import { unstable_noStore as noStore } from 'next/cache'
import { requireApprovedUser } from '@/lib/auth/require-approval'
import { SchedulePageClient } from './SchedulePageClient'

type SearchParams = Record<string, string | string[] | undefined>

function parseMonthParam(raw: string | undefined): { year: number; monthIndex: number } | null {
  if (!raw) return null
  const m = raw.match(/^(\d{4})-(\d{2})$/)
  if (!m) return null
  const year = Number(m[1])
  const month = Number(m[2])
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null
  if (month < 1 || month > 12) return null
  return { year, monthIndex: month - 1 }
}

function parseDayParam(raw: string | undefined): string | null {
  if (!raw) return null
  const ok = /^\d{4}-\d{2}-\d{2}$/.test(raw)
  return ok ? raw : null
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>
}) {
  noStore()
  await requireApprovedUser()

  const sp = (await searchParams) ?? {}
  const monthRaw = Array.isArray(sp.month) ? sp.month[0] : sp.month
  const dayRaw = Array.isArray(sp.day) ? sp.day[0] : sp.day

  const now = new Date()
  const parsedMonth = parseMonthParam(monthRaw)

  return (
    <SchedulePageClient
      month={parsedMonth ? `${parsedMonth.year}-${String(parsedMonth.monthIndex + 1).padStart(2, '0')}` : `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`}
      day={parseDayParam(dayRaw)}
    />
  )
}

export const dynamic = 'force-dynamic'
