import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireSession } from '@/src/lib/auth-session'
import { getDb } from '@/src/lib/db'
import { StakeholderReportView } from '@/src/components/reports/StakeholderReportView'
import { CopyShareLinkButton } from '@/src/components/reports/CopyShareLinkButton'
import { RevokeShareLinkButton } from '@/src/components/reports/RevokeShareLinkButton'
import type { StakeholderReportContent } from '@/src/components/reports/StakeholderReportView'

interface PageProps {
  params: Promise<{ reportId: string }>
}

export default async function StakeholderReportDetailPage({ params }: PageProps) {
  const { reportId } = await params
  const session = await requireSession()
  const db = getDb(session.teamId)

  const report = await db.stakeholderReport.findFirst({
    where: { id: reportId },
    include: { project: { select: { name: true } } },
  })

  if (!report) notFound()

  const content = report.content as StakeholderReportContent

  const hasActiveShare =
    report.shareToken &&
    !report.shareTokenRevokedAt &&
    (!report.shareTokenExpiresAt || report.shareTokenExpiresAt > new Date())

  const shareUrl = report.shareToken
    ? `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/share/${report.shareToken}`
    : null

  const periodLabel = `${new Date(report.periodStart).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  })} – ${new Date(report.periodEnd).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })}`

  const scopeLabel =
    report.scope === 'PROJECT' && report.project
      ? `Project: ${report.project.name}`
      : 'Team Report'

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href="/app/reports/stakeholder"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to stakeholder reports
        </Link>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{scopeLabel}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{periodLabel}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Generated{' '}
            {new Date(report.generatedAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {shareUrl && hasActiveShare ? (
            <>
              <CopyShareLinkButton url={shareUrl} />
              <RevokeShareLinkButton reportId={reportId} />
            </>
          ) : (
            <span className="text-xs text-muted-foreground">No active share link</span>
          )}
          <a
            href={`/api/reports/stakeholder/${reportId}/export?format=md`}
            className="inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Export Markdown
          </a>
          <a
            href={`/api/reports/stakeholder/${reportId}/export?format=pdf`}
            className="inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Export PDF
          </a>
        </div>
      </div>

      <StakeholderReportView content={content} />
    </div>
  )
}
