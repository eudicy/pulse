import { describe, it, expect } from 'vitest'
import type { Task, Project, User } from '@prisma/client'
import { generateWeeklyUpdate } from '@/src/server/reports/weekly-generator'
import type { TaskFacts } from '@/src/server/reports/collect-task-facts'

const periodStart = new Date('2024-03-04T00:00:00Z')
const periodEnd = new Date('2024-03-11T00:00:00Z')

function makeTask(overrides: Partial<Task> & { id: string; projectId: string }): Task {
  return {
    id: overrides.id,
    teamId: 'team-1',
    projectId: overrides.projectId,
    title: overrides.title ?? 'Untitled task',
    assigneeId: overrides.assigneeId ?? null,
    dueDate: overrides.dueDate ?? null,
    status: overrides.status ?? 'TODO',
    blockedReason: overrides.blockedReason ?? null,
    completedAt: overrides.completedAt ?? null,
    createdAt: overrides.createdAt ?? periodStart,
    ...overrides,
  } as Task
}

function makeProject(id: string, name: string): Project {
  return {
    id,
    teamId: 'team-1',
    name,
    status: 'ACTIVE',
    createdAt: periodStart,
  } as Project
}

function makeUser(id: string, name: string): User {
  return {
    id,
    name,
    email: `${id}@example.com`,
    teamId: 'team-1',
    createdAt: periodStart,
  } as User
}

function makeFacts(overrides: Partial<TaskFacts>): TaskFacts {
  return {
    periodStart,
    periodEnd,
    teamTimezone: 'UTC',
    completed: [],
    inProgress: [],
    blocked: [],
    newlyCreated: [],
    upcoming: [],
    overdue: [],
    slippedThisWeek: [],
    byProject: new Map(),
    byAssignee: new Map(),
    statusTransitions: [],
    ...overrides,
  }
}

describe('generateWeeklyUpdate', () => {
  it('empty week: narrative contains "No activity", completed is empty', () => {
    const facts = makeFacts({})
    const result = generateWeeklyUpdate(facts)

    expect(result.completed).toHaveLength(0)
    expect(result.inProgress).toHaveLength(0)
    expect(result.blocked).toHaveLength(0)
    expect(result.highlights).toHaveLength(0)
    expect(result.narrative).toMatch(/no activity/i)
    expect(result.usedLlm).toBe(false)
  })

  it('happy week: 3 completed tasks across 2 projects → highlights non-empty, completed has 3 items, narrative mentions count', () => {
    const proj1 = makeProject('proj-1', 'Alpha')
    const proj2 = makeProject('proj-2', 'Beta')

    const t1 = makeTask({ id: 't1', projectId: 'proj-1', title: 'Fix login bug', status: 'DONE', completedAt: new Date('2024-03-07T10:00:00Z') })
    const t2 = makeTask({ id: 't2', projectId: 'proj-1', title: 'Add dashboard', status: 'DONE', completedAt: new Date('2024-03-08T10:00:00Z') })
    const t3 = makeTask({ id: 't3', projectId: 'proj-2', title: 'Deploy staging', status: 'DONE', completedAt: new Date('2024-03-09T10:00:00Z') })

    const byProject = new Map([
      ['proj-1', { project: proj1, tasks: [t1, t2] }],
      ['proj-2', { project: proj2, tasks: [t3] }],
    ])

    const facts = makeFacts({ completed: [t1, t2, t3], byProject })
    const result = generateWeeklyUpdate(facts)

    expect(result.completed).toHaveLength(3)
    expect(result.highlights.length).toBeGreaterThan(0)
    // narrative mentions 3 tasks
    expect(result.narrative).toMatch(/3 task/i)
    // narrative mentions 2 projects
    expect(result.narrative).toMatch(/2 project/i)
    expect(result.usedLlm).toBe(false)
  })

  it('blocked week: 2 blocked tasks → blocked has 2 items', () => {
    const proj = makeProject('proj-1', 'Alpha')
    const t1 = makeTask({ id: 't1', projectId: 'proj-1', title: 'Waiting on design', status: 'BLOCKED', blockedReason: 'Waiting for designs' })
    const t2 = makeTask({ id: 't2', projectId: 'proj-1', title: 'Pending approval', status: 'BLOCKED', blockedReason: 'Needs legal sign-off' })

    const byProject = new Map([['proj-1', { project: proj, tasks: [t1, t2] }]])
    const facts = makeFacts({ blocked: [t1, t2], byProject })
    const result = generateWeeklyUpdate(facts)

    expect(result.blocked).toHaveLength(2)
    expect(result.blocked[0].blockedReason).toBe('Waiting for designs')
    expect(result.blocked[1].blockedReason).toBe('Needs legal sign-off')
    expect(result.narrative).toMatch(/2 task.*blocked/i)
  })

  it('determinism: identical facts produce byte-identical structured sections', () => {
    const proj = makeProject('proj-1', 'Alpha')
    const t1 = makeTask({ id: 't1', projectId: 'proj-1', title: 'Ship feature', status: 'DONE', completedAt: new Date('2024-03-07T10:00:00Z') })
    const byProject = new Map([['proj-1', { project: proj, tasks: [t1] }]])
    const facts = makeFacts({ completed: [t1], byProject })

    const r1 = generateWeeklyUpdate(facts)
    const r2 = generateWeeklyUpdate(facts)

    expect(r1.completed).toEqual(r2.completed)
    expect(r1.inProgress).toEqual(r2.inProgress)
    expect(r1.blocked).toEqual(r2.blocked)
    expect(r1.upcoming).toEqual(r2.upcoming)
    expect(r1.highlights).toEqual(r2.highlights)
    expect(r1.narrative).toBe(r2.narrative)
  })
})
