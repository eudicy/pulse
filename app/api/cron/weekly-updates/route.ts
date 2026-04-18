import { DateTime } from 'luxon'
import { dbRaw } from '@/src/lib/db-raw'
import { weeklyPeriod } from '@/src/lib/time'
import { collectTaskFacts } from '@/src/server/reports/collect-task-facts'
import { generateWeeklyUpdate } from '@/src/server/reports/weekly-generator'
import { polishNarrative } from '@/src/server/reports/narrative-polish'

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('forbidden', { status: 403 })
  }

  const teams = await dbRaw.team.findMany({
    select: { id: true, timezone: true },
  })

  const results = await Promise.allSettled(
    teams.map(async (t) => {
      const { periodStart, periodEnd } = weeklyPeriod(t, DateTime.now())
      const facts = await collectTaskFacts(t.id, periodStart, periodEnd)
      const structured = generateWeeklyUpdate(facts)
      const polished = await polishNarrative(structured.narrative, t.id)
      const content = {
        ...structured,
        narrative: polished.text,
        usedLlm: polished.usedLlm,
      }
      return dbRaw.weeklyUpdate.upsert({
        where: { teamId_periodStart: { teamId: t.id, periodStart } },
        create: {
          teamId: t.id,
          periodStart,
          periodEnd,
          content,
          contentVersion: 1,
        },
        update: { content, generatedAt: new Date() },
      })
    })
  )

  const failures = results.filter((r) => r.status === 'rejected')
  if (failures.length > 0) {
    console.error(
      'Weekly update failures:',
      failures.map((f) => (f as PromiseRejectedResult).reason)
    )
  }

  return Response.json({ total: teams.length, failed: failures.length })
}
