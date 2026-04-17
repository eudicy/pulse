import { PrismaClient, TaskStatus } from '@prisma/client'
import { dbRaw } from './db-raw'

const DOMAIN_MODELS = new Set([
  'task', 'project', 'invite', 'weeklyUpdate', 'stakeholderReport', 'llmUsage',
])

/**
 * Creates a tenant-scoped Prisma client using $extends.
 * All domain model queries are automatically scoped to sessionTeamId.
 * Task status changes automatically emit TaskStatusEvent rows.
 */
export function createScopedDb(sessionTeamId: string) {
  const tenantScoped = dbRaw.$extends({
    query: {
      $allModels: {
        // READ operations: inject teamId filter
        async findMany({ model, args, query }) {
          if (DOMAIN_MODELS.has(model as string)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(args as any).where = { ...(args as any).where, teamId: sessionTeamId }
          }
          return query(args)
        },
        async findFirst({ model, args, query }) {
          if (DOMAIN_MODELS.has(model as string)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(args as any).where = { ...(args as any).where, teamId: sessionTeamId }
          }
          return query(args)
        },
        async findUnique({ model, args, query }) {
          if (DOMAIN_MODELS.has(model as string)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(args as any).where = { ...(args as any).where, teamId: sessionTeamId }
          }
          return query(args)
        },
        // WRITE operations: validate/inject teamId
        async create({ model, args, query }) {
          if (DOMAIN_MODELS.has(model as string)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data = (args as any).data as Record<string, unknown>
            if (data.teamId && data.teamId !== sessionTeamId) {
              throw new Error(
                `Cross-tenant write rejected: tried to write teamId=${data.teamId} in session for teamId=${sessionTeamId}`
              )
            }
            data.teamId = sessionTeamId
          }
          return query(args)
        },
        async createMany({ model, args, query }) {
          if (DOMAIN_MODELS.has(model as string)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const rows = (args as any).data as Record<string, unknown>[]
            for (const row of rows) {
              if (row.teamId && row.teamId !== sessionTeamId) {
                throw new Error(`Cross-tenant write rejected in createMany: teamId=${row.teamId}`)
              }
              row.teamId = sessionTeamId
            }
          }
          return query(args)
        },
        async update({ model, args, query }) {
          if (DOMAIN_MODELS.has(model as string)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(args as any).where = { ...(args as any).where, teamId: sessionTeamId }
          }
          return query(args)
        },
        async updateMany({ model, args, query }) {
          if (DOMAIN_MODELS.has(model as string)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(args as any).where = { ...(args as any).where, teamId: sessionTeamId }
          }
          return query(args)
        },
        async upsert({ model, args, query }) {
          if (DOMAIN_MODELS.has(model as string)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const a = args as any
            a.where = { ...a.where, teamId: sessionTeamId }
            if (a.create?.teamId && a.create.teamId !== sessionTeamId) {
              throw new Error(`Cross-tenant upsert rejected: teamId=${a.create.teamId}`)
            }
            if (a.create) a.create.teamId = sessionTeamId
          }
          return query(args)
        },
        async delete({ model, args, query }) {
          if (DOMAIN_MODELS.has(model as string)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(args as any).where = { ...(args as any).where, teamId: sessionTeamId }
          }
          return query(args)
        },
        async deleteMany({ model, args, query }) {
          if (DOMAIN_MODELS.has(model as string)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(args as any).where = { ...(args as any).where, teamId: sessionTeamId }
          }
          return query(args)
        },
      },

      // Status-event invariant: emit TaskStatusEvent on every task status change
      task: {
        async update({ args, query }) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const data = (args as any).data
          if (!data?.status) return query(args)

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const taskId = (args as any).where?.id as string | undefined
          if (!taskId) return query(args)

          const before = await dbRaw.task.findUnique({
            where: { id: taskId },
            select: { status: true, teamId: true },
          })

          const result = await query(args)

          if (before && before.status !== data.status) {
            await dbRaw.taskStatusEvent.create({
              data: {
                taskId,
                teamId: before.teamId,
                fromStatus: before.status,
                toStatus: data.status as TaskStatus,
                changedByUserId: null,
              },
            })
          }
          return result
        },
      },
    },
  })

  return tenantScoped
}

// Per-request cache — cleared at module load (Next.js hot-reload safe)
const dbCache = new Map<string, ReturnType<typeof createScopedDb>>()

export function getDb(teamId: string) {
  if (!dbCache.has(teamId)) {
    dbCache.set(teamId, createScopedDb(teamId))
  }
  return dbCache.get(teamId)!
}

// For use in server actions without explicit teamId (resolved from session)
export type ScopedDb = ReturnType<typeof createScopedDb>

// Re-export raw client for cron/seed/system operations
export { dbRaw } from './db-raw'
