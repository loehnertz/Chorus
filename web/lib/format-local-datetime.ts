function pad2(n: number) {
  return String(n).padStart(2, '0')
}

/**
 * Format a timestamp in the viewer's local timezone.
 * Output: YYYY-MM-DD HH:mm
 */
export function formatLocalDateTimeCompact(iso: string): string | null {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null

  const y = d.getFullYear()
  const m = pad2(d.getMonth() + 1)
  const day = pad2(d.getDate())
  const hh = pad2(d.getHours())
  const mm = pad2(d.getMinutes())

  return `${y}-${m}-${day} ${hh}:${mm}`
}
