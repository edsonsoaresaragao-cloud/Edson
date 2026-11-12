import { randomUUID } from "node:crypto";
import { type SearchCache } from "./service";
import {
  searchSchema,
  type SearchResponse,
  type SearchInput,
} from "./contracts";
export type QueryStore = {
  $queryRaw: <T = unknown>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ) => Promise<T>;
  $executeRaw: (
    strings: TemplateStringsArray,
    ...values: unknown[]
  ) => Promise<number>;
};
export function automotiveStore(db: QueryStore) {
  const cache: SearchCache = {
    async get(key) {
      const rows = await db.$queryRaw<
        { result: SearchResponse }[]
      >`SELECT result FROM "AutomotiveSearchCache" WHERE key=${key} AND "expiresAt">CURRENT_TIMESTAMP`;
      return rows[0]?.result || null;
    },
    async put(key, result, expires) {
      await db.$executeRaw`DELETE FROM "AutomotiveSearchCache" WHERE "expiresAt"<CURRENT_TIMESTAMP`;
      await db.$executeRaw`INSERT INTO "AutomotiveSearchCache" (key,result,"expiresAt") VALUES (${key},${JSON.stringify(result)}::jsonb,${expires}) ON CONFLICT(key) DO UPDATE SET result=EXCLUDED.result,"expiresAt"=EXCLUDED."expiresAt"`;
    },
  };
  return {
    cache,
    async history(owner: string) {
      return db.$queryRaw<
        { id: string; query: SearchInput; createdAt: Date }[]
      >`SELECT id,query,"createdAt" FROM "AutomotiveSearchHistory" WHERE "ownerId"=${owner} ORDER BY "createdAt" DESC LIMIT 30`;
    },
    async save(owner: string, input: SearchInput) {
      const query = searchSchema.parse(input),
        id = randomUUID();
      await db.$executeRaw`INSERT INTO "AutomotiveSearchHistory" (id,"ownerId",query) VALUES (${id},${owner},${JSON.stringify(query)}::jsonb)`;
      await db.$executeRaw`DELETE FROM "AutomotiveSearchHistory" WHERE "ownerId"=${owner} AND id NOT IN (SELECT id FROM "AutomotiveSearchHistory" WHERE "ownerId"=${owner} ORDER BY "createdAt" DESC LIMIT 30)`;
      return id;
    },
    async clear(owner: string) {
      await db.$executeRaw`DELETE FROM "AutomotiveSearchHistory" WHERE "ownerId"=${owner}`;
    },
  };
}
