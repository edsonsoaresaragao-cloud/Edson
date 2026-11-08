"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  absParts,
  initialAbsState,
  absPhaseLabels,
  type AbsPhase,
} from "@/lib/abs-parts";
import type { AbsRenderer } from "@/lib/abs-renderer";
import { usePartNarration } from "./use-part-narration";
import { PartNarrationControls } from "./part-narration-controls";

export function AbsExplorer() {
  const [state, setState] = useState(initialAbsState),
    [paused, setPaused] = useState(false),
    [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading"),
    [phase, setPhase] = useState<AbsPhase>("idle");
  const host = useRef<HTMLDivElement>(null),
    controller = useRef<AbsRenderer | null>(null),
    latest = useRef({ state, paused });
  const narration = usePartNarration();
  const { speak } = narration;
  const selectPart = useCallback(
    (id: number) => {
      const part = absParts.find((item) => item.id === id);
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
    import("@/lib/abs-renderer")
      .then(({ createAbsRenderer }) => {
        if (cancelled || !host.current) return;
        try {
          controller.current = createAbsRenderer(
            host.current,
            latest.current.state,
            selectPart,
            () => setStatus("fallback"),
            setPhase,
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
  const selected = absParts[state.selected - 1];
  return (
    <section
      className="suspension-explorer abs-explorer"
      aria-labelledby="abs-title"
      data-renderer={status}
    >
      <header className="suspension-heading">
        <div>
          <span className="eyebrow">
            EXPLORE / SISTEMA ANTIBLOQUEIO DAS RODAS
          </span>
          <h2 id="abs-title">Por dentro do freio ABS.</h2>
          <p>
            Unidade hidráulica, ECU, válvulas e quatro sensores em uma
            demonstração interativa da modulação de pressão.
          </p>
        </div>
        <span className="suspension-count">8 itens + 3 de contexto</span>
      </header>
      <div className="suspension-subsystems" aria-label="Explorar detalhes">
        {[
          { id: 1, name: "Sensores nas 4 rodas" },
          { id: 2, name: "ECU e placa" },
          { id: 3, name: "Bloco hidráulico" },
          { id: 4, name: "Válvulas e molas" },
          { id: 5, name: "Motor da bomba" },
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
            <button
              type="button"
              disabled={status !== "ready"}
              onClick={() => controller.current?.resetView()}
            >
              Restaurar câmera
            </button>
          </div>
          <PartNarrationControls
            narration={narration}
            part={selected}
            className="abs-narration"
          />
          <div className="suspension-stage">
            <div
              ref={host}
              className="suspension-canvas"
              role="img"
              aria-label="Sistema ABS didático em 3D, com quatro rodas e módulo de controle. Explore as peças pela lista."
            />
            {status !== "ready" && (
              <div className="suspension-fallback">
                <svg
                  viewBox="0 0 700 350"
                  role="img"
                  aria-label="Esquema ABS: sensores das quatro rodas informam ECU; modulador liga cilindro-mestre aos freios"
                >
                  <g fill="none" stroke="#8fc9e5" strokeWidth="5">
                    <path d="M130 90L320 150L570 90M130 260L320 150L570 260" />
                  </g>
                  <g fill="#29495e" stroke="#c5d8e5" strokeWidth="3">
                    <rect x="275" y="105" width="110" height="100" rx="16" />
                    <circle cx="130" cy="90" r="35" />
                    <circle cx="570" cy="90" r="35" />
                    <circle cx="130" cy="260" r="35" />
                    <circle cx="570" cy="260" r="35" />
                    <rect x="435" y="130" width="65" height="45" rx="8" />
                  </g>
                  <g fill="#d8ebfa" fontSize="15" textAnchor="middle">
                    <text x="330" y="235">
                      ECU + modulador
                    </text>
                    <text x="470" y="120">
                      Cilindro-mestre
                    </text>
                    <text x="350" y="325">
                      4 sensores → ECU → válvulas e bomba
                    </text>
                  </g>
                </svg>
                <p>
                  {status === "loading"
                    ? "Carregando sistema ABS 3D…"
                    : "Modo esquemático: 3D indisponível. Explore as descrições pela lista."}
                </p>
              </div>
            )}
            <span className="suspension-stage-label">
              ABS / EXEMPLO DE QUATRO CANAIS
            </span>
          </div>
          <p className="suspension-hint">
            Arraste para girar a câmera. Selecione as peças ou use a lista. As
            fases destacam o canal dianteiro esquerdo neste exemplo.
          </p>
          <div className="hvac-legend" aria-label="Legenda de sinais">
            <span style={{ "--flow": "#81c6f1" } as React.CSSProperties}>
              Azul · caminhos de atuação hidráulica
            </span>
            <span style={{ "--flow": "#64d2a2" } as React.CSSProperties}>
              Verde · sinais dos sensores
            </span>
          </div>
          <div className="suspension-toolbar" aria-label="Modo de demonstração">
            <button
              type="button"
              disabled={status === "fallback"}
              aria-pressed={state.mode === "normal"}
              onClick={() => setState((s) => ({ ...s, mode: "normal" }))}
            >
              Frenagem convencional
            </button>
            <button
              type="button"
              disabled={status === "fallback"}
              aria-pressed={state.mode === "abs"}
              onClick={() => setState((s) => ({ ...s, mode: "abs" }))}
            >
              Intervenção ABS (didática)
            </button>
            <button
              type="button"
              disabled={status === "fallback"}
              onClick={() => setState((s) => ({ ...s, pedal: 0 }))}
            >
              Soltar pedal
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
              Acionamento didático do pedal{" "}
              <output>{Math.round(state.pedal * 100)}%</output>
              <input
                disabled={status === "fallback"}
                type="range"
                min="0"
                max="100"
                value={state.pedal * 100}
                onChange={(e) =>
                  setState((s) => ({
                    ...s,
                    pedal: Number(e.target.value) / 100,
                  }))
                }
              />
            </label>
          </div>
          <div className="abs-phase-panel" aria-live="polite">
            <span className="eyebrow">CANAL DIANTEIRO ESQUERDO</span>
            <h3>
              {status === "ready"
                ? absPhaseLabels[phase]
                : "Demonstração das fases do ABS"}
            </h3>
            {status === "ready" && (
              <p>
                {phase === "reduce"
                  ? "Entrada fechada · saída aberta · recirculação da bomba indicada"
                  : phase === "hold"
                    ? "Entrada fechada · saída fechada"
                    : phase === "increase" || phase === "apply"
                      ? "Entrada aberta · saída fechada"
                      : "Sem comando de frenagem neste exemplo"}
                {paused ? " · animação pausada" : ""}
              </p>
            )}
            <ol>
              {(["increase", "hold", "reduce"] as AbsPhase[]).map((p) => (
                <li key={p} data-active={phase === p && status === "ready"}>
                  {absPhaseLabels[p]}
                </li>
              ))}
            </ol>
          </div>
          <div className="suspension-detail" aria-live="polite">
            <span className="suspension-number">{selected.id}</span>
            <div>
              <h3>{selected.name}</h3>
              <p>{selected.description}</p>
            </div>
          </div>
        </div>
        <aside className="suspension-parts" aria-label="Componentes do ABS">
          <h3>Peça por peça</h3>
          <p>
            Itens 1–8 da referência. Freios, acionamento e acumuladores aparecem
            como contexto nos itens 9–11.
          </p>
          <ol>
            {absParts.map((p) => (
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
        <h3>Como o ABS intervém</h3>
        <ol>
          {[
            { id: 10, name: "Pedal" },
            { id: 7, name: "Pressão no cilindro-mestre" },
            { id: 1, name: "Leitura das rodas" },
            { id: 2, name: "Comando da ECU" },
            { id: 4, name: "Modulação nas válvulas" },
            { id: 5, name: "Recirculação" },
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
          Ao identificar tendência de bloqueio, o controle pode aumentar, manter
          ou reduzir a pressão de cada canal. O fluido liberado vai ao
          acumulador e retorna ao circuito pela bomba. Os sensores ficam fixos
          junto aos anéis girantes.
        </p>
      </div>
      <p className="suspension-note">
        Modelo genérico inspirado na imagem, com quatro canais e oito válvulas.
        Movimentos, fases, roteamento e sinais são didáticos; partículas indicam
        caminhos de atuação, não vazão contínua. Não calcula aderência,
        velocidade real, pressão ou distância de parada, nem garante desempenho
        em qualquer piso. Diagnóstico, fluido, sangria e intervenções devem
        seguir o fabricante.
      </p>
    </section>
  );
}
