"use client";
import { ModelZoomControls } from "./model-zoom-controls";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  injectionParts,
  initialInjectionState,
  type InjectionPulse,
} from "@/lib/injection-parts";
import type { InjectionRenderer } from "@/lib/injection-renderer";
import { usePartNarration } from "./use-part-narration";
import { PartNarrationControls } from "./part-narration-controls";

export function InjectionExplorer() {
  const [state, setState] = useState(initialInjectionState),
    [paused, setPaused] = useState(false),
    [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading"),
    [pulse, setPulse] = useState<InjectionPulse>({ injector: 0, spark: 0 });
  const host = useRef<HTMLDivElement>(null),
    controller = useRef<InjectionRenderer | null>(null),
    latest = useRef({ state, paused });
  const narration = usePartNarration();
  const { speak } = narration;
  const selectPart = useCallback(
    (id: number) => {
      const part = injectionParts.find((item) => item.id === id);
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
    import("@/lib/injection-renderer")
      .then(({ createInjectionRenderer }) => {
        if (cancelled || !host.current) return;
        try {
          controller.current = createInjectionRenderer(
            host.current,
            latest.current.state,
            selectPart,
            () => setStatus("fallback"),
            setPulse,
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
  }, [selectPart]);
  useEffect(() => {
    controller.current?.setState(state);
  }, [state]);
  useEffect(() => {
    controller.current?.setPaused(paused);
  }, [paused]);
  const selected = injectionParts[state.selected - 1];
  return (
    <section
      className="suspension-explorer injection-explorer"
      aria-labelledby="injection-title"
      data-renderer={status}
    >
      <header className="suspension-heading">
        <div>
          <span className="eyebrow">EXPLORE / INJEÇÃO MULTIPONTO (MPI)</span>
          <h2 id="injection-title">Ar, combustível e centelha.</h2>
          <p>
            Quatro injetores nos dutos de admissão, sensores e ECU em um
            conjunto interativo com pulsos em câmera lenta.
          </p>
        </div>
        <span className="suspension-count">16 itens + 3 de contexto</span>
      </header>
      <div className="suspension-subsystems" aria-label="Explorar conjuntos">
        {[
          { id: 1, name: "Bomba e filtro" },
          { id: 5, name: "Flauta e injetores" },
          { id: 7, name: "Borboleta e ar" },
          { id: 11, name: "Sensores e ECU" },
          { id: 14, name: "Bobinas e velas" },
          { id: 16, name: "Cânister e purga" },
        ].map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={state.selected === p.id}
            onClick={() => selectPart(p.id)}
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
            <ModelZoomControls
              disabled={status !== "ready"}
              onZoom={(factor) => controller.current?.zoomView(factor)}
            />
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
              aria-pressed={state.running}
              onClick={() => setState((s) => ({ ...s, running: !s.running }))}
            >
              {state.running ? "Desligar demonstração" : "Iniciar demonstração"}
            </button>
          </div>
          <PartNarrationControls
            narration={narration}
            part={selected}
            className="injection-narration"
          />
          <div className="suspension-stage">
            <div
              ref={host}
              className="suspension-canvas"
              role="img"
              aria-label="Modelo MPI didático em 3D. Selecione componentes pela lista para conhecer suas funções."
            />
            {status !== "ready" && (
              <div className="suspension-fallback">
                <svg
                  viewBox="0 0 700 340"
                  role="img"
                  aria-label="Esquema MPI: bomba e filtro abastecem flauta; quatro injetores atuam nos dutos de admissão"
                >
                  <g fill="none" strokeWidth="6">
                    <path d="M70 200V70H460" stroke="#e9b83e" />
                    <path d="M600 170H160" stroke="#4da8e3" />
                    <path d="M520 90H580V250H400" stroke="#e46d51" />
                  </g>
                  <g fill="#284659" stroke="#bed5e3" strokeWidth="3">
                    <rect x="50" y="180" width="40" height="70" rx="15" />
                    <rect x="120" y="50" width="65" height="35" rx="12" />
                    <rect x="220" y="55" width="240" height="30" rx="12" />
                    {[250, 310, 370, 430].map((x) => (
                      <g key={x}>
                        <rect x={x} y="90" width="18" height="45" rx="5" />
                        <path d={`M${x + 9} 140V200`} />
                        <rect
                          x={x - 8}
                          y="210"
                          width="45"
                          height="55"
                          rx="12"
                        />
                      </g>
                    ))}
                    <rect x="490" y="55" width="55" height="65" rx="7" />
                  </g>
                  <g fill="#d8ebfa" textAnchor="middle" fontSize="15">
                    <text x="330" y="305">
                      Bomba → filtro → flauta → injetores no coletor
                    </text>
                    <text x="520" y="40">
                      ECU
                    </text>
                  </g>
                </svg>
                <p>
                  {status === "loading"
                    ? "Carregando injeção multiponto 3D…"
                    : "Modo esquemático: 3D indisponível. Explore as funções pela lista."}
                </p>
              </div>
            )}
            <span className="suspension-stage-label">
              MPI / INJEÇÃO NOS DUTOS DE ADMISSÃO
            </span>
          </div>
          <p className="suspension-hint">
            Arraste para girar a câmera. Selecione uma peça ou etiqueta. A
            numeração dos cilindros vai de 1 a 4 no modelo.
          </p>
          <div className="hvac-legend" aria-label="Legenda dos caminhos">
            <span style={{ "--flow": "#e9b83e" } as React.CSSProperties}>
              Amarelo · combustível líquido
            </span>
            <span style={{ "--flow": "#4da8e3" } as React.CSSProperties}>
              Azul · ar admitido
            </span>
            <span style={{ "--flow": "#e46d51" } as React.CSSProperties}>
              Vermelho · sinais elétricos
            </span>
            <span style={{ "--flow": "#55b788" } as React.CSSProperties}>
              Verde · vapores EVAP
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
              Abertura didática da borboleta{" "}
              <output>{Math.round(state.throttle * 100)}%</output>
              <input
                disabled={status === "fallback"}
                type="range"
                min="0"
                max="100"
                value={state.throttle * 100}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    throttle: Number(e.target.value) / 100,
                  }))
                }
              />
            </label>
          </div>
          <div className="injection-pulse-panel">
            <span className="eyebrow">PULSOS E IGNIÇÃO · CÂMERA LENTA</span>
            <div className="injection-cylinders">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  data-injecting={status === "ready" && pulse.injector === n}
                  data-spark={status === "ready" && pulse.spark === n}
                >
                  <strong>Cilindro {n}</strong>
                  <span>
                    {status === "ready" && pulse.injector === n
                      ? "Injetor ativo"
                      : "Injetor aguardando"}
                  </span>
                  <span>
                    {status === "ready" && pulse.spark === n
                      ? "✦ Centelha"
                      : "Vela aguardando"}
                  </span>
                </div>
              ))}
            </div>
            <p role="status">
              {status !== "ready"
                ? "Use a lista para conhecer o funcionamento."
                : !state.running
                  ? "Demonstração desligada."
                  : paused
                    ? "Animação pausada."
                    : `Injetor ${pulse.injector || "—"} · centelha ${pulse.spark || "—"} · ordem de ignição 1–3–4–2.`}
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
          aria-label="Componentes da injeção MPI"
        >
          <h3>Peça por peça</h3>
          <p>
            Itens 1–16 da referência. Coletor, motor e sensor CKP são contexto
            nos itens 17–19.
          </p>
          <ol>
            {injectionParts.map((p) => (
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
        <h3>Da admissão ao controle da mistura</h3>
        <ol>
          {[
            { id: 6, name: "Medição do ar" },
            { id: 11, name: "Cálculo pela ECU" },
            { id: 5, name: "Injeção no coletor" },
            { id: 14, name: "Bobina e centelha" },
            { id: 10, name: "Retorno da sonda lambda" },
          ].map((p) => (
            <li key={p.id}>
              <button
                type="button"
                aria-pressed={state.selected === p.id}
                onClick={() => selectPart(p.id)}
              >
                {p.name} →
              </button>
            </li>
          ))}
        </ol>
        <p>
          O combustível chega à flauta e é dosado pelos injetores nos dutos,
          antes das válvulas de admissão. As velas atuam dentro dos cilindros. O
          regulador de retorno está ligado à flauta; a purga liga o cânister à
          admissão em um caminho de vapores separado.
        </p>
      </div>
      <p className="suspension-note">
        Modelo genérico inspirado na imagem: MPI sequencial com borboleta
        mecânica, IAC e regulador de retorno. Não representa todas as
        arquiteturas. Pulsos, sincronismo, cores e velocidades são didáticos;
        não calcula mistura, pressão, emissões, valores de sensores ou
        calibração. Sistemas com borboleta eletrônica podem dispensar IAC. A
        vista explodida não é procedimento de intervenção.
      </p>
    </section>
  );
}
