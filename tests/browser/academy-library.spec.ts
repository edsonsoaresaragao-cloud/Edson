import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  libraryCourses,
  libraryLessonUrl,
} from "../../src/lib/academy/library/catalog";

test("biblioteca preserva as duas aulas e apresenta as oito novas preparações", async ({
  page,
}) => {
  await page.goto("/academy/aulas");
  await expect(page.getByRole("link", { name: /AULA 01/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /AULA 02/ })).toBeVisible();
  for (const course of libraryCourses) {
    await expect(
      page.locator(`a[href='${libraryLessonUrl(course.slug)}']`),
    ).toContainText(course.title);
  }
  for (const course of libraryCourses) {
    // A05 is synthetic and temporarily authorized only in the separate integration test.
    const response = await page.request.get(
      `/api/academy/library/${course.slug}`,
    );
    expect(response.status()).toBe(200);
    const value = await response.json();
    expect(value.course.expectedPages).toBe(course.expectedPages);
    expect(value.document).toBeNull();
    expect(value.canStudy).toBe(false);
    expect(value.preview).toBe(false);
    expect(value.questions).toEqual({});
    await page.goto(libraryLessonUrl(course.slug));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      course.title,
    );
    await expect(
      page.getByRole("region", { name: "Preparação da aula" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Iniciar aula", exact: true }),
    ).toHaveCount(0);
    await expect(page.locator(".academy-study img")).toHaveCount(0);
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

test("rascunhos, arquivos e progresso ficam protegidos sem conta editorial", async ({
  request,
}) => {
  for (const course of libraryCourses) {
    const root = `/api/academy/library/${course.slug}`;
    for (const filename of [
      "original.pdf",
      "pagina-001.jpg",
      "preview-001.webp",
    ]) {
      const result = await request.get(`${root}/material/${filename}`);
      expect(result.status()).toBe(403);
      expect(result.headers()["cache-control"]).toContain("no-store");
    }
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
