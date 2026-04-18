import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
}

let finalConfig: NextConfig | Promise<NextConfig> = nextConfig

if (process.env.SENTRY_DSN) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { withSentryConfig } = require('@sentry/nextjs') as typeof import('@sentry/nextjs')
  finalConfig = withSentryConfig(nextConfig, { silent: true, telemetry: false })
}

export default finalConfig
