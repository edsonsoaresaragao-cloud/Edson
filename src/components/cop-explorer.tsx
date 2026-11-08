"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { copParts, initialCopState, type CopEvent } from "@/lib/cop-parts";
import type { CopRenderer } from "@/lib/cop-renderer";
import { usePartNarration } from "./use-part-narration";
import { PartNarrationControls } from "./part-narration-controls";

export function CopExplorer() {
  const [state, setState] = useState(initialCopState),
    [paused, setPaused] = useState(false),
    [ready, setReady] = useState(false),
    [failed, setFailed] = useState(false),
    [event, setEvent] = useState<CopEvent>({ cylinder: 0, phase: "wait" });
  const host = useRef<HTMLDivElement>(null),
    controller = useRef<CopRenderer | null>(null),
    latest = useRef({ state, paused });
  const narration = usePartNarration();
  const { speak } = narration;
  const selectPart = useCallback(
    (id: number) => {
      const part = copParts.find((item) => item.id === id);
      if (!part) return;
      setState((current) => ({ ...current, selected: id }));
      speak(part);
    },
    [speak],
  );
  useEffect(() => {
    latest.current = { state, paused };
  }, [state, paused]);
  useEffect(() => {
    let cancelled = false;
    import("@/lib/cop-renderer")
      .then(({ createCopRenderer }) => {
        if (cancelled || !host.current) return;
        try {
          controller.current = createCopRenderer(
            host.current,
            latest.current.state,
            selectPart,
            () => {
              setFailed(true);
              setReady(false);
            },
            setEvent,
          );
          controller.current.setPaused(latest.current.paused);
          setReady(true);
        } catch {
          setFailed(true);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      controller.current?.dispose();
      controller.current = null;
    };
  }, [selectPart]);
  useEffect(() => {
    controller.current?.setState(state);
  }, [state]);
  useEffect(() => {
    controller.current?.setPaused(paused);
  }, [paused]);
  const selected = copParts[state.selected - 1];
  return (
    <section
      className="suspension-explorer cop-explorer"
      aria-labelledby="cop-title"
      data-renderer={failed ? "fallback" : ready ? "ready" : "loading"}
    >
      <header className="suspension-heading">
        <div>
          <span className="eyebrow">
            EXPLORE / IGNIÇÃO ELETRÔNICA · COIL ON PLUG
          </span>
          <h2 id="cop-title">Da carga da bobina à centelha.</h2>
          <p>
            Quatro bobinas individuais e uma cópia ampliada em corte para
            explorar driver, núcleo, enrolamentos e isolador.
          </p>
        </div>
      </header>
      <div className="suspension-layout">
        <div>
          <div className="suspension-toolbar">
            <button
              type="button"
              disabled={failed}
              aria-pressed={!state.cutaway && state.explosion === 0}
              onClick={() =>
                setState((s) => ({ ...s, explosion: 0, cutaway: false }))
              }
            >
              Montado
            </button>
            <button
              type="button"
              disabled={failed}
              aria-pressed={state.cutaway && state.explosion === 0}
              onClick={() =>
                setState((s) => ({ ...s, explosion: 0, cutaway: true }))
              }
            >
              Bobina em corte
            </button>
            <button
              type="button"
              disabled={failed}
              aria-pressed={state.explosion === 1}
              onClick={() =>
                setState((s) => ({ ...s, explosion: 1, cutaway: true }))
              }
            >
              Vista explodida
            </button>
            <button
              type="button"
              disabled={failed}
              aria-pressed={paused}
              onClick={() => setPaused((p) => !p)}
            >
              {paused ? "▶ Reproduzir" : "Ⅱ Pausar"}
            </button>
            <button
              type="button"
              disabled={!ready}
              onClick={() => controller.current?.resetView()}
            >
              Restaurar câmera
            </button>
            <button
              type="button"
              disabled={failed}
              aria-pressed={state.running}
              onClick={() => setState((s) => ({ ...s, running: !s.running }))}
            >
              {state.running ? "Desligar demonstração" : "Iniciar demonstração"}
            </button>
          </div>
          <PartNarrationControls
            narration={narration}
            part={selected}
            className="cop-narration"
          />
          <div className="suspension-stage">
            <div
              ref={host}
              className="suspension-canvas"
              role="img"
              aria-label="Ignição COP em 3D; selecione os componentes pela lista."
            />
            {!ready && (
              <div className="suspension-fallback">
                <svg
                  viewBox="0 0 650 300"
                  role="img"
                  aria-label="Esquema: sensores para ECU, quatro bobinas sobre as velas"
                >
                  <g fill="#29475c" stroke="#b9d4e3" strokeWidth="3">
                    <rect x="40" y="95" width="90" height="100" rx="12" />
                    {[220, 320, 420, 520].map((x) => (
                      <g key={x}>
                        <path
                          d={`M130 140H${x}V95`}
                          fill="none"
                          stroke="#64b7e8"
                        />
                        <rect
                          x={x - 20}
                          y="100"
                          width="40"
                          height="45"
                          rx="10"
                        />
                        <rect x={x - 8} y="145" width="16" height="65" rx="5" />
                        <path d={`M${x} 215V245`} stroke="#ffc567" />
                      </g>
                    ))}
                  </g>
                  <text x="85" y="150" fill="#e2f1fc" textAnchor="middle">
                    ECU
                  </text>
                </svg>
                <p>
                  {failed
                    ? "Modo esquemático: 3D indisponível. Explore as descrições pela lista."
                    : "Carregando ignição atual 3D…"}
                </p>
              </div>
            )}
            <span className="suspension-stage-label">
              ACIMA: BOBINA AMPLIADA / ABAIXO: QUATRO CILINDROS
            </span>
          </div>
          <p className="suspension-hint">
            Arraste para girar. Selecione as peças ou seus nomes para ler as
            funções.
          </p>
          <div className="hvac-legend">
            <span style={{ "--flow": "#d65749" } as React.CSSProperties}>
              Vermelho · alimentação
            </span>
            <span style={{ "--flow": "#285d45" } as React.CSSProperties}>
              Verde · sensores → ECU
            </span>
            <span style={{ "--flow": "#59afe1" } as React.CSSProperties}>
              Azul · comando das bobinas
            </span>
            <span style={{ "--flow": "#ffc567" } as React.CSSProperties}>
              Dourado · centelha
            </span>
          </div>
          <div className="suspension-controls">
            <label>
              Separação das peças{" "}
              <output>{Math.round(state.explosion * 100)}%</output>
              <input
                type="range"
                disabled={failed}
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
          </div>
          <div className="injection-pulse-panel" aria-live="polite">
            <span className="eyebrow">CARGA E CENTELHA · CÂMERA LENTA</span>
            <h3>
              {!ready
                ? "Demonstração do ciclo de ignição"
                : event.phase === "off"
                  ? "Demonstração desligada"
                  : event.phase === "spark"
                    ? `Centelha no cilindro ${event.cylinder}`
                    : event.phase === "charge"
                      ? `Carga da bobina do cilindro ${event.cylinder}`
                      : "Intervalo entre comandos"}
            </h3>
            <p>
              {paused ? "Animação pausada. " : " "}Ordem de ignição do exemplo:
              1–3–4–2. O campo magnético é carregado antes da descarga na vela.
            </p>
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
          aria-label="Componentes da ignição atual"
        >
          <h3>Peça por peça</h3>
          <p>
            Itens 1–6: sistema. Itens 7–13: interior da bobina ampliada. Item
            14: contexto do motor.
          </p>
          <ol>
            {copParts.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  aria-pressed={state.selected === p.id}
                  onClick={() => selectPart(p.id)}
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
        <h3>Como a centelha é comandada</h3>
        <p>
          Sensores informam a ECU, que define a carga e o instante da ignição. A
          corrente primária armazena energia; sua interrupção produz a elevação
          de tensão no secundário e a descarga na vela.
        </p>
      </div>
      <p className="suspension-note">
        Modelo genérico inspirado na referência. A bobina ampliada é uma cópia
        didática; materiais, espiras e proporções são ilustrativos. Não calcula
        tensão, corrente, tempo de carga real ou avanço de ignição. Outras
        arquiteturas podem usar bobinas em conjunto, drivers em outro módulo ou
        outra ordem de ignição. A vista explodida serve ao estudo dos
        componentes.
      </p>
    </section>
  );
}
