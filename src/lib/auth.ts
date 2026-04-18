import NextAuth, { type NextAuthConfig } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import NodemailerProvider from 'next-auth/providers/nodemailer'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { dbRaw } from './db-raw'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      userId: string
      teamId: string
      role: 'ADMIN' | 'MEMBER'
      email: string
      name?: string | null
      image?: string | null
    }
  }

  interface User {
    teamId: string
    role: 'ADMIN' | 'MEMBER'
  }
}


const config: NextAuthConfig = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(dbRaw) as any,
  session: { strategy: 'jwt' },
  providers: [
    NodemailerProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST ?? 'localhost',
        port: Number(process.env.EMAIL_SERVER_PORT ?? 1025),
        auth:
          process.env.EMAIL_SERVER_USER
            ? {
                user: process.env.EMAIL_SERVER_USER,
                pass: process.env.EMAIL_SERVER_PASSWORD,
              }
            : undefined,
      },
      from: process.env.EMAIL_FROM ?? 'noreply@example.com',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (
          !credentials?.email ||
          !credentials?.password ||
          typeof credentials.email !== 'string' ||
          typeof credentials.password !== 'string'
        ) {
          return null
        }

        const user = await dbRaw.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user?.hashedPassword) return null

        const passwordValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword,
        )

        if (!passwordValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          teamId: user.teamId,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token['userId'] = user.id as string
        token['teamId'] = (user as { teamId: string }).teamId
        token['role'] = (user as { role: 'ADMIN' | 'MEMBER' }).role
      }
      return token
    },
    async session({ session, token }) {
      session.user.userId = token['userId'] as string
      session.user.teamId = token['teamId'] as string
      session.user.role = token['role'] as 'ADMIN' | 'MEMBER'
      session.user.id = token['userId'] as string
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
}

export const { auth, handlers, signIn, signOut } = NextAuth(config)
