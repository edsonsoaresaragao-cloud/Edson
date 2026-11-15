import { test, expect } from "@playwright/test";
import { libraryCourses } from "../../src/lib/academy/library/catalog";
import { installSyntheticLibraryFixture } from "./support/library-fixture";
import {
  setupLibrarySpeech,
  verifyLibraryReader,
  verifyLibraryResumeNavigation,
} from "./support/library-reader-checks";

test.skip(
  process.env.ACADEMY_LIBRARY_INTEGRATION !== "1",
  "Requer PostgreSQL isolado academy_library e fixture sintética.",
);
test("contas reais, restrição editorial, 17 páginas, avaliação e tentativas PostgreSQL independentes", async ({
  page,
}, testInfo) => {
  test.setTimeout(180000);
  const database = new URL(process.env.DATABASE_URL!);
  expect(["127.0.0.1", "localhost"]).toContain(database.hostname);
  expect(database.pathname).toBe("/academy_library");
  const { db } = await import("../../src/lib/db");
  const fixture = await installSyntheticLibraryFixture();
  const course = libraryCourses.find((value) => value.number === 5)!;
  const endpoint = `/api/academy/library/${course.slug}`;
  const emails = [
    `library-${testInfo.project.name}-${Date.now()}-ana@example.invalid`,
    `library-${testInfo.project.name}-${Date.now()}-bia@example.invalid`,
  ];
  await setupLibrarySpeech(page);
  const baseline = await db.progress.count({
    where: { enrollment: { courseId: { not: course.id } } },
  });
  async function register(email: string, name: string) {
    await page.goto("/cadastro");
    await page.getByLabel("Nome completo").fill(name);
    await page.getByLabel("E-mail", { exact: true }).fill(email);
    await page
      .getByLabel("Senha (mínimo 12 caracteres)")
      .fill("Biblioteca-Teste-123456789");
    await page.getByRole("checkbox").check();
    await page
      .getByRole("button", { name: "Criar conta", exact: true })
      .click();
    await expect(page).toHaveURL("/aluno");
  }
  async function action(data: Record<string, unknown>, expected = 200) {
    const response = await page.request.post(`${endpoint}/progress`, {
      headers: { origin: testInfo.project.use.baseURL! },
      data,
    });
    expect(response.status(), await response.text()).toBe(expected);
    return response.json();
  }
  try {
    expect(
      (await page.request.get(`${endpoint}/material/original.pdf`)).status(),
    ).toBe(403);
    expect(
      (await (await page.request.get(endpoint)).json()).document,
    ).toBeNull();
    await register(emails[0], "Ana Biblioteca");
    const ana = await db.user.findUniqueOrThrow({
      where: { email: emails[0] },
    });
    expect(
      (await (await page.request.get(endpoint)).json()).document,
    ).toBeNull();
    await db.user.update({ where: { id: ana.id }, data: { role: "EDITOR" } });
    const preview = await (await page.request.get(endpoint)).json();
    expect(preview.preview).toBe(true);
    expect(preview.canStudy).toBe(false);
    expect(preview.document.pages).toHaveLength(17);
    expect(preview.document.questions).toBeUndefined();
    for (const questions of Object.values(preview.questions) as Record<
      string,
      unknown
    >[][])
      for (const question of questions)
        expect(question.correctIndex).toBeUndefined();
    await action({ action: "start" }, 409);
    await db.user.update({ where: { id: ana.id }, data: { role: "STUDENT" } });
    await fixture.authorize(true);
    expect(
      (await (await page.request.get(`${endpoint}/progress`)).json()).progress
        .started,
    ).toBe(false);
    expect(
      await db.enrollment.count({
        where: { userId: ana.id, courseId: course.id },
      }),
    ).toBe(0);
    await page.goto(`/academy/aulas/${course.slug}`);
    const start = page.waitForResponse(
      (response) =>
        response.url().endsWith(`${endpoint}/progress`) &&
        response.request().method() === "POST",
    );
    await page
      .getByRole("button", { name: "Iniciar aula", exact: true })
      .click();
    expect((await start).status()).toBe(200);
    await verifyLibraryResumeNavigation(page, course.slug);
    await verifyLibraryReader(page);
    await page
      .getByLabel("Estudei a página, suas tabelas, figuras e alertas.", {
        exact: true,
      })
      .check();
    await page
      .getByRole("button", { name: "Marcar estudado", exact: true })
      .click();
    await expect(
      page.getByRole("progressbar", { name: "Progresso da Aula 05" }),
    ).toHaveAttribute("value", "6");
    await action({
      action: "complete",
      step: "pagina-2",
      studied: true,
      answers: { "practice-1": 1, "practice-2": 1 },
    });
    for (let number = 2; number <= 17; number++)
      await action({
        action: "complete",
        step: `pagina-${number}`,
        studied: true,
        answers: number === 2 ? { "practice-1": 0, "practice-2": 0 } : {},
      });
    const final = (count: number) =>
      Object.fromEntries(
        Array.from({ length: 10 }, (_, index) => [
          `final-${index + 1}`,
          index < count ? 0 : 1,
        ]),
      );
    expect(
      (
        await action({
          action: "complete",
          step: "avaliacao",
          answers: final(6),
        })
      ).progress.eligible,
    ).toBe(false);
    const completed = await action({
      action: "complete",
      step: "avaliacao",
      answers: final(7),
    });
    expect(completed.progress.percent).toBe(100);
    await page.reload();
    await expect(
      page.getByRole("progressbar", { name: "Progresso da Aula 05" }),
    ).toHaveAttribute("value", "100");
    const enrollment = await db.enrollment.findUniqueOrThrow({
      where: { userId_courseId: { userId: ana.id, courseId: course.id } },
      include: { progress: true, academyAttempts: true },
    });
    expect(enrollment.progress).toHaveLength(18);
    expect(enrollment.academyAttempts).toHaveLength(20);
    expect(
      enrollment.progress.find((value) => value.lessonId.endsWith(":avaliacao"))
        ?.score,
    ).toBe(70);
    expect(
      enrollment.academyAttempts.some(
        (value) =>
          value.score === 0 &&
          JSON.stringify(value.answers).includes("practice-1"),
      ),
    ).toBe(true);
    expect(
      await db.progress.count({
        where: { enrollment: { courseId: { not: course.id } } },
      }),
    ).toBe(baseline);
    await action(
      { action: "complete", step: "avaliacao", userId: "outro", score: 100 },
      400,
    );
    const certificate = await page.request.post("/api/actions/certificate", {
      headers: { origin: testInfo.project.use.baseURL! },
      multipart: { id: course.id },
    });
    expect(certificate.status()).toBe(409);
    expect(
      (await db.course.findUniqueOrThrow({ where: { id: course.id } })).status,
    ).toBe("PUBLISHED");
    for (const [name, id] of [
      ["enroll", course.id],
      ["complete-lesson", `${course.id}:pagina-1`],
    ]) {
      const response = await page.request.post(`/api/actions/${name}`, {
        headers: { origin: testInfo.project.use.baseURL! },
        multipart: { id },
      });
      expect(response.status(), await response.text()).toBe(409);
    }
    const material = await page.request.get(
      `${endpoint}/material/original.pdf`,
    );
    expect(material.status()).toBe(200);
    expect(material.headers()["cache-control"]).toBe("private, no-store");
    await db.course.update({ where: { id: course.id }, data: { hours: 1 } });
    await page.reload();
    await expect(page.getByText("1 hora de estudo previstas")).toBeVisible();
    await expect(
      page.getByText(
        "A carga horária aguarda validação pelo responsável para emissão do certificado.",
      ),
    ).toHaveCount(0);
    await fixture.authorize(false);
    try {
      const revokedCertificate = await page.request.post(
        "/api/actions/certificate",
        {
          headers: { origin: testInfo.project.use.baseURL! },
          multipart: { id: course.id },
        },
      );
      expect(revokedCertificate.status(), await revokedCertificate.text()).toBe(
        409,
      );
      expect(
        await db.certificate.count({
          where: { userId: ana.id, courseId: course.id },
        }),
      ).toBe(0);
      expect((await page.request.get(`${endpoint}/progress`)).status()).toBe(
        409,
      );
      await action(
        { action: "complete", step: "pagina-1", studied: true },
        409,
      );
      expect(
        (await page.request.get(`${endpoint}/material/original.pdf`)).status(),
      ).toBe(403);
      expect(
        (await (await page.request.get(endpoint)).json()).document,
      ).toBeNull();
      expect(
        await db.academyAttempt.count({
          where: { enrollmentId: enrollment.id },
        }),
      ).toBe(20);
    } finally {
      await db.course.update({ where: { id: course.id }, data: { hours: 0 } });
      await fixture.authorize(true);
    }
    await page.goto("/aluno");
    await page.getByRole("link", { name: /AULA 05/ }).click();
    await expect(page).toHaveURL(new RegExp(`/academy/aulas/${course.slug}`));
    await expect(
      page.getByRole("progressbar", { name: "Progresso da Aula 05" }),
    ).toHaveAttribute("value", "100");
    await expect(
      page.getByText(
        "A carga horária aguarda validação pelo responsável para emissão do certificado.",
      ),
    ).toBeVisible();
    await page.goto("/aluno");
    await page.getByRole("button", { name: "Sair", exact: true }).click();
    await register(emails[1], "Bia Biblioteca");
    const second = await (
      await page.request.get(`${endpoint}/progress`)
    ).json();
    expect(second.progress.started).toBe(false);
    expect(second.progress.completed).toHaveLength(0);
    expect(
      (
        await (
          await page.request.get(
            `/api/academy/library/${libraryCourses.find((value) => value.number === 6)!.slug}/progress`,
          )
        ).json()
      ).progress,
    ).toBeUndefined();
  } finally {
    try {
      const users = await db.user.findMany({
        where: { email: { in: emails } },
        select: { id: true },
      });
      const ids = users.map((user) => user.id);
      await db.certificate.deleteMany({ where: { userId: { in: ids } } });
      await db.enrollment.deleteMany({ where: { userId: { in: ids } } });
      await db.user.deleteMany({ where: { id: { in: ids } } });
      await db.course.deleteMany({ where: { id: course.id } });
    } finally {
      await fixture.restore();
    }
  }
});
