CREATE TABLE "PageAccessCounter" (
  "path" TEXT NOT NULL,
  "views" BIGINT NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PageAccessCounter_pkey" PRIMARY KEY ("path"),
  CONSTRAINT "PageAccessCounter_views_nonnegative" CHECK ("views" >= 0)
);
CREATE TABLE "PageAccessReceipt" (
  "id" UUID NOT NULL,
  "path" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PageAccessReceipt_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PageAccessReceipt_expiresAt_idx" ON "PageAccessReceipt"("expiresAt");
