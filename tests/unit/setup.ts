// Global test setup for unit tests
import { vi } from 'vitest'

// Mock environment variables for tests
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://pmapp:pmapp@localhost:5432/pmapp_test'
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.CRON_SECRET = 'test-cron-secret'
