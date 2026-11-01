"use client";
import { useState } from "react";
import { type Engine } from "@/lib/engines";
import visuals from "@/lib/engine-visuals.json";
import { EngineDiagram } from "./engine-diagram";
import { EngineSheet } from "./engine-sheet";

export function EngineVisual({
  engine,
  part,
  onSelect,
}: {
  engine: Engine;
  part: number;
  onSelect: (part: number) => void;
}) {
  const [view, setView] = useState<"generated" | "photo" | "diagram">(
    "generated",
  );
  const [photoFailed, setPhotoFailed] = useState(false);
  const visual = visuals.find((v) => v.id === engine.id)!;
  const panelId = `visual-${engine.id}`;
  return (
    <div className={`engine-drawing engine-view-${view}`}>
      <div
        className="engine-view-tabs"
        role="tablist"
        aria-label="Tipo de imagem"
      >
        {(
          [
            ["generated", "Vista gerada"],
            ["photo", "Referência"],
            ["diagram", "Esquema"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`${panelId}-${id}`}
            aria-selected={view === id}
            aria-controls={panelId}
            tabIndex={view === id ? 0 : -1}
            onKeyDown={(event) => {
              const order = ["generated", "photo", "diagram"] as const;
              const current = order.indexOf(id);
              const next =
                event.key === "ArrowRight"
                  ? (current + 1) % order.length
                  : event.key === "ArrowLeft"
                    ? (current + order.length - 1) % order.length
                    : event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? order.length - 1
                        : -1;
              if (next < 0) return;
              event.preventDefault();
              setView(order[next]);
              document.getElementById(`${panelId}-${order[next]}`)?.focus();
            }}
            onClick={() => setView(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div id={panelId} role="tabpanel" aria-labelledby={`${panelId}-${view}`}>
        {view === "generated" ? (
          <EngineSheet engine={engine} selected={part} onSelect={onSelect} />
        ) : view === "diagram" ? (
          <EngineDiagram
            cylinders={visual.cylinders}
            v={engine.layout === "V6"}
            selected={part}
            onSelect={onSelect}
          />
        ) : (
          <figure className="engine-photo-frame">
            {view === "photo" && photoFailed ? (
              <div className="engine-photo-unavailable">
                <p>Não foi possível carregar a imagem externa aqui.</p>
                <a
                  href={visual.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ver referência no site de origem ↗
                </a>
              </div>
            ) : (
              <img
                key={view}
                src={visual.photoUrl}
                alt={`Imagem publicada como ${engine.maker} ${engine.family} pela fonte consultada`}
                width={1024}
                height={1536}
                referrerPolicy="no-referrer"
                onError={() => setPhotoFailed(true)}
              />
            )}
            <figcaption>
              IMAGEM DA FONTE · DIREITOS DO RESPECTIVO TITULAR
            </figcaption>
          </figure>
        )}
      </div>
      {view === "generated" && (
        <button
          className="sheet-print button"
          type="button"
          onClick={() => window.print()}
        >
          Imprimir ficha / salvar PDF
        </button>
      )}
      {view === "generated" && (
        <a
          className="engine-enlarge"
          href={visual.image}
          target="_blank"
          rel="noopener noreferrer"
        >
          Abrir ilustração sem a ficha ↗
        </a>
      )}
      <div className="engine-source">
        <strong>Referência visual: {visual.referenceVersion}</strong>
        <a href={visual.sourceUrl} target="_blank" rel="noopener noreferrer">
          {visual.sourceTitle} ↗
        </a>
        <small>
          Fonte consultada em 01/11/2026. A imagem publicada pode representar
          uma versão específica da família. A vista gerada é uma interpretação
          educativa; detalhes internos exigem documentação técnica.
        </small>
      </div>
      <p>
        {engine.layout === "variavel"
          ? "O esquema usa a arquitetura da versão de referência; outras versões da família podem ser diferentes."
          : "O esquema interativo ilustra a arquitetura geral."}{" "}
        Não é um desenho específico de peças desta família.
      </p>
    </div>
  );
}
