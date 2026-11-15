import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createHash } from "node:crypto";
import { PDFDocument } from "pdf-lib";
import {
  libraryCourses,
  libraryLessonUrl,
} from "../../src/lib/academy/library/catalog";
import { installChecklistSpeech } from "./support/checklist-speech";
import { narrationChunks } from "../../src/lib/academy/narration";

test("as sete aulas autorizadas mostram páginas reais e a Aula 03 oferece acesso às disponíveis", async ({
  page,
}) => {
  test.setTimeout(120000);
  await installChecklistSpeech(page);
  await page.goto("/academy/aulas");
  await expect(page.getByRole("link", { name: /AULA 01/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /AULA 02/ })).toBeVisible();
  for (const course of libraryCourses) {
    const response = await page.request.get(
      `/api/academy/library/${course.slug}`,
    );
    expect(response.status()).toBe(200);
    const value = await response.json();
    expect(value.canStudy).toBe(false);
    expect(value.questions).toEqual({});
    await page.goto(libraryLessonUrl(course.slug));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      course.title,
    );
    if (course.number === 3) {
      expect(value.canView).toBe(false);
      expect(value.document).toBeNull();
      expect(value.availableLessons).toHaveLength(7);
      const alternatives = page.getByRole("region", {
        name: "Aulas que você já pode visualizar",
      });
      await expect(alternatives.getByRole("link")).toHaveCount(7);
      await expect(page.locator(".academy-study img")).toHaveCount(0);
    } else {
      expect(value.canView).toBe(true);
      expect(value.preview).toBe(true);
      expect(value.document.pages).toHaveLength(course.expectedPages);
      await expect(
        page.getByRole("heading", {
          name: "Material disponível para consulta",
          exact: true,
        }),
      ).toBeVisible();
      const navigation = page.getByRole("navigation", {
        name: `Páginas da Aula ${String(course.number).padStart(2, "0")}`,
      });
      await expect(navigation.getByRole("button")).toHaveCount(
        course.expectedPages,
      );
      const preview = page.locator(".academy-document-scroll img").first();
      await preview.scrollIntoViewIfNeeded();
      await expect(preview).toHaveJSProperty("naturalWidth", 640);
      for (const number of [1, course.expectedPages]) {
        const image = await page.request.get(
          `/api/academy/library/${course.slug}/material/pagina-${String(number).padStart(3, "0")}.jpg`,
        );
        expect(image.status()).toBe(200);
        expect(image.headers()["content-type"]).toBe("image/jpeg");
        expect(
          createHash("sha256")
            .update(await image.body())
            .digest("hex"),
        ).toBe(value.document.pages[number - 1].sourceSha256);
      }
      await expect(
        page.getByRole("button", {
          name: /Ouvir (esta|rascunho desta) página/,
          exact: false,
        }),
      ).toBeVisible();
    }
    await expect(
      page.getByRole("button", { name: "Iniciar aula", exact: true }),
    ).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      ),
    ).toBe(false);
  }
  expect(
    (await new AxeBuilder({ page }).include(".academy-study").analyze())
      .violations,
  ).toEqual([]);
});

test("consulta permite ampliar, ouvir e navegar sem registrar conclusão nem expor avaliação", async ({
  page,
}, testInfo) => {
  await installChecklistSpeech(page);
  const course = libraryCourses.find((c) => c.number === 5)!;
  const endpoint = `/api/academy/library/${course.slug}`;
  const value = await (await page.request.get(endpoint)).json();
  const paragraphs = value.document.pages[0].transcript as string[];
  await page.goto(libraryLessonUrl(course.slug));
  const reader = page.getByRole("region", {
    name: "Leitura em voz alta da página 1",
    exact: true,
  });
  expect(await page.evaluate(() => window.__checklistSpeech.calls.length)).toBe(
    0,
  );
  await page.evaluate(() => {
    window.__checklistSpeech.auto = true;
  });
  await reader
    .getByRole("button", { name: "Ouvir esta página", exact: true })
    .click();
  await expect(reader.getByRole("status")).toHaveText(
    "Leitura da página 1 concluída.",
  );
  expect(
    await page.evaluate(() =>
      window.__checklistSpeech.calls.map((c) => c.text),
    ),
  ).toEqual(narrationChunks(paragraphs, 180));
  await page.getByLabel("Zoom da página", { exact: true }).selectOption("150");
  const full = page.locator(".academy-document-scroll img").first();
  await full.scrollIntoViewIfNeeded();
  await expect(full).toHaveJSProperty("naturalWidth", 1024);
  await page
    .getByRole("button", { name: "Ampliar página", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByLabel("Ir à página", { exact: true }).fill("17");
  await page.getByRole("button", { name: "Abrir página", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: /^Página 17 —/ }),
  ).toBeVisible();
  await expect(page).toHaveURL(/#pagina-17$/);
  await page.getByLabel("Pesquisar nesta aula").fill("sem-resultado-xyz");
  await expect(
    page.getByText("0 página(s) encontrada(s) nesta aula."),
  ).toBeVisible();
  await page.getByLabel("Pesquisar nesta aula").clear();
  await page
    .getByRole("navigation", { name: "Páginas da Aula 05" })
    .getByRole("button")
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: /^Página 1 —/ }),
  ).toBeVisible();
  await expect(page.locator("form.academy-quiz")).toHaveCount(0);
  await expect(
    page.getByRole("progressbar", { name: "Progresso da Aula 05" }),
  ).toHaveCount(0);
  expect(
    (await new AxeBuilder({ page }).include(".academy-study").analyze())
      .violations,
  ).toEqual([]);
  await page.screenshot({
    path: `work/library-consulta-${testInfo.project.name}.png`,
    fullPage: true,
  });
});

test("PDFs autorizados podem ser consultados e conta/progresso continuam protegidos", async ({
  request,
}) => {
  const course = libraryCourses.find((c) => c.number === 9)!;
  const response = await request.get(
    `/api/academy/library/${course.slug}/material/original.pdf`,
  );
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect((await PDFDocument.load(await response.body())).getPageCount()).toBe(
    8,
  );
  for (const course of libraryCourses) {
    const root = `/api/academy/library/${course.slug}`;
    expect(
      (await request.get(`${root}/material/authorization.json`)).status(),
    ).toBe(404);
    expect((await request.get(`${root}/progress`)).status()).toBe(401);
    expect(
      (
        await request.post(`${root}/progress`, { data: { action: "start" } })
      ).status(),
    ).toBe(401);
  }
  expect((await request.get("/api/academy/library/inexistente")).status()).toBe(
    404,
  );
});
