import { describe, it, expect, vi, beforeEach } from 'vitest'

// We need to capture the $extends call args so we can extract and invoke
// the interceptors directly — this lets us test the guard logic without
// needing a real Prisma client or database.
let capturedExt: Record<string, unknown> | null = null

vi.mock('@/src/lib/db-raw', () => ({
  dbRaw: {
    $extends: vi.fn().mockImplementation((ext: Record<string, unknown>) => {
      capturedExt = ext
      // Return a minimal object; tests call the interceptors directly
      return { _ext: ext }
    }),
    task: { findUnique: vi.fn(), update: vi.fn() },
    taskStatusEvent: { create: vi.fn() },
  },
}))

import { createScopedDb } from '@/src/lib/db'

// Helper: walk into the $extends query interceptor for a model+operation
function getInterceptor(model: string, operation: string): Function {
  const ext = capturedExt as any
  // Prisma $extends shape: { query: { $allModels: { create, ... }, task: { ... } } }
  const allModels = ext?.query?.$allModels
  const modelSpecific = ext?.query?.[model]
  return (modelSpecific?.[operation] ?? allModels?.[operation]) as Function
}

describe('createScopedDb cross-tenant write rejection', () => {
  beforeEach(() => {
    capturedExt = null
    vi.clearAllMocks()
  })

  it('calling create with mismatched teamId throws Cross-tenant write rejected', async () => {
    createScopedDb('team-A')

    const createInterceptor = getInterceptor('task', 'create')
    expect(createInterceptor).toBeDefined()

    const mockQuery = vi.fn().mockResolvedValue({})
    await expect(
      createInterceptor({
        model: 'task',
        args: { data: { teamId: 'team-B', title: 'Evil task' } },
        query: mockQuery,
        operation: 'create',
      })
    ).rejects.toThrow('Cross-tenant write rejected')

    // The underlying query should NOT have been called
    expect(mockQuery).not.toHaveBeenCalled()
  })

  it('calling create with matching teamId does NOT throw', async () => {
    createScopedDb('team-A')

    const createInterceptor = getInterceptor('task', 'create')
    const mockQuery = vi.fn().mockResolvedValue({ id: 'new-task' })

    await expect(
      createInterceptor({
        model: 'task',
        args: { data: { teamId: 'team-A', title: 'Legit task' } },
        query: mockQuery,
        operation: 'create',
      })
    ).resolves.not.toThrow()

    expect(mockQuery).toHaveBeenCalledOnce()
  })

  it('calling create with no teamId in data injects the session teamId', async () => {
    createScopedDb('team-A')

    const createInterceptor = getInterceptor('task', 'create')
    const data: Record<string, unknown> = { title: 'No teamId set' }
    const mockQuery = vi.fn().mockResolvedValue({ id: 'new-task' })

    await createInterceptor({
      model: 'task',
      args: { data },
      query: mockQuery,
      operation: 'create',
    })

    // teamId should have been injected
    expect(data.teamId).toBe('team-A')
    expect(mockQuery).toHaveBeenCalledOnce()
  })

  it('non-domain model (e.g. user) is NOT guarded by teamId check', async () => {
    createScopedDb('team-A')

    const createInterceptor = getInterceptor('$allModels', 'create')
    expect(createInterceptor).toBeDefined()

    const mockQuery = vi.fn().mockResolvedValue({})
    // 'user' is not in DOMAIN_MODELS so cross-tenant data should pass through
    await expect(
      createInterceptor({
        model: 'user',
        args: { data: { teamId: 'team-Z', name: 'Alice' } },
        query: mockQuery,
        operation: 'create',
      })
    ).resolves.not.toThrow()

    expect(mockQuery).toHaveBeenCalledOnce()
  })
})
