import Link from 'next/link'
import { requireSession } from '@/src/lib/auth-session'
import { getDb } from '@/src/lib/db'
import { Badge } from '@/components/ui/badge'
import { GenerateWeeklyButton } from '@/src/components/reports/GenerateWeeklyButton'
import type { WeeklyUpdateContent } from '@/src/components/reports/WeeklyUpdateView'

export default async function WeeklyReportsPage() {
  const session = await requireSession()
  const db = getDb(session.teamId)

  const updates = await db.weeklyUpdate.findMany({
    orderBy: { periodStart: 'desc' },
  })

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Weekly Updates</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Automatically generated summaries of your team&apos;s weekly progress.
          </p>
        </div>
        <GenerateWeeklyButton />
      </div>

      {updates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border rounded-lg border-dashed">
          <p className="text-muted-foreground max-w-sm">
            Your first weekly update will appear after tasks are completed. You can also generate
            one now.
          </p>
          <GenerateWeeklyButton className="mt-6" />
        </div>
      ) : (
        <ul className="space-y-3">
          {updates.map((update) => {
            const content = update.content as WeeklyUpdateContent
            const start = new Date(update.periodStart).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })
            const end = new Date(update.periodEnd).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
            const highlights = content?.highlights ?? []

            return (
              <li key={update.id}>
                <Link
                  href={`/app/reports/weekly/${update.id}`}
                  className="block rounded-lg border bg-card p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground text-sm">
                      {start} – {end}
                    </span>
                    {content?.usedLlm && (
                      <Badge variant="secondary" className="text-xs">
                        AI-assisted narrative
                      </Badge>
                    )}
                  </div>
                  {highlights.length > 0 && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {highlights[0]}
                    </p>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
