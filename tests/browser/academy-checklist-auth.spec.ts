import { test, expect } from "@playwright/test";
import {
  LESSON_URL,
  COURSE_ID,
  COURSE_HOURS,
  steps,
} from "../../src/lib/academy/checklist/content";
import {
  questionsFor,
  finalQuestions,
} from "../../src/lib/academy/checklist/questions";
test.skip(
  process.env.ACADEMY_CHECKLIST_INTEGRATION !== "1",
  "Requer servidor e PostgreSQL isolados da Academy",
);
test("conta real, cinco etapas, correção, retomada PostgreSQL e isolamento entre alunos", async ({
  page,
}, testInfo) => {
  test.setTimeout(120000);
  const database = new URL(process.env.DATABASE_URL!);
  expect(["localhost", "127.0.0.1"]).toContain(database.hostname);
  expect(database.pathname).toBe("/academy_checklist");
  const { db } = await import("../../src/lib/db");
  const emails = [
    `aula02-${testInfo.project.name}-${Date.now()}-ana@example.invalid`,
    `aula02-${testInfo.project.name}-${Date.now()}-bia@example.invalid`,
  ];
  const password = "Checklist-Teste-123456789";
  async function register(email: string, name: string) {
    await page.goto("/cadastro");
    await page.getByLabel("Nome completo").fill(name);
    await page.getByLabel("E-mail", { exact: true }).fill(email);
    await page.getByLabel("Senha (mínimo 12 caracteres)").fill(password);
    await page.getByRole("checkbox").check();
    await page
      .getByRole("button", { name: "Criar conta", exact: true })
      .click();
    await expect(page).toHaveURL("/aluno");
  }
  async function fill(step: string, correct?: number) {
    const form = page.locator("form.academy-quiz");
    for (const [qIndex, q] of questionsFor(step).entries()) {
      const value =
        correct === undefined || qIndex < correct
          ? q.correctIndex
          : (q.correctIndex + 1) % q.options.length;
      await form
        .locator("fieldset")
        .nth(qIndex)
        .getByRole("radio")
        .nth(value)
        .check();
    }
  }
  async function chooseStep(step: string) {
    await page
      .getByRole("navigation", { name: "Etapas da Aula 02" })
      .getByRole("button", {
        name: new RegExp(steps.find((s) => s.id === step)!.title),
      })
      .click();
  }
  async function studyPoints() {
    for (const box of await page
      .getByRole("region", { name: "Checklist digital de estudo" })
      .getByRole("checkbox")
      .all())
      await box.check();
  }
  const percent = (value: number) =>
    expect(
      page.getByRole("progressbar", { name: "Progresso da Aula 02" }),
    ).toHaveAttribute("value", String(value));
  try {
    await register(emails[0], "Ana Checklist");
    await page.goto(LESSON_URL);
    await expect(
      page.getByRole("button", { name: "Iniciar aula", exact: true }),
    ).toBeEnabled();
    const initial = await page.request.get("/api/academy/aula-02/progress");
    expect((await initial.json()).progress.started).toBe(false);
    const ana = await db.user.findUniqueOrThrow({
      where: { email: emails[0] },
    });
    expect(
      await db.enrollment.count({
        where: { userId: ana.id, courseId: COURSE_ID },
      }),
    ).toBe(0);
    await page
      .getByRole("button", { name: "Iniciar aula", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Marcar estudado", exact: true }),
    ).toBeEnabled();
    await page
      .getByRole("button", { name: "Marcar estudado", exact: true })
      .click();
    await percent(20);
    await chooseStep("correia-seca");
    await studyPoints();
    await fill("correia-seca", 0);
    await page
      .getByRole("button", { name: "Corrigir respostas e marcar estudado" })
      .click();
    await expect(
      page.getByRole("status", { name: "Resultado da atividade" }),
    ).toContainText("Você alcançou 0%");
    await percent(20);
    await fill("correia-seca");
    await page
      .getByRole("button", { name: "Corrigir respostas e marcar estudado" })
      .click();
    await percent(40);
    await page.goto("/academy/aulas");
    await page.getByRole("link", { name: /AULA 02/ }).click();
    await expect(
      page.getByRole("heading", {
        name: "Correia seca · Concluída",
        exact: true,
      }),
    ).toBeVisible();
    await percent(40);
    for (const [step, value] of [
      ["correia-em-oleo", 60],
      ["corrente", 80],
    ] as const) {
      await chooseStep(step);
      await studyPoints();
      await fill(step);
      await page
        .getByRole("button", { name: "Corrigir respostas e marcar estudado" })
        .click();
      await percent(value);
    }
    await chooseStep("avaliacao");
    expect(finalQuestions).toHaveLength(10);
    await fill("avaliacao", 6);
    await page
      .getByRole("button", { name: "Corrigir respostas e marcar estudado" })
      .click();
    await percent(80);
    await expect(
      page.getByRole("status", { name: "Resultado da atividade" }),
    ).toContainText("60%");
    await fill("avaliacao", 7);
    await page
      .getByRole("button", { name: "Corrigir respostas e marcar estudado" })
      .click();
    await percent(100);
    await expect(
      page.getByRole("heading", { name: "Aula 02 concluída", exact: true }),
    ).toBeVisible();
    await page.reload();
    await percent(100);
    const enrollment = await db.enrollment.findUniqueOrThrow({
      where: { userId_courseId: { userId: ana.id, courseId: COURSE_ID } },
      include: { progress: true },
    });
    expect(enrollment.progress).toHaveLength(5);
    expect(
      enrollment.progress.find((p) => p.lessonId.endsWith(":avaliacao"))?.score,
    ).toBe(70);
    expect(await db.course.count({ where: { id: COURSE_ID } })).toBe(1);
    const forged = await page.request.post("/api/academy/aula-02/progress", {
      headers: { origin: testInfo.project.use.baseURL! },
      data: {
        action: "complete",
        step: "avaliacao",
        score: 100,
        userId: "outro-aluno",
      },
    });
    expect(forged.status()).toBe(400);
    if (COURSE_HOURS === null) {
      const certificate = await page.request.post("/api/actions/certificate", {
        headers: { origin: testInfo.project.use.baseURL! },
        multipart: { id: COURSE_ID },
      });
      expect(certificate.status()).toBe(409);
      expect((await certificate.json()).error).toContain("carga horária");
    }
    await page.goto("/aluno");
    await page.getByRole("link", { name: /AULA 02/ }).click();
    await expect(page).toHaveURL(new RegExp(LESSON_URL));
    await percent(100);
    await page.goto("/aluno");
    await page.getByRole("button", { name: "Sair", exact: true }).click();
    await expect(page).toHaveURL("/");
    await register(emails[1], "Bia Checklist");
    await page.goto(LESSON_URL);
    await expect(
      page.getByRole("button", { name: "Iniciar aula", exact: true }),
    ).toBeEnabled();
    await percent(0);
    expect(
      (await (await page.request.get("/api/academy/aula-02/progress")).json())
        .progress.started,
    ).toBe(false);
    expect(
      (
        await db.enrollment.findUniqueOrThrow({
          where: { userId_courseId: { userId: ana.id, courseId: COURSE_ID } },
          include: { progress: true },
        })
      ).progress,
    ).toHaveLength(5);
  } finally {
    const users = await db.user.findMany({
      where: { email: { in: emails } },
      select: { id: true },
    });
    const ids = users.map((u) => u.id);
    await db.certificate.deleteMany({ where: { userId: { in: ids } } });
    await db.enrollment.deleteMany({ where: { userId: { in: ids } } });
    await db.user.deleteMany({ where: { id: { in: ids } } });
  }
});
