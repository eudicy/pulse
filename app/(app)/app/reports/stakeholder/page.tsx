import Link from 'next/link'
import { requireSession } from '@/src/lib/auth-session'
import { getDb } from '@/src/lib/db'
import { Badge } from '@/components/ui/badge'
import { GenerateReportForm } from '@/src/components/reports/GenerateReportForm'
import type { ReportScope } from '@prisma/client'

const SCOPE_LABELS: Record<ReportScope, string> = {
  TEAM: 'Team',
  PROJECT: 'Project',
}

export default async function StakeholderReportsPage() {
  const session = await requireSession()
  const db = getDb(session.teamId)

  const [reports, projects] = await Promise.all([
    db.stakeholderReport.findMany({
      orderBy: { generatedAt: 'desc' },
      include: { project: { select: { id: true, name: true } } },
    }),
    db.project.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ])

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Stakeholder Reports</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Share progress reports with stakeholders via a secure link.
        </p>
      </div>

      {/* Generate new report */}
      <div className="rounded-lg border bg-card p-6 mb-8">
        <h2 className="text-base font-semibold text-foreground mb-4">Generate Report</h2>
        <GenerateReportForm projects={projects} />
      </div>

      {/* Report list */}
      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg border-dashed">
          <p className="text-muted-foreground">No stakeholder reports yet. Generate your first one above.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {reports.map((report) => {
            const hasActiveShare =
              report.shareToken &&
              !report.shareTokenRevokedAt &&
              (!report.shareTokenExpiresAt || report.shareTokenExpiresAt > new Date())

            const scopeLabel =
              report.scope === 'PROJECT' && report.project
                ? `Project: ${report.project.name}`
                : SCOPE_LABELS[report.scope]

            return (
              <li key={report.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground text-sm">{scopeLabel}</span>
                      <Badge variant="outline" className="text-xs">
                        {new Date(report.generatedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(report.periodStart).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      –{' '}
                      {new Date(report.periodEnd).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasActiveShare && (
                      <Badge variant="secondary" className="text-xs">
                        Share active
                      </Badge>
                    )}
                    <Link
                      href={`/app/reports/stakeholder/${report.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
