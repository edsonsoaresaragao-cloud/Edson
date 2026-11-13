ALTER TABLE "Enrollment" ADD COLUMN "lastLessonId" TEXT,
ADD COLUMN "lastViewedAt" TIMESTAMP(3);
ALTER TABLE "Certificate" ADD COLUMN "completedAt" TIMESTAMP(3);
