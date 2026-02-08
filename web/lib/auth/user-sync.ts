import { db } from '@/lib/db';
import type { NeonAuthUser } from '@/types/auth';
import { logError } from '@/lib/logger';
import { z } from 'zod';

const neonUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().max(255).nullable().optional(),
  image: z.string().url().nullable().optional(),
});

/**
 * User Sync Logic
 * Ensures that a User record exists in the app schema for each Neon Auth user
 * This should be called after successful authentication
 */

/**
 * Sync user from Neon Auth to app database
 * Creates a User record if it doesn't exist, updates if it does
 *
 * @param neonUser - User object from Neon Auth session
 * @param approved - Optional: set approval status (default: false for new users, unchanged for existing)
 * @returns The synced User record from the app database
 */
export async function syncUser(neonUser: NeonAuthUser, approved?: boolean) {
  const parsed = neonUserSchema.safeParse(neonUser);
  if (!parsed.success) {
    logError('user-sync.validation', parsed.error, {
      userId: (neonUser as unknown as { id?: string })?.id,
    });
    throw new Error('Invalid user data');
  }

  const validated = parsed.data;

  const normalizedName =
    validated.name === undefined
      ? undefined
      : (validated.name?.trim() ? validated.name.trim() : null);

  try {
    // Use upsert to atomically create or update the user record
    // This avoids race conditions where concurrent requests both try to create
    return await db.user.upsert({
      where: { id: validated.id },
      update: {
        ...(normalizedName !== undefined ? { name: normalizedName } : {}),
        ...(validated.image !== undefined ? { image: validated.image } : {}),
        ...(approved !== undefined && { approved }),
      },
      create: {
        id: validated.id,
        name: normalizedName ?? null,
        image: validated.image ?? null,
        approved: approved ?? false,
      },
    });
  } catch (error) {
    logError('user-sync', error, { userId: validated.id });
    throw new Error('Failed to sync user data');
  }
}

/**
 * Get or create user in app database
 * Convenience function that syncs the user and returns the result
 *
 * @param neonUser - User object from Neon Auth session
 * @returns The User record from the app database
 */
export async function getOrCreateUser(neonUser: NeonAuthUser) {
  return syncUser(neonUser);
}
