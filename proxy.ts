import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  authLimiter,
  inviteLimiter,
  signupLimiter,
  checkRateLimit,
} from './src/lib/rate-limit'

const PUBLIC_PATHS = [
  '/login',
  '/signup',
  '/share',
  '/api/auth',
  '/api/invites/accept',
]

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  )
}

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'anonymous'
  )
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const ip = getIp(req)

  // Rate limiting for specific paths
  if (pathname.startsWith('/api/auth')) {
    const { limited, reset } = await checkRateLimit(authLimiter, ip)
    if (limited) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: reset ? { 'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)) } : {},
      })
    }
  } else if (pathname.startsWith('/api/invites/accept')) {
    const { limited, reset } = await checkRateLimit(inviteLimiter, ip)
    if (limited) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: reset ? { 'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)) } : {},
      })
    }
  } else if (pathname === '/signup' || pathname.startsWith('/signup/')) {
    const { limited, reset } = await checkRateLimit(signupLimiter, ip)
    if (limited) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: reset ? { 'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)) } : {},
      })
    }
  }

  // Allow public paths unconditionally
  if (isPublic(pathname)) return NextResponse.next()

  // Edge-safe JWT check — no Prisma involved
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (!token?.teamId) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
