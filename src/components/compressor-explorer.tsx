"use client";
import { useEffect, useRef, useState } from "react";
import {
  compressorParts,
  initialCompressorState,
} from "@/lib/compressor-parts";
import type { CompressorRenderer } from "@/lib/compressor-renderer";
export function CompressorExplorer() {
  const [state, setState] = useState(initialCompressorState),
    [paused, setPaused] = useState(false),
    [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const host = useRef<HTMLDivElement>(null),
    controller = useRef<CompressorRenderer | null>(null),
    latest = useRef({ state, paused });
  useEffect(() => {
    latest.current = { state, paused };
  }, [state, paused]);
  useEffect(() => {
    let cancelled = false;
    import("@/lib/compressor-renderer")
      .then(({ createCompressorRenderer }) => {
        if (cancelled || !host.current) return;
        try {
          controller.current = createCompressorRenderer(
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
  const selected = compressorParts[state.selected - 1];
  return (
    <section
      className="suspension-explorer compressor-explorer"
      aria-labelledby="compressor-title"
    >
      <header className="suspension-heading">
        <div>
          <span className="eyebrow">
            EXPLORE / COMPRESSOR AXIAL COM EMBREAGEM
          </span>
          <h2 id="compressor-title">O movimento por trás do frio.</h2>
          <p>
            Polia, embreagem e pistões em uma vista 3D com corte e separação das
            peças.
          </p>
        </div>
        <span className="suspension-count">16 identificações</span>
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
              aria-label="Compressor axial didático em 3D. Use a lista para selecionar componentes e ler suas funções."
            />
            {status !== "ready" && (
              <div className="suspension-fallback">
                <svg
                  viewBox="0 0 700 300"
                  role="img"
                  aria-label="Esquema: polia, eixo, placa inclinada e pistões axiais"
                >
                  <g fill="#30495c" stroke="#b9cfdd" strokeWidth="3">
                    <ellipse cx="125" cy="150" rx="25" ry="80" />
                    <rect
                      x="170"
                      y="80"
                      width="330"
                      height="140"
                      rx="45"
                      fill="none"
                    />
                    <path d="M140 145H450V155H140Z" />
                    <ellipse
                      cx="285"
                      cy="150"
                      rx="20"
                      ry="60"
                      transform="rotate(-20 285 150)"
                    />
                    <rect x="340" y="105" width="100" height="30" rx="8" />
                    <rect x="340" y="165" width="100" height="30" rx="8" />
                    <path d="M285 120H340M285 180H340" />
                  </g>
                  <g fill="#d8ebfa" textAnchor="middle" fontSize="16">
                    <text x="125" y="260">
                      Polia
                    </text>
                    <text x="285" y="260">
                      Placa inclinada
                    </text>
                    <text x="420" y="260">
                      Pistões
                    </text>
                  </g>
                </svg>
                <p>
                  {status === "loading"
                    ? "Carregando compressor 3D…"
                    : "Modo esquemático: 3D indisponível. Explore a lista de peças."}
                </p>
              </div>
            )}
            <span className="suspension-stage-label">
              COMPRESSOR / MECANISMO AXIAL
            </span>
          </div>
          <p className="suspension-hint">
            {status === "ready"
              ? "Arraste para girar. Selecione uma peça ou etiqueta para ver sua função."
              : "As descrições das peças estão disponíveis pela lista."}
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
                checked={state.engaged}
                onChange={(e) =>
                  setState((s) => ({ ...s, engaged: e.target.checked }))
                }
              />{" "}
              Embreagem acoplada
            </label>
          </div>
          <div className="compressor-status" role="status">
            {paused
              ? "Animação pausada."
              : state.speed === 0
                ? "Velocidade em zero."
                : state.engaged
                  ? "Polia e eixo acoplados: pistões em movimento."
                  : "Polia livre: eixo e pistões parados."}{" "}
            {state.explosion > 0
              ? "A separação é didática; use o corte para observar o mecanismo montado."
              : ""}
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
          aria-label="Componentes do compressor"
        >
          <h3>Peça por peça</h3>
          <p>
            Selecione para destacar. Na referência, 11 e 14 indicam as mesmas
            conexões; o item 11 aqui mostra seu fluxo.
          </p>
          <ol>
            {compressorParts.map((p) => (
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
        <h3>Da rotação à compressão</h3>
        <ol>
          {[
            { id: 1, name: "Polia" },
            { id: 7, name: "Bobina" },
            { id: 3, name: "Embreagem" },
            { id: 4, name: "Eixo" },
            { id: 8, name: "Placa e pistões" },
            { id: 9, name: "Válvulas" },
            { id: 14, name: "Sucção e descarga" },
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
          Com a embreagem acoplada, o eixo gira a placa inclinada e os pistões
          alternam seus cursos. Ao desacoplar, a polia continua livre enquanto o
          mecanismo interno para neste exemplo.
        </p>
      </div>
      <p className="suspension-note">
        Modelo didático genérico inspirado na referência, sem aplicação
        específica. O corte, as folgas e as velocidades foram adaptados para
        estudo. Existem compressores sem embreagem e com outros mecanismos; este
        exemplo não representa todos os tipos. A vista explodida não é um
        procedimento de desmontagem.
      </p>
    </section>
  );
}
