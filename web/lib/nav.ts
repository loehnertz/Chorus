import type { LucideIcon } from 'lucide-react'
import { CalendarDays, ClipboardList, LayoutDashboard, Settings } from 'lucide-react'

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/schedule', label: 'Schedule', icon: CalendarDays },
  { href: '/chores', label: 'Chores', icon: ClipboardList },
  { href: '/settings', label: 'Settings', icon: Settings },
]
