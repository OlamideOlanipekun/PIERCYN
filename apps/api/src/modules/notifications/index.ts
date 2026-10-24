import { waitUntil } from '@vercel/functions';

export * from './types';
export * from './emailConfig';
export * from './emailTemplates';
export * from './notificationQueueService';
export * from './notificationWorker';

/**
 * Registers opportunistic notification work with the Vercel invocation so it
 * can continue after the response without relying on an untracked timer.
 */
export function triggerNotificationProcessingAsync(): void {
  const task = import('./notificationWorker')
    .then(({ NotificationWorker }) => NotificationWorker.processNotifications(2))
    .catch((err) => {
      console.warn('[NOTIFICATION_ASYNC_DISPATCH_WARN]', err?.message || err);
    });

  try {
    waitUntil(task);
  } catch (err: any) {
    // Local/non-Vercel execution has no invocation context. The task still has
    // its rejection handler; production Vercel requests register it above.
    console.warn('[NOTIFICATION_WAITUNTIL_UNAVAILABLE]', err?.message || err);
  }
}
