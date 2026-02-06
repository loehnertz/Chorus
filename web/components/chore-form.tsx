'use client'

import { useEffect, useMemo, useState } from 'react'
import { Frequency } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ChoreWithMeta, UserSummary } from '@/types'

interface ChoreFormValues {
  id?: string
  title: string
  description: string
  frequency: Frequency
  assignedUserIds: string[]
}

interface ChoreFormProps {
  users: UserSummary[]
  initialValues?: ChoreFormValues
  onSuccess: (chore: ChoreWithMeta) => void
  onCancel?: () => void
}

const DEFAULT_VALUES: ChoreFormValues = {
  title: '',
  description: '',
  frequency: Frequency.DAILY,
  assignedUserIds: [],
}

export function ChoreForm({ users, initialValues, onSuccess, onCancel }: ChoreFormProps) {
  const [values, setValues] = useState<ChoreFormValues>(initialValues ?? DEFAULT_VALUES)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const mode = useMemo(() => (initialValues?.id ? 'edit' : 'create'), [initialValues?.id])

  useEffect(() => {
    setValues(initialValues ?? DEFAULT_VALUES)
  }, [initialValues])

  const toggleAssignment = (userId: string) => {
    setValues((current) => {
      if (current.assignedUserIds.includes(userId)) {
        return {
          ...current,
          assignedUserIds: current.assignedUserIds.filter((id) => id !== userId),
        }
      }

      return {
        ...current,
        assignedUserIds: [...current.assignedUserIds, userId],
      }
    })
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!values.title.trim()) {
      setError('Title is required')
      return
    }

    setIsSubmitting(true)
    try {
      const endpoint = mode === 'create' ? '/api/chores' : `/api/chores/${initialValues?.id}`
      const method = mode === 'create' ? 'POST' : 'PUT'

      const response = await fetch(endpoint, {
        method,
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          title: values.title,
          description: values.description,
          frequency: values.frequency,
          assignedUserIds: values.assignedUserIds,
        }),
      })

      const payload = await response.json()
      if (!response.ok) {
        setError(payload.error || 'Failed to save chore')
        return
      }

      onSuccess(payload.data as ChoreWithMeta)
    } catch {
      setError('Failed to save chore')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error ? (
        <div className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
      ) : null}

      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--color-charcoal)]" htmlFor="chore-title">
          Title
        </label>
        <Input
          id="chore-title"
          value={values.title}
          onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
          placeholder="Kitchen cleanup"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--color-charcoal)]" htmlFor="chore-description">
          Description
        </label>
        <textarea
          id="chore-description"
          className="min-h-24 w-full rounded-[var(--radius-md)] border-2 border-[var(--color-charcoal)]/20 bg-white px-4 py-2 text-sm"
          value={values.description}
          onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
          placeholder="Wipe counters, sink, and cabinet handles"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[var(--color-charcoal)]" htmlFor="chore-frequency">
          Frequency
        </label>
        <select
          id="chore-frequency"
          value={values.frequency}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              frequency: event.target.value as Frequency,
            }))
          }
          className="h-11 w-full rounded-[var(--radius-md)] border-2 border-[var(--color-charcoal)]/20 bg-white px-3 text-sm"
        >
          <option value={Frequency.DAILY}>DAILY</option>
          <option value={Frequency.WEEKLY}>WEEKLY</option>
          <option value={Frequency.MONTHLY}>MONTHLY</option>
          <option value={Frequency.YEARLY}>YEARLY</option>
        </select>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-[var(--color-charcoal)]">Assign to household members</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {users.map((user) => (
            <label
              key={user.id}
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-charcoal)]/15 bg-white px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={values.assignedUserIds.includes(user.id)}
                onChange={() => toggleAssignment(user.id)}
              />
              <span>{user.name || 'Unnamed user'}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Chore' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
