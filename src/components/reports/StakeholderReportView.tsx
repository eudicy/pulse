import { Badge } from '@/components/ui/badge'

export interface StakeholderReportContent {
  usedLlm?: boolean
  executiveSummary?: string
  progressSinceLast?: Array<{
    label: string
    percentComplete: number
    note?: string
  }>
  keyDeliverables?: Array<{
    title: string
    status: 'completed' | 'in_progress' | 'upcoming'
    note?: string
  }>
  risks?: Array<{
    title: string
    severity: 'low' | 'medium' | 'high'
    mitigation?: string
  }>
  nextMilestones?: Array<{
    title: string
    dueDate?: string
    owner?: string
  }>
}

interface StakeholderReportViewProps {
  content: StakeholderReportContent
  readOnly?: boolean
}

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

const DELIVERABLE_STATUS_LABELS: Record<string, string> = {
  completed: 'Completed',
  in_progress: 'In Progress',
  upcoming: 'Upcoming',
}

export function StakeholderReportView({ content }: StakeholderReportViewProps) {
  return (
    <div className="space-y-10">
      {content.executiveSummary && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-semibold text-foreground">Executive Summary</h2>
            {content.usedLlm && (
              <Badge variant="secondary" className="text-xs">
                AI-assisted
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {content.executiveSummary}
          </p>
        </section>
      )}

      {content.progressSinceLast && content.progressSinceLast.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Progress Since Last Report</h2>
          <div className="space-y-4">
            {content.progressSinceLast.map((item, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                  <span className="text-sm text-muted-foreground">{item.percentComplete}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, Math.max(0, item.percentComplete))}%` }}
                  />
                </div>
                {item.note && (
                  <p className="text-xs text-muted-foreground mt-1">{item.note}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {content.keyDeliverables && content.keyDeliverables.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Key Deliverables</h2>
          <ul className="space-y-3">
            {content.keyDeliverables.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <Badge variant="outline" className="shrink-0 mt-0.5">
                  {DELIVERABLE_STATUS_LABELS[item.status] ?? item.status}
                </Badge>
                <div>
                  <span className="text-foreground font-medium">{item.title}</span>
                  {item.note && (
                    <p className="text-muted-foreground mt-0.5">{item.note}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {content.risks && content.risks.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Risks</h2>
          <ul className="space-y-3">
            {content.risks.map((risk, i) => (
              <li key={i} className="text-sm">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_COLORS[risk.severity] ?? ''}`}
                  >
                    {risk.severity.charAt(0).toUpperCase() + risk.severity.slice(1)}
                  </span>
                  <span className="text-foreground font-medium">{risk.title}</span>
                </div>
                {risk.mitigation && (
                  <p className="text-muted-foreground mt-1 ml-14">{risk.mitigation}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {content.nextMilestones && content.nextMilestones.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-3">Next Milestones</h2>
          <ul className="space-y-2">
            {content.nextMilestones.map((milestone, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-primary">▸</span>
                <div>
                  <span className="text-foreground">{milestone.title}</span>
                  <div className="flex gap-3 mt-0.5 text-xs text-muted-foreground">
                    {milestone.dueDate && (
                      <span>Due {new Date(milestone.dueDate).toLocaleDateString()}</span>
                    )}
                    {milestone.owner && <span>Owner: {milestone.owner}</span>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
