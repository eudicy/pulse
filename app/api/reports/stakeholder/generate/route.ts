import { requireSession } from '@/src/lib/auth-session'
import { dbRaw } from '@/src/lib/db-raw'
import { collectTaskFacts } from '@/src/server/reports/collect-task-facts'
import { generateStakeholderReport } from '@/src/server/reports/stakeholder-generator'
import { polishNarrative } from '@/src/server/reports/narrative-polish'
import { randomBytes } from 'crypto'

export async function POST(req: Request) {
  const session = await requireSession()

  let body: {
    projectId?: string
    periodStart?: string
    periodEnd?: string
  }

  try {
    body = await req.json()
  } catch {
    return new Response('invalid json', { status: 400 })
  }

  const { projectId, periodStart: periodStartStr, periodEnd: periodEndStr } = body

  if (!periodStartStr || !periodEndStr) {
    return new Response('periodStart and periodEnd are required', {
      status: 400,
    })
  }

  const periodStart = new Date(periodStartStr)
  const periodEnd = new Date(periodEndStr)

  if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime())) {
    return new Response('invalid date', { status: 400 })
  }

  // Verify project belongs to team if provided
  if (projectId) {
    const project = await dbRaw.project.findFirst({
      where: { id: projectId, teamId: session.teamId },
      select: { id: true },
    })
    if (!project) {
      return new Response('project not found', { status: 404 })
    }
  }

  const facts = await collectTaskFacts(session.teamId, periodStart, periodEnd)
  const scope: { type: 'team' | 'project'; projectId?: string } = projectId
    ? { type: 'project', projectId }
    : { type: 'team' }
  const structured = generateStakeholderReport(facts, scope)
  const polished = await polishNarrative(structured.narrative, session.teamId)
  const content = {
    ...structured,
    narrative: polished.text,
    usedLlm: polished.usedLlm,
  }

  const shareToken = randomBytes(32).toString('base64url')
  const shareTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  try {
    const report = await dbRaw.stakeholderReport.create({
      data: {
        teamId: session.teamId,
        projectId: projectId ?? null,
        scope: projectId ? 'PROJECT' : 'TEAM',
        periodStart,
        periodEnd,
        content,
        contentVersion: 1,
        shareToken,
        shareTokenExpiresAt,
        generatedByUserId: session.userId,
      },
    })

    return Response.json({ reportId: report.id, shareToken })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('P2002')) {
      const existing = await dbRaw.stakeholderReport.findFirst({
        where: {
          teamId: session.teamId,
          projectId: projectId ?? null,
          periodStart,
        },
      })
      if (existing) {
        return Response.json({
          reportId: existing.id,
          shareToken: existing.shareToken,
        })
      }
    }
    throw err
  }
}
