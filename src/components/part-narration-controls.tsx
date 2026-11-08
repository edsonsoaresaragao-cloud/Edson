"use client";
import type { usePartNarration } from "./use-part-narration";

export function PartNarrationControls({
  narration,
  part,
  className = "",
  surface = false,
}: {
  narration: ReturnType<typeof usePartNarration>;
  part: { name: string; description: string } | null;
  className?: string;
  surface?: boolean;
}) {
  const { availability, enabled, speaking, error, speak, stop, toggle } =
    narration;
  return (
    <div
      className={`part-narration ${surface ? "part-narration-surface" : ""} ${className}`}
      role="group"
      aria-label="Narração das peças"
    >
      <div className="suspension-toolbar part-narration-controls">
        <button
          type="button"
          aria-pressed={enabled && availability === "available"}
          disabled={availability !== "available"}
          onClick={toggle}
        >
          Falar ao selecionar
        </button>
        <button
          type="button"
          disabled={availability !== "available" || !enabled || !part}
          onClick={() => part && speak(part)}
        >
          Ouvir peça novamente
        </button>
        <button type="button" disabled={!speaking} onClick={stop}>
          Interromper fala
        </button>
      </div>
      <p role="status" aria-live="polite" aria-atomic="true">
        {availability === "checking"
          ? "Verificando voz do navegador…"
          : availability === "unavailable"
            ? "A voz não está disponível neste navegador. As descrições continuam no texto."
            : error ||
              (!enabled
                ? "Narração desligada. As peças continuam selecionáveis."
                : speaking
                  ? `Lendo: ${part?.name ?? "peça selecionada"}.`
                  : surface
                    ? "Selecione uma peça para ouvir o nome e a função em português."
                    : "Clique na peça, na etiqueta ou na lista para ouvir o nome e a função em português.")}
      </p>
    </div>
  );
}
