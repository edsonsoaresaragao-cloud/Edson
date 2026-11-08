import { test, expect } from "@playwright/test";
import { installSpeech } from "./support/part-narration";
import { narrationPath, narrationSystems } from "./support/narration-systems";

test.setTimeout(120000);
for (const system of narrationSystems) {
  test(`${system.id}: todas as peças e atalhos falam; silenciar preserva a seleção`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await installSpeech(page);
    await page.goto(narrationPath(system));
    const root = page.locator(system.selector);
    await expect(root).toHaveAttribute("data-renderer", "fallback");
    const buttons = root.locator(".suspension-parts > ol > li > button");
    const detail = root.locator(
      system.id === "starter"
        ? ".starter-selected-detail"
        : ".suspension-detail",
    );
    const controls = root.getByRole("group", { name: "Narração das peças" });
    expect(await page.evaluate(() => window.__speechRecorder.calls)).toEqual(
      [],
    );
    await expect(buttons).toHaveCount(system.parts.length);
    for (const part of system.parts) {
      await buttons.nth(part.id - 1).click();
      await expect(detail.locator("h3")).toHaveText(part.name);
      expect(
        await page.evaluate(() => window.__speechRecorder.calls.at(-1)),
      ).toMatchObject({
        text: `${part.name}. Função: ${part.description}`,
        lang: "pt-BR",
        voice: "Brasil local",
      });
    }
    // Every secondary selection path must use the same narration handler.
    const shortcuts = root.locator(
      ".suspension-subsystems button, .hvac-cycle button, .starter-steps button",
    );
    for (let i = 0; i < (await shortcuts.count()); i++) {
      const before = await page.evaluate(
        () => window.__speechRecorder.calls.length,
      );
      await shortcuts.nth(i).click();
      expect(
        await page.evaluate(() => window.__speechRecorder.calls.length),
      ).toBe(before + 1);
      const name = await detail.locator("h3").innerText();
      const part = system.parts.find((part) => part.name === name)!;
      expect(
        await page.evaluate(() => window.__speechRecorder.calls.at(-1)!.text),
      ).toBe(`${part.name}. Função: ${part.description}`);
    }
    await controls.getByRole("button", { name: "Falar ao selecionar" }).click();
    const count = await page.evaluate(
      () => window.__speechRecorder.calls.length,
    );
    await buttons.first().click();
    await expect(detail.locator("h3")).toHaveText(system.parts[0].name);
    expect(
      await page.evaluate(() => window.__speechRecorder.calls.length),
    ).toBe(count);
    await controls.getByRole("button", { name: "Falar ao selecionar" }).click();
    expect(
      await page.evaluate(() => window.__speechRecorder.calls.length),
    ).toBe(count);
    await controls
      .getByRole("button", { name: "Ouvir peça novamente" })
      .click();
    expect(
      await page.evaluate(() => window.__speechRecorder.calls.at(-1)!.text),
    ).toBe(`${system.parts[0].name}. Função: ${system.parts[0].description}`);
    await controls.getByRole("button", { name: "Interromper fala" }).click();
    await expect(
      controls.getByRole("button", { name: "Interromper fala" }),
    ).toBeDisabled();
    expect(errors).toEqual([]);
  });

  test(`${system.id}: etiqueta e clique na malha 3D acionam a narração`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await installSpeech(page, true);
    await page.goto(narrationPath(system));
    const root = page.locator(system.selector);
    await expect(root).toHaveAttribute("data-renderer", "ready", {
      timeout: 45000,
    });
    expect(await page.evaluate(() => window.__speechRecorder.calls)).toEqual(
      [],
    );
    const label = root.locator(".suspension-annotations button").nth(1);
    await label.click();
    const before = await page.evaluate(
      () => window.__speechRecorder.calls.length,
    );
    await label.click();
    expect(
      await page.evaluate(() => window.__speechRecorder.calls.length),
    ).toBe(before + 1);
    expect(
      await page.evaluate(() => window.__speechRecorder.calls.at(-1)!.text),
    ).toBe(`${system.parts[1].name}. Função: ${system.parts[1].description}`);
    await root.locator(".suspension-stage").scrollIntoViewIfNeeded();
    const points = await root.locator(".suspension-canvas").evaluate((host) => {
      const box = host.getBoundingClientRect(),
        canvas = host.querySelector("canvas")!;
      canvas.addEventListener(
        "pointerup",
        () => window.__speechRecorder.pointerUps++,
      );
      return Array.from(host.querySelectorAll(".suspension-annotations line"))
        .flatMap((line) => {
          const x = box.left + Number(line.getAttribute("x2")),
            y = box.top + Number(line.getAttribute("y2"));
          return [
            [0, 0],
            [-10, 0],
            [10, 0],
            [0, -10],
            [0, 10],
          ].map(([dx, dy]) => ({ x: x + dx, y: y + dy }));
        })
        .filter(
          (point) => document.elementFromPoint(point.x, point.y) === canvas,
        );
    });
    const count = await page.evaluate(
      () => window.__speechRecorder.calls.length,
    );
    for (const point of points) {
      await page.mouse.click(point.x, point.y);
      if (
        (await page.evaluate(() => window.__speechRecorder.calls.length)) >
        count
      )
        break;
    }
    expect(
      await page.evaluate(() => window.__speechRecorder.pointerUps),
    ).toBeGreaterThan(0);
    expect(
      await page.evaluate(() => window.__speechRecorder.calls.length),
    ).toBeGreaterThan(count);
    const detail = root.locator(
      system.id === "starter"
        ? ".starter-selected-detail"
        : ".suspension-detail",
    );
    const name = await detail.locator("h3").innerText();
    const part = system.parts.find((part) => part.name === name)!;
    expect(
      await page.evaluate(() => window.__speechRecorder.calls.at(-1)!.text),
    ).toBe(`${part.name}. Função: ${part.description}`);
  });
}
