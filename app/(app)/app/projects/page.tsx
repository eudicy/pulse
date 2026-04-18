import Link from 'next/link'
import { requireSession } from '@/src/lib/auth-session'
import { listProjects } from '@/src/server/projects'
import { getDb } from '@/src/lib/db'
import { ProjectCard } from '@/src/components/projects/ProjectCard'

export default async function ProjectsPage() {
  const session = await requireSession()
  const db = getDb(session.teamId)

  const projects = await listProjects()

  // Get task counts per project
  const projectsWithTaskCounts = await Promise.all(
    projects.map(async (project) => {
      const tasks = await db.task.findMany({ where: { projectId: project.id } })
      return { ...project, tasks }
    })
  )

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your team&apos;s projects and tasks.
          </p>
        </div>
        <Link
          href="/app/projects/new"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
        >
          New Project
        </Link>
      </div>

      {projectsWithTaskCounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground mb-2">
            Create your first project to get a weekly update next Monday
          </p>
          <Link
            href="/app/projects/new"
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
          >
            Create Project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projectsWithTaskCounts.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}
