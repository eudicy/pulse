import type { StakeholderReportContent } from '../stakeholder-generator'
import type { SectionItem } from '../weekly-generator'

function sectionItemLine(item: SectionItem): string {
  const parts: string[] = [`- **${item.title}**`]
  const meta: string[] = []
  if (item.project) meta.push(`Project: ${item.project}`)
  if (item.assignee) meta.push(`Assignee: ${item.assignee}`)
  if (item.dueDate) meta.push(`Due: ${item.dueDate.slice(0, 10)}`)
  if (item.blockedReason) meta.push(`Blocked: ${item.blockedReason}`)
  if (meta.length > 0) parts.push(` *(${meta.join(' | ')})*`)
  return parts.join('')
}

export function toMarkdown(content: StakeholderReportContent): string {
  const lines: string[] = []

  const title = content.projectName
    ? `# Stakeholder Report — ${content.projectName}`
    : '# Stakeholder Report'
  lines.push(title)
  lines.push('')

  lines.push('## Executive Summary')
  lines.push('')
  lines.push(content.executiveSummary)
  lines.push('')

  lines.push('## Progress Since Last Update')
  lines.push('')
  if (content.progressSinceLast.length === 0) {
    lines.push('No project data available.')
  } else {
    for (const p of content.progressSinceLast) {
      lines.push(`- ${p.projectName}: ${p.done}/${p.total} (${p.percentComplete}%)`)
    }
  }
  lines.push('')

  lines.push('## Key Deliverables')
  lines.push('')
  if (content.keyDeliverables.length === 0) {
    lines.push('No deliverables completed in this period.')
  } else {
    for (const item of content.keyDeliverables) {
      lines.push(sectionItemLine(item))
    }
  }
  lines.push('')

  lines.push('## Risks & Blockers')
  lines.push('')
  if (content.risks.length === 0) {
    lines.push('No risks or blockers identified.')
  } else {
    for (const item of content.risks) {
      const riskLabel =
        item.riskType === 'blocked'
          ? 'BLOCKED'
          : item.riskType === 'overdue'
            ? 'OVERDUE'
            : 'SLIPPED'
      lines.push(`- [${riskLabel}] **${item.title}**`)
      const meta: string[] = []
      if (item.project) meta.push(`Project: ${item.project}`)
      if (item.assignee) meta.push(`Assignee: ${item.assignee}`)
      if (item.dueDate) meta.push(`Due: ${item.dueDate.slice(0, 10)}`)
      if (item.blockedReason) meta.push(`Reason: ${item.blockedReason}`)
      if (meta.length > 0) lines.push(`  *(${meta.join(' | ')})*`)
    }
  }
  lines.push('')

  lines.push('## Next Milestones')
  lines.push('')
  if (content.nextMilestones.length === 0) {
    lines.push('No upcoming milestones.')
  } else {
    for (const item of content.nextMilestones) {
      lines.push(sectionItemLine(item))
    }
  }
  lines.push('')

  lines.push('## Narrative')
  lines.push('')
  lines.push(content.narrative)
  lines.push('')

  if (content.usedLlm) {
    lines.push('---')
    lines.push('')
    lines.push('*Narrative enhanced with AI.*')
    lines.push('')
  }

  return lines.join('\n')
}
