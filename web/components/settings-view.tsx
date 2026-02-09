'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { PushRemindersOptIn } from '@/components/pwa/push-reminders-opt-in'
import { HolidayManager } from '@/components/holiday-manager'

export interface SettingsViewProps {
  className?: string
}

export function SettingsView({ className }: SettingsViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn('space-y-7 md:space-y-8', className)}
    >
      <div>
        <h1 className="text-2xl md:text-3xl font-[var(--font-display)] font-bold text-[var(--foreground)]">
          Settings
        </h1>
        <p className="mt-1 text-sm text-[var(--foreground)]/70">
          Manage your notifications and holidays.
        </p>
      </div>

      <PushRemindersOptIn />

      <HolidayManager />
    </motion.div>
  )
}
