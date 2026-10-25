import "dotenv/config";
import { db } from "../../src/lib/db";
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
test("página inicial acessível, responsiva e com navegação funcional", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Conhecimento que/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Conversar com Edson pelo WhatsApp" }),
  ).toHaveAttribute("href", /5585981408606/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    accessibility.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
  await page.screenshot({
    path: `test-results/home-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Alternar tema claro e escuro" })
    .click();
  expect(await page.locator("html").getAttribute("data-theme")).toBe("dark");
  const darkAccessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    darkAccessibility.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
  await page
    .getByRole("button", { name: "Alternar tema claro e escuro" })
    .click();
  await page.getByRole("link", { name: "Explorar diagnóstico" }).click();
  await expect(
    page.getByRole("heading", { name: "Diagnóstico automotivo", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: /Motor não liga/ })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Motor não liga", exact: true }),
  ).toBeVisible();
  await page.goto("/busca?q=bateria");
  await expect(
    page.getByRole("heading", { name: "Bateria automotiva" }),
  ).toBeVisible();
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login/);
  expect(errors).toEqual([]);
});
test("cadastro e sessão pelo navegador", async ({ page }) => {
  const email = `browser-${Date.now()}-${Math.random().toString(16).slice(2)}@example.invalid`;
  try {
    await page.goto("/cadastro");
    await page.getByLabel("Nome completo").fill("Aluno Navegador");
    await page.getByLabel("E-mail", { exact: true }).fill(email);
    await page
      .getByLabel("Senha (mínimo 12 caracteres)")
      .fill("Senha-Temporaria-123456");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Criar conta" }).click();
    await expect(page).toHaveURL("/aluno");
    await expect(
      page.getByRole("heading", { name: "Olá, Aluno." }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Sair", exact: true }).click();
    await expect(page).toHaveURL("/");
  } finally {
    await db.user.deleteMany({ where: { email } });
  }
});

test("administrador cria conteúdo e curso pelo navegador", async ({
  page,
}, testInfo) => {
  const suffix = randomBytes(6).toString("hex"),
    email = `admin-browser-${suffix}@example.invalid`,
    password = randomBytes(20).toString("hex");
  const user = await db.user.create({
    data: {
      name: "Administrador navegador",
      email,
      role: "ADMIN",
      passwordHash: await bcrypt.hash(password, 12),
    },
  });
  let contentId = "",
    courseId = "";
  try {
    await page.goto("/login");
    await page.getByLabel("E-mail", { exact: true }).fill(email);
    await page.getByLabel("Senha", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page).toHaveURL("/admin");
    await page.goto("/admin/conteudos?kind=ARTICLE");
    const form = page.locator("form").filter({
      has: page.getByRole("heading", { name: "Novo conteúdo", exact: true }),
    });
    await form
      .getByLabel("Título", { exact: true })
      .fill(`Artigo navegador ${suffix}`);
    await form
      .getByLabel("Resumo", { exact: true })
      .fill("Texto original temporário para validação pelo navegador.");
    await form
      .getByLabel(
        "Conteúdo técnico, função, sintomas, manutenção ou referências",
        { exact: true },
      )
      .fill("Texto de teste do editor de conteúdos.");
    await form
      .getByRole("combobox", { name: "Status", exact: true })
      .selectOption("PUBLISHED");
    await form
      .getByRole("button", { name: "Salvar conteúdo", exact: true })
      .click();
    await expect(page).toHaveURL(/edit=/);
    contentId = new URL(page.url()).searchParams.get("edit")!;
    const content = await db.content.findUniqueOrThrow({
      where: { id: contentId },
    });
    await page.goto("/artigos/" + content.slug);
    await expect(
      page.getByRole("heading", { name: content.title, exact: true }),
    ).toBeVisible();
    await page.goto("/admin/cursos");
    const courseForm = page.locator("form").filter({
      has: page.getByRole("heading", {
        name: "Criar treinamento gratuito",
        exact: true,
      }),
    });
    await courseForm
      .getByLabel("Nome do curso", { exact: true })
      .fill(`Curso navegador ${suffix}`);
    await courseForm
      .getByLabel("Instrutor", { exact: true })
      .fill("Instrutor teste");
    await courseForm
      .getByLabel("Descrição", { exact: true })
      .fill("Treinamento temporário para validar o editor visual de aulas.");
    await courseForm
      .getByRole("combobox", { name: "Status", exact: true })
      .selectOption("PUBLISHED");
    await courseForm
      .getByLabel("Nome do módulo", { exact: true })
      .fill("Módulo do navegador");
    await courseForm
      .getByLabel("Título", { exact: true })
      .fill("Primeira aula");
    await courseForm
      .getByLabel("Conteúdo educativo", { exact: true })
      .fill("Conteúdo educativo original de teste do editor de aulas.");
    await courseForm
      .getByRole("button", { name: "Adicionar pergunta", exact: true })
      .click();
    await courseForm
      .getByLabel("Enunciado", { exact: true })
      .fill("Qual é a referência de manutenção?");
    await courseForm
      .getByLabel("Alternativa 1", { exact: true })
      .fill("Manual do fabricante");
    await courseForm
      .getByLabel("Alternativa 2", { exact: true })
      .fill("Qualquer intervalo genérico");
    await courseForm
      .getByRole("button", { name: "Salvar curso e aulas", exact: true })
      .click();
    await expect(page).toHaveURL(/edit=/);
    courseId = new URL(page.url()).searchParams.get("edit")!;
    const course = await db.course.findUniqueOrThrow({
      where: { id: courseId },
    });
    await page.goto("/cursos/" + course.slug);
    await expect(
      page.getByRole("heading", { name: course.title, exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: `test-results/course-${testInfo.project.name}.png`,
      fullPage: true,
    });
  } finally {
    if (courseId) await db.course.deleteMany({ where: { id: courseId } });
    if (contentId) await db.content.deleteMany({ where: { id: contentId } });
    await db.audit.deleteMany({ where: { actorId: user.id } });
    await db.user.deleteMany({ where: { id: user.id } });
  }
});
