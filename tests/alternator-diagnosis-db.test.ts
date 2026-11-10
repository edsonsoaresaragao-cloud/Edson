import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Client } from "pg";
import {
  createDiagnosticStore,
  type QueryClient,
} from "../src/lib/alternator-diagnosis/store";
import { emptyCase } from "../src/lib/alternator-diagnosis/schema";
import { caseHandler } from "../src/lib/alternator-diagnosis/handlers";
const connectionString = process.env.TEST_ALTERNATOR_DATABASE_URL;
test(
  "PostgreSQL: migração aditiva, isolamento por proprietário, revisão e retomada real",
  { skip: !connectionString },
  async () => {
    const url = new URL(connectionString!);
    assert.equal(
      url.pathname,
      "/edson_test",
      "Usar somente banco isolado de teste.",
    );
    assert.ok(["localhost", "127.0.0.1"].includes(url.hostname));
    const client = new Client({ connectionString });
    await client.connect();
    try {
      await client.query("BEGIN");
      await client.query("CREATE SCHEMA ad_test");
      await client.query("SET LOCAL search_path TO ad_test");
      await client.query('CREATE TABLE "User" (id TEXT PRIMARY KEY)');
      await client.query(`INSERT INTO "User" VALUES ('owner-a'),('owner-b')`);
      await client.query(
        await readFile(
          "prisma/migrations/202611100001_alternator_diagnostics/migration.sql",
          "utf8",
        ),
      );
      const query = (strings: TemplateStringsArray, values: unknown[]) => ({
        text: strings.reduce((s, part, i) => s + (i ? "$" + i : "") + part, ""),
        values,
      });
      const adapter: QueryClient = {
        $queryRaw: async <T>(
          strings: TemplateStringsArray,
          ...values: unknown[]
        ) => {
          const result = await client.query(query(strings, values));
          return result.rows as T;
        },
        $executeRaw: async (strings, ...values) =>
          (await client.query(query(strings, values))).rowCount || 0,
      };
      const store = createDiagnosticStore(adapter);
      const c = emptyCase();
      c.vehicle.plate = "TEST123";
      c.vehicle.complaint = "Informação privada do proprietário A";
      const saved = await store.create("owner-a", c);
      assert.equal(saved.revision, 1);
      assert.equal(
        (await store.get(saved.id, "owner-a"))?.data.vehicle.plate,
        "TEST123",
      );
      assert.equal(await store.get(saved.id, "owner-b"), undefined);
      assert.equal(((await store.list("owner-b")) as unknown[]).length, 0);
      const h = caseHandler(store, async () => ({ id: "owner-b" }));
      assert.equal(
        (await h(new Request("http://localhost/api?id=" + saved.id))).status,
        404,
      );
      assert.equal(await store.update(saved.id, "owner-b", 1, c), undefined);
      assert.equal(await store.remove(saved.id, "owner-b"), false);
      c.measurements.bplus = "14,1";
      const updated = await store.update(saved.id, "owner-a", 1, c);
      assert.equal(updated?.revision, 2);
      assert.equal(await store.update(saved.id, "owner-a", 1, c), undefined);
      assert.equal(
        (await store.get(saved.id, "owner-a"))?.data.measurements.bplus,
        "14,1",
      );
      await client.query(`DELETE FROM "User" WHERE id='owner-a'`);
      assert.equal(await store.get(saved.id, "owner-a"), undefined);
    } finally {
      await client.query("ROLLBACK");
      await client.end();
    }
  },
);
