import type { Page } from "@playwright/test";

type VoiceRecord = {
  text: string;
  lang: string;
  voice: string | null;
  rate: number;
};
declare global {
  interface Window {
    __speechRecorder: {
      calls: VoiceRecord[];
      cancellations: number;
      pointerUps: number;
      mode: "br" | "pt" | "empty";
      finish(): void;
      fail(): void;
      endPrevious(): void;
    };
  }
}
export async function installSpeech(
  page: Page,
  webgl = false,
  missing = false,
) {
  await page.addInitScript(
    ({ webgl, missing }) => {
      if (!webgl) {
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (
          this: HTMLCanvasElement,
          kind: string,
          ...args: unknown[]
        ) {
          return kind.includes("webgl")
            ? null
            : Reflect.apply(original, this, [kind, ...args]);
        } as typeof original;
      }
      if (missing) {
        Object.defineProperty(window, "speechSynthesis", {
          configurable: true,
          value: undefined,
        });
        Object.defineProperty(window, "SpeechSynthesisUtterance", {
          configurable: true,
          value: undefined,
        });
        return;
      }
      class Utterance {
        text: string;
        lang = "";
        rate = 1;
        voice: SpeechSynthesisVoice | null = null;
        onend: (() => void) | null = null;
        onerror: (() => void) | null = null;
        onstart: (() => void) | null = null;
        constructor(text: string) {
          this.text = text;
        }
      }
      let current: Utterance | null = null;
      const ends: Array<(() => void) | null> = [];
      const recorder: Window["__speechRecorder"] = {
        calls: [],
        cancellations: 0,
        pointerUps: 0,
        mode: "br",
        finish() {
          current?.onend?.();
        },
        fail() {
          current?.onerror?.();
        },
        endPrevious() {
          ends.at(-2)?.();
        },
      };
      window.__speechRecorder = recorder;
      const voice = (
        name: string,
        lang: string,
        localService: boolean,
      ): SpeechSynthesisVoice => ({
        name,
        lang,
        localService,
        default: false,
        voiceURI: name,
      });
      Object.defineProperty(window, "SpeechSynthesisUtterance", {
        configurable: true,
        value: Utterance,
      });
      Object.defineProperty(window, "speechSynthesis", {
        configurable: true,
        value: {
          getVoices() {
            return recorder.mode === "empty"
              ? []
              : recorder.mode === "pt"
                ? [voice("Portugal", "pt-PT", true)]
                : [
                    voice("English", "en-US", true),
                    voice("Brasil remoto", "pt-BR", false),
                    voice("Brasil local", "pt_BR", true),
                  ];
          },
          speak(next: Utterance) {
            current = next;
            ends.push(next.onend);
            recorder.calls.push({
              text: next.text,
              lang: next.lang,
              voice: next.voice?.name ?? null,
              rate: next.rate,
            });
          },
          cancel() {
            recorder.cancellations++;
            current = null;
          },
        },
      });
    },
    { webgl, missing },
  );
}
