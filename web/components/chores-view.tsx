'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { ClipboardList, Plus } from 'lucide-react'
import type { Frequency } from '@/types/frequency'
import { FREQUENCIES } from '@/types/frequency'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { ChoreCard } from '@/components/chore-card'
import { ChoreForm } from '@/components/chore-form'

export type ChoresViewUser = { id: string; name: string }

export type ChoresViewChore = {
  id: string
  title: string
  description?: string | null
  frequency: Frequency
  completionCount: number
  assignees: { id: string; name: string }[]
}

export interface ChoresViewProps {
  chores: ChoresViewChore[]
  users: ChoresViewUser[]
}

type FrequencyFilter = 'ALL' | Frequency

export function ChoresView({ chores, users }: ChoresViewProps) {
  const router = useRouter()

  const [filter, setFilter] = React.useState<FrequencyFilter>('ALL')
  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<ChoresViewChore | null>(null)

  const filtered = React.useMemo(() => {
    if (filter === 'ALL') return chores
    return chores.filter((c) => c.frequency === filter)
  }, [chores, filter])

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (chore: ChoresViewChore) => {
    setEditing(chore)
    setFormOpen(true)
  }

  const handleDelete = async (chore: ChoresViewChore) => {
    const ok = window.confirm(`Delete "${chore.title}"? This cannot be undone.`)
    if (!ok) return

    try {
      const res = await fetch(`/api/chores/${chore.id}`, { method: 'DELETE' })
      if (!res.ok) {
        toast.error('Failed to delete chore')
        return
      }

      toast.success('Chore deleted')
      router.refresh()
    } catch {
      toast.error('Failed to delete chore')
    }
  }

  const chipBase =
    'px-3 py-1.5 rounded-full text-sm font-[var(--font-display)] font-medium cursor-pointer transition-colors'

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-[var(--font-display)] font-bold text-[var(--color-charcoal)]">
            Chores
          </h1>
          <p className="mt-1 text-sm text-[var(--color-charcoal)]/70">
            Manage the household chore pool.
          </p>
        </div>

        <Button onClick={openCreate} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          Add Chore
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={cn(
            chipBase,
            filter === 'ALL'
              ? 'bg-[var(--color-terracotta)] text-white'
              : 'bg-white text-[var(--color-charcoal)]/60 border border-[var(--color-charcoal)]/15 hover:border-[var(--color-charcoal)]/30'
          )}
          onClick={() => setFilter('ALL')}
        >
          All
        </button>
        {FREQUENCIES.map((f) => (
          <button
            key={f}
            type="button"
            className={cn(
              chipBase,
              filter === f
                ? 'bg-[var(--color-terracotta)] text-white'
                : 'bg-white text-[var(--color-charcoal)]/60 border border-[var(--color-charcoal)]/15 hover:border-[var(--color-charcoal)]/30'
            )}
            onClick={() => setFilter(f)}
          >
            {f.toLowerCase()}
          </button>
        ))}
      </div>

      {chores.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No chores yet"
          subtitle="Add your first chore to get started"
          ctaLabel="Add Chore"
          onCtaClick={openCreate}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No chores match"
          subtitle="Try a different frequency filter"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c, idx) => (
            <ChoreCard
              key={c.id}
              title={c.title}
              description={c.description}
              frequency={c.frequency}
              assignees={c.assignees}
              completionCount={c.completionCount}
              index={idx}
              onEdit={() => openEdit(c)}
              onDelete={() => handleDelete(c)}
            />
          ))}
        </div>
      )}

      <ChoreForm
        open={formOpen}
        onOpenChange={setFormOpen}
        users={users}
        initialValues={
          editing
            ? {
                id: editing.id,
                title: editing.title,
                description: editing.description,
                frequency: editing.frequency,
                assigneeIds: editing.assignees.map((u) => u.id),
              }
            : undefined
        }
        onSaved={() => router.refresh()}
      />
    </div>
  )
}
