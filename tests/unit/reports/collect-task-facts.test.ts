import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Task, Project, User } from '@prisma/client'

vi.mock('@/src/lib/db-raw', () => ({
  dbRaw: {
    task: { findMany: vi.fn() },
    taskStatusEvent: { findMany: vi.fn() },
    team: { findUnique: vi.fn() },
    project: { findMany: vi.fn() },
    user: { findMany: vi.fn() },
  },
}))

import { dbRaw } from '@/src/lib/db-raw'
import { collectTaskFacts } from '@/src/server/reports/collect-task-facts'

const periodStart = new Date('2024-03-04T00:00:00Z')
const periodEnd = new Date('2024-03-11T00:00:00Z')

function makeTask(overrides: Partial<Task> & { id: string }): Task {
  return {
    id: overrides.id,
    teamId: 'team-1',
    projectId: 'proj-1',
    title: 'Test task',
    assigneeId: null,
    dueDate: null,
    status: 'DONE',
    blockedReason: null,
    completedAt: null,
    createdAt: periodStart,
    ...overrides,
  } as Task
}

function makeProject(): Project {
  return {
    id: 'proj-1',
    teamId: 'team-1',
    name: 'Alpha',
    status: 'ACTIVE',
    createdAt: periodStart,
  } as Project
}

beforeEach(() => {
  vi.clearAllMocks()
  ;(dbRaw.team.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
    timezone: 'UTC',
  })
  ;(dbRaw.project.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([makeProject()])
  ;(dbRaw.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([])
  ;(dbRaw.taskStatusEvent.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([])
})

describe('collectTaskFacts boundary behavior', () => {
  it('task with completedAt exactly equal to periodEnd is classified as completed (boundary inclusive)', async () => {
    // completedAt === periodEnd — the <= check should include it
    const task = makeTask({
      id: 't-boundary',
      status: 'DONE',
      completedAt: periodEnd, // exactly on the boundary
      createdAt: new Date('2024-03-05T00:00:00Z'),
    })
    ;(dbRaw.task.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([task])

    const facts = await collectTaskFacts('team-1', periodStart, periodEnd)

    expect(facts.completed).toHaveLength(1)
    expect(facts.completed[0].id).toBe('t-boundary')
  })

  it('task with completedAt exactly equal to periodStart is classified as completed (lower boundary inclusive)', async () => {
    const task = makeTask({
      id: 't-start',
      status: 'DONE',
      completedAt: periodStart,
      createdAt: new Date('2024-03-01T00:00:00Z'),
    })
    ;(dbRaw.task.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([task])

    const facts = await collectTaskFacts('team-1', periodStart, periodEnd)

    expect(facts.completed).toHaveLength(1)
    expect(facts.completed[0].id).toBe('t-start')
  })

  it('task with completedAt one millisecond after periodEnd is NOT classified as completed', async () => {
    const oneAfter = new Date(periodEnd.getTime() + 1)
    const task = makeTask({
      id: 't-after',
      status: 'DONE',
      completedAt: oneAfter,
      createdAt: new Date('2024-03-05T00:00:00Z'),
    })
    ;(dbRaw.task.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([task])

    const facts = await collectTaskFacts('team-1', periodStart, periodEnd)

    expect(facts.completed).toHaveLength(0)
  })
})
