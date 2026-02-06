'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Frequency } from '@prisma/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ChoreCard } from '@/components/chore-card'
import { ChoreForm } from '@/components/chore-form'
import { useToast } from '@/components/toast-provider'
import type { ChoreWithMeta, UserSummary } from '@/types'

interface ChorePoolManagerProps {
  users: UserSummary[]
}

const FREQUENCIES: Frequency[] = [Frequency.DAILY, Frequency.WEEKLY, Frequency.MONTHLY, Frequency.YEARLY]

interface ChoreResponse {
  data: ChoreWithMeta[]
}

export function ChorePoolManager({ users }: ChorePoolManagerProps) {
  const [chores, setChores] = useState<ChoreWithMeta[]>([])
  const [selectedFrequency, setSelectedFrequency] = useState<Frequency>(Frequency.DAILY)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingChore, setEditingChore] = useState<ChoreWithMeta | null>(null)
  const { showToast } = useToast()

  const filteredChores = useMemo(
    () => chores.filter((chore) => chore.frequency === selectedFrequency),
    [chores, selectedFrequency]
  )

  useEffect(() => {
    const loadChores = async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await fetch('/api/chores')
        const payload = (await response.json()) as ChoreResponse

        if (!response.ok) {
          setError('Failed to load chores')
          showToast('Failed to load chores', 'error')
          return
        }

        setChores(payload.data)
      } catch {
        setError('Failed to load chores')
        showToast('Failed to load chores', 'error')
      } finally {
        setIsLoading(false)
      }
    }

    void loadChores()
  }, [showToast])

  const handleSuccess = (savedChore: ChoreWithMeta) => {
    setChores((current) => {
      const existing = current.find((chore) => chore.id === savedChore.id)
      if (existing) {
        return current.map((chore) => (chore.id === savedChore.id ? savedChore : chore))
      }

      return [savedChore, ...current]
    })
    setFormOpen(false)
    setEditingChore(null)
    showToast('Chore saved')
  }

  const handleDelete = async (choreId: string) => {
    const confirmed = window.confirm('Delete this chore? This cannot be undone.')
    if (!confirmed) {
      return
    }

    const response = await fetch(`/api/chores/${choreId}`, { method: 'DELETE' })
    if (!response.ok) {
      setError('Failed to delete chore')
      showToast('Failed to delete chore', 'error')
      return
    }

    setChores((current) => current.filter((chore) => chore.id !== choreId))
    showToast('Chore deleted')
  }

  return (
    <motion.div
      className="space-y-7 sm:space-y-10"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-charcoal)] sm:text-4xl">Chore Pool</h1>
        <Dialog open={formOpen} onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) {
            setEditingChore(null)
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingChore(null)}>Add Chore</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingChore ? 'Edit Chore' : 'Create Chore'}</DialogTitle>
              <DialogDescription>All chores are shared with the household.</DialogDescription>
            </DialogHeader>
            <ChoreForm
              users={users}
              initialValues={
                editingChore
                  ? {
                    id: editingChore.id,
                    title: editingChore.title,
                    description: editingChore.description || '',
                    frequency: editingChore.frequency,
                    assignedUserIds: editingChore.assignments.map((assignment) => assignment.userId),
                  }
                  : undefined
              }
              onSuccess={handleSuccess}
              onCancel={() => {
                setFormOpen(false)
                setEditingChore(null)
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        {FREQUENCIES.map((frequency) => (
          <Button
            key={frequency}
            size="sm"
            variant={selectedFrequency === frequency ? 'secondary' : 'tertiary'}
            onClick={() => setSelectedFrequency(frequency)}
          >
            {frequency}
          </Button>
        ))}
      </div>

      {error ? (
        <div className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-44 animate-pulse rounded-[var(--radius-lg)] bg-white" />
          ))}
        </div>
      ) : filteredChores.length === 0 ? (
        <p className="text-sm text-[var(--color-charcoal)]/70">No chores in this frequency yet.</p>
      ) : (
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          {filteredChores.map((chore) => (
            <ChoreCard
              key={chore.id}
              chore={chore}
              onEdit={() => {
                setEditingChore(chore)
                setFormOpen(true)
              }}
              onDelete={() => {
                void handleDelete(chore.id)
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
}
