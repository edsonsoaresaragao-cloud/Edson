ALTER TABLE "Content" ADD COLUMN "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "Content" SET "publishedAt" = CASE
  WHEN "kind" = 'VIDEO' AND "metadata"->>'publishedAt' ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$'
  THEN ("metadata"->>'publishedAt')::timestamptz AT TIME ZONE 'UTC'
  ELSE "createdAt" END;
CREATE INDEX "Content_kind_status_publishedAt_idx" ON "Content"("kind", "status", "publishedAt");
