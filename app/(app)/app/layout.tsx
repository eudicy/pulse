import { requireSession } from '@/src/lib/auth-session'
import { Sidebar } from '@/src/components/nav/Sidebar'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireSession()

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  )
}
