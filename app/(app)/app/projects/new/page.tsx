'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { createProject } from '@/src/server/projects'
import { Button } from '@/components/ui/button'

interface FormValues {
  name: string
  description: string
  deadline: string
}

export default function NewProjectPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { name: '', description: '', deadline: '' },
  })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    try {
      const result = await createProject({
        name: values.name,
        description: values.description || undefined,
        deadline: values.deadline || undefined,
      })
      router.push(`/app/projects/${result.id}`)
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  return (
    <div className="p-8 max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">New Project</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Fill in the details to create a new project.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Name */}
        <div className="space-y-1">
          <label htmlFor="project-name" className="text-sm font-medium">
            Name <span className="text-destructive">*</span>
          </label>
          <input
            id="project-name"
            type="text"
            placeholder="My awesome project"
            {...register('name', { required: 'Project name is required' })}
            className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label htmlFor="project-description" className="text-sm font-medium">
            Description
          </label>
          <textarea
            id="project-description"
            rows={4}
            placeholder="What is this project about?"
            {...register('description')}
            className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        {/* Deadline */}
        <div className="space-y-1">
          <label htmlFor="project-deadline" className="text-sm font-medium">
            Deadline
          </label>
          <input
            id="project-deadline"
            type="date"
            {...register('deadline')}
            className="block w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {serverError && (
          <p className="text-sm text-destructive">{serverError}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create Project'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
