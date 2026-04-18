import type { Task, Project, User } from '@prisma/client'
import type { TaskFacts } from './collect-task-facts'

export type SectionItem = {
  title: string
  project: string
  assignee?: string
  dueDate?: string
  blockedReason?: string
}

export type WeeklyUpdateContent = {
  highlights: string[]
  completed: SectionItem[]
  inProgress: SectionItem[]
  blocked: SectionItem[]
  upcoming: SectionItem[]
  narrative: string
  usedLlm: boolean
}

function plural(n: number): string {
  return n === 1 ? '' : 's'
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

export function generateWeeklyUpdate(facts: TaskFacts): WeeklyUpdateContent {
  const { byProject, byAssignee } = facts

  const completed = facts.completed.map((t) =>
    toSectionItem(t, byProject, byAssignee)
  )
  const inProgress = facts.inProgress.map((t) =>
    toSectionItem(t, byProject, byAssignee)
  )
  const blocked = facts.blocked.map((t) =>
    toSectionItem(t, byProject, byAssignee)
  )
  const upcoming = facts.upcoming.map((t) =>
    toSectionItem(t, byProject, byAssignee)
  )

  // Highlights: top completed (up to 5) as one-liners
  const highlights = facts.completed
    .slice(0, 5)
    .map((t) => {
      const projectName =
        byProject.get(t.projectId)?.project.name ?? 'Unknown project'
      return `${t.title} (${projectName})`
    })

  // Deterministic narrative
  const parts: string[] = []

  if (facts.completed.length > 0) {
    const projectsTouched = new Set(facts.completed.map((t) => t.projectId))
    parts.push(
      `Shipped ${facts.completed.length} task${plural(facts.completed.length)} across ${projectsTouched.size} project${plural(projectsTouched.size)}.`
    )
  }

  if (facts.blocked.length > 0) {
    parts.push(
      `${facts.blocked.length} task${plural(facts.blocked.length)} blocked.`
    )
  }

  if (facts.overdue.length > 0) {
    parts.push(
      `${facts.overdue.length} task${plural(facts.overdue.length)} overdue.`
    )
  }

  const narrative =
    parts.length === 0 ? 'No activity this week.' : parts.join(' ')

  return {
    highlights,
    completed,
    inProgress,
    blocked,
    upcoming,
    narrative,
    usedLlm: false,
  }
}
