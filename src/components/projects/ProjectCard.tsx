import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Project, Task, ProjectStatus } from '@prisma/client'

const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  ACTIVE: { label: 'Active', variant: 'default' },
  PAUSED: { label: 'Paused', variant: 'outline' },
  COMPLETED: { label: 'Completed', variant: 'secondary' },
  ARCHIVED: { label: 'Archived', variant: 'outline' },
}

interface ProjectCardProps {
  project: Project & { tasks?: Task[] }
}

export function ProjectCard({ project }: ProjectCardProps) {
  const statusConfig = STATUS_CONFIG[project.status]
  const taskCount = project.tasks?.length ?? 0

  return (
    <Link href={`/app/projects/${project.id}`} className="block group">
      <Card className="hover:ring-primary/40 transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="group-hover:text-primary transition-colors">
              {project.name}
            </CardTitle>
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          </div>
          {project.description && (
            <CardDescription className="line-clamp-2">
              {project.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
          </p>
        </CardContent>
        {project.deadline && (
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              Due {new Date(project.deadline).toLocaleDateString()}
            </p>
          </CardFooter>
        )}
      </Card>
    </Link>
  )
}
