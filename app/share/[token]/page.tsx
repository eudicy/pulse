import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { dbRaw } from '@/src/lib/db-raw'
import { shareLimiter, checkRateLimit } from '@/src/lib/rate-limit'
import { StakeholderReportView } from '@/src/components/reports/StakeholderReportView'
import type { StakeholderReportContent } from '@/src/components/reports/StakeholderReportView'

export const metadata = {
  robots: 'noindex, nofollow',
}

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function SharePage({ params }: PageProps) {
  const { token } = await params

  // Rate limiting based on IP
  const headersList = await headers()
  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headersList.get('x-real-ip') ??
    'unknown'

  const { limited } = await checkRateLimit(shareLimiter, `share:${ip}`)
  if (limited) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground mb-2">Too many requests</h1>
          <p className="text-muted-foreground text-sm">Please wait a moment and try again.</p>
        </div>
      </div>
    )
  }

  // Look up report by share token
  const report = await dbRaw.stakeholderReport.findUnique({
    where: { shareToken: token },
    include: { project: { select: { name: true } }, team: { select: { name: true } } },
  })

  const now = new Date()
  const isInvalid =
    !report ||
    report.shareTokenRevokedAt !== null ||
    (report.shareTokenExpiresAt !== null && report.shareTokenExpiresAt < now)

  if (isInvalid) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground mb-2">
            This link is no longer valid.
          </h1>
          <p className="text-muted-foreground text-sm">
            The report may have been revoked or the link has expired.
          </p>
        </div>
      </div>
    )
  }

  const content = report.content as StakeholderReportContent

  const scopeLabel =
    report.scope === 'PROJECT' && report.project
      ? `Project: ${report.project.name}`
      : `${report.team.name} — Team Report`

  const periodLabel = `${new Date(report.periodStart).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  })} – ${new Date(report.periodEnd).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })}`

  return (
    <>
      <meta name="robots" content="noindex, nofollow" />
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="mb-8">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Stakeholder Report
            </p>
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

          <StakeholderReportView content={content} readOnly />
        </div>
      </div>
    </>
  )
}
