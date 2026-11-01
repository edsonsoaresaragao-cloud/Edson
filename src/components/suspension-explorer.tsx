"use client";
import { useEffect, useRef, useState } from "react";
import {
  initialSuspensionState,
  suspensionParts,
} from "@/lib/suspension-parts";
import type { SuspensionRenderer } from "@/lib/suspension-renderer";

export function SuspensionExplorer() {
  const [state, setState] = useState(initialSuspensionState),
    [paused, setPaused] = useState(false),
    [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const host = useRef<HTMLDivElement>(null),
    controller = useRef<SuspensionRenderer | null>(null);
  const latest = useRef({ state, paused });
  useEffect(() => {
    latest.current = { state, paused };
  }, [state, paused]);
  useEffect(() => {
    let cancelled = false;
    import("@/lib/suspension-renderer")
      .then(({ createSuspensionRenderer }) => {
        if (cancelled || !host.current) return;
        try {
          controller.current = createSuspensionRenderer(
            host.current,
            latest.current.state,
            (id) => setState((s) => ({ ...s, selected: id })),
            () => setStatus("fallback"),
          );
          controller.current.setPaused(latest.current.paused);
          setStatus("ready");
        } catch {
          setStatus("fallback");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("fallback");
      });
    return () => {
      cancelled = true;
      controller.current?.dispose();
      controller.current = null;
    };
  }, []);
  useEffect(() => {
    controller.current?.setState(state);
  }, [state]);
  useEffect(() => {
    controller.current?.setPaused(paused);
  }, [paused]);
  const selected = suspensionParts[state.selected - 1];
  return (
    <section className="suspension-explorer" aria-labelledby="suspension-title">
      <div className="suspension-heading">
        <div>
          <span className="eyebrow">EXPLORE / MÓDULO DIANTEIRO</span>
          <h2 id="suspension-title">Veja como tudo se conecta.</h2>
          <p>
            Suspensão McPherson, direção, freio e transmissão em um conjunto
            interativo.
          </p>
        </div>
        <span className="suspension-count">20 componentes</span>
      </div>
      <div className="suspension-subsystems" aria-label="Explorar conjuntos">
        <span>Explorar:</span>
        {[
          { name: "Módulo dianteiro", id: 1 },
          { name: "Suspensão", id: 11 },
          { name: "Transmissão e diferencial", id: 2 },
          { name: "Sistema de freio", id: 9 },
          { name: "Direção", id: 17 },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={state.selected === item.id}
            onClick={() => setState((s) => ({ ...s, selected: item.id }))}
          >
            {item.name}
          </button>
        ))}
      </div>
      <div className="suspension-layout">
        <div>
          <div className="suspension-toolbar">
            <button
              type="button"
              aria-pressed={state.explosion === 0}
              onClick={() => setState((s) => ({ ...s, explosion: 0 }))}
            >
              Montado
            </button>
            <button
              type="button"
              aria-pressed={state.explosion === 1}
              onClick={() => setState((s) => ({ ...s, explosion: 1 }))}
            >
              Vista explodida
            </button>
            <button
              type="button"
              aria-pressed={paused}
              onClick={() => setPaused((p) => !p)}
            >
              {paused ? "▶ Reproduzir" : "Ⅱ Pausar"}
            </button>
            <button
              type="button"
              onClick={() => controller.current?.resetView()}
            >
              Restaurar câmera
            </button>
          </div>
          <div className="suspension-stage">
            <div
              ref={host}
              className="suspension-canvas"
              role="img"
              aria-label="Modelo 3D didático do módulo dianteiro. Selecione as peças pela lista de componentes."
            />
            {status !== "ready" && (
              <div className="suspension-fallback">
                <svg
                  viewBox="0 0 640 340"
                  role="img"
                  aria-label="Esquema frontal de suspensão McPherson"
                >
                  <g fill="none" stroke="#a6bbc9" strokeWidth="12">
                    <path d="M120 270H520M180 270L100 210M460 270L540 210M100 210L150 65M540 210L490 65M100 210H540" />
                    <path
                      d="M145 75l-35 15 30 15-40 15 30 15-40 15 30 15M495 75l35 15-30 15 40 15-30 15 40 15-30 15"
                      stroke="#ff7b16"
                      strokeWidth="7"
                    />
                  </g>
                  <g fill="#60788b" stroke="#c3d6e3" strokeWidth="3">
                    <rect x="265" y="175" width="110" height="80" rx="14" />
                    <ellipse cx="85" cy="225" rx="20" ry="53" />
                    <ellipse cx="555" cy="225" rx="20" ry="53" />
                  </g>
                </svg>
                <p>
                  {status === "loading"
                    ? "Carregando visualização 3D…"
                    : "Modo esquemático: visualização 3D indisponível neste navegador."}
                </p>
              </div>
            )}
            <span className="suspension-stage-label">
              DIANTEIRA / McPHERSON
            </span>
          </div>
          <p className="suspension-hint">
            {status === "ready"
              ? "Arraste para girar. Toque em uma peça ou selecione pela lista."
              : "Explore as funções das peças pela lista de componentes."}
          </p>
          <div className="suspension-controls">
            <label>
              Separação das peças{" "}
              <output>{Math.round(state.explosion * 100)}%</output>
              <input
                disabled={status === "fallback"}
                type="range"
                min="0"
                max="100"
                value={state.explosion * 100}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    explosion: Number(e.target.value) / 100,
                  }))
                }
              />
            </label>
            <label>
              Direção <output>{state.steering}°</output>
              <input
                disabled={status === "fallback"}
                type="range"
                min="-25"
                max="25"
                value={state.steering}
                onChange={(e) =>
                  setState((s) => ({ ...s, steering: Number(e.target.value) }))
                }
              />
            </label>
            <label>
              Irregularidade do piso{" "}
              <output>{Math.round(state.amplitude * 100)}%</output>
              <input
                disabled={status === "fallback"}
                type="range"
                min="0"
                max="100"
                value={state.amplitude * 100}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    amplitude: Number(e.target.value) / 100,
                  }))
                }
              />
            </label>
          </div>
          <div className="suspension-detail" aria-live="polite">
            <span className="suspension-number">{selected.id}</span>
            <div>
              <h3>{selected.name}</h3>
              <p>{selected.description}</p>
            </div>
          </div>
        </div>
        <aside className="suspension-parts" aria-label="Principais componentes">
          <h3>Principais componentes</h3>
          <p>Selecione para destacar e conhecer.</p>
          <ol>
            {suspensionParts.map((part) => (
              <li key={part.id}>
                <button
                  type="button"
                  aria-pressed={state.selected === part.id}
                  onClick={() => setState((s) => ({ ...s, selected: part.id }))}
                >
                  <span className="suspension-number">{part.id}</span>
                  {part.name}
                </button>
              </li>
            ))}
          </ol>
        </aside>
      </div>
      <p className="suspension-note">
        Modelo didático genérico inspirado na referência. A vista explodida
        separa os conjuntos para estudo; o movimento é demonstrado na vista
        montada. Geometria, fixações e aplicações variam por veículo.
      </p>
    </section>
  );
}
