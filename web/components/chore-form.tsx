'use client'

import { useEffect, useMemo, useState } from 'react'
import { Frequency } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/toast-provider'
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
  const { showToast } = useToast()

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
        showToast(payload.error || 'Failed to save chore', 'error')
        return
      }

      onSuccess(payload.data as ChoreWithMeta)
      showToast(mode === 'create' ? 'Chore created' : 'Chore updated')
    } catch {
      setError('Failed to save chore')
      showToast('Failed to save chore', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {error ? (
        <div className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-3.5 text-sm text-red-800">{error}</div>
      ) : null}

      <div className="space-y-2.5">
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

      <div className="space-y-2.5">
        <label className="text-sm font-medium text-[var(--color-charcoal)]" htmlFor="chore-description">
          Description
        </label>
        <textarea
          id="chore-description"
          className="min-h-28 w-full rounded-[var(--radius-md)] border border-[var(--border-soft)] bg-white px-4 py-3 text-sm leading-relaxed transition-all duration-200 focus-visible:outline-none focus-visible:border-[var(--color-terracotta)] focus-visible:shadow-[var(--shadow-focus)]"
          value={values.description}
          onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
          placeholder="Wipe counters, sink, and cabinet handles"
        />
      </div>

      <div className="space-y-2.5">
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
          className="min-h-11 w-full rounded-[var(--radius-md)] border border-[var(--border-soft)] bg-white px-3.5 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:border-[var(--color-terracotta)] focus-visible:shadow-[var(--shadow-focus)] sm:min-h-12"
        >
          <option value={Frequency.DAILY}>DAILY</option>
          <option value={Frequency.WEEKLY}>WEEKLY</option>
          <option value={Frequency.MONTHLY}>MONTHLY</option>
          <option value={Frequency.YEARLY}>YEARLY</option>
        </select>
      </div>

      <div className="space-y-2.5">
        <p className="text-sm font-medium text-[var(--color-charcoal)]">Assign to household members</p>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {users.map((user) => (
            <label
              key={user.id}
              className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-[var(--radius-sm)] border border-[var(--border-soft)] bg-white px-3.5 py-2 text-sm transition-colors hover:bg-[var(--color-cream)]/45"
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

      <div className="flex flex-wrap justify-end gap-2.5 pt-1">
        {onCancel ? (
          <Button type="button" variant="tertiary" onClick={onCancel} className="justify-center">
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={isSubmitting} className="justify-center">
          {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Chore' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
