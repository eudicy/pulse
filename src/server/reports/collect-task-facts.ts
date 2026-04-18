import { dbRaw } from '@/src/lib/db-raw'
import type { Task, Project, User, TaskStatusEvent } from '@prisma/client'

export type TaskFacts = {
  periodStart: Date
  periodEnd: Date
  teamTimezone: string
  completed: Task[]
  inProgress: Task[]
  blocked: Task[]
  newlyCreated: Task[]
  upcoming: Task[]
  overdue: Task[]
  slippedThisWeek: Task[]
  byProject: Map<string, { project: Project; tasks: Task[] }>
  byAssignee: Map<string, { user: User; tasks: Task[] }>
  statusTransitions: TaskStatusEvent[]
}

export async function collectTaskFacts(
  teamId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<TaskFacts> {
  const upcomingEnd = new Date(periodEnd.getTime() + 7 * 24 * 60 * 60 * 1000)

  // Fetch team timezone, all tasks that could be relevant, projects, users, and status events
  const [team, tasks, projects, users, statusTransitions] = await Promise.all([
    dbRaw.team.findUnique({
      where: { id: teamId },
      select: { timezone: true },
    }),
    dbRaw.task.findMany({
      where: {
        teamId,
        OR: [
          // Completed within the period
          { completedAt: { gte: periodStart, lte: periodEnd } },
          // Created within the period
          { createdAt: { gte: periodStart, lte: periodEnd } },
          // Currently active (not done) — captures in-progress, blocked, overdue, upcoming
          { status: { not: 'DONE' } },
        ],
      },
    }),
    dbRaw.project.findMany({
      where: { teamId },
    }),
    dbRaw.user.findMany({
      where: { teamId },
    }),
    dbRaw.taskStatusEvent.findMany({
      where: {
        teamId,
        changedAt: { gte: periodStart, lte: periodEnd },
      },
      orderBy: { changedAt: 'asc' },
    }),
  ])

  const teamTimezone = team?.timezone ?? 'UTC'

  const completed: Task[] = []
  const inProgress: Task[] = []
  const blocked: Task[] = []
  const newlyCreated: Task[] = []
  const upcoming: Task[] = []
  const overdue: Task[] = []
  const slippedThisWeek: Task[] = []
  const activeTasks: Task[] = []

  const isCompletedInPeriod = (t: Task) =>
    !!t.completedAt && t.completedAt >= periodStart && t.completedAt <= periodEnd

  for (const task of tasks) {
    const completedInPeriod = isCompletedInPeriod(task)

    if (completedInPeriod) completed.push(task)
    if (task.createdAt >= periodStart && task.createdAt <= periodEnd) newlyCreated.push(task)
    if (task.status === 'IN_PROGRESS') inProgress.push(task)
    if (task.status === 'BLOCKED') blocked.push(task)
    if (task.dueDate && task.status !== 'DONE' && task.dueDate > periodEnd && task.dueDate <= upcomingEnd) upcoming.push(task)
    if (task.dueDate && task.status !== 'DONE' && task.dueDate < periodEnd) overdue.push(task)
    if (task.dueDate && task.status !== 'DONE' && task.dueDate >= periodStart && task.dueDate <= periodEnd) slippedThisWeek.push(task)
    if (completedInPeriod || task.status !== 'DONE') activeTasks.push(task)
  }

  const projectMap = new Map(projects.map((p) => [p.id, p]))
  const userMap = new Map(users.map((u) => [u.id, u]))

  const byProject = new Map<string, { project: Project; tasks: Task[] }>()
  for (const task of activeTasks) {
    const project = projectMap.get(task.projectId)
    if (!project) continue
    const existing = byProject.get(task.projectId)
    if (existing) {
      existing.tasks.push(task)
    } else {
      byProject.set(task.projectId, { project, tasks: [task] })
    }
  }

  const byAssignee = new Map<string, { user: User; tasks: Task[] }>()
  for (const task of activeTasks) {
    if (!task.assigneeId) continue
    const user = userMap.get(task.assigneeId)
    if (!user) continue
    const existing = byAssignee.get(task.assigneeId)
    if (existing) {
      existing.tasks.push(task)
    } else {
      byAssignee.set(task.assigneeId, { user, tasks: [task] })
    }
  }

  return {
    periodStart,
    periodEnd,
    teamTimezone,
    completed,
    inProgress,
    blocked,
    newlyCreated,
    upcoming,
    overdue,
    slippedThisWeek,
    byProject,
    byAssignee,
    statusTransitions,
  }
}
