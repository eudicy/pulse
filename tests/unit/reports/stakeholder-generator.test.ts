import { describe, it, expect } from 'vitest'
import type { Task, Project, User } from '@prisma/client'
import { generateStakeholderReport } from '@/src/server/reports/stakeholder-generator'
import type { TaskFacts } from '@/src/server/reports/collect-task-facts'

const periodStart = new Date('2026-04-01T00:00:00Z')
const periodEnd = new Date('2026-04-30T00:00:00Z')

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
    description: null,
    deadline: null,
    createdAt: periodStart,
    updatedAt: periodStart,
  } as Project
}

function makeFacts(overrides: Partial<TaskFacts> = {}): TaskFacts {
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

const project = makeProject('p1', 'Alpha')

describe('generateStakeholderReport', () => {
  describe('progressSinceLast', () => {
    it('uses percentComplete field (not pct)', () => {
      const done = makeTask({ id: 't1', projectId: 'p1', status: 'DONE', completedAt: periodStart })
      const todo = makeTask({ id: 't2', projectId: 'p1', status: 'TODO' })
      const facts = makeFacts({
        completed: [done],
        inProgress: [todo],
        byProject: new Map([['p1', { project, tasks: [done, todo] }]]),
      })

      const report = generateStakeholderReport(facts, { type: 'team' })
      const progress = report.progressSinceLast

      expect(progress.length).toBeGreaterThan(0)
      const item = progress[0]
      // Must have percentComplete, not pct
      expect(item).toHaveProperty('percentComplete')
      expect((item as Record<string, unknown>).pct).toBeUndefined()
      expect(item.percentComplete).toBe(50)
    })

    it('percentComplete is 100 when all tasks done', () => {
      const t1 = makeTask({ id: 't1', projectId: 'p1', status: 'DONE', completedAt: periodStart })
      const t2 = makeTask({ id: 't2', projectId: 'p1', status: 'DONE', completedAt: periodStart })
      const facts = makeFacts({
        completed: [t1, t2],
        byProject: new Map([['p1', { project, tasks: [t1, t2] }]]),
      })

      const report = generateStakeholderReport(facts, { type: 'team' })
      expect(report.progressSinceLast[0].percentComplete).toBe(100)
    })

    it('percentComplete is 0 when no tasks done', () => {
      const t1 = makeTask({ id: 't1', projectId: 'p1', status: 'TODO' })
      const facts = makeFacts({
        inProgress: [t1],
        byProject: new Map([['p1', { project, tasks: [t1] }]]),
      })

      const report = generateStakeholderReport(facts, { type: 'team' })
      expect(report.progressSinceLast[0].percentComplete).toBe(0)
    })
  })

  describe('risks severity field', () => {
    it('blocked tasks have severity high', () => {
      const t = makeTask({ id: 't1', projectId: 'p1', status: 'BLOCKED', blockedReason: 'waiting' })
      const facts = makeFacts({
        blocked: [t],
        byProject: new Map([['p1', { project, tasks: [t] }]]),
      })

      const report = generateStakeholderReport(facts, { type: 'team' })
      const risk = report.risks.find((r) => r.riskType === 'blocked')
      expect(risk).toBeDefined()
      expect(risk?.severity).toBe('high')
    })

    it('overdue tasks have severity high', () => {
      const t = makeTask({
        id: 't1',
        projectId: 'p1',
        status: 'IN_PROGRESS',
        dueDate: new Date('2026-03-01T00:00:00Z'),
      })
      const facts = makeFacts({
        overdue: [t],
        byProject: new Map([['p1', { project, tasks: [t] }]]),
      })

      const report = generateStakeholderReport(facts, { type: 'team' })
      const risk = report.risks.find((r) => r.riskType === 'overdue')
      expect(risk).toBeDefined()
      expect(risk?.severity).toBe('high')
    })

    it('slipped tasks have severity medium', () => {
      const t = makeTask({
        id: 't1',
        projectId: 'p1',
        status: 'IN_PROGRESS',
        dueDate: new Date('2026-04-15T00:00:00Z'),
      })
      const facts = makeFacts({
        slippedThisWeek: [t],
        byProject: new Map([['p1', { project, tasks: [t] }]]),
      })

      const report = generateStakeholderReport(facts, { type: 'team' })
      const risk = report.risks.find((r) => r.riskType === 'slipped')
      expect(risk).toBeDefined()
      expect(risk?.severity).toBe('medium')
    })

    it('all risk items have a severity field', () => {
      const blocked = makeTask({ id: 't1', projectId: 'p1', status: 'BLOCKED' })
      const overdue = makeTask({ id: 't2', projectId: 'p1', status: 'TODO', dueDate: new Date('2026-03-01') })
      const facts = makeFacts({
        blocked: [blocked],
        overdue: [overdue],
        byProject: new Map([['p1', { project, tasks: [blocked, overdue] }]]),
      })

      const report = generateStakeholderReport(facts, { type: 'team' })
      for (const risk of report.risks) {
        expect(risk.severity).toBeDefined()
        expect(['low', 'medium', 'high']).toContain(risk.severity)
      }
    })
  })

  describe('empty state', () => {
    it('returns valid structure with no tasks', () => {
      const report = generateStakeholderReport(makeFacts(), { type: 'team' })
      expect(report.progressSinceLast).toEqual([])
      expect(report.risks).toEqual([])
      expect(report.keyDeliverables).toEqual([])
      expect(report.narrative).toBeTruthy()
    })
  })
})
