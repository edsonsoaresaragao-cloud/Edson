import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  LESSON_URL,
  COURSE_ID,
  studySteps,
} from "../../src/lib/academy/content";
import {
  changeProgress,
  summarizeProgress,
  type StudentProgress,
  type ProgressRepository,
} from "../../src/lib/academy/progress";
import { questionsFor } from "../../src/lib/academy/questions";

test("biblioteca, 11 páginas, zoom, anonimato e fundamentos no computador/celular", async ({
  page,
  request,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/academy/aulas");
  await page.getByRole("link", { name: /AULA 01 · GRATUITA/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "AULA 01 — MOTORES QUE BATEM VÁLVULA",
  );
  await expect(
    page.getByRole("link", { name: "Entrar para iniciar aula" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Marcar como concluído", exact: true }),
  ).toBeDisabled();
  await expect(page.getByRole("progressbar")).toHaveAttribute("value", "0");
  const viewer = page.getByRole("region", {
    name: "Visualizador do material técnico",
  });
  for (let i = 1; i <= 11; i++) {
    await viewer
      .getByLabel("Página do material", { exact: true })
      .selectOption(String(i));
    await expect(
      viewer.locator(".academy-document-scroll img").first(),
    ).toHaveJSProperty("naturalWidth", 1024);
    await expect(
      viewer.locator(".academy-document-scroll img").first(),
    ).toHaveAttribute(
      "src",
      new RegExp(`page-${String(i).padStart(2, "0")}.png$`),
    );
  }
  await viewer.getByLabel("Zoom da página").selectOption("200");
  expect(
    await viewer
      .locator(".academy-document-scroll")
      .first()
      .evaluate((e) => e.scrollWidth > e.clientWidth),
  ).toBe(true);
  await viewer
    .getByRole("button", { name: "Ampliar página", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Página técnica ampliada" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    viewer.getByRole("link", { name: /Baixar material adaptado/ }).click(),
  ]);
  expect(download.suggestedFilename()).toBe("aula-01.pdf");
  expect(
    (await request.get("/api/academy/aula-01/material/original.pdf")).status(),
  ).toBe(403);
  expect((await request.get("/api/academy/aula-01/progress")).status()).toBe(
    401,
  );
  expect(
    (
      await request.post("/api/academy/aula-01/progress", {
        data: { action: "complete", step: "introducao" },
      })
    ).status(),
  ).toBe(401);
  await page
    .getByRole("navigation", { name: "Etapas da Aula 01" })
    .getByRole("button", { name: /Fundamentos/ })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Fundamentos do sincronismo",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Animar ciclo" }).click();
  await expect
    .poll(
      async () => await page.getByLabel("Ângulo do virabrequim").inputValue(),
    )
    .not.toBe("0");
  await page.getByRole("button", { name: "Pausar movimento" }).click();
  await page.getByLabel("Projeto conceitual").selectOption("sem-fonte");
  await expect(page.getByRole("status")).toContainText(
    "Sem confirmação técnica",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  expect(
    (await new AxeBuilder({ page }).include(".academy-study").analyze())
      .violations,
  ).toEqual([]);
  await page.screenshot({
    path: `test-results/academy-fundamentos-${info.project.name}.png`,
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("iniciar, corrigir, reprovar, retomar, concluir e solicitar certificado", async ({
  page,
}, info) => {
  let saved: StudentProgress = summarizeProgress([], "introducao", false),
    certificateCalls = 0;
  const repo: ProgressRepository = {
    async load() {
      return structuredClone(saved);
    },
    async start() {
      if (!saved.started) saved = summarizeProgress([]);
    },
    async visit(_, step) {
      saved.lastStep = step;
    },
    async complete(_, step, score) {
      saved = summarizeProgress(
        [
          ...saved.completed.filter((p) => p.step !== step),
          { step, score, completedAt: new Date().toISOString() },
        ],
        step,
      );
    },
  };
  await page.route("**/api/academy/aula-01/progress", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({ json: { progress: saved } });
    try {
      await route.fulfill({
        json: await changeProgress(
          repo,
          "aluno-fixture",
          route.request().postDataJSON(),
        ),
      });
    } catch (e) {
      await route.fulfill({
        status: 400,
        json: { error: (e as Error).message },
      });
    }
  });
  await page.route("**/api/actions/certificate", async (route) => {
    expect(route.request().postData()).toContain(COURSE_ID);
    certificateCalls++;
    await route.fulfill({
      status: 503,
      json: { error: "Emissão de certificado testada sem conexão ao banco." },
    });
  });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(LESSON_URL);
  await page.getByRole("button", { name: "Iniciar aula", exact: true }).click();
  await expect(
    page.getByText("Progresso salvo na sua conta.", { exact: false }),
  ).toBeVisible();
  expect(saved.completed).toHaveLength(0);
  await page
    .getByRole("navigation", { name: "Etapas da Aula 01" })
    .getByRole("button", { name: /Ford/ })
    .click();
  await expect.poll(() => saved.lastStep).toBe("ford");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Ford", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("progressbar")).toHaveAttribute("value", "0");
  const nav = page.getByRole("navigation", { name: "Etapas da Aula 01" });
  for (const s of studySteps) {
    await nav
      .getByRole("button", {
        name: new RegExp(s.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      })
      .click();
    await expect(
      page.getByRole("heading", { name: s.title, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name:
          s.kind === "manufacturer" || s.kind === "exam"
            ? "Corrigir respostas e concluir etapa"
            : "Marcar como concluído",
        exact: true,
      }),
    ).toBeEnabled();
    const qs = questionsFor(s.id);
    if (s.kind === "exam") {
      for (const q of qs)
        await page
          .getByRole("radio", {
            name: q.options[(q.correctIndex + 1) % q.options.length],
            exact: true,
          })
          .check();
      await page
        .getByRole("button", {
          name: "Corrigir respostas e concluir etapa",
          exact: true,
        })
        .click();
      await expect(
        page.getByRole("status", { name: "Resultado da atividade" }),
      ).toContainText("Você alcançou 0%");
      expect(saved.eligible).toBe(false);
      expect(saved.completed).toHaveLength(13);
    }
    for (const q of qs)
      await page
        .getByRole("radio", { name: q.options[q.correctIndex], exact: true })
        .check();
    await page
      .getByRole("button", {
        name: qs.length
          ? "Corrigir respostas e concluir etapa"
          : "Marcar como concluído",
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("status", { name: "Resultado da atividade" }),
    ).toContainText("Etapa concluída");
    expect(saved.completed.some((p) => p.step === s.id)).toBe(true);
  }
  await expect(page.getByRole("progressbar")).toHaveAttribute("value", "100");
  await page.getByRole("button", { name: "Emitir meu certificado" }).click();
  await expect(
    page.getByRole("alert", { name: "Erro na atividade" }),
  ).toContainText("sem conexão ao banco");
  expect(certificateCalls).toBe(1);
  await page.reload();
  await expect(page.getByRole("progressbar")).toHaveAttribute("value", "100");
  expect(errors).toEqual([]);
  await page.screenshot({
    path: `test-results/academy-concluida-${info.project.name}.png`,
    fullPage: true,
  });
});
