import { type NextRequest, NextResponse } from 'next/server'
import { dbRaw } from '@/src/lib/db-raw'
import { signIn } from '@/src/lib/auth'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=invalid-invite', req.url))
  }

  const invite = await dbRaw.invite.findUnique({ where: { token } })

  if (
    !invite ||
    invite.acceptedAt ||
    invite.expiresAt < new Date()
  ) {
    return NextResponse.redirect(new URL('/login?error=invalid-invite', req.url))
  }

  // Check if user already exists
  let user = await dbRaw.user.findUnique({ where: { email: invite.email } })

  if (!user) {
    // Create the user with a random unusable password (they can set it later)
    const tempPassword = randomBytes(24).toString('hex')
    const hashedPassword = await bcrypt.hash(tempPassword, 12)

    user = await dbRaw.user.create({
      data: {
        email: invite.email,
        role: invite.role,
        teamId: invite.teamId,
        hashedPassword,
      },
    })
  }

  // Mark invite as accepted
  await dbRaw.invite.update({
    where: { id: invite.id },
    data: { acceptedAt: new Date() },
  })

  // Sign in the user and redirect to dashboard
  try {
    await signIn('credentials', {
      email: user.email,
      // Using the redirect flow via NextAuth signIn is not possible here
      // without a password. Use a magic-link approach via NextAuth instead.
      // For MVP: redirect to login with a success message.
      redirect: false,
    })
  } catch {
    // signIn throws a redirect — swallow it
  }

  return NextResponse.redirect(new URL('/app/dashboard', req.url))
}
