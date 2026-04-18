'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Users,
  Settings,
} from 'lucide-react'

const navItems = [
  {
    label: 'Dashboard',
    href: '/app/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Projects',
    href: '/app/projects',
    icon: FolderKanban,
  },
  {
    label: 'Weekly Report',
    href: '/app/reports/weekly',
    icon: FileText,
  },
  {
    label: 'Stakeholder Report',
    href: '/app/reports/stakeholder',
    icon: Users,
  },
  {
    label: 'Team Settings',
    href: '/app/settings/team',
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-sidebar h-full flex flex-col">
      <div className="h-14 flex items-center px-4 border-b border-border">
        <span className="font-semibold text-sidebar-foreground text-sm">
          PM Tool
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
