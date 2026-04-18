import type { Task, Project, User } from '@prisma/client'
import type { TaskFacts } from './collect-task-facts'
import type { SectionItem } from './weekly-generator'

export type StakeholderReportContent = {
  scope: 'team' | 'project'
  projectName?: string
  executiveSummary: string
  progressSinceLast: {
    projectName: string
    done: number
    total: number
    pct: number
  }[]
  keyDeliverables: SectionItem[]
  risks: Array<
    SectionItem & { riskType: 'blocked' | 'overdue' | 'slipped' }
  >
  nextMilestones: SectionItem[]
  narrative: string
  usedLlm: boolean
}

function plural(n: number): string {
  return n === 1 ? '' : 's'
}

function formatDate(d: Date): string {
  // YYYY-MM-DD for deterministic output
  return d.toISOString().slice(0, 10)
}

function toSectionItem(
  task: Task,
  byProject: Map<string, { project: Project; tasks: Task[] }>,
  byAssignee: Map<string, { user: User; tasks: Task[] }>
): SectionItem {
  const projectEntry = byProject.get(task.projectId)
  const assigneeEntry = task.assigneeId
    ? byAssignee.get(task.assigneeId)
    : undefined

  const item: SectionItem = {
    title: task.title,
    project: projectEntry?.project.name ?? 'Unknown project',
  }

  const assigneeName = assigneeEntry?.user.name ?? assigneeEntry?.user.email
  if (assigneeName) item.assignee = assigneeName

  if (task.dueDate) {
    item.dueDate = task.dueDate.toISOString()
  }

  if (task.blockedReason) {
    item.blockedReason = task.blockedReason
  }

  return item
}

export function generateStakeholderReport(
  facts: TaskFacts,
  scope: { type: 'team' | 'project'; projectId?: string }
): StakeholderReportContent {
  const { byProject, byAssignee } = facts

  const projectFilter = (t: Task) =>
    scope.type !== 'project' || t.projectId === scope.projectId

  const completed = facts.completed.filter(projectFilter)
  const blocked = facts.blocked.filter(projectFilter)
  const overdue = facts.overdue.filter(projectFilter)
  const slipped = facts.slippedThisWeek.filter(projectFilter)
  const upcoming = facts.upcoming.filter(projectFilter)

  const projectName =
    scope.type === 'project' && scope.projectId
      ? byProject.get(scope.projectId)?.project.name
      : undefined

  const executiveSummary = `In the period ${formatDate(facts.periodStart)} to ${formatDate(facts.periodEnd)}, the team completed ${completed.length} task${plural(completed.length)}, with ${blocked.length} currently blocked.`

  // Progress bars per project (or single project)
  const progressProjects =
    scope.type === 'project' && scope.projectId
      ? byProject.has(scope.projectId)
        ? [byProject.get(scope.projectId)!]
        : []
      : Array.from(byProject.values())

  const progressSinceLast = progressProjects.map(({ project, tasks }) => {
    const total = tasks.length
    const done = tasks.filter((t) => t.status === 'DONE').length
    const pct = total === 0 ? 0 : Math.round((done / total) * 100)
    return { projectName: project.name, done, total, pct }
  })

  const keyDeliverables = completed.map((t) =>
    toSectionItem(t, byProject, byAssignee)
  )

  const blockedIds = new Set(blocked.map((t) => t.id))
  const overdueIds = new Set(overdue.map((t) => t.id))

  const riskTasks: Array<{
    task: Task
    riskType: 'blocked' | 'overdue' | 'slipped'
  }> = []
  const seen = new Set<string>()

  for (const t of blocked) {
    if (!seen.has(t.id)) {
      riskTasks.push({ task: t, riskType: 'blocked' })
      seen.add(t.id)
    }
  }
  for (const t of overdue) {
    if (!seen.has(t.id)) {
      riskTasks.push({ task: t, riskType: 'overdue' })
      seen.add(t.id)
    }
  }
  for (const t of slipped) {
    if (!seen.has(t.id) && !blockedIds.has(t.id) && !overdueIds.has(t.id)) {
      riskTasks.push({ task: t, riskType: 'slipped' })
      seen.add(t.id)
    }
  }

  const risks = riskTasks.map(({ task, riskType }) => ({
    ...toSectionItem(task, byProject, byAssignee),
    riskType,
  }))

  const nextMilestones = upcoming.map((t) =>
    toSectionItem(t, byProject, byAssignee)
  )

  // Deterministic narrative
  const parts: string[] = [executiveSummary]

  if (overdue.length > 0) {
    parts.push(
      `${overdue.length} task${plural(overdue.length)} overdue.`
    )
  }

  if (upcoming.length > 0) {
    parts.push(
      `${upcoming.length} milestone${plural(upcoming.length)} upcoming in the next week.`
    )
  }

  const narrative = parts.join(' ')

  const result: StakeholderReportContent = {
    scope: scope.type,
    executiveSummary,
    progressSinceLast,
    keyDeliverables,
    risks,
    nextMilestones,
    narrative,
    usedLlm: false,
  }

  if (projectName) {
    result.projectName = projectName
  }

  return result
}
