export * from './types';
export * from './emailConfig';
export * from './emailTemplates';
export * from './notificationQueueService';
export * from './notificationWorker';

/**
 * Fires an opportunistic in-process dispatch of pending notification jobs.
 * This guarantees real-time delivery (<2s) on any plan without delaying the
 * client's HTTP response. If the invocation ends or temporary network failure
 * occurs, the database-backed queue ensures retries by the cron worker.
 */
export function triggerNotificationProcessingAsync(): void {
  // Use setImmediate to avoid blocking the synchronous completion of the request
  setImmediate(() => {
    import('./notificationWorker').then(({ NotificationWorker }) => {
      NotificationWorker.processNotifications(5).catch((err) => {
        console.warn('[NOTIFICATION_ASYNC_DISPATCH_WARN]', err?.message || err);
      });
    });
  });
}
