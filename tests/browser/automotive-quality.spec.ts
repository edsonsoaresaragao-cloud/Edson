import { test, expect } from "@playwright/test";
import { narrationSystems, narrationPath } from "./support/narration-systems";
import { installSpeech } from "./support/part-narration";
test.setTimeout(120000);
for (const system of narrationSystems) {
  test(`${system.id}: qualidade 3D, zoom, seleção, voz e vistas preservadas`, async ({
    page,
  }, info) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await installSpeech(page, true);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error" && /THREE|shader|WebGL|context/i.test(m.text()))
        errors.push(m.text());
    });
    await page.goto(narrationPath(system));
    const root = page.locator(system.selector);
    await expect(root).toHaveAttribute("data-renderer", "ready", {
      timeout: 60000,
    });
    const canvas = root.locator("canvas");
    const size = await canvas.evaluate((element) => {
      const c = element as HTMLCanvasElement;
      return {
        pixels: c.width * c.height,
        width: c.width,
        cssWidth: c.clientWidth,
        ratio: c.width / c.clientWidth,
      };
    });
    expect(size.width).toBeGreaterThanOrEqual(size.cssWidth);
    expect(size.pixels).toBeLessThanOrEqual(2_000_000);
    expect(size.ratio).toBeLessThanOrEqual(
      info.project.name === "mobile" ? 1.5 : 2,
    );
    const points = () =>
      root.locator(".suspension-annotations line").evaluateAll((lines) =>
        lines
          .map((l) => [l.getAttribute("x2"), l.getAttribute("y2")])
          .flat()
          .join(","),
      );
    const initial = await points();
    await root
      .getByRole("button", { name: "Aproximar modelo 3D", exact: true })
      .click();
    await expect.poll(points).not.toBe(initial);
    await root
      .getByRole("button", { name: "Afastar modelo 3D", exact: true })
      .click();
    await root
      .getByRole("button", { name: "Restaurar câmera", exact: true })
      .click();
    await root.locator(".suspension-annotations button").nth(1).click();
    expect(
      await page.evaluate(() => window.__speechRecorder.calls.at(-1)?.text),
    ).toBe(`${system.parts[1].name}. Função: ${system.parts[1].description}`);
    await root.locator(".suspension-parts > ol > li > button").last().click();
    expect(
      await page.evaluate(() => window.__speechRecorder.calls.at(-1)?.text),
    ).toBe(
      `${system.parts.at(-1)!.name}. Função: ${system.parts.at(-1)!.description}`,
    );
    await root.getByRole("button", { name: "Montado", exact: true }).click();
    await root
      .getByRole("button", { name: "Vista explodida", exact: true })
      .click();
    await expect(root).toHaveAttribute("data-renderer", "ready");
    await expect(canvas).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await root.locator(".suspension-stage").screenshot({
      path: `test-results/quality-${system.id}-${info.project.name}.png`,
    });
    expect(errors).toEqual([]);
    // Context loss must still release resources and present the existing accessible fallback.
    if (system.id === "alternator") {
      await canvas.evaluate((c) =>
        c.dispatchEvent(new Event("webglcontextlost", { cancelable: true })),
      );
      await expect(root).toHaveAttribute("data-renderer", "fallback");
      await root
        .locator(".suspension-parts > ol > li > button")
        .first()
        .click();
      expect(
        await page.evaluate(() => window.__speechRecorder.calls.at(-1)?.text),
      ).toBe(`${system.parts[0].name}. Função: ${system.parts[0].description}`);
    }
  });
}
test("motor da página inicial recebe acabamento, zoom e renderização responsiva", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(
    process.env.ALL_VOICE_PREVIEW_PREFIX
      ? `${process.env.ALL_VOICE_PREVIEW_PREFIX}/engine`
      : "/",
  );
  const host = page.locator(".engine-webgl-host[aria-hidden=false]");
  await expect(host).toBeVisible({ timeout: 60000 });
  await page.getByRole("button", { name: "Aproximar modelo 3D" }).click();
  await page.getByRole("button", { name: "Afastar modelo 3D" }).click();
  expect(
    await host.locator("canvas").evaluate((element) => {
      const c = element as HTMLCanvasElement;
      return c.width * c.height;
    }),
  ).toBeLessThanOrEqual(2_000_000);
  await page.locator(".engine-realistic-view").screenshot({
    path: `test-results/quality-engine-${info.project.name}.png`,
  });
  expect(errors).toEqual([]);
});
