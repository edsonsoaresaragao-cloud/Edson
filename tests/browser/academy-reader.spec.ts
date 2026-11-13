import { test, expect, type Page } from "@playwright/test";
import { LESSON_URL, studySteps } from "../../src/lib/academy/content";
import { publicQuestions } from "../../src/lib/academy/questions";
import {
  stepNarration,
  narrationChunks,
} from "../../src/lib/academy/narration";
type SpeechMock = {
  spoken: { text: string; lang: string; rate: number; voice: string }[];
  cancelled: number;
  paused: number;
  resumed: number;
  auto: boolean;
  finish: () => void;
  fail: () => void;
  loadVoices: () => void;
};
async function installVoice(page: Page) {
  await page.addInitScript(() => {
    let current: { onend?: () => void; onerror?: () => void } | null = null;
    const eventTarget = new EventTarget();
    let voices: SpeechSynthesisVoice[] = [];
    const state = {
      spoken: [] as {
        text: string;
        lang: string;
        rate: number;
        voice: string;
      }[],
      cancelled: 0,
      paused: 0,
      resumed: 0,
      auto: false,
      finish() {
        const u = current;
        current = null;
        u?.onend?.();
      },
      fail() {
        current?.onerror?.();
      },
      loadVoices() {
        voices = [
          {
            voiceURI: "pt-local",
            lang: "pt-BR",
            name: "Português local de teste",
            localService: true,
            default: true,
          },
          {
            voiceURI: "pt-pt",
            lang: "pt-PT",
            name: "Português europeu de teste",
            localService: true,
            default: false,
          },
        ] as SpeechSynthesisVoice[];
        eventTarget.dispatchEvent(new Event("voiceschanged"));
      },
    };
    class Utterance {
      text: string;
      lang = "";
      rate = 1;
      voice: { voiceURI: string } | null = null;
      onend?: () => void;
      onerror?: () => void;
      constructor(text: string) {
        this.text = text;
      }
    }
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      value: Utterance,
    });
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        getVoices: () => voices,
        addEventListener: eventTarget.addEventListener.bind(eventTarget),
        removeEventListener: eventTarget.removeEventListener.bind(eventTarget),
        speak(u: Utterance) {
          current = u;
          state.spoken.push({
            text: u.text,
            lang: u.lang,
            rate: u.rate,
            voice: u.voice?.voiceURI || "",
          });
          if (state.auto)
            setTimeout(() => {
              if (current === u) state.finish();
            }, 0);
        },
        cancel() {
          state.cancelled++;
          current = null;
        },
        pause() {
          state.paused++;
        },
        resume() {
          state.resumed++;
        },
      },
    });
    (window as unknown as { __academySpeech: typeof state }).__academySpeech =
      state;
  });
}
const mock = (page: Page) =>
  page.evaluate(() => {
    const s = (window as unknown as { __academySpeech: SpeechMock })
      .__academySpeech;
    return {
      spoken: s.spoken,
      cancelled: s.cancelled,
      paused: s.paused,
      resumed: s.resumed,
    };
  });

test("botão lê todas as 14 etapas e suas tabelas, sem concluir o estudo", async ({
  page,
}) => {
  test.setTimeout(120000);
  await installVoice(page);
  await page.goto(LESSON_URL);
  const reader = page.getByRole("region", {
    name: "Leitura em voz alta da etapa",
  });
  await expect(
    reader.getByRole("button", { name: "Ouvir esta etapa", exact: true }),
  ).toBeEnabled();
  expect((await mock(page)).spoken).toHaveLength(0);
  await page.evaluate(() => {
    const s = (window as unknown as { __academySpeech: SpeechMock })
      .__academySpeech;
    s.loadVoices();
    s.auto = true;
  });
  for (const [i, step] of studySteps.entries()) {
    if (i)
      await page
        .getByRole("navigation", { name: "Etapas da Aula 01" })
        .getByRole("button", {
          name: new RegExp(step.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
        })
        .click();
    await expect(
      page.getByRole("heading", { name: step.title, exact: true }),
    ).toBeVisible();
    const before = (await mock(page)).spoken.length;
    await reader
      .getByRole("button", { name: "Ouvir esta etapa", exact: true })
      .click();
    await expect(
      reader.getByRole("status", { name: "Estado da leitura" }),
    ).toContainText("Leitura desta etapa concluída", { timeout: 15000 });
    const spoken = (await mock(page)).spoken.slice(before);
    expect(spoken.map((s) => s.text)).toEqual(
      narrationChunks(stepNarration(step, publicQuestions(step.id))),
    );
    expect(
      spoken.every((s) => s.lang === "pt-BR" && s.voice === "pt-local"),
    ).toBe(true);
    await expect(page.getByRole("progressbar")).toHaveAttribute("value", "0");
  }
});

test("pausa, retoma, para, escolhe voz, trata erro e cancela ao trocar etapa", async ({
  page,
}) => {
  await installVoice(page);
  await page.goto(LESSON_URL);
  const reader = page.getByRole("region", {
    name: "Leitura em voz alta da etapa",
  });
  await expect(
    reader.getByRole("button", { name: "Ouvir esta etapa", exact: true }),
  ).toBeEnabled();
  await page.evaluate(() =>
    (
      window as unknown as { __academySpeech: SpeechMock }
    ).__academySpeech.loadVoices(),
  );
  await reader.getByLabel("Voz em português").selectOption("pt-pt");
  await reader.getByLabel("Velocidade da leitura").selectOption("0.75");
  await reader
    .getByRole("button", { name: "Ouvir esta etapa", exact: true })
    .click();
  expect((await mock(page)).spoken.at(-1)).toMatchObject({
    lang: "pt-PT",
    rate: 0.75,
    voice: "pt-pt",
  });
  await reader
    .getByRole("button", { name: "Pausar leitura", exact: true })
    .click();
  await expect(reader.getByRole("status")).toHaveText("Leitura pausada.");
  expect((await mock(page)).paused).toBe(1);
  await reader
    .getByRole("button", { name: "Continuar leitura", exact: true })
    .click();
  await expect(reader.getByRole("status")).toContainText("Lendo esta etapa");
  await reader
    .getByRole("button", { name: "Pausar leitura", exact: true })
    .click();
  await reader
    .getByRole("button", { name: "Parar leitura", exact: true })
    .click();
  const stopped = (await mock(page)).spoken.length;
  await page.waitForTimeout(100);
  expect((await mock(page)).spoken).toHaveLength(stopped);
  await reader
    .getByRole("button", { name: "Ouvir esta etapa", exact: true })
    .click();
  expect((await mock(page)).resumed).toBeGreaterThan(1);
  await page.evaluate(() =>
    (
      window as unknown as { __academySpeech: SpeechMock }
    ).__academySpeech.fail(),
  );
  await expect(
    reader.getByRole("alert", { name: "Erro na leitura" }),
  ).toContainText("Não foi possível reproduzir");
  await reader
    .getByRole("button", { name: "Ouvir esta etapa", exact: true })
    .click();
  const cancelled = (await mock(page)).cancelled;
  await page
    .getByRole("navigation", { name: "Etapas da Aula 01" })
    .getByRole("button", { name: /Volkswagen/ })
    .click();
  expect((await mock(page)).cancelled).toBeGreaterThan(cancelled);
  await expect(
    reader.getByRole("button", { name: "Ouvir esta etapa", exact: true }),
  ).toBeEnabled();
  await reader
    .getByRole("button", { name: "Ouvir esta etapa", exact: true })
    .click();
  const pending = (await mock(page)).spoken.length;
  await page.evaluate(() =>
    (
      window as unknown as { __academySpeech: SpeechMock }
    ).__academySpeech.finish(),
  );
  await expect
    .poll(async () => (await mock(page)).spoken.length)
    .toBe(pending + 1);
  await reader
    .getByRole("button", { name: "Parar leitura", exact: true })
    .click();
  await page.goto("/academy/aulas");
});

test("navegador sem voz mantém o conteúdo e informa a indisponibilidade", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: undefined,
    }),
  );
  await page.goto(LESSON_URL);
  const reader = page.getByRole("region", {
    name: "Leitura em voz alta da etapa",
  });
  await expect(
    reader.getByRole("button", { name: "Ouvir esta etapa", exact: true }),
  ).toBeDisabled();
  await expect(
    reader.getByText(/A leitura em voz alta não está disponível/),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Introdução", exact: true }),
  ).toBeVisible();
});
