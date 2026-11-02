"use client";
import { useCallback, useState } from "react";
import type { TechnicalComponent } from "@/lib/sensor-actuator-catalog";

export function ComponentReferenceImage({
  item,
}: {
  item: TechnicalComponent;
}) {
  const [state, setState] = useState<"pending" | "loaded" | "unavailable">(
    item.photo && !item.photo.unavailable ? "pending" : "unavailable",
  );
  // SSR images can finish or fail before React attaches its event handlers.
  // Read their settled state when the DOM node is attached as well.
  const attachImage = useCallback((element: HTMLImageElement | null) => {
    if (element?.complete) {
      setState(element.naturalWidth > 0 ? "loaded" : "unavailable");
    }
  }, []);
  const col = item.illustrationIndex % 5;
  const row = Math.floor(item.illustrationIndex / 5);
  return (
    <figure className="component-reference">
      <div className="component-reference-visual">
        {state !== "loaded" && (
          <div
            className="component-reference-illustration"
            role="img"
            aria-label={`Ilustração didática gerada: ${item.name}. Formato genérico de referência.`}
            style={{
              backgroundPosition: `${(col / 4) * 100}% ${(row / 7) * 100}%`,
            }}
          />
        )}
        {item.photo && !item.photo.unavailable && state !== "unavailable" && (
          // Supplied proxy URLs are not stable Next Image sources. A local,
          // explicitly labelled illustration remains if the remote photo fails.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={attachImage}
            src={item.photo.url}
            alt={`Foto de referência: ${item.name}. ${item.photo.title}`}
            aria-hidden={state !== "loaded"}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onLoad={() => setState("loaded")}
            onError={() => setState("unavailable")}
          />
        )}
      </div>
      <figcaption>
        {state === "loaded"
          ? "Foto de referência fornecida"
          : "Ilustração didática gerada"}
        {state === "pending" && <span> · carregando foto enviada</span>}
      </figcaption>
    </figure>
  );
}
