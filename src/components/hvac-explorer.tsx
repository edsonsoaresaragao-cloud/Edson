"use client";
import { useEffect, useRef, useState } from "react";
import { hvacParts, initialHvacState } from "@/lib/hvac-parts";
import type { HvacRenderer } from "@/lib/hvac-renderer";
export function HvacExplorer() {
  const [state, setState] = useState(initialHvacState),
    [paused, setPaused] = useState(false),
    [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const host = useRef<HTMLDivElement>(null),
    controller = useRef<HvacRenderer | null>(null),
    latest = useRef({ state, paused });
  useEffect(() => {
    latest.current = { state, paused };
  }, [state, paused]);
  useEffect(() => {
    let cancelled = false;
    import("@/lib/hvac-renderer")
      .then(({ createHvacRenderer }) => {
        if (cancelled || !host.current) return;
        try {
          controller.current = createHvacRenderer(
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
  const selected = hvacParts[state.selected - 1];
  return (
    <section
      className="suspension-explorer hvac-explorer"
      aria-labelledby="hvac-title"
    >
      <header className="suspension-heading">
        <div>
          <span className="eyebrow">EXPLORE / CLIMATIZAÇÃO AUTOMOTIVA</span>
          <h2 id="hvac-title">Por dentro do ar-condicionado.</h2>
          <p>
            Circuito de refrigeração e caixa HVAC em corte, com peças
            identificadas e fluxo em movimento.
          </p>
        </div>
        <span className="suspension-count">13 componentes</span>
      </header>
      <div className="suspension-layout">
        <div>
          <div className="suspension-toolbar">
            <button
              type="button"
              disabled={status === "fallback"}
              aria-pressed={state.explosion === 0}
              onClick={() => setState((s) => ({ ...s, explosion: 0 }))}
            >
              Montado
            </button>
            <button
              type="button"
              disabled={status === "fallback"}
              aria-pressed={state.explosion === 1}
              onClick={() => setState((s) => ({ ...s, explosion: 1 }))}
            >
              Vista explodida
            </button>
            <button
              type="button"
              disabled={status === "fallback"}
              aria-pressed={paused}
              onClick={() => setPaused((p) => !p)}
            >
              {paused ? "▶ Reproduzir" : "Ⅱ Pausar"}
            </button>
            <button
              type="button"
              disabled={status !== "ready"}
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
              aria-label="Modelo didático 3D do circuito de ar-condicionado; seleção acessível pela lista de componentes."
            />
            {status !== "ready" && (
              <div className="suspension-fallback">
                <svg
                  viewBox="0 0 700 330"
                  role="img"
                  aria-label="Circuito: compressor, condensador, filtro secador, expansão e evaporador"
                >
                  <g fill="none" strokeWidth="8">
                    <path d="M100 90V245H260" stroke="#f26935" />
                    <path d="M260 245H360V90H490" stroke="#f3c833" />
                    <path d="M490 90H600V200H490V40H100V90" stroke="#3abaff" />
                  </g>
                  <g fill="#18374c" stroke="#a8c2d4" strokeWidth="3">
                    <circle cx="100" cy="90" r="35" />
                    <rect x="60" y="170" width="80" height="100" rx="7" />
                    <rect x="245" y="205" width="30" height="70" rx="14" />
                    <rect x="345" y="65" width="30" height="50" rx="5" />
                    <rect x="480" y="110" width="100" height="90" rx="6" />
                  </g>
                  <g fill="#dcebf6" fontSize="14" textAnchor="middle">
                    <text x="100" y="145">
                      1 Compressor
                    </text>
                    <text x="100" y="300">
                      2 Condensador
                    </text>
                    <text x="270" y="300">
                      4 Filtro secador
                    </text>
                    <text x="360" y="50">
                      5 Expansão
                    </text>
                    <text x="535" y="230">
                      6 Evaporador
                    </text>
                  </g>
                </svg>
                <p>
                  {status === "loading"
                    ? "Carregando módulo 3D…"
                    : "Modo esquemático: 3D indisponível. Explore os componentes pela lista."}
                </p>
              </div>
            )}
            <span className="suspension-stage-label">A/C / HVAC EM CORTE</span>
          </div>
          <p className="suspension-hint">
            {status === "ready"
              ? "Arraste para girar. Selecione uma etiqueta ou peça para conhecer sua função."
              : "As funções de todos os componentes estão disponíveis na lista."}
          </p>
          <div className="hvac-legend" aria-label="Legenda dos fluxos">
            <span style={{ "--flow": "#f04c3b" } as React.CSSProperties}>
              Alta pressão · vapor quente
            </span>
            <span style={{ "--flow": "#ffa22c" } as React.CSSProperties}>
              Alta pressão · líquido
            </span>
            <span style={{ "--flow": "#42bfff" } as React.CSSProperties}>
              Após expansão · mistura fria
            </span>
            <span style={{ "--flow": "#258dff" } as React.CSSProperties}>
              Baixa pressão · retorno em vapor
            </span>
            <span style={{ "--flow": "#7edcff" } as React.CSSProperties}>
              Setas · ar da cabine
            </span>
          </div>
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
              Ventilação da cabine{" "}
              <output>{Math.round(state.speed * 100)}%</output>
              <input
                disabled={status === "fallback"}
                type="range"
                min="0"
                max="100"
                value={state.speed * 100}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    speed: Number(e.target.value) / 100,
                  }))
                }
              />
            </label>
            <label className="hvac-cooling">
              <input
                disabled={status === "fallback"}
                type="checkbox"
                checked={state.cooling}
                onChange={(e) =>
                  setState((s) => ({ ...s, cooling: e.target.checked }))
                }
              />{" "}
              Circuito A/C ligado
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
        <aside
          className="suspension-parts"
          aria-label="Componentes do ar-condicionado"
        >
          <h3>Peça por peça</h3>
          <p>
            Numeração baseada na referência; aquecedor opcional identificado
            como item 13.
          </p>
          <ol>
            {hvacParts.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  aria-pressed={state.selected === p.id}
                  onClick={() => setState((s) => ({ ...s, selected: p.id }))}
                >
                  <span className="suspension-number">{p.id}</span>
                  {p.name}
                </button>
              </li>
            ))}
          </ol>
        </aside>
      </div>
      <div className="hvac-cycle">
        <h3>Como o ciclo se conecta</h3>
        <ol>
          {[
            { id: 1, name: "Compressão" },
            { id: 2, name: "Condensação" },
            { id: 4, name: "Filtragem e secagem" },
            { id: 5, name: "Expansão" },
            { id: 6, name: "Evaporação" },
            { id: 7, name: "Ventilação da cabine" },
          ].map((step) => (
            <li key={step.id}>
              <button
                type="button"
                aria-pressed={state.selected === step.id}
                onClick={() => setState((s) => ({ ...s, selected: step.id }))}
              >
                {step.name} →
              </button>
            </li>
          ))}
        </ol>
        <p>
          O refrigerante circula em circuito fechado. O ar da cabine passa pelos
          trocadores e segue aos difusores; os dois fluxos não se misturam.
        </p>
      </div>
      <p className="suspension-note">
        Modelo didático genérico inspirado na imagem enviada, com caixa aberta
        para estudo. Cores, velocidades e separação são ilustrativas. A posição
        das peças e a arquitetura variam por veículo; este modelo usa válvula de
        expansão e filtro secador na linha de alta pressão.
      </p>
    </section>
  );
}
