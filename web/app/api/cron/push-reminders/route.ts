import webpush from 'web-push';

import { db } from '@/lib/db';
import { startOfTodayUtc, startOfTomorrowUtc } from '@/lib/date';
import {
  buildReminderNotificationPayload,
  filterSchedulesForUser,
  shouldSendReminder,
  type ReminderKind,
} from '@/lib/push/reminders';

export const runtime = 'nodejs';

function isAuthorizedCron(request: Request): boolean {
  // Vercel Scheduled Functions set this header.
  const vercelCron = request.headers.get('x-vercel-cron');
  if (vercelCron === '1') return true;

  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length).trim() : null;
  const expected = process.env.CRON_SECRET?.trim();
  if (!expected) return false;
  return token === expected;
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v?.trim()) {
    throw new Error(`Missing env var: ${name}`);
  }
  return v.trim();
}

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const vapidPublicKey = requireEnv('NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY');
  const vapidPrivateKey = requireEnv('WEB_PUSH_VAPID_PRIVATE_KEY');
  const subject = requireEnv('WEB_PUSH_VAPID_SUBJECT');

  webpush.setVapidDetails(subject, vapidPublicKey, vapidPrivateKey);

  const now = new Date();
  const todayStart = startOfTodayUtc(now);
  const tomorrowStart = startOfTomorrowUtc(now);

  const [subs, schedules] = await Promise.all([
    db.webPushSubscription.findMany({
      select: {
        id: true,
        endpoint: true,
        subscription: true,
        userId: true,
        timezone: true,
        lastMorningKey: true,
        lastEveningKey: true,
      },
    }),
    db.schedule.findMany({
      where: {
        hidden: false,
        scheduledFor: { gte: todayStart, lt: tomorrowStart },
        completion: { is: null },
      },
      select: {
        id: true,
        scheduledFor: true,
        chore: {
          select: {
            title: true,
            frequency: true,
            assignments: { select: { userId: true } },
          },
        },
      },
    }),
  ]);

  let considered = 0;
  let sent = 0;
  let removed = 0;
  let skipped = 0;

  const kindOrder: ReminderKind[] = ['morning', 'evening'];

  for (const sub of subs) {
    const tz = sub.timezone?.trim() ? sub.timezone.trim() : 'UTC';

    let kindToSend: ReminderKind | null = null;
    let dayKey: string | null = null;

    for (const kind of kindOrder) {
      const check = shouldSendReminder(now, tz, kind);
      const already = kind === 'morning' ? sub.lastMorningKey === check.dayKey : sub.lastEveningKey === check.dayKey;
      if (check.send && !already) {
        kindToSend = kind;
        dayKey = check.dayKey;
        break;
      }
    }

    if (!kindToSend || !dayKey) {
      skipped++;
      continue;
    }

    considered++;

    const relevant = filterSchedulesForUser(schedules as never, sub.userId);
    if (relevant.length === 0) {
      // Don't set dedupe keys: if tasks appear later in the window, we still want to send.
      continue;
    }

    const payload = buildReminderNotificationPayload({
      kind: kindToSend,
      dayKey,
      incomplete: relevant.map((s) => ({ title: s.chore.title })),
    });

    try {
      await webpush.sendNotification(
        sub.subscription as unknown as webpush.PushSubscription,
        JSON.stringify(payload),
      );
      sent++;

      await db.webPushSubscription.update({
        where: { id: sub.id },
        data: kindToSend === 'morning' ? { lastMorningKey: dayKey } : { lastEveningKey: dayKey },
      });
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number } | null)?.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        removed++;
        await db.webPushSubscription.deleteMany({ where: { id: sub.id } });
        continue;
      }

      console.error('Failed to send push notification', {
        subscriptionId: sub.id,
        statusCode,
        error: err,
      });
    }
  }

  return Response.json({ ok: true, considered, sent, skipped, removed });
}
