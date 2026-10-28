ALTER TYPE "EventType" ADD VALUE IF NOT EXISTS 'PAGE_VIEW';

ALTER TABLE "AnalyticsEvent"
  ADD COLUMN "visitorId" TEXT,
  ADD COLUMN "path" TEXT;

CREATE INDEX "AnalyticsEvent_eventType_createdAt_idx"
  ON "AnalyticsEvent"("eventType", "createdAt");

CREATE INDEX "AnalyticsEvent_visitorId_createdAt_idx"
  ON "AnalyticsEvent"("visitorId", "createdAt");

CREATE INDEX "AnalyticsEvent_path_createdAt_idx"
  ON "AnalyticsEvent"("path", "createdAt");
