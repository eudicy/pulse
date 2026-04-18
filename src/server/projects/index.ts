'use server'

import { requireSession } from '@/src/lib/auth-session'
import { getDb } from '@/src/lib/db'
import type { Project, Task, ProjectStatus } from '@prisma/client'

export async function createProject(data: {
  name: string
  description?: string
  deadline?: string
}): Promise<{ id: string }> {
  const session = await requireSession()
  const db = getDb(session.teamId)

  const project = await db.project.create({
    data: {
      teamId: session.teamId,
      name: data.name,
      description: data.description ?? null,
      deadline: data.deadline ? new Date(data.deadline) : null,
    },
  })

  return { id: project.id }
}

export async function listProjects(): Promise<Project[]> {
  const session = await requireSession()
  const db = getDb(session.teamId)

  return db.project.findMany({
    orderBy: { createdAt: 'desc' },
  })
}

export async function getProject(
  projectId: string
): Promise<Project & { tasks: Task[] }> {
  const session = await requireSession()
  const db = getDb(session.teamId)

  const project = await db.project.findFirst({
    where: { id: projectId },
    include: { tasks: { orderBy: { createdAt: 'asc' } } },
  })

  if (!project) {
    throw new Error('Project not found')
  }

  return project
}

export async function updateProject(
  projectId: string,
  data: Partial<{
    name: string
    description: string
    status: ProjectStatus
    deadline: string
  }>
): Promise<void> {
  const session = await requireSession()
  const db = getDb(session.teamId)

  await db.project.update({
    where: { id: projectId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.deadline !== undefined && {
        deadline: data.deadline ? new Date(data.deadline) : null,
      }),
    },
  })
}
