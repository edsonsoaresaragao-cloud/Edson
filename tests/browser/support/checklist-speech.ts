import type { Page } from "@playwright/test";
declare global {
  interface Window {
    __checklistSpeech: {
      calls: { text: string; lang: string; rate: number; voice: string }[];
      cancelled: number;
      paused: number;
      resumed: number;
      auto: boolean;
      finish: () => void;
      fail: () => void;
      loadVoices: () => void;
      endPrevious: () => void;
    };
  }
}
export async function installChecklistSpeech(
  page: Page,
  mode: "br" | "no-br" | "missing" = "br",
) {
  await page.addInitScript((mode) => {
    if (mode === "missing") {
      Object.defineProperty(window, "speechSynthesis", {
        configurable: true,
        value: undefined,
      });
      return;
    }
    let current: {
      onend: (() => void) | null;
      onerror: (() => void) | null;
    } | null = null;
    const ends: ((() => void) | null)[] = [];
    const target = new EventTarget();
    let ready = true;
    const voices = () =>
      ready
        ? [
            {
              name: "Brasil local",
              lang: "pt-BR",
              voiceURI: "br-local",
              localService: true,
            },
            {
              name: "Brasil remoto",
              lang: "pt-BR",
              voiceURI: "br-remote",
              localService: false,
            },
          ]
        : [];
    const state: Window["__checklistSpeech"] = {
      calls: [],
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
        ready = true;
        target.dispatchEvent(new Event("voiceschanged"));
      },
      endPrevious() {
        ends.at(-2)?.();
      },
    };
    window.__checklistSpeech = state;
    class Utterance {
      text: string;
      lang = "";
      rate = 1;
      voice: SpeechSynthesisVoice | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
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
        getVoices: () =>
          mode === "no-br"
            ? [
                {
                  name: "Portugal",
                  lang: "pt-PT",
                  voiceURI: "pt",
                  localService: true,
                },
              ]
            : voices(),
        addEventListener: target.addEventListener.bind(target),
        removeEventListener: target.removeEventListener.bind(target),
        speak(u: Utterance) {
          current = u;
          ends.push(u.onend);
          state.calls.push({
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
  }, mode);
}
