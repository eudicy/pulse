import { Badge } from '@/components/ui/badge'

export interface WeeklyUpdateContent {
  usedLlm?: boolean
  narrative?: string
  highlights?: string[]
  completedTasks?: Array<{ title: string; projectName?: string }>
  inProgressTasks?: Array<{ title: string; projectName?: string; assignee?: string }>
  blockedTasks?: Array<{ title: string; reason?: string; projectName?: string }>
  upcomingTasks?: Array<{ title: string; projectName?: string; dueDate?: string }>
}

interface WeeklyUpdateViewProps {
  content: WeeklyUpdateContent
}

export function WeeklyUpdateView({ content }: WeeklyUpdateViewProps) {
  return (
    <div className="space-y-8">
      {content.narrative && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-semibold text-foreground">Summary</h2>
            {content.usedLlm && (
              <Badge variant="secondary" className="text-xs">
                AI-assisted
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {content.narrative}
          </p>
        </section>
      )}

      {content.highlights && content.highlights.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Highlights</h2>
          <ul className="space-y-2">
            {content.highlights.map((highlight, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                {highlight}
              </li>
            ))}
          </ul>
        </section>
      )}

      {content.completedTasks && content.completedTasks.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Completed Tasks</h2>
          <ul className="space-y-2">
            {content.completedTasks.map((task, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-green-500">✓</span>
                <span className="text-foreground">{task.title}</span>
                {task.projectName && (
                  <span className="text-muted-foreground">· {task.projectName}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {content.inProgressTasks && content.inProgressTasks.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">In Progress</h2>
          <ul className="space-y-2">
            {content.inProgressTasks.map((task, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-blue-500">→</span>
                <span className="text-foreground">{task.title}</span>
                {task.projectName && (
                  <span className="text-muted-foreground">· {task.projectName}</span>
                )}
                {task.assignee && (
                  <span className="text-muted-foreground">({task.assignee})</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {content.blockedTasks && content.blockedTasks.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Blocked</h2>
          <ul className="space-y-2">
            {content.blockedTasks.map((task, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-red-500">✗</span>
                <div>
                  <span className="text-foreground">{task.title}</span>
                  {task.projectName && (
                    <span className="text-muted-foreground"> · {task.projectName}</span>
                  )}
                  {task.reason && (
                    <p className="text-muted-foreground mt-0.5">{task.reason}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {content.upcomingTasks && content.upcomingTasks.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Upcoming</h2>
          <ul className="space-y-2">
            {content.upcomingTasks.map((task, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-muted-foreground">◦</span>
                <span className="text-foreground">{task.title}</span>
                {task.projectName && (
                  <span className="text-muted-foreground">· {task.projectName}</span>
                )}
                {task.dueDate && (
                  <span className="text-muted-foreground">
                    due {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
