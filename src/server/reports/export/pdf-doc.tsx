import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  type DocumentProps,
} from '@react-pdf/renderer'
import type { StakeholderReportContent } from '../stakeholder-generator'
import type { SectionItem } from '../weekly-generator'
import type React from 'react'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 48,
    paddingBottom: 48,
    paddingLeft: 56,
    paddingRight: 56,
    color: '#111',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: '#555',
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    marginTop: 20,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 3,
  },
  paragraph: {
    lineHeight: 1.6,
    marginBottom: 6,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingLeft: 8,
  },
  bullet: {
    width: 12,
    flexShrink: 0,
  },
  listContent: {
    flex: 1,
    lineHeight: 1.5,
  },
  metaText: {
    fontSize: 8.5,
    color: '#666',
    marginTop: 1,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressLabel: {
    width: 140,
    fontSize: 9.5,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
  },
  progressBarFill: {
    height: 6,
    backgroundColor: '#6366f1',
    borderRadius: 3,
  },
  progressPct: {
    width: 36,
    fontSize: 9,
    color: '#555',
    textAlign: 'right',
  },
  riskBadge: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    marginRight: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
  },
  footer: {
    fontSize: 8,
    color: '#aaa',
    marginTop: 24,
    textAlign: 'center',
  },
})

function SectionItemView({ item }: { item: SectionItem }) {
  const meta = [
    item.project && `Project: ${item.project}`,
    item.assignee && `Assignee: ${item.assignee}`,
    item.dueDate && `Due: ${item.dueDate.slice(0, 10)}`,
    item.blockedReason && `Blocked: ${item.blockedReason}`,
  ]
    .filter(Boolean)
    .join('  |  ')

  return (
    <View style={styles.listItem}>
      <Text style={styles.bullet}>•</Text>
      <View style={styles.listContent}>
        <Text>{item.title}</Text>
        {meta ? <Text style={styles.metaText}>{meta}</Text> : null}
      </View>
    </View>
  )
}

function EmptyItem({ text }: { text: string }) {
  return (
    <View style={styles.listItem}>
      <Text style={[styles.listContent, { color: '#888' }]}>{text}</Text>
    </View>
  )
}

export function buildStakeholderReportPdfElement(
  content: StakeholderReportContent
): React.ReactElement<DocumentProps> {
  const title = content.projectName
    ? `Stakeholder Report — ${content.projectName}`
    : 'Stakeholder Report'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          Scope: {content.scope === 'project' ? 'Project' : 'Team'}
        </Text>

        <Text style={styles.sectionHeading}>Executive Summary</Text>
        <Text style={styles.paragraph}>{content.executiveSummary}</Text>

        <Text style={styles.sectionHeading}>Progress Since Last Update</Text>
        {content.progressSinceLast.length === 0 ? (
          <EmptyItem text="No project data available." />
        ) : (
          content.progressSinceLast.map((p, i) => (
            <View key={i} style={styles.progressRow}>
              <Text style={styles.progressLabel}>{p.projectName}</Text>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${p.percentComplete}%` as unknown as number },
                  ]}
                />
              </View>
              <Text style={styles.progressPct}>
                {p.done}/{p.total} ({p.percentComplete}%)
              </Text>
            </View>
          ))
        )}

        <Text style={styles.sectionHeading}>Key Deliverables</Text>
        {content.keyDeliverables.length === 0 ? (
          <EmptyItem text="No deliverables completed in this period." />
        ) : (
          content.keyDeliverables.map((item, i) => (
            <SectionItemView key={i} item={item} />
          ))
        )}

        <Text style={styles.sectionHeading}>Risks &amp; Blockers</Text>
        {content.risks.length === 0 ? (
          <EmptyItem text="No risks or blockers identified." />
        ) : (
          content.risks.map((item, i) => {
            const label =
              item.riskType === 'blocked'
                ? 'BLOCKED'
                : item.riskType === 'overdue'
                  ? 'OVERDUE'
                  : 'SLIPPED'
            const meta = [
              item.project && `Project: ${item.project}`,
              item.assignee && `Assignee: ${item.assignee}`,
              item.dueDate && `Due: ${item.dueDate.slice(0, 10)}`,
              item.blockedReason && `Reason: ${item.blockedReason}`,
            ]
              .filter(Boolean)
              .join('  |  ')
            return (
              <View key={i} style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <View style={styles.listContent}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.riskBadge}>{label}</Text>
                    <Text>{item.title}</Text>
                  </View>
                  {meta ? <Text style={styles.metaText}>{meta}</Text> : null}
                </View>
              </View>
            )
          })
        )}

        <Text style={styles.sectionHeading}>Next Milestones</Text>
        {content.nextMilestones.length === 0 ? (
          <EmptyItem text="No upcoming milestones." />
        ) : (
          content.nextMilestones.map((item, i) => (
            <SectionItemView key={i} item={item} />
          ))
        )}

        <Text style={styles.sectionHeading}>Narrative</Text>
        <Text style={styles.paragraph}>{content.narrative}</Text>

        {content.usedLlm && (
          <Text style={styles.footer}>Narrative enhanced with AI.</Text>
        )}
      </Page>
    </Document>
  ) as React.ReactElement<DocumentProps>
}
