import { withApproval } from '@/lib/auth/with-approval';
import { db } from '@/lib/db';
import {
  deleteWebPushSubscriptionSchema,
  formatValidationError,
  upsertWebPushSubscriptionSchema,
} from '@/lib/validations';

export const runtime = 'nodejs';

export const GET = withApproval(async (session) => {
  const count = await db.webPushSubscription.count({
    where: { userId: session.user.id },
  });

  return Response.json({ enabled: count > 0, count });
});

export const POST = withApproval(async (session, request: Request) => {
  try {
    const body = await request.json();
    const parsed = upsertWebPushSubscriptionSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(formatValidationError(parsed.error), { status: 400 });
    }

    const { subscription, timezone } = parsed.data;
    const endpoint = subscription.endpoint;
    const p256dh = subscription.keys.p256dh;
    const auth = subscription.keys.auth;

    const userAgent = request.headers.get('user-agent') || null;
    const tz = timezone?.trim() ? timezone.trim() : null;

    const saved = await db.webPushSubscription.upsert({
      where: { endpoint },
      create: {
        userId: session.user.id,
        endpoint,
        p256dh,
        auth,
        subscription: subscription as unknown as object,
        userAgent,
        timezone: tz,
      },
      update: {
        userId: session.user.id,
        p256dh,
        auth,
        subscription: subscription as unknown as object,
        userAgent,
        timezone: tz,
      },
      select: {
        id: true,
        endpoint: true,
        timezone: true,
        updatedAt: true,
      },
    });

    return Response.json({ ok: true, subscription: saved }, { status: 200 });
  } catch (error) {
    console.error('Failed to save web push subscription:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const DELETE = withApproval(async (session, request: Request) => {
  try {
    let endpoint: string | undefined;
    try {
      const body = await request.json();
      const parsed = deleteWebPushSubscriptionSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json(formatValidationError(parsed.error), { status: 400 });
      }
      endpoint = parsed.data.endpoint;
    } catch {
      // Allow empty body: delete all.
      endpoint = undefined;
    }

    if (endpoint) {
      await db.webPushSubscription.deleteMany({
        where: { userId: session.user.id, endpoint },
      });
    } else {
      await db.webPushSubscription.deleteMany({
        where: { userId: session.user.id },
      });
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete web push subscription:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});
