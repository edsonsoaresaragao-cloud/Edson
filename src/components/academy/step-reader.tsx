"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { narrationChunks } from "@/lib/academy/narration";
function available() {
  return (
    typeof window !== "undefined" &&
    typeof window.speechSynthesis?.speak === "function" &&
    typeof window.speechSynthesis?.cancel === "function" &&
    typeof window.SpeechSynthesisUtterance === "function"
  );
}
function snapshot() {
  if (!available()) return "unavailable";
  return JSON.stringify(
    window.speechSynthesis
      .getVoices()
      .filter((v) => /^pt(?:-|_|$)/i.test(v.lang))
      .map((v) => ({
        uri: v.voiceURI,
        name: v.name,
        lang: v.lang,
        local: v.localService,
      })),
  );
}
function subscribe(onChange: () => void) {
  if (!available()) return () => {};
  window.speechSynthesis.addEventListener("voiceschanged", onChange);
  return () =>
    window.speechSynthesis.removeEventListener("voiceschanged", onChange);
}
type Session = {
  chunks: string[];
  index: number;
  paused: boolean;
  utterance: SpeechSynthesisUtterance | null;
  timer?: ReturnType<typeof setTimeout>;
};
export type ReaderSettings = { voiceUri: string; rate: number };
export function StepReader({
  paragraphs,
  settings,
  onSettingsChange,
}: {
  paragraphs: string[];
  settings: ReaderSettings;
  onSettingsChange: (settings: ReaderSettings) => void;
}) {
  const voiceList = useSyncExternalStore(subscribe, snapshot, () => "checking");
  const supported = voiceList !== "unavailable" && voiceList !== "checking";
  const voices: { uri: string; name: string; lang: string; local: boolean }[] =
    supported ? JSON.parse(voiceList) : [];
  const [status, setStatus] = useState<"idle" | "speaking" | "paused">("idle"),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const { voiceUri, rate } = settings;
  const session = useRef<Session | null>(null);
  function cancel() {
    const current = session.current;
    if (!current) return;
    session.current = null;
    clearTimeout(current.timer);
    if (current.utterance)
      current.utterance.onend =
        current.utterance.onerror =
        current.utterance.onstart =
          null;
    try {
      window.speechSynthesis.cancel();
      if (current.paused) window.speechSynthesis.resume();
    } catch {
      /* Não há fala a cancelar. */
    }
  }
  useEffect(() => {
    function leave() {
      if (!session.current) return;
      cancel();
      setStatus("idle");
      setNotice(
        "Leitura interrompida. Clique em Ouvir esta etapa para recomeçar.",
      );
    }
    function visibility() {
      if (document.hidden) leave();
    }
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("pagehide", leave);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("pagehide", leave);
      cancel();
    };
  }, []);
  function start() {
    if (!available()) {
      setError(
        "A leitura em voz alta não está disponível neste navegador. Use outro navegador ou continue pelo texto.",
      );
      return;
    }
    cancel();
    setError("");
    setNotice("");
    const current: Session = {
      chunks: narrationChunks(paragraphs),
      index: 0,
      paused: false,
      utterance: null,
    };
    if (!current.chunks.length) return;
    session.current = current;
    setStatus("speaking");
    const deviceVoices = window.speechSynthesis.getVoices();
    const voice =
      deviceVoices.find((v) => v.voiceURI === voiceUri) ||
      deviceVoices.find((v) => /^pt[-_]br$/i.test(v.lang) && v.localService) ||
      deviceVoices.find((v) => /^pt[-_]br$/i.test(v.lang)) ||
      deviceVoices.find((v) => /^pt(?:-|_|$)/i.test(v.lang));
    function next() {
      if (session.current !== current || current.paused) return;
      if (current.index >= current.chunks.length) {
        session.current = null;
        setStatus("idle");
        setNotice(
          "Leitura desta etapa concluída. Para registrar o estudo, use o botão de conclusão da etapa.",
        );
        return;
      }
      try {
        const utterance = new SpeechSynthesisUtterance(
          current.chunks[current.index],
        );
        current.utterance = utterance;
        utterance.lang = voice?.lang || "pt-BR";
        utterance.rate = rate;
        if (voice) utterance.voice = voice;
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
          setStatus("idle");
          setError(
            "Não foi possível reproduzir a voz. Confira o áudio do dispositivo e tente novamente.",
          );
        };
        window.speechSynthesis.speak(utterance);
      } catch {
        cancel();
        setStatus("idle");
        setError("Não foi possível iniciar a leitura. Tente novamente.");
      }
    }
    // Retomada entre dois trechos, caso a pausa ocorra no intervalo de transição.
    continuation.current = next;
    try {
      window.speechSynthesis.resume();
      next();
    } catch {
      cancel();
      setStatus("idle");
      setError("Não foi possível iniciar a leitura. Tente novamente.");
    }
  }
  const continuation = useRef<(() => void) | null>(null);
  function pauseOrResume() {
    const current = session.current;
    if (!current) return;
    try {
      if (current.paused) {
        current.paused = false;
        window.speechSynthesis.resume();
        setStatus("speaking");
        if (!current.utterance) {
          clearTimeout(current.timer);
          continuation.current?.();
        }
      } else {
        current.paused = true;
        clearTimeout(current.timer);
        window.speechSynthesis.pause();
        setStatus("paused");
      }
    } catch {
      cancel();
      setStatus("idle");
      setError(
        "Não foi possível pausar ou retomar. Inicie a leitura novamente.",
      );
    }
  }
  return (
    <section
      className="academy-reader"
      aria-label="Leitura em voz alta da etapa"
    >
      <div className="academy-reader-actions">
        <button
          type="button"
          className="button"
          disabled={!supported}
          onClick={start}
        >
          {status === "idle" ? "Ouvir esta etapa" : "Reiniciar leitura"}
        </button>
        <button
          type="button"
          className="button secondary"
          disabled={status === "idle"}
          onClick={pauseOrResume}
        >
          {status === "paused" ? "Continuar leitura" : "Pausar leitura"}
        </button>
        <button
          type="button"
          className="button secondary"
          disabled={status === "idle"}
          onClick={() => {
            cancel();
            setStatus("idle");
            setError("");
            setNotice("Leitura parada.");
          }}
        >
          Parar leitura
        </button>
      </div>
      <div className="academy-reader-options">
        <label>
          Voz em português
          <select
            value={voiceUri}
            disabled={!supported || status !== "idle"}
            onChange={(e) =>
              onSettingsChange({ ...settings, voiceUri: e.target.value })
            }
          >
            <option value="">Automática · português do Brasil</option>
            {voices.map((v) => (
              <option value={v.uri} key={v.uri}>
                {v.name} · {v.lang}
              </option>
            ))}
          </select>
        </label>
        <label>
          Velocidade da leitura
          <select
            value={rate}
            disabled={!supported || status !== "idle"}
            onChange={(e) =>
              onSettingsChange({ ...settings, rate: Number(e.target.value) })
            }
          >
            {[0.75, 0.9, 1, 1.15, 1.3].map((v) => (
              <option key={v} value={v}>
                {String(v).replace(".", ",")}×
              </option>
            ))}
          </select>
        </label>
      </div>
      <p>
        Ouça o texto, as tabelas e as perguntas desta etapa. A voz depende das
        opções disponíveis no seu dispositivo.
      </p>
      {voiceList === "unavailable" && (
        <p>
          A leitura em voz alta não está disponível neste navegador. O conteúdo
          continua disponível no texto e nas páginas do material.
        </p>
      )}
      {error && (
        <p role="alert" aria-label="Erro na leitura">
          {error}
        </p>
      )}
      {(status !== "idle" || notice) && (
        <p role="status" aria-label="Estado da leitura">
          {status === "speaking"
            ? "Lendo esta etapa…"
            : status === "paused"
              ? "Leitura pausada."
              : notice}
        </p>
      )}
    </section>
  );
}
