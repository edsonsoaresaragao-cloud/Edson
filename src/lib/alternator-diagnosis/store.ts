import { randomUUID } from "node:crypto";
import { administrativeReferenceIssue, entrySchema } from "./schema";
import type { Store, CaseRow } from "./handlers";
export type QueryClient = {
  $queryRaw: <T = unknown>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ) => Promise<T>;
  $executeRaw: (
    strings: TemplateStringsArray,
    ...values: unknown[]
  ) => Promise<number>;
};
export function createDiagnosticStore(db: QueryClient): Store {
  return {
    async validateReference(data) {
      const rows = await db.$queryRaw<
        { data: unknown }[]
      >`SELECT data FROM "DiagnosticTechnicalEntry" WHERE id=${data.reference.entryId} AND published=TRUE`;
      const parsed = entrySchema.safeParse(rows[0]?.data);
      return administrativeReferenceIssue(
        data,
        parsed.success ? parsed.data : undefined,
      );
    },
    list: (owner) =>
      db.$queryRaw`SELECT id,revision,"updatedAt",data->'vehicle'->>'make' AS make,data->'vehicle'->>'model' AS model FROM "DiagnosticCase" WHERE "ownerId"=${owner} ORDER BY "updatedAt" DESC LIMIT 100`,
    async get(id, owner) {
      return (
        await db.$queryRaw<
          CaseRow[]
        >`SELECT * FROM "DiagnosticCase" WHERE id=${id} AND "ownerId"=${owner}`
      )[0];
    },
    async create(owner, data) {
      const id = randomUUID();
      return (
        await db.$queryRaw<
          CaseRow[]
        >`INSERT INTO "DiagnosticCase" (id,"ownerId",data) VALUES (${id},${owner},${JSON.stringify(data)}::jsonb) RETURNING *`
      )[0];
    },
    async update(id, owner, revision, data) {
      return (
        await db.$queryRaw<
          CaseRow[]
        >`UPDATE "DiagnosticCase" SET data=${JSON.stringify(data)}::jsonb,revision=revision+1,"updatedAt"=CURRENT_TIMESTAMP WHERE id=${id} AND "ownerId"=${owner} AND revision=${revision} RETURNING *`
      )[0];
    },
    async remove(id, owner) {
      return (
        (await db.$executeRaw`DELETE FROM "DiagnosticCase" WHERE id=${id} AND "ownerId"=${owner}`) >
        0
      );
    },
  };
}
