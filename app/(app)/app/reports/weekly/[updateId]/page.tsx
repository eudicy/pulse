import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireSession } from '@/src/lib/auth-session'
import { getDb } from '@/src/lib/db'
import { WeeklyUpdateView } from '@/src/components/reports/WeeklyUpdateView'
import type { WeeklyUpdateContent } from '@/src/components/reports/WeeklyUpdateView'

interface PageProps {
  params: Promise<{ updateId: string }>
}

export default async function WeeklyUpdateDetailPage({ params }: PageProps) {
  const { updateId } = await params
  const session = await requireSession()
  const db = getDb(session.teamId)

  const update = await db.weeklyUpdate.findFirst({
    where: { id: updateId },
  })

  if (!update) notFound()

  const content = update.content as WeeklyUpdateContent

  const start = new Date(update.periodStart).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const end = new Date(update.periodEnd).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href="/app/reports/weekly"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to weekly reports
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Weekly Update</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {start} — {end}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Generated {new Date(update.generatedAt).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      </div>

      <WeeklyUpdateView content={content} />
    </div>
  )
}
