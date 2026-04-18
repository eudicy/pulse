import { requireSession } from '@/src/lib/auth-session'
import { dbRaw } from '@/src/lib/db-raw'
import { collectTaskFacts } from '@/src/server/reports/collect-task-facts'
import { generateWeeklyUpdate } from '@/src/server/reports/weekly-generator'
import { polishNarrative } from '@/src/server/reports/narrative-polish'
import { weeklyPeriod } from '@/src/lib/time'
import { DateTime } from 'luxon'

export async function POST() {
  const session = await requireSession()

  if (session.role !== 'ADMIN') {
    return new Response('forbidden', { status: 403 })
  }

  const team = await dbRaw.team.findUnique({
    where: { id: session.teamId },
    select: { id: true, timezone: true },
  })

  if (!team) {
    return new Response('team not found', { status: 404 })
  }

  const { periodStart, periodEnd } = weeklyPeriod(team, DateTime.now())
  const facts = await collectTaskFacts(team.id, periodStart, periodEnd)
  const structured = generateWeeklyUpdate(facts)
  const polished = await polishNarrative(structured.narrative, team.id)
  const content = {
    ...structured,
    narrative: polished.text,
    usedLlm: polished.usedLlm,
  }

  const update = await dbRaw.weeklyUpdate.upsert({
    where: { teamId_periodStart: { teamId: team.id, periodStart } },
    create: {
      teamId: team.id,
      periodStart,
      periodEnd,
      content,
      contentVersion: 1,
    },
    update: { content, generatedAt: new Date() },
  })

  return Response.json({ id: update.id, periodStart, periodEnd })
}
