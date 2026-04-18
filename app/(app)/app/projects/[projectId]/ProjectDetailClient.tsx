'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TaskDialog } from '@/src/components/tasks/TaskDialog'
import { TaskStatusBadge } from '@/src/components/tasks/TaskStatusBadge'
import { Button } from '@/components/ui/button'
import { deleteTask } from '@/src/server/tasks'
import type { Task } from '@prisma/client'

interface Member {
  id: string
  name: string | null
  email: string
}

interface ProjectDetailClientProps {
  projectId: string
  members: Member[]
  tasks: Task[]
  memberMap: Record<string, Member>
  showEmptyState: boolean
}

export function ProjectDetailClient({
  projectId,
  members,
  tasks,
  memberMap,
  showEmptyState,
}: ProjectDetailClientProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined)

  function openAddDialog() {
    setEditingTask(undefined)
    setDialogOpen(true)
  }

  function openEditDialog(task: Task) {
    setEditingTask(task)
    setDialogOpen(true)
  }

  async function handleDelete(taskId: string) {
    if (!confirm('Delete this task?')) return
    await deleteTask(taskId)
    router.refresh()
  }

  function handleClose() {
    setDialogOpen(false)
    setEditingTask(undefined)
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={openAddDialog}>Add Task</Button>
      </div>

      {showEmptyState ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-lg border border-dashed border-border">
          <p className="text-muted-foreground text-sm">
            No tasks yet. Add your first task.
          </p>
          <Button variant="outline" className="mt-4" onClick={openAddDialog}>
            Add Task
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Title
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Assignee
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Due Date
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tasks.map((task) => {
                const assignee = task.assigneeId ? memberMap[task.assigneeId] : null
                return (
                  <tr key={task.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{task.title}</p>
                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {task.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {assignee ? (assignee.name ?? assignee.email) : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <TaskStatusBadge status={task.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(task)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(task.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {dialogOpen && (
        <TaskDialog
          task={editingTask}
          projectId={projectId}
          members={members}
          onClose={handleClose}
        />
      )}
    </div>
  )
}
