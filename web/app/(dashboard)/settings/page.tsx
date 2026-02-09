import { unstable_noStore as noStore } from 'next/cache'
import { requireApprovedUser } from '@/lib/auth/require-approval'
import { SettingsView } from '@/components/settings-view'

export default async function SettingsPage() {
  noStore()
  await requireApprovedUser()

  return <SettingsView />
}

export const dynamic = 'force-dynamic'
