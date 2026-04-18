import { getProject } from '@/src/server/projects'
import { listTeamMembers } from '@/src/server/tasks'
import { TaskStatusBadge } from '@/src/components/tasks/TaskStatusBadge'
import { ProjectDetailClient } from './ProjectDetailClient'
import { Badge } from '@/components/ui/badge'
import type { ProjectStatus } from '@prisma/client'

const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
}

const PROJECT_STATUS_VARIANTS: Record<
  ProjectStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  ACTIVE: 'default',
  PAUSED: 'outline',
  COMPLETED: 'secondary',
  ARCHIVED: 'outline',
}

interface PageProps {
  params: Promise<{ projectId: string }>
}

export default async function ProjectPage({ params }: PageProps) {
  const { projectId } = await params
  const [project, members] = await Promise.all([
    getProject(projectId),
    listTeamMembers(),
  ])

  const memberMap = Object.fromEntries(members.map((m) => [m.id, m]))

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Project header */}
      <div className="mb-8">
        <div className="flex items-start gap-3 mb-1">
          <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
          <Badge variant={PROJECT_STATUS_VARIANTS[project.status]}>
            {PROJECT_STATUS_LABELS[project.status]}
          </Badge>
        </div>
        {project.description && (
          <p className="text-muted-foreground text-sm mt-1">{project.description}</p>
        )}
        {project.deadline && (
          <p className="text-xs text-muted-foreground mt-2">
            Deadline: {new Date(project.deadline).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Tasks section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Tasks</h2>
          {/* Add Task button rendered by client component */}
        </div>

        {project.tasks.length === 0 ? (
          <ProjectDetailClient
            projectId={projectId}
            members={members}
            tasks={[]}
            memberMap={memberMap}
            showEmptyState
          />
        ) : (
          <ProjectDetailClient
            projectId={projectId}
            members={members}
            tasks={project.tasks}
            memberMap={memberMap}
            showEmptyState={false}
          />
        )}
      </div>
    </div>
  )
}
