import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { counterPath, validCounts } from "../src/lib/page-access/paths";
import {
  AccessError,
  type AccessRepository,
} from "../src/lib/page-access/repository";
import { createAccessHandlers } from "../src/lib/page-access/handler";
const origin = "https://edson.example";
function fixture() {
  const pages = new Map<string, bigint>(),
    receipts = new Map<string, string>();
  let total = 0n;
  const repo: AccessRepository = {
    async exists(p) {
      return p !== "/artigos/inexistente";
    },
    async read(path) {
      return { total: String(total), page: String(pages.get(path) || 0n) };
    },
    async record(path, id) {
      if (receipts.has(id)) {
        if (receipts.get(id) !== path)
          throw new AccessError("Evento reutilizado.", 409);
      } else {
        receipts.set(id, path);
        pages.set(path, (pages.get(path) || 0n) + 1n);
        total++;
      }
      return this.read(path);
    },
  };
  return createAccessHandlers({ repository: () => repo, origin: () => origin });
}
function request(
  path = "/sobre",
  eventId: string = randomUUID(),
  headers: Record<string, string> = {},
) {
  return new Request(origin + "/api/page-access", {
    method: "POST",
    headers: { origin, "content-type": "application/json", ...headers },
    body: JSON.stringify({ path, eventId }),
  });
}
test("caminhos públicos são normalizados sem aceitar consultas, contas ou códigos privados", () => {
  for (const p of [
    "/",
    "/sobre",
    "/pecas",
    "/categorias/suspensao",
    "/academy/aulas/motores-que-batem-valvula",
  ])
    assert.equal(counterPath(p), p);
  assert.equal(counterPath("/sobre/"), "/sobre");
  for (const p of [
    "/admin",
    "/aluno",
    "/aluno/cursos/1",
    "/login",
    "/cadastro",
    "/redefinir-senha",
    "/certificados/abcd1234",
    "/api/page-access",
    "//sobre",
    "/sobre?email=pessoal",
    "/sobre#token",
    "/constructor/foo",
    "/categorias/../admin",
    "https://evil.test/",
    "/artigos/" + "x".repeat(250),
  ])
    assert.equal(counterPath(p), null, p);
});
test("POST contabiliza uma visita por evento; GET e repetição não duplicam", async () => {
  const api = fixture(),
    id = randomUUID();
  assert.deepEqual(await (await api.POST(request("/sobre", id))).json(), {
    total: "1",
    page: "1",
    counted: true,
  });
  assert.deepEqual(await (await api.POST(request("/sobre", id))).json(), {
    total: "1",
    page: "1",
    counted: true,
  });
  assert.deepEqual(await (await api.POST(request("/termos"))).json(), {
    total: "2",
    page: "1",
    counted: true,
  });
  assert.deepEqual(
    await (
      await api.GET(new Request(origin + "/api/page-access?path=/sobre"))
    ).json(),
    { total: "2", page: "1" },
  );
  assert.equal((await api.POST(request("/termos", id))).status, 409);
});
test("origem externa, rotas privadas, campos extras e payloads inválidos são recusados", async () => {
  const api = fixture();
  assert.equal(
    (
      await api.POST(
        request("/sobre", randomUUID(), { origin: "https://evil.test" }),
      )
    ).status,
    403,
  );
  assert.equal((await api.POST(request("/aluno"))).status, 400);
  assert.equal((await api.POST(request("/artigos/inexistente"))).status, 404);
  assert.equal((await api.POST(request("/sobre", "abc"))).status, 400);
  assert.equal(
    (
      await api.POST(
        new Request(origin, {
          method: "POST",
          headers: { origin, "content-type": "text/plain" },
          body: "hello",
        }),
      )
    ).status,
    415,
  );
  assert.equal(
    (
      await api.POST(
        new Request(origin, {
          method: "POST",
          headers: { origin, "content-type": "application/json" },
          body: JSON.stringify({
            path: "/sobre",
            eventId: randomUUID(),
            userId: "outra-pessoa",
          }),
        }),
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await api.POST(
        new Request(origin, {
          method: "POST",
          headers: { origin, "content-type": "application/json" },
          body: "x".repeat(1100),
        }),
      )
    ).status,
    413,
  );
});
test("robôs conhecidos, prefetch, DNT e GPC consultam sem incrementar", async () => {
  const api = fixture();
  const cases: Record<string, string>[] = [
    { "user-agent": "Googlebot" },
    { purpose: "prefetch" },
    { dnt: "1" },
    { "sec-gpc": "1" },
  ];
  for (const headers of cases) {
    assert.deepEqual(
      await (await api.POST(request("/sobre", randomUUID(), headers))).json(),
      { total: "0", page: "0", counted: false },
    );
  }
});
test("falha do banco é honesta, sem expor credenciais ou números fabricados", async (context) => {
  context.mock.method(console, "error", () => {});
  const api = createAccessHandlers({
    repository: () => {
      throw new Error("postgresql://segredo@host/db");
    },
    origin: () => origin,
  });
  const response = await api.POST(request());
  assert.equal(response.status, 503);
  const text = await response.text();
  assert.match(text, /indisponível/);
  assert.doesNotMatch(text, /segredo|total|page/);
});
test("totais grandes permanecem inteiros e respostas inválidas não são exibidas", () => {
  assert.ok(validCounts({ total: "9007199254740993", page: "1234" }));
  assert.equal(
    BigInt("9007199254740993").toLocaleString("pt-BR"),
    "9.007.199.254.740.993",
  );
  for (const value of [
    { total: -1, page: 0 },
    { total: "NaN", page: "1" },
    { total: "-1", page: "0" },
    null,
  ])
    assert.equal(validCounts(value), false);
});
