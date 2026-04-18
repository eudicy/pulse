'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { createTask, updateTask } from '@/src/server/tasks'
import type { Task, TaskStatus } from '@prisma/client'

interface TaskDialogProps {
  task?: Task
  projectId: string
  members: { id: string; name: string | null; email: string }[]
  onClose: () => void
}

interface FormValues {
  title: string
  description: string
  assigneeId: string
  dueDate: string
  status: TaskStatus
  blockedReason: string
}

const TASK_STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE']

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  BLOCKED: 'Blocked',
  DONE: 'Done',
}

export function TaskDialog({ task, projectId, members, onClose }: TaskDialogProps) {
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      title: task?.title ?? '',
      description: task?.description ?? '',
      assigneeId: task?.assigneeId ?? '',
      dueDate: task?.dueDate
        ? new Date(task.dueDate).toISOString().split('T')[0]
        : '',
      status: task?.status ?? 'TODO',
      blockedReason: task?.blockedReason ?? '',
    },
  })

  const status = watch('status')

  useEffect(() => {
    reset({
      title: task?.title ?? '',
      description: task?.description ?? '',
      assigneeId: task?.assigneeId ?? '',
      dueDate: task?.dueDate
        ? new Date(task.dueDate).toISOString().split('T')[0]
        : '',
      status: task?.status ?? 'TODO',
      blockedReason: task?.blockedReason ?? '',
    })
  }, [task, reset])

  async function onSubmit(values: FormValues) {
    if (task) {
      await updateTask(task.id, {
        title: values.title,
        description: values.description || undefined,
        assigneeId: values.assigneeId || undefined,
        dueDate: values.dueDate || undefined,
        status: values.status,
        blockedReason: values.status === 'BLOCKED' ? values.blockedReason : undefined,
      })
    } else {
      await createTask({
        projectId,
        title: values.title,
        description: values.description || undefined,
        assigneeId: values.assigneeId || undefined,
        dueDate: values.dueDate || undefined,
        status: values.status,
      })
    }
    router.refresh()
    onClose()
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Add Task'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-1">
            <label htmlFor="task-title" className="text-sm font-medium">
              Title <span className="text-destructive">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              {...register('title', { required: 'Title is required' })}
              className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label htmlFor="task-description" className="text-sm font-medium">
              Description
            </label>
            <textarea
              id="task-description"
              rows={3}
              {...register('description')}
              className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* Assignee */}
          <div className="space-y-1">
            <label htmlFor="task-assignee" className="text-sm font-medium">
              Assignee
            </label>
            <select
              id="task-assignee"
              {...register('assigneeId')}
              className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name ?? m.email}
                </option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <div className="space-y-1">
            <label htmlFor="task-due-date" className="text-sm font-medium">
              Due Date
            </label>
            <input
              id="task-due-date"
              type="date"
              {...register('dueDate')}
              className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Status */}
          <div className="space-y-1">
            <label htmlFor="task-status" className="text-sm font-medium">
              Status
            </label>
            <select
              id="task-status"
              {...register('status')}
              className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          {/* Blocked Reason — only shown when BLOCKED */}
          {status === 'BLOCKED' && (
            <div className="space-y-1">
              <label htmlFor="task-blocked-reason" className="text-sm font-medium">
                Blocked Reason
              </label>
              <textarea
                id="task-blocked-reason"
                rows={2}
                {...register('blockedReason')}
                placeholder="What is blocking this task?"
                className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
          )}

          <DialogFooter showCloseButton>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : task ? 'Save Changes' : 'Add Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
