import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Client } from "pg";
import {
  automotiveStore,
  type QueryStore,
} from "../src/lib/automotive-search/store";
import {
  emptyInput,
  type SearchResponse,
} from "../src/lib/automotive-search/contracts";

const connectionString = process.env.AUTOMOTIVE_TEST_DATABASE_URL;
test(
  "migration PostgreSQL, cache expirado e histórico isolado por usuário",
  { skip: !connectionString },
  async () => {
    const client = new Client({ connectionString });
    await client.connect();
    await client.query("BEGIN");
    try {
      const schema = "auto_test_" + Date.now();
      await client.query(`CREATE SCHEMA "${schema}"`);
      await client.query(`SET LOCAL search_path TO "${schema}"`);
      await client.query('CREATE TABLE "User" (id TEXT PRIMARY KEY)');
      await client.query(
        await readFile(
          "prisma/migrations/202611120001_automotive_search/migration.sql",
          "utf8",
        ),
      );
      await client.query('INSERT INTO "User"(id) VALUES ($1),($2)', [
        "alice",
        "bob",
      ]);
      const text = (strings: TemplateStringsArray) =>
        strings.reduce((a, s, i) => a + (i ? "$" + i : "") + s, "");
      const database: QueryStore = {
        async $queryRaw<T>(
          strings: TemplateStringsArray,
          ...values: unknown[]
        ) {
          return (await client.query(text(strings), values)).rows as T;
        },
        async $executeRaw(strings: TemplateStringsArray, ...values: unknown[]) {
          return (await client.query(text(strings), values)).rowCount || 0;
        },
      };
      const store = automotiveStore(database);
      const cached = {
        version: 1,
        query: { ...emptyInput, q: "Sensor MAP" },
      } as SearchResponse;
      await store.cache.put("live", cached, new Date(Date.now() + 60000));
      assert.deepEqual(await store.cache.get("live"), cached);
      await store.cache.put("expired", cached, new Date(Date.now() - 60000));
      assert.equal(await store.cache.get("expired"), null);
      await store.cache.put(
        "live",
        { ...cached, cached: true },
        new Date(Date.now() + 60000),
      );
      assert.equal((await store.cache.get("live"))?.cached, true);
      await store.save("alice", {
        ...emptyInput,
        q: "Bobina ' teste; DROP TABLE --",
      });
      await store.save("bob", { ...emptyInput, q: "Sensor MAP" });
      assert.equal((await store.history("alice")).length, 1);
      assert.equal((await store.history("bob"))[0].query.q, "Sensor MAP");
      for (let n = 0; n < 32; n++)
        await store.save("alice", { ...emptyInput, q: "Pesquisa " + n });
      assert.equal((await store.history("alice")).length, 30);
      await store.clear("alice");
      assert.deepEqual(await store.history("alice"), []);
      assert.equal((await store.history("bob")).length, 1);
      await client.query('DELETE FROM "User" WHERE id=$1', ["bob"]);
      assert.deepEqual(await store.history("bob"), []);
    } finally {
      await client.query("ROLLBACK");
      await client.end();
    }
  },
);
