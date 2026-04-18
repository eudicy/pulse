import { Badge } from '@/components/ui/badge'
import type { TaskStatus } from '@prisma/client'

const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  TODO: { label: 'To Do', variant: 'outline' },
  IN_PROGRESS: { label: 'In Progress', variant: 'secondary' },
  BLOCKED: { label: 'Blocked', variant: 'destructive' },
  DONE: { label: 'Done', variant: 'default' },
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const config = STATUS_CONFIG[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
