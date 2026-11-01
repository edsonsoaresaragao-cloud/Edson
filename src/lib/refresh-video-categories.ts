import { db } from "./db";
import type { Prisma } from "@prisma/client";
import { classify, CLASSIFICATION_VERSION } from "./catalog";

export async function refreshVideoCategories() {
  let cursor: string | undefined;
  let updated = 0;
  while (true) {
    const batch = await db.content.findMany({
      where: {
        kind: "VIDEO",
        youtubeId: { not: null },
        manualCategories: false,
      },
      select: { id: true, title: true, body: true, metadata: true },
      orderBy: { id: "asc" },
      take: 100,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    if (!batch.length) return updated;
    for (const item of batch) {
      const metadata: Prisma.JsonObject =
        item.metadata &&
        typeof item.metadata === "object" &&
        !Array.isArray(item.metadata)
          ? item.metadata
          : {};
      if (metadata.classificationVersion === CLASSIFICATION_VERSION) continue;
      const result = classify(`${item.title} ${item.body}`);
      const change = await db.content.updateMany({
        // An administrator's manual correction during this pass still wins.
        where: { id: item.id, manualCategories: false },
        data: {
          categorySlugs: result.categories,
          confidence: result.confidence,
          metadata: {
            ...metadata,
            classificationVersion: CLASSIFICATION_VERSION,
          },
        },
      });
      updated += change.count;
    }
    cursor = batch[batch.length - 1].id;
  }
}
