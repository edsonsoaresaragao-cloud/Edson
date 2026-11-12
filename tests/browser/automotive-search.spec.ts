import { test, expect } from "@playwright/test";

test("endereço antigo da pesquisa técnica redireciona para peças", async ({
  request,
}) => {
  const response = await request.get("/pesquisa-automotiva?auto=Sensor%20MAP", {
    maxRedirects: 0,
  });
  expect(response.status()).toBe(307);
  expect(response.headers().location).toBe("/pecas");
});

test("endpoint real sem credenciais e sugestões locais", async ({
  request,
}) => {
  // O teste independe de Prisma: sem credenciais não há cobrança nem acesso ao banco.
  const suggestions = await request.get(
    "/api/automotive-search?suggest=1&q=map",
  );
  expect(suggestions.status()).toBe(200);
  expect((await suggestions.json()).suggestions.length).toBeGreaterThan(0);
  const response = await request.get("/api/automotive-search?q=sensor%20map");
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.status).toBe("not_configured");
  expect(body.answer).toBeNull();
  expect(body.sources).toEqual([]);
  expect(body.localReferences.length).toBeGreaterThan(0);
});
