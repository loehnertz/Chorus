import { revalidateTag } from 'next/cache'

/**
 * Next's revalidation helpers throw when used outside a request/static generation context
 * (notably in unit tests). This wrapper makes cache invalidation best-effort.
 */
export function safeRevalidateTag(tag: string) {
  try {
    // Next 16+: the single-arg form is deprecated.
    revalidateTag(tag, 'max')
  } catch {
    // Ignore when static generation store is unavailable (eg. Jest).
  }
}
