"use client";
import { useEffect, useRef, useState } from "react";
import {
  alternatorParts,
  initialAlternatorState,
} from "@/lib/alternator-parts";
import type { AlternatorRenderer } from "@/lib/alternator-renderer";
export function AlternatorExplorer() {
  const [state, setState] = useState(initialAlternatorState),
    [paused, setPaused] = useState(false),
    [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const host = useRef<HTMLDivElement>(null),
    controller = useRef<AlternatorRenderer | null>(null),
    latest = useRef({ state, paused });
  useEffect(() => {
    latest.current = { state, paused };
  }, [state, paused]);
  useEffect(() => {
    let cancelled = false;
    import("@/lib/alternator-renderer")
      .then(({ createAlternatorRenderer }) => {
        if (cancelled || !host.current) return;
        try {
          controller.current = createAlternatorRenderer(
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
  const selected = alternatorParts[state.selected - 1];
  return (
    <section
      className="suspension-explorer alternator-explorer"
      aria-labelledby="alternator-title"
    >
      <header className="suspension-heading">
        <div>
          <span className="eyebrow">EXPLORE / GERAÇÃO ELÉTRICA AUTOMOTIVA</span>
          <h2 id="alternator-title">Da rotação à energia.</h2>
          <p>
            Carcaças ventiladas, rotor em garra e enrolamentos de cobre em um
            conjunto 3D interativo.
          </p>
        </div>
        <span className="suspension-count">16 componentes</span>
      </header>
      <div className="suspension-layout">
        <div>
          <div className="suspension-toolbar">
            <button
              type="button"
              disabled={status === "fallback"}
              aria-pressed={state.explosion === 0 && !state.cutaway}
              onClick={() =>
                setState((s) => ({ ...s, explosion: 0, cutaway: false }))
              }
            >
              Montado
            </button>
            <button
              type="button"
              disabled={status === "fallback"}
              aria-pressed={state.explosion === 0 && state.cutaway}
              onClick={() =>
                setState((s) => ({ ...s, explosion: 0, cutaway: true }))
              }
            >
              Corte em funcionamento
            </button>
            <button
              type="button"
              disabled={status === "fallback"}
              aria-pressed={state.explosion === 1}
              onClick={() =>
                setState((s) => ({ ...s, explosion: 1, cutaway: true }))
              }
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
              aria-label="Alternador automotivo didático em 3D. Selecione os componentes pela lista para ler as funções."
            />
            {status !== "ready" && (
              <div className="suspension-fallback">
                <svg
                  viewBox="0 0 700 300"
                  role="img"
                  aria-label="Esquema do alternador: polia, rotor, estator e retificador"
                >
                  <g stroke="#b7d0de" strokeWidth="4" fill="#254056">
                    <ellipse cx="120" cy="150" rx="20" ry="55" />
                    <path d="M140 145H480V155H140Z" />
                    <rect
                      x="210"
                      y="75"
                      width="230"
                      height="150"
                      rx="40"
                      fill="none"
                    />
                    <rect x="260" y="115" width="120" height="70" rx="25" />
                    <rect x="475" y="90" width="50" height="120" rx="12" />
                  </g>
                  <g stroke="#c5803d" fill="none" strokeWidth="6">
                    <path d="M240 100H410M240 200H410M240 85H410M240 215H410" />
                  </g>
                  <g fill="#d8ebfa" textAnchor="middle" fontSize="15">
                    <text x="120" y="260">
                      Polia
                    </text>
                    <text x="320" y="260">
                      Rotor e estator
                    </text>
                    <text x="500" y="260">
                      Retificador
                    </text>
                  </g>
                </svg>
                <p>
                  {status === "loading"
                    ? "Carregando alternador 3D…"
                    : "Modo esquemático: 3D indisponível. Explore as descrições pela lista."}
                </p>
              </div>
            )}
            <span className="suspension-stage-label">
              ALTERNADOR / POLOS EM GARRA
            </span>
          </div>
          <p className="suspension-hint">
            {status === "ready"
              ? "Arraste para girar. Selecione uma peça ou etiqueta para conhecer sua função."
              : "As funções dos componentes estão disponíveis pela lista."}
          </p>
          <div className="hvac-legend" aria-label="Legenda didática">
            <span style={{ "--flow": "#70c6ff" } as React.CSSProperties}>
              Azul, violeta e verde · fases CA do estator
            </span>
            <span style={{ "--flow": "#ffc257" } as React.CSSProperties}>
              Dourado · saída retificada CC
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
              Velocidade didática{" "}
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
                type="checkbox"
                disabled={status === "fallback"}
                checked={state.excited}
                onChange={(e) =>
                  setState((s) => ({ ...s, excited: e.target.checked }))
                }
              />{" "}
              Campo de excitação
            </label>
          </div>
          <div className="compressor-status" role="status">
            {paused
              ? "Animação pausada."
              : state.speed === 0
                ? "Rotação parada neste exemplo."
                : state.excited
                  ? "Excitação habilitada: partículas representam geração e retificação."
                  : "Rotor continua girando; indicação de geração desativada."}{" "}
            {state.explosion > 0 ? "Peças separadas apenas para estudo." : ""}
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
          aria-label="Componentes do alternador"
        >
          <h3>Peça por peça</h3>
          <p>Numeração da referência. Selecione para destacar.</p>
          <ol>
            {alternatorParts.map((p) => (
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
        <h3>Como a energia chega ao veículo</h3>
        <ol>
          {[
            { id: 1, name: "Correia → polia" },
            { id: 5, name: "Rotor → campo magnético" },
            { id: 6, name: "Estator → fases CA" },
            { id: 9, name: "Retificador → CC" },
            { id: 7, name: "Regulador → excitação" },
            { id: 12, name: "Terminais → veículo" },
          ].map((p) => (
            <li key={p.id}>
              <button
                type="button"
                aria-pressed={state.selected === p.id}
                onClick={() => setState((s) => ({ ...s, selected: p.id }))}
              >
                {p.name}
              </button>
            </li>
          ))}
        </ol>
        <p>
          O rotor gira; o estator permanece fixo. A ponte retificadora converte
          a corrente alternada em contínua e o regulador atua sobre a excitação.
          As partículas são uma indicação visual, não uma simulação de corrente
          ou tensão.
        </p>
      </div>
      <p className="suspension-note">
        Modelo didático genérico inspirado na referência. Corte, separação e
        velocidades adaptados para estudo, sem aplicação específica. A vista
        explodida não define procedimentos ou torques. Sistemas de carga
        inteligente e diferentes tipos de polia podem funcionar de outra forma.
      </p>
    </section>
  );
}
