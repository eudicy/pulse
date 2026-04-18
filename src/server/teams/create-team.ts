'use server'

import bcrypt from 'bcryptjs'
import { dbRaw } from '@/src/lib/db-raw'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function createTeamAndAdmin(input: {
  teamName: string
  name: string
  email: string
  password?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { teamName, name, email, password } = input

    const baseSlug = slugify(teamName)
    if (!baseSlug) {
      return { success: false, error: 'Invalid team name.' }
    }

    // Ensure slug uniqueness by appending a short random suffix if needed
    let slug = baseSlug
    const existing = await dbRaw.team.findUnique({ where: { slug } })
    if (existing) {
      slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`
    }

    const hashedPassword = password
      ? await bcrypt.hash(password, 12)
      : undefined

    await dbRaw.$transaction(async (tx) => {
      const team = await tx.team.create({
        data: { name: teamName, slug },
      })

      await tx.user.create({
        data: {
          name,
          email,
          role: 'ADMIN',
          teamId: team.id,
          hashedPassword: hashedPassword ?? null,
        },
      })
    })

    return { success: true }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Something went wrong.'
    // Unique constraint on email
    if (message.includes('Unique constraint') || message.includes('P2002')) {
      return { success: false, error: 'An account with that email already exists.' }
    }
    return { success: false, error: message }
  }
}
