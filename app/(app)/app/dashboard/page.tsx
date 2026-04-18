import Link from 'next/link'
import { requireSession } from '@/src/lib/auth-session'

export default async function DashboardPage() {
  const session = await requireSession()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-foreground">
        Welcome, {session.name ?? session.email}
      </h1>
      <p className="text-muted-foreground mt-1">
        You&apos;re logged in as a team admin.
      </p>

      <div className="mt-8">
        <p className="text-sm text-muted-foreground mb-4">
          No projects yet. Get started by creating your first project.
        </p>
        <Link
          href="/app/projects/new"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
        >
          Create first project
        </Link>
      </div>
    </div>
  )
}
