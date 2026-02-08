import { Prisma } from '@prisma/client';

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
    // IMPORTANT: Avoid writing on every request.
    // `User.updatedAt` is `@updatedAt`, so an unconditional upsert turns every
    // approval check into a DB write.

    const existing = await db.user.findUnique({ where: { id: validated.id } });

    if (!existing) {
      try {
        return await db.user.create({
          data: {
            id: validated.id,
            name: normalizedName ?? null,
            image: validated.image ?? null,
            approved: approved ?? false,
          },
        });
      } catch (error) {
        // Concurrent requests can race on first-login user creation.
        const isUniqueConstraint =
          (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') ||
          (typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            (error as { code?: unknown }).code === 'P2002');

        if (isUniqueConstraint) {
          const afterRace = await db.user.findUnique({ where: { id: validated.id } });
          if (afterRace) return afterRace;
        }
        throw error;
      }
    }

    const update: { name?: string | null; image?: string | null; approved?: boolean } = {};

    if (normalizedName !== undefined && normalizedName !== existing.name) {
      update.name = normalizedName;
    }
    if (validated.image !== undefined && validated.image !== existing.image) {
      update.image = validated.image;
    }
    if (approved !== undefined && approved !== existing.approved) {
      update.approved = approved;
    }

    if (Object.keys(update).length === 0) {
      return existing;
    }

    return await db.user.update({
      where: { id: validated.id },
      data: update,
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
