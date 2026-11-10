import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { requireAdmin, assertOrigin, rateLimit, AppError } from "@/lib/auth";
import { referenceHandler } from "@/lib/alternator-diagnosis/handlers";
export const dynamic = "force-dynamic";
const handler = referenceHandler(
  {
    list: async (admin) =>
      admin
        ? db.$queryRaw`SELECT id,data FROM "DiagnosticTechnicalEntry" ORDER BY "updatedAt" DESC LIMIT 200`
        : db.$queryRaw`SELECT id,data FROM "DiagnosticTechnicalEntry" WHERE published=TRUE ORDER BY "updatedAt" DESC LIMIT 200`,
    async save(entry, actor) {
      const id = entry.id || randomUUID();
      if (entry.id) {
        const changed =
          await db.$executeRaw`UPDATE "DiagnosticTechnicalEntry" SET kind=${entry.kind},data=${JSON.stringify(entry)}::jsonb,published=${entry.published},"editorId"=${actor},"updatedAt"=CURRENT_TIMESTAMP WHERE id=${id}`;
        if (!changed) throw new AppError("Referência não encontrada.", 404);
      } else
        await db.$executeRaw`INSERT INTO "DiagnosticTechnicalEntry" (id,kind,data,published,"editorId") VALUES (${id},${entry.kind},${JSON.stringify(entry)}::jsonb,${entry.published},${actor})`;
      await db.audit.create({
        data: {
          actorId: actor,
          action: "ALTERNATOR_REFERENCE_SAVE",
          target: id,
        },
      });
      return id;
    },
    async remove(id, actor) {
      await db.$executeRaw`DELETE FROM "DiagnosticTechnicalEntry" WHERE id=${id}`;
      await db.audit.create({
        data: {
          actorId: actor,
          action: "ALTERNATOR_REFERENCE_DELETE",
          target: id,
        },
      });
    },
  },
  async (request, write) => {
    if (write) assertOrigin(request);
    const user = await requireAdmin();
    await rateLimit(`alternator:refs:${user.id}`, 30, 60);
    return user;
  },
);
export const GET = handler,
  POST = handler,
  DELETE = handler;
