"use client";
import { useEffect, useRef, useState } from "react";
import { coolingParts, initialCoolingState } from "@/lib/cooling-parts";
import type { CoolingRenderer } from "@/lib/cooling-renderer";
export function CoolingExplorer() {
  const [state, setState] = useState(initialCoolingState),
    [paused, setPaused] = useState(false),
    [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const host = useRef<HTMLDivElement>(null),
    controller = useRef<CoolingRenderer | null>(null),
    latest = useRef({ state, paused });
  useEffect(() => {
    latest.current = { state, paused };
  }, [state, paused]);
  useEffect(() => {
    let cancelled = false;
    import("@/lib/cooling-renderer")
      .then(({ createCoolingRenderer }) => {
        if (cancelled || !host.current) return;
        try {
          controller.current = createCoolingRenderer(
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
  const selected = coolingParts[state.selected - 1];
  return (
    <section
      className="suspension-explorer cooling-explorer"
      aria-labelledby="cooling-title"
    >
      <header className="suspension-heading">
        <div>
          <span className="eyebrow">EXPLORE / CONTROLE TÉRMICO DO MOTOR</span>
          <h2 id="cooling-title">Siga o caminho do líquido.</h2>
          <p>
            Radiador, bomba, termostato e aquecedor em um circuito 3D com peças
            identificadas e circulação em movimento.
          </p>
        </div>
        <span className="suspension-count">15 peças + motor contextual</span>
      </header>
      <div className="suspension-subsystems" aria-label="Explorar detalhes">
        <span>Detalhes:</span>
        {[
          { id: 4, name: "Bomba e impulsor" },
          { id: 6, name: "Termostato e mola" },
          { id: 1, name: "Radiador" },
          { id: 10, name: "Aquecedor" },
        ].map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={state.selected === p.id}
            onClick={() =>
              setState((s) => ({
                ...s,
                selected: p.id,
                explosion: status === "fallback" ? s.explosion : 0.75,
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
              aria-label="Circuito de arrefecimento didático em 3D; selecione as peças pela lista para ler suas funções."
            />
            {status !== "ready" && (
              <div className="suspension-fallback">
                <svg
                  viewBox="0 0 700 330"
                  role="img"
                  aria-label="Esquema: motor, termostato, radiador e bomba, com retorno ao motor"
                >
                  <g fill="none" strokeWidth="9">
                    <path d="M390 170V75H130V125" stroke="#df4938" />
                    <path d="M130 220V280H390V220" stroke="#368fdc" />
                    <path d="M390 75Q570 150 390 280" stroke="#d18e51" />
                  </g>
                  <g fill="#244154" stroke="#bdd5e3" strokeWidth="3">
                    <rect x="80" y="125" width="100" height="100" rx="10" />
                    <rect x="335" y="150" width="110" height="80" rx="20" />
                    <circle cx="390" cy="75" r="20" />
                    <circle cx="390" cy="280" r="20" />
                  </g>
                  <g fill="#d8ebfa" fontSize="15" textAnchor="middle">
                    <text x="130" y="250">
                      Radiador
                    </text>
                    <text x="390" y="140">
                      Motor
                    </text>
                    <text x="460" y="50">
                      Termostato
                    </text>
                    <text x="470" y="310">
                      Bomba
                    </text>
                  </g>
                </svg>
                <p>
                  {status === "loading"
                    ? "Carregando circuito 3D…"
                    : "Modo esquemático: 3D indisponível. Explore as descrições pela lista."}
                </p>
              </div>
            )}
            <span className="suspension-stage-label">
              ARREFECIMENTO / FLUXO ILUSTRATIVO
            </span>
          </div>
          <p className="suspension-hint">
            {status === "ready"
              ? "Arraste para girar. Selecione uma peça ou etiqueta para conhecer sua função."
              : "As funções das peças estão disponíveis pela lista."}
          </p>
          <div className="hvac-legend" aria-label="Legenda do líquido">
            <span style={{ "--flow": "#df4938" } as React.CSSProperties}>
              Vermelho · líquido mais quente
            </span>
            <span style={{ "--flow": "#368fdc" } as React.CSSProperties}>
              Azul · retorno relativamente mais frio
            </span>
            <span style={{ "--flow": "#d7f6ff" } as React.CSSProperties}>
              Partículas · sentido da circulação
            </span>
          </div>
          <div
            className="suspension-toolbar cooling-presets"
            aria-label="Estados do circuito"
          >
            <button
              type="button"
              disabled={status === "fallback"}
              aria-pressed={state.opening === 0}
              onClick={() =>
                setState((s) => ({ ...s, opening: 0, fan: false }))
              }
            >
              Motor frio · termostato fechado
            </button>
            <button
              type="button"
              disabled={status === "fallback"}
              aria-pressed={state.opening === 1}
              onClick={() => setState((s) => ({ ...s, opening: 1, fan: true }))}
            >
              Motor aquecido · termostato aberto
            </button>
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
              Abertura didática do termostato{" "}
              <output>{Math.round(state.opening * 100)}%</output>
              <input
                disabled={status === "fallback"}
                type="range"
                min="0"
                max="100"
                value={state.opening * 100}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    opening: Number(e.target.value) / 100,
                  }))
                }
              />
            </label>
            <label>
              Velocidade da animação{" "}
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
                checked={state.fan}
                onChange={(e) =>
                  setState((s) => ({ ...s, fan: e.target.checked }))
                }
              />{" "}
              Ventoinha do radiador
            </label>
          </div>
          <div className="compressor-status" role="status">
            {paused
              ? "Animação pausada."
              : state.opening === 0
                ? "Termostato fechado: circuito do radiador sem indicação de fluxo; bypass e aquecedor continuam disponíveis."
                : state.opening === 1
                  ? "Termostato aberto: circuito do radiador disponível; bypass fechado neste exemplo."
                  : "Abertura parcial: fluxo dividido entre radiador e bypass neste exemplo."}
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
          aria-label="Componentes do arrefecimento"
        >
          <h3>Peça por peça</h3>
          <p>
            Itens 1–15 da referência. Motor e bypass identificados como contexto
            no item 16.
          </p>
          <ol>
            {coolingParts.map((p) => (
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
        <h3>Como os circuitos se conectam</h3>
        <ol>
          {[
            { id: 4, name: "Bomba" },
            { id: 16, name: "Motor" },
            { id: 6, name: "Termostato" },
            { id: 7, name: "Mangueira superior" },
            { id: 1, name: "Radiador" },
            { id: 8, name: "Retorno à bomba" },
          ].map((p) => (
            <li key={p.id}>
              <button
                type="button"
                aria-pressed={state.selected === p.id}
                onClick={() => setState((s) => ({ ...s, selected: p.id }))}
              >
                {p.name} →
              </button>
            </li>
          ))}
        </ol>
        <p>
          O aquecedor tem um ramal próprio entre o motor e a entrada da bomba. O
          bypass mantém circulação interna com o termostato fechado. O
          reservatório compensa volume e não é mostrado como caminho principal
          de circulação.
        </p>
      </div>
      <p className="suspension-note">
        Modelo didático genérico inspirado na imagem, com bomba em corte e
        movimento do termostato ampliado. Abertura, fluxo, temperatura e
        acionamento da ventoinha não são uma simulação física nem uma estratégia
        de um veículo específico. Pressão, fluido, temperatura de abertura e
        manutenção devem seguir as especificações do fabricante.
      </p>
    </section>
  );
}
