CREATE TABLE "AutomotiveSearchCache" ("key" TEXT NOT NULL PRIMARY KEY,"result" JSONB NOT NULL,"expiresAt" TIMESTAMP(3) NOT NULL);
CREATE INDEX "AutomotiveSearchCache_expiresAt_idx" ON "AutomotiveSearchCache"("expiresAt");
CREATE TABLE "AutomotiveSearchHistory" ("id" TEXT NOT NULL PRIMARY KEY,"ownerId" TEXT NOT NULL,"query" JSONB NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "AutomotiveSearchHistory_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE);
CREATE INDEX "AutomotiveSearchHistory_ownerId_createdAt_idx" ON "AutomotiveSearchHistory"("ownerId","createdAt");
