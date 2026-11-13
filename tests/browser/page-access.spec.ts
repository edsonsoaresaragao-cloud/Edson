import {
  test,
  expect,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import type { AccessCounts } from "../../src/lib/page-access/paths";

// Requer o banco isolado descrito em docs/CONTADOR-ACESSOS.md; não simula totais.
test.skip(
  !process.env.COUNTER_TEST_DATABASE_URL,
  "Requer PostgreSQL local isolado",
);
const counter = (page: Page) =>
  page.getByRole("group", { name: "Contador de acessos" });
const formatted = (value: bigint) => value.toLocaleString("pt-BR");
async function counts(request: APIRequestContext, path: string) {
  const response = await request.get("/api/page-access", { params: { path } });
  expect(response.ok()).toBe(true);
  return (await response.json()) as AccessCounts;
}

test("conta visitas reais, navega, recarrega e exclui dados da URL e cookies", async ({
  page,
  context,
  request,
}, testInfo) => {
  const before = await counts(request, "/sobre");
  const events: { path: string; eventId: string }[] = [];
  const cookies: (string | undefined)[] = [];
  await context.addCookies([
    {
      name: "counter_test_cookie",
      value: "nao-enviar",
      url: testInfo.project.use.baseURL!,
    },
  ]);
  page.on("request", (req) => {
    if (req.url().includes("/api/page-access") && req.method() === "POST") {
      events.push(req.postDataJSON());
      cookies.push(req.headers().cookie);
    }
  });
  await page.goto("/sobre?email=nao-registrar#fragmento-privado");
  await expect(counter(page).locator('[data-counter="site"]')).toHaveText(
    formatted(BigInt(before.total) + 1n),
  );
  await expect(counter(page).locator('[data-counter="page"]')).toHaveText(
    formatted(BigInt(before.page) + 1n),
  );
  expect(events.length).toBeGreaterThan(0);
  expect(new Set(events.map((event) => event.eventId)).size).toBe(1);
  expect(events.every((event) => event.path === "/sobre")).toBe(true);
  expect(
    events.every(
      (event) => Object.keys(event).sort().join() === "eventId,path",
    ),
  ).toBe(true);
  expect(cookies.every((value) => !value)).toBe(true);

  const afterFirst = await counts(request, "/sobre");
  const eventCount = events.length;
  await page.evaluate(() =>
    history.pushState({}, "", "/sobre?outro=valor#nova-ancora"),
  );
  await expect(page).toHaveURL(/outro=valor/);
  expect(await counts(request, "/sobre")).toEqual(afterFirst);
  expect(events).toHaveLength(eventCount);
  await page.reload();
  await expect(counter(page).locator('[data-counter="page"]')).toHaveText(
    formatted(BigInt(before.page) + 2n),
  );
  expect(new Set(events.map((event) => event.eventId)).size).toBe(2);

  const privacyBefore = await counts(request, "/privacidade");
  await page
    .getByRole("contentinfo")
    .getByRole("link", { name: "Privacidade", exact: true })
    .click();
  await expect(counter(page).locator('[data-counter="page"]')).toHaveText(
    formatted(BigInt(privacyBefore.page) + 1n),
  );
  await expect(counter(page).locator('[data-counter="site"]')).toHaveText(
    formatted(BigInt(before.total) + 3n),
  );
  await counter(page).scrollIntoViewIfNeeded();
  expect(
    (await new AxeBuilder({ page }).include(".page-access-counter").analyze())
      .violations,
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("contador.png") });

  const recorded = events.length;
  const finalCount = await counts(request, "/sobre");
  await page.goto("/recuperar-senha?token=privado");
  await expect(
    page.getByRole("heading", { name: "Recuperar acesso", exact: true }),
  ).toBeVisible();
  await expect(counter(page)).toHaveCount(0);
  expect(events).toHaveLength(recorded);
  expect(await counts(request, "/sobre")).toEqual(finalCount);
});

test("nova tentativa após resposta perdida não duplica visita já salva", async ({
  page,
  request,
}) => {
  const before = await counts(request, "/termos");
  let failResponse = true;
  const ids: string[] = [];
  await page.route("**/api/page-access", async (route) => {
    const req = route.request();
    if (req.method() !== "POST") return route.continue();
    ids.push(req.postDataJSON().eventId);
    const response = await route.fetch();
    expect(response.ok()).toBe(true);
    await route.fulfill(
      failResponse
        ? {
            status: 503,
            contentType: "application/json",
            body: '{"error":"Resposta perdida"}',
          }
        : { response },
    );
  });
  await page.goto("/termos");
  await expect(counter(page)).toContainText(
    "Contador temporariamente indisponível.",
  );
  await expect(counter(page).locator("[data-counter]")).toHaveCount(0);
  expect(await counts(request, "/termos")).toEqual({
    total: String(BigInt(before.total) + 1n),
    page: String(BigInt(before.page) + 1n),
  });
  failResponse = false;
  await counter(page).getByRole("button", { name: "Tentar novamente" }).click();
  await expect(counter(page).locator('[data-counter="page"]')).toHaveText(
    formatted(BigInt(before.page) + 1n),
  );
  expect(ids.length).toBeGreaterThanOrEqual(2);
  expect(new Set(ids).size).toBe(1);
  expect(await counts(request, "/termos")).toEqual({
    total: String(BigInt(before.total) + 1n),
    page: String(BigInt(before.page) + 1n),
  });
});

test("API pública recusa origem externa e áreas privadas sem incrementar", async ({
  request,
}) => {
  const before = await counts(request, "/sobre");
  const external = await request.post("/api/page-access", {
    headers: { origin: "https://outro.example" },
    data: { path: "/sobre", eventId: crypto.randomUUID() },
  });
  expect(external.status()).toBe(403);
  const privatePage = await request.get("/api/page-access", {
    params: { path: "/aluno" },
  });
  expect(privatePage.status()).toBe(400);
  expect(await counts(request, "/sobre")).toEqual(before);
});
