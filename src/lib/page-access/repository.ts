import type { Pool, PoolClient } from "pg";
import {
  counterSectionKinds,
  staticCounterPaths,
  type AccessCounts,
} from "./paths";
export class AccessError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export type AccessRepository = {
  exists(path: string): Promise<boolean>;
  read(path: string): Promise<AccessCounts>;
  record(path: string, eventId: string): Promise<AccessCounts>;
};
async function readCounts(
  client: Pool | PoolClient,
  path: string,
): Promise<AccessCounts> {
  const { rows } = await client.query<{ path: string; views: string }>(
    'SELECT "path", "views"::text FROM "PageAccessCounter" WHERE "path" = ANY($1::text[])',
    [["*", path]],
  );
  return {
    total: rows.find((r) => r.path === "*")?.views || "0",
    page: rows.find((r) => r.path === path)?.views || "0",
  };
}
export function createPgAccessRepository(pool: Pool): AccessRepository {
  let nextCleanup = 0;
  return {
    async exists(path) {
      if (staticCounterPaths.has(path)) return true;
      const [section, slug] = path.slice(1).split("/");
      if (section === "categorias")
        return (
          (
            await pool.query(
              'SELECT 1 FROM "Category" WHERE "slug"=$1 LIMIT 1',
              [slug],
            )
          ).rowCount === 1
        );
      if (section === "cursos")
        return (
          (
            await pool.query(
              'SELECT 1 FROM "Course" WHERE "slug"=$1 AND "status"=\'PUBLISHED\' LIMIT 1',
              [slug],
            )
          ).rowCount === 1
        );
      const kind = counterSectionKinds[section];
      if (!kind) return false;
      return (
        (
          await pool.query(
            'SELECT 1 FROM "Content" WHERE "slug"=$1 AND "kind"=$2 AND "status"=\'PUBLISHED\' AND "visibility"=\'PUBLIC\' AND "externalAvailable"=true LIMIT 1',
            [slug, kind],
          )
        ).rowCount === 1
      );
    },
    read(path) {
      return readCounts(pool, path);
    },
    async record(path, eventId) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const inserted = await client.query(
          'INSERT INTO "PageAccessReceipt" ("id","path","expiresAt") VALUES ($1::uuid,$2,CURRENT_TIMESTAMP + INTERVAL \'24 hours\') ON CONFLICT ("id") DO NOTHING RETURNING "id"',
          [eventId, path],
        );
        if (inserted.rowCount === 1) {
          // Mesma ordem de bloqueio em todas as transações evita deadlocks entre páginas.
          await client.query(
            'INSERT INTO "PageAccessCounter" AS counter ("path","views","updatedAt") SELECT p,1,CURRENT_TIMESTAMP FROM unnest($1::text[]) AS p ORDER BY p ON CONFLICT ("path") DO UPDATE SET "views"=counter."views"+1,"updatedAt"=CURRENT_TIMESTAMP',
            [["*", path]],
          );
        } else {
          const existing = await client.query<{ path: string }>(
            'SELECT "path" FROM "PageAccessReceipt" WHERE "id"=$1::uuid',
            [eventId],
          );
          if (existing.rows[0]?.path !== path)
            throw new AccessError(
              "Este acesso já foi registrado em outra página.",
              409,
            );
        }
        const counts = await readCounts(client, path);
        if (Date.now() >= nextCleanup) {
          await client.query(
            'DELETE FROM "PageAccessReceipt" WHERE "id" IN (SELECT "id" FROM "PageAccessReceipt" WHERE "expiresAt"<CURRENT_TIMESTAMP ORDER BY "expiresAt" LIMIT 2000)',
          );
          nextCleanup = Date.now() + 300000;
        }
        await client.query("COMMIT");
        return counts;
      } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    },
  };
}
