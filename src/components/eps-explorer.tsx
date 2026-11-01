"use client";
import { useEffect, useRef, useState } from "react";
import { epsParts, initialEpsState } from "@/lib/eps-parts";
import type { EpsRenderer } from "@/lib/eps-renderer";
export function EpsExplorer() {
  const [state, setState] = useState(initialEpsState),
    [paused, setPaused] = useState(false),
    [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const host = useRef<HTMLDivElement>(null),
    controller = useRef<EpsRenderer | null>(null),
    latest = useRef({ state, paused });
  useEffect(() => {
    latest.current = { state, paused };
  }, [state, paused]);
  useEffect(() => {
    let cancelled = false;
    import("@/lib/eps-renderer")
      .then(({ createEpsRenderer }) => {
        if (cancelled || !host.current) return;
        try {
          controller.current = createEpsRenderer(
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
  const selected = epsParts[state.selected - 1];
  return (
    <section
      className="suspension-explorer eps-explorer"
      aria-labelledby="eps-title"
    >
      <header className="suspension-heading">
        <div>
          <span className="eyebrow">EXPLORE / DIREÇÃO ELÉTRICA (EPS)</span>
          <h2 id="eps-title">Assistência elétrica, por dentro.</h2>
          <p>
            Gire o volante e acompanhe o sensor, a ECU e o motor elétrico no
            módulo dianteiro.
          </p>
        </div>
        <span className="suspension-count">17 itens + 2 de contexto</span>
      </header>
      <div className="suspension-subsystems" aria-label="Explorar conjuntos">
        {[
          { id: 1, name: "Volante e coluna" },
          { id: 4, name: "Sensor de torque" },
          { id: 5, name: "ECU" },
          { id: 6, name: "Motor em corte" },
          { id: 7, name: "Caixa em corte" },
          { id: 10, name: "Barras e terminais" },
          { id: 15, name: "Suspensão e freios" },
        ].map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={state.selected === p.id}
            onClick={() =>
              setState((s) => ({
                ...s,
                selected: p.id,
                cutaway: p.id === 6 ? true : s.cutaway,
              }))
            }
          >
            {p.name}
          </button>
        ))}
      </div>
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
              aria-pressed={state.cutaway && state.explosion === 0}
              onClick={() =>
                setState((s) => ({ ...s, explosion: 0, cutaway: true }))
              }
            >
              Corte do motor EPS
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
            <button
              type="button"
              disabled={status === "fallback"}
              onClick={() =>
                setState((s) => ({ ...s, steering: 0, automatic: false }))
              }
            >
              Centralizar direção
            </button>
          </div>
          <div className="suspension-stage">
            <div
              ref={host}
              className="suspension-canvas"
              role="img"
              aria-label="Módulo dianteiro com direção elétrica EPS em 3D. A lista permite selecionar componentes e ler suas funções."
            />
            {status !== "ready" && (
              <div className="suspension-fallback">
                <svg
                  viewBox="0 0 700 340"
                  role="img"
                  aria-label="Esquema: volante e coluna comandam a cremalheira; sensor e ECU comandam assistência elétrica"
                >
                  <g fill="none" stroke="#b4d0df" strokeWidth="8">
                    <circle cx="300" cy="65" r="40" />
                    <path d="M300 105V240M130 240H550M120 200V280M560 200V280" />
                  </g>
                  <g fill="#284356" stroke="#b4d0df" strokeWidth="3">
                    <rect x="210" y="220" width="200" height="40" rx="20" />
                    <circle cx="490" cy="135" r="25" />
                    <rect x="535" y="65" width="40" height="50" rx="10" />
                  </g>
                  <path
                    d="M490 160Q470 210 400 230M400 245Q600 230 555 115M535 100L510 120"
                    fill="none"
                    stroke="#64b8e3"
                    strokeWidth="5"
                  />
                  <g fill="#d8ebfa" fontSize="15" textAnchor="middle">
                    <text x="300" y="325">
                      Volante → sensor → ECU → motor → caixa EPS
                    </text>
                  </g>
                </svg>
                <p>
                  {status === "loading"
                    ? "Carregando direção elétrica 3D…"
                    : "Modo esquemático: 3D indisponível. Explore as descrições pela lista."}
                </p>
              </div>
            )}
            <span className="suspension-stage-label">
              DIREÇÃO ELÉTRICA / MOTOR EM CORTE
            </span>
          </div>
          <p className="suspension-hint">
            {status === "ready"
              ? "Arraste para girar a câmera. Desative o movimento automático ou use o controle do volante para esterçar manualmente."
              : "As descrições de todos os componentes estão disponíveis na lista."}
          </p>
          <div className="hvac-legend" aria-label="Sinais ilustrativos">
            <span style={{ "--flow": "#65bbf3" } as React.CSSProperties}>
              Partículas · sensor → ECU → motor
            </span>
            <span style={{ "--flow": "#b97b39" } as React.CSSProperties}>
              Cobre · enrolamentos fixos do motor
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
              Volante manual{" "}
              <output>
                {state.automatic ? "Automático" : `${state.steering}°`}
              </output>
              <input
                disabled={status === "fallback"}
                type="range"
                min="-360"
                max="360"
                step="5"
                value={state.steering}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    steering: Number(e.target.value),
                    automatic: false,
                  }))
                }
              />
            </label>
            <label className="hvac-cooling">
              <input
                type="checkbox"
                disabled={status === "fallback"}
                checked={state.automatic}
                onChange={(e) =>
                  setState((s) => ({ ...s, automatic: e.target.checked }))
                }
              />{" "}
              Movimento automático
            </label>
            <label className="hvac-cooling">
              <input
                type="checkbox"
                disabled={status === "fallback"}
                checked={state.assist}
                onChange={(e) =>
                  setState((s) => ({ ...s, assist: e.target.checked }))
                }
              />{" "}
              Assistência elétrica (demonstração)
            </label>
          </div>
          <div className="compressor-status" role="status">
            {paused
              ? "Animação pausada."
              : state.assist
                ? "Indicação de assistência elétrica habilitada."
                : "Assistência desativada no exemplo; o vínculo mecânico do volante com as rodas permanece."}{" "}
            O modelo usa a mudança do comando para ilustrar demanda; não calcula
            torque nem corrente reais.
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
          aria-label="Componentes da direção elétrica"
        >
          <h3>Peça por peça</h3>
          <p>
            Itens 1–17 da referência. Cubos e estabilizadora aparecem como
            contexto nos itens 18–19.
          </p>
          <ol>
            {epsParts.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  aria-pressed={state.selected === p.id}
                  onClick={() =>
                    setState((s) => ({
                      ...s,
                      selected: p.id,
                      cutaway: p.id === 6 ? true : s.cutaway,
                    }))
                  }
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
        <h3>Comando mecânico e assistência</h3>
        <ol>
          {[
            { id: 1, name: "Volante" },
            { id: 2, name: "Coluna" },
            { id: 8, name: "Pinhão" },
            { id: 7, name: "Cremalheira" },
            { id: 9, name: "Barras" },
            { id: 10, name: "Terminais" },
          ].map((p) => (
            <li key={p.id}>
              <button
                type="button"
                aria-pressed={state.selected === p.id}
                onClick={() =>
                  setState((s) => ({
                    ...s,
                    selected: p.id,
                    cutaway: p.id === 6 ? true : s.cutaway,
                  }))
                }
              >
                {p.name} →
              </button>
            </li>
          ))}
        </ol>
        <p>
          O sensor detecta esforço e sentido; a ECU processa a informação e
          comanda o motor elétrico. O rotor do motor move uma redução que
          auxilia a caixa. Na arquitetura EPS representada não há bomba,
          reservatório ou circuito hidráulico.
        </p>
      </div>
      <p className="suspension-note">
        Modelo didático genérico de EPS com motor junto à caixa, inspirado na
        imagem. Corte, separação e proporções adaptados para estudo. Demanda,
        sinais e assistência são ilustrativos: não há cálculo de torque,
        corrente ou estratégia de um fabricante. Esterçamento simplificado, sem
        Ackermann; outras arquiteturas EPS podem atuar na coluna ou em outro
        ponto.
      </p>
    </section>
  );
}
