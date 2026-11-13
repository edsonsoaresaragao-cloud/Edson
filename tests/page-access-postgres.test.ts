import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { createPgAccessRepository } from "../src/lib/page-access/repository";
const testDatabase = process.env.COUNTER_TEST_DATABASE_URL;
test(
  "PostgreSQL: concorrência, repetição, persistência, limpeza e páginas publicadas",
  { skip: !testDatabase },
  async (t) => {
    const url = new URL(testDatabase!);
    assert.ok(["localhost", "127.0.0.1"].includes(url.hostname));
    assert.equal(url.pathname, "/page_counter");
    const pool = new Pool({ connectionString: testDatabase, max: 4 });
    let repo = createPgAccessRepository(pool);
    await pool.query('TRUNCATE "PageAccessReceipt", "PageAccessCounter"');
    try {
      await t.test(
        "vinte tentativas simultâneas de um evento somam uma visita",
        async () => {
          const id = randomUUID();
          await Promise.all(
            Array.from({ length: 20 }, () => repo.record("/sobre", id)),
          );
          assert.deepEqual(await repo.read("/sobre"), {
            total: "1",
            page: "1",
          });
        },
      );
      await t.test(
        "quarenta visitas simultâneas em duas páginas não perdem incrementos",
        async () => {
          await Promise.all(
            Array.from({ length: 40 }, (_, i) =>
              repo.record(i % 2 ? "/sobre" : "/termos", randomUUID()),
            ),
          );
          assert.deepEqual(await repo.read("/sobre"), {
            total: "41",
            page: "21",
          });
          assert.deepEqual(await repo.read("/termos"), {
            total: "41",
            page: "20",
          });
          const duplicate = await pool.query<{ id: string }>(
            'SELECT "id"::text FROM "PageAccessReceipt" WHERE "path"=\'/sobre\' LIMIT 1',
          );
          await assert.rejects(
            repo.record("/termos", duplicate.rows[0].id),
            /outra página/,
          );
          assert.equal((await repo.read("/sobre")).total, "41");
        },
      );
      await t.test(
        "os números permanecem ao recriar o repositório e outra conexão",
        async () => {
          const anotherPool = new Pool({
            connectionString: testDatabase,
            max: 1,
          });
          try {
            repo = createPgAccessRepository(anotherPool);
            assert.deepEqual(await repo.read("/sobre"), {
              total: "41",
              page: "21",
            });
          } finally {
            await anotherPool.end();
            repo = createPgAccessRepository(pool);
          }
        },
      );
      await t.test(
        "identificadores vencidos são removidos sem apagar totais",
        async () => {
          const id = randomUUID();
          await pool.query(
            'INSERT INTO "PageAccessReceipt" ("id","path","expiresAt") VALUES ($1,\'/sobre\',CURRENT_TIMESTAMP-INTERVAL \'2 days\')',
            [id],
          );
          await repo.record("/sobre", randomUUID());
          assert.equal(
            (
              await pool.query(
                'SELECT 1 FROM "PageAccessReceipt" WHERE "id"=$1',
                [id],
              )
            ).rowCount,
            0,
          );
          assert.deepEqual(await repo.read("/sobre"), {
            total: "42",
            page: "22",
          });
        },
      );
      await t.test(
        "somente conteúdo público da seção correta pode receber contador",
        async () => {
          await pool.query(
            'INSERT INTO "Content" ("id","kind","slug","title","summary","status","updatedAt") VALUES (\'counter-fixture\',\'ARTICLE\',\'counter-fixture\',\'Teste\',\'Teste\',\'PUBLISHED\',CURRENT_TIMESTAMP)',
          );
          assert.equal(await repo.exists("/artigos/counter-fixture"), true);
          assert.equal(await repo.exists("/videos/counter-fixture"), false);
          await pool.query(
            'UPDATE "Content" SET "visibility"=\'PRIVATE\' WHERE "id"=\'counter-fixture\'',
          );
          assert.equal(await repo.exists("/artigos/counter-fixture"), false);
          assert.equal(await repo.exists("/categorias/nao-existe"), false);
          assert.equal(await repo.exists("/cursos/nao-existe"), false);
        },
      );
    } finally {
      await pool.query('DELETE FROM "Content" WHERE "id"=\'counter-fixture\'');
      await pool.end();
    }
  },
);
