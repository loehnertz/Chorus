'use client'

import { useMemo, useState } from 'react'
import { Frequency } from '@prisma/client'
import { motion } from 'framer-motion'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { FrequencyBadge } from '@/components/frequency-badge'
import type { ChoreWithMeta } from '@/types'

interface ChoreCardProps {
  chore: Pick<ChoreWithMeta, 'id' | 'title' | 'description' | 'frequency' | 'assignments' | '_count'>
  scheduleId?: string
  onComplete?: (choreId: string, scheduleId?: string) => Promise<void> | void
  onEdit?: () => void
  onDelete?: () => void
  className?: string
}

export function ChoreCard({ chore, scheduleId, onComplete, onEdit, onDelete, className }: ChoreCardProps) {
  const [isCompleting, setIsCompleting] = useState(false)

  const assignedNames = useMemo(
    () => chore.assignments.map((assignment) => assignment.user.name || 'Unknown').join(', '),
    [chore.assignments]
  )

  const handleCompletion = async (checked: boolean | string) => {
    if (checked !== true || !onComplete || isCompleting) {
      return
    }

    setIsCompleting(true)
    try {
      await onComplete(chore.id, scheduleId)
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={className}>
        <CardHeader className="mb-4 flex flex-row items-start justify-between gap-4 pb-0">
          <div className="space-y-2">
            <CardTitle className="text-xl">{chore.title}</CardTitle>
            <FrequencyBadge frequency={chore.frequency as Frequency} />
          </div>
          {onComplete ? (
            <Checkbox
              aria-label={`Mark ${chore.title} complete`}
              disabled={isCompleting}
              onCheckedChange={handleCompletion}
            />
          ) : null}
        </CardHeader>

        <CardContent className="space-y-3">
          {chore.description ? (
            <p className="text-sm leading-relaxed text-[var(--color-charcoal)]/82">{chore.description}</p>
          ) : (
            <p className="text-sm text-[var(--color-charcoal)]/50">No description</p>
          )}
          <p className="text-xs font-medium tracking-wide text-[var(--color-charcoal)]/70">
            Assigned to: {assignedNames || 'No one yet'}
          </p>
          <p className="text-xs text-[var(--color-charcoal)]/60">Completed {chore._count.completions} times</p>
        </CardContent>

        {(onEdit || onDelete) ? (
          <CardFooter className="gap-2.5">
            {onEdit ? (
              <Button size="sm" variant="tertiary" onClick={onEdit}>
                Edit
              </Button>
            ) : null}
            {onDelete ? (
              <Button size="sm" variant="tertiary" onClick={onDelete} className="border-red-200 text-red-700 hover:bg-red-50">
                Delete
              </Button>
            ) : null}
          </CardFooter>
        ) : null}
      </Card>
    </motion.div>
  )
}
