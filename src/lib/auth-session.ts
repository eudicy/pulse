import { auth } from './auth'
import { redirect } from 'next/navigation'

export interface SessionUser {
  userId: string
  teamId: string
  role: 'ADMIN' | 'MEMBER'
  email: string
  name?: string | null
}

export async function requireSession(): Promise<SessionUser> {
  const session = await auth()
  if (!session?.user?.teamId) redirect('/login')
  return {
    userId: session.user.id as string,
    teamId: session.user.teamId as string,
    role: session.user.role as 'ADMIN' | 'MEMBER',
    email: session.user.email as string,
    name: session.user.name,
  }
}
