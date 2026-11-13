import { randomBytes, createHmac } from "node:crypto";
import { Pool } from "pg";
import {
  AccessError,
  createPgAccessRepository,
  type AccessRepository,
} from "./repository";
const globalAccess = globalThis as unknown as {
  pageAccessPool?: Pool;
  pageAccessRepository?: AccessRepository;
};
export function productionAccessRepository() {
  if (!globalAccess.pageAccessRepository) {
    if (!process.env.DATABASE_URL)
      throw new AccessError("Contador temporariamente indisponível.", 503);
    globalAccess.pageAccessPool ??= new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 2,
      idleTimeoutMillis: 15000,
      connectionTimeoutMillis: 3000,
      statement_timeout: 5000,
      allowExitOnIdle: true,
    });
    globalAccess.pageAccessPool.on("error", () =>
      console.error("page_access_pool_unavailable"),
    );
    globalAccess.pageAccessRepository = createPgAccessRepository(
      globalAccess.pageAccessPool,
    );
  }
  return globalAccess.pageAccessRepository;
}
const salt = randomBytes(32),
  limits = new Map<string, { count: number; until: number }>();
export function guardAccess(request: Request) {
  const now = Date.now();
  for (const [key, value] of limits) if (value.until < now) limits.delete(key);
  const address =
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    "anonymous";
  const key = createHmac("sha256", salt)
    .update(address.slice(0, 160))
    .digest("hex");
  const entry = limits.get(key) || { count: 0, until: now + 60000 };
  entry.count++;
  if (!limits.has(key) && limits.size >= 4096)
    limits.delete(limits.keys().next().value!);
  limits.set(key, entry);
  if (entry.count > 120)
    throw new AccessError("Aguarde um momento para atualizar o contador.", 429);
}
