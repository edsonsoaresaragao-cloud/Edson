"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

type SpokenPart = { name: string; description: string };
const subscribe = () => () => {};
const serverAvailability = () => "checking" as const;
function browserAvailability(): "available" | "unavailable" {
  return typeof window !== "undefined" &&
    typeof window.speechSynthesis?.speak === "function" &&
    typeof window.speechSynthesis?.cancel === "function" &&
    typeof window.SpeechSynthesisUtterance === "function"
    ? "available"
    : "unavailable";
}

/** Speak only in user-initiated handlers, including repeated clicks on the same part. */
export function usePartNarration() {
  const availability = useSyncExternalStore(
    subscribe,
    browserAvailability,
    serverAvailability,
  );
  const [enabled, setEnabled] = useState(true),
    [speaking, setSpeaking] = useState(false),
    [error, setError] = useState("");
  const enabledRef = useRef(true),
    utterance = useRef<SpeechSynthesisUtterance | null>(null);

  const cancelCurrent = useCallback(() => {
    const current = utterance.current;
    if (!current) return;
    utterance.current = null;
    current.onend = current.onerror = current.onstart = null;
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* Already unavailable. */
    }
  }, []);
  const stop = useCallback(() => {
    cancelCurrent();
    setSpeaking(false);
  }, [cancelCurrent]);
  const speak = useCallback(
    (part: SpokenPart) => {
      if (!enabledRef.current) return;
      if (browserAvailability() !== "available") {
        setError(
          "A voz não está disponível neste navegador. A função da peça continua no texto.",
        );
        return;
      }
      cancelCurrent();
      setError("");
      try {
        const synth = window.speechSynthesis;
        const next = new window.SpeechSynthesisUtterance(
          `${part.name}. Função: ${part.description}`,
        );
        next.lang = "pt-BR";
        next.rate = 0.95;
        const voices = synth.getVoices();
        const brazilian = voices.filter(
          (voice) => voice.lang.replace("_", "-").toLowerCase() === "pt-br",
        );
        const portuguese = voices.filter((voice) =>
          /^pt(?:-|_|$)/i.test(voice.lang),
        );
        const voice =
          brazilian.find((voice) => voice.localService) ??
          brazilian[0] ??
          portuguese.find((voice) => voice.localService) ??
          portuguese[0];
        if (voice) next.voice = voice;
        utterance.current = next;
        next.onend = () => {
          if (utterance.current !== next) return;
          utterance.current = null;
          setSpeaking(false);
        };
        next.onerror = () => {
          if (utterance.current !== next) return;
          utterance.current = null;
          setSpeaking(false);
          setError(
            "Não foi possível reproduzir a voz. Confira o áudio do dispositivo e tente ouvir novamente.",
          );
        };
        setSpeaking(true);
        synth.speak(next);
      } catch {
        utterance.current = null;
        setSpeaking(false);
        setError("Não foi possível iniciar a voz. Tente ouvir novamente.");
      }
    },
    [cancelCurrent],
  );
  const toggle = useCallback(() => {
    enabledRef.current = !enabledRef.current;
    setEnabled(enabledRef.current);
    setError("");
    if (!enabledRef.current) stop();
  }, [stop]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) stop();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", stop);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", stop);
      cancelCurrent();
    };
  }, [stop, cancelCurrent]);

  return { availability, enabled, speaking, error, speak, stop, toggle };
}
