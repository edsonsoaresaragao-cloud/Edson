"use client";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Volume2 } from "lucide-react";
import { narrationChunks } from "@/lib/academy/narration";
export type PageVoiceSettings = { voice: string; rate: number };
function supported() {
  return (
    typeof window !== "undefined" &&
    typeof window.SpeechSynthesisUtterance === "function" &&
    ["speak", "cancel", "pause", "resume", "getVoices"].every(
      (key) =>
        typeof window.speechSynthesis?.[key as keyof SpeechSynthesis] ===
        "function",
    )
  );
}
function snapshot() {
  if (!supported()) return "unavailable";
  return JSON.stringify(
    window.speechSynthesis
      .getVoices()
      .filter((v) => /^pt[-_]br$/i.test(v.lang))
      .map((v) => ({ uri: v.voiceURI, name: v.name, local: v.localService })),
  );
}
function subscribe(notify: () => void) {
  if (!supported()) return () => {};
  window.speechSynthesis.addEventListener("voiceschanged", notify);
  return () =>
    window.speechSynthesis.removeEventListener("voiceschanged", notify);
}
type Session = {
  chunks: string[];
  index: number;
  paused: boolean;
  utterance: SpeechSynthesisUtterance | null;
  timer?: ReturnType<typeof setTimeout>;
  next: () => void;
};
export function PageReader({
  page,
  paragraphs,
  settings,
  onSettingsChange,
}: {
  page: number;
  paragraphs: string[];
  settings: PageVoiceSettings;
  onSettingsChange: (s: PageVoiceSettings) => void;
}) {
  const owner = useId();
  const voiceSnapshot = useSyncExternalStore(
    subscribe,
    snapshot,
    () => "checking",
  );
  const voices: { uri: string; name: string; local: boolean }[] =
    voiceSnapshot.startsWith("[") ? JSON.parse(voiceSnapshot) : [];
  const canRead = voices.length > 0;
  const session = useRef<Session | null>(null);
  const [state, setState] = useState<{
    mode: "idle" | "speaking" | "paused";
    index: number;
    total: number;
    notice: string;
    error: string;
  }>({ mode: "idle", index: 0, total: 0, notice: "", error: "" });
  function cancel() {
    const current = session.current;
    if (!current) return;
    session.current = null;
    clearTimeout(current.timer);
    if (current.utterance)
      current.utterance.onend = current.utterance.onerror = null;
    try {
      window.speechSynthesis.cancel();
      if (current.paused) window.speechSynthesis.resume();
    } catch {
      /* Navegador interrompido. */
    }
  }
  useEffect(() => {
    function stopOther(event: Event) {
      if ((event as CustomEvent<string>).detail === owner || !session.current)
        return;
      cancel();
      setState((s) => ({
        ...s,
        mode: "idle",
        notice: "Leitura parada.",
        error: "",
      }));
    }
    function leave() {
      if (session.current) {
        cancel();
        setState((s) => ({
          ...s,
          mode: "idle",
          notice: "Leitura parada.",
          error: "",
        }));
      }
    }
    function hide() {
      if (document.hidden) leave();
    }
    document.addEventListener("academy-page-reading", stopOther);
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("pagehide", leave);
    return () => {
      document.removeEventListener("academy-page-reading", stopOther);
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("pagehide", leave);
      cancel();
    };
  }, [owner]);
  function start() {
    if (!supported() || !canRead) return;
    cancel();
    document.dispatchEvent(
      new CustomEvent("academy-page-reading", { detail: owner }),
    );
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
    } catch {
      setState((s) => ({
        ...s,
        mode: "idle",
        error:
          "Não foi possível iniciar a leitura. Confira o áudio do dispositivo.",
      }));
      return;
    }
    const deviceVoices = window.speechSynthesis
      .getVoices()
      .filter((v) => /^pt[-_]br$/i.test(v.lang));
    const voice =
      deviceVoices.find((v) => v.voiceURI === settings.voice) ||
      deviceVoices.find((v) => v.localService) ||
      deviceVoices[0];
    if (!voice) {
      setState((s) => ({
        ...s,
        error:
          "A voz pt-BR não está disponível. Consulte a transcrição abaixo.",
      }));
      return;
    }
    const current: Session = {
      chunks: narrationChunks(paragraphs, 180),
      index: 0,
      paused: false,
      utterance: null,
      next: () => {},
    };
    function next() {
      if (session.current !== current || current.paused) return;
      if (current.index >= current.chunks.length) {
        session.current = null;
        setState((s) => ({
          ...s,
          mode: "idle",
          notice: `Leitura da página ${page} concluída.`,
          error: "",
        }));
        return;
      }
      setState({
        mode: "speaking",
        index: current.index + 1,
        total: current.chunks.length,
        notice: "",
        error: "",
      });
      try {
        const utterance = new SpeechSynthesisUtterance(
          current.chunks[current.index],
        );
        current.utterance = utterance;
        utterance.lang = "pt-BR";
        utterance.rate = settings.rate;
        utterance.voice = voice;
        utterance.onend = () => {
          if (session.current !== current || current.utterance !== utterance)
            return;
          current.utterance = null;
          current.index++;
          if (!current.paused) current.timer = setTimeout(next, 30);
        };
        utterance.onerror = () => {
          if (session.current !== current) return;
          cancel();
          setState((s) => ({
            ...s,
            mode: "idle",
            notice: "",
            error:
              "Não foi possível reproduzir a voz. Confira o áudio e tente novamente.",
          }));
        };
        window.speechSynthesis.speak(utterance);
      } catch {
        cancel();
        setState((s) => ({
          ...s,
          mode: "idle",
          notice: "",
          error: "Não foi possível iniciar a leitura. Tente novamente.",
        }));
      }
    }
    current.next = next;
    session.current = current;
    next();
  }
  function pause() {
    const current = session.current;
    if (!current) return;
    try {
      current.paused = true;
      clearTimeout(current.timer);
      window.speechSynthesis.pause();
      setState((s) => ({ ...s, mode: "paused" }));
    } catch {
      cancel();
      setState((s) => ({
        ...s,
        mode: "idle",
        error: "Não foi possível pausar a leitura.",
      }));
    }
  }
  function resume() {
    const current = session.current;
    if (!current) return;
    try {
      current.paused = false;
      window.speechSynthesis.resume();
      setState((s) => ({ ...s, mode: "speaking" }));
      if (!current.utterance) current.next();
    } catch {
      cancel();
      setState((s) => ({
        ...s,
        mode: "idle",
        error: "Não foi possível retomar a leitura.",
      }));
    }
  }
  return (
    <section
      className="academy-reader"
      aria-label={`Leitura em voz alta da página ${page}`}
    >
      <div className="academy-reader-actions">
        <button
          type="button"
          className="button"
          disabled={!canRead}
          onClick={start}
        >
          <Volume2 size={18} aria-hidden="true" /> Ouvir esta página
        </button>
        <button
          type="button"
          className="button secondary"
          disabled={state.mode !== "speaking"}
          onClick={pause}
        >
          Pausar
        </button>
        <button
          type="button"
          className="button secondary"
          disabled={state.mode !== "paused"}
          onClick={resume}
        >
          Continuar
        </button>
        <button
          type="button"
          className="button secondary"
          disabled={state.mode === "idle"}
          onClick={() => {
            cancel();
            setState((s) => ({
              ...s,
              mode: "idle",
              notice: "Leitura parada.",
              error: "",
            }));
          }}
        >
          Parar
        </button>
      </div>
      <div className="academy-reader-options">
        <label>
          Voz em português do Brasil
          <select
            value={settings.voice}
            disabled={!canRead || state.mode !== "idle"}
            onChange={(e) =>
              onSettingsChange({ ...settings, voice: e.target.value })
            }
          >
            <option value="">Automática · pt-BR</option>
            {voices.map((v) => (
              <option value={v.uri} key={v.uri}>
                {v.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Velocidade da leitura
          <select
            value={settings.rate}
            disabled={!canRead || state.mode !== "idle"}
            onChange={(e) =>
              onSettingsChange({ ...settings, rate: Number(e.target.value) })
            }
          >
            {[0.8, 1, 1.2, 1.4].map((rate) => (
              <option key={rate} value={rate}>
                {String(rate).replace(".", ",")}×
              </option>
            ))}
          </select>
        </label>
      </div>
      <p>
        Leitura integral da página {page}, incluindo os pontos de conferência,
        avisos e créditos. Ouvir não marca o estudo como concluído.
      </p>
      {voiceSnapshot === "unavailable" ? (
        <p>
          A leitura em voz alta não está disponível neste navegador. Consulte a
          transcrição abaixo.
        </p>
      ) : voiceSnapshot !== "checking" && !canRead ? (
        <p>
          Não há voz pt-BR disponível no dispositivo. Consulte a transcrição ou
          instale uma voz em português do Brasil no sistema.
        </p>
      ) : null}
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-label="Estado da leitura"
      >
        {state.mode === "speaking"
          ? `Lendo página ${page} — trecho ${state.index} de ${state.total}`
          : state.mode === "paused"
            ? `Pausado — página ${page}, trecho ${state.index} de ${state.total}`
            : state.notice || `Pronto para ler a página ${page}.`}
      </p>
      {state.error && <p role="alert">{state.error}</p>}
      <details className="academy-page-transcript">
        <summary>Ver texto que será narrado</summary>
        {paragraphs.map((text, i) => (
          <p key={i}>{text}</p>
        ))}
      </details>
    </section>
  );
}
