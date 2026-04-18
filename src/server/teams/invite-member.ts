'use server'

import { requireSession } from '@/src/lib/auth-session'
import { dbRaw } from '@/src/lib/db-raw'
import { sendEmail } from '@/src/lib/email'
import { randomBytes } from 'crypto'

export async function inviteMember(input: {
  email: string
  role: 'ADMIN' | 'MEMBER'
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireSession()

    if (session.role !== 'ADMIN') {
      return { success: false, error: 'Only admins can invite members.' }
    }

    const { email, role } = input

    if (!email || typeof email !== 'string') {
      return { success: false, error: 'Invalid email address.' }
    }

    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h

    // Upsert: replace any existing pending invite for this email+team
    await dbRaw.invite.upsert({
      where: {
        // Use a unique lookup — fall back to create if not found
        token: token, // always new, so always creates
      },
      update: {},
      create: {
        teamId: session.teamId,
        email,
        token,
        role,
        expiresAt,
      },
    })

    const inviteUrl = `${process.env.NEXTAUTH_URL}/api/invites/accept?token=${token}`

    await sendEmail({
      to: email,
      subject: "You've been invited to join a team",
      html: `
        <p>You have been invited to join a team as <strong>${role}</strong>.</p>
        <p>
          <a href="${inviteUrl}" style="display:inline-block;padding:10px 20px;background:#000;color:#fff;border-radius:6px;text-decoration:none;">
            Accept Invitation
          </a>
        </p>
        <p>This invite expires in 24 hours.</p>
        <p>Or copy this link: ${inviteUrl}</p>
      `,
    })

    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Something went wrong.'
    return { success: false, error: message }
  }
}
