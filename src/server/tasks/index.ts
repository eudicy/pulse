'use server'

import { requireSession } from '@/src/lib/auth-session'
import { getDb } from '@/src/lib/db'
import type { TaskStatus, User } from '@prisma/client'
import { dbRaw } from '@/src/lib/db-raw'

export async function createTask(data: {
  projectId: string
  title: string
  description?: string
  assigneeId?: string
  dueDate?: string
  status?: TaskStatus
}): Promise<{ id: string }> {
  const session = await requireSession()
  const db = getDb(session.teamId)

  const task = await db.task.create({
    data: {
      teamId: session.teamId,
      projectId: data.projectId,
      title: data.title,
      description: data.description ?? null,
      assigneeId: data.assigneeId ?? null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      status: data.status ?? 'TODO',
      completedAt: data.status === 'DONE' ? new Date() : null,
    },
  })

  return { id: task.id }
}

export async function updateTask(
  taskId: string,
  data: Partial<{
    title: string
    description: string
    assigneeId: string
    dueDate: string
    status: TaskStatus
    blockedReason: string
  }>
): Promise<void> {
  const session = await requireSession()
  const db = getDb(session.teamId)

  const updateData: Record<string, unknown> = { ...data }

  if (data.dueDate !== undefined) {
    updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null
  }

  if (data.status === 'DONE') {
    updateData.completedAt = new Date()
  } else if (data.status !== undefined) {
    updateData.completedAt = null
  }

  await db.task.update({
    where: { id: taskId },
    data: updateData,
  })
}

export async function deleteTask(taskId: string): Promise<void> {
  const session = await requireSession()
  const db = getDb(session.teamId)

  await db.task.delete({
    where: { id: taskId },
  })
}

export async function listTeamMembers(): Promise<
  Pick<User, 'id' | 'name' | 'email'>[]
> {
  const session = await requireSession()

  return dbRaw.user.findMany({
    where: { teamId: session.teamId },
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  })
}
