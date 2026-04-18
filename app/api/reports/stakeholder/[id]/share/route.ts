import { requireSession } from '@/src/lib/auth-session'
import { dbRaw } from '@/src/lib/db-raw'
import { randomBytes } from 'crypto'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession()
  const { id } = await params

  const report = await dbRaw.stakeholderReport.findFirst({
    where: { id, teamId: session.teamId },
    select: { id: true },
  })

  if (!report) {
    return new Response('report not found', { status: 404 })
  }

  const shareToken = randomBytes(32).toString('base64url')
  const shareTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  const updated = await dbRaw.stakeholderReport.update({
    where: { id },
    data: {
      shareToken,
      shareTokenExpiresAt,
      shareTokenRevokedAt: null,
    },
  })

  return Response.json({
    reportId: updated.id,
    shareToken: updated.shareToken,
    shareTokenExpiresAt: updated.shareTokenExpiresAt,
  })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession()
  const { id } = await params

  const report = await dbRaw.stakeholderReport.findFirst({
    where: { id, teamId: session.teamId },
    select: { id: true },
  })

  if (!report) {
    return new Response('report not found', { status: 404 })
  }

  await dbRaw.stakeholderReport.update({
    where: { id },
    data: { shareTokenRevokedAt: new Date() },
  })

  return Response.json({ reportId: id, revoked: true })
}
