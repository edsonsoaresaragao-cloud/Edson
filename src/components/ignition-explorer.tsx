"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ignitionParts,
  initialIgnitionState,
  ignitionStepLabels,
  type IgnitionStep,
} from "@/lib/ignition-parts";
import type { IgnitionRenderer } from "@/lib/ignition-renderer";
import { usePartNarration } from "./use-part-narration";
import { PartNarrationControls } from "./part-narration-controls";

export function IgnitionExplorer() {
  const [state, setState] = useState(initialIgnitionState),
    [paused, setPaused] = useState(false),
    [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading"),
    [step, setStep] = useState<IgnitionStep>("insert");
  const host = useRef<HTMLDivElement>(null),
    controller = useRef<IgnitionRenderer | null>(null),
    latest = useRef({ state, paused });
  const narration = usePartNarration();
  const { speak } = narration;
  const selectPart = useCallback(
    (id: number) => {
      const part = ignitionParts.find((item) => item.id === id);
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
    import("@/lib/ignition-renderer")
      .then(({ createIgnitionRenderer }) => {
        if (cancelled || !host.current) return;
        try {
          controller.current = createIgnitionRenderer(
            host.current,
            latest.current.state,
            selectPart,
            () => setStatus("fallback"),
            setStep,
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
  const selected = ignitionParts[state.selected - 1];
  return (
    <section
      className="suspension-explorer ignition-explorer"
      aria-labelledby="ignition-title"
      data-renderer={status}
    >
      <header className="suspension-heading">
        <div>
          <span className="eyebrow">
            EXPLORE / CHAVE, IMOBILIZADOR E PARTIDA
          </span>
          <h2 id="ignition-title">Da chave à autorização do motor.</h2>
          <p>
            Transponder, antena, BCM, ECU e motor de partida em uma sequência
            didática com peças identificadas.
          </p>
        </div>
        <span className="suspension-count">9 itens + 2 de contexto</span>
      </header>
      <div className="suspension-subsystems" aria-label="Explorar conjuntos">
        {[
          { id: 1, name: "Chave e transponder" },
          { id: 3, name: "Cilindro e antena" },
          { id: 5, name: "BCM e ECU" },
          { id: 7, name: "Relé e partida" },
          { id: 9, name: "Bobinas e injetores" },
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
              onClick={() => controller.current?.restart()}
            >
              Recomeçar sequência
            </button>
            <button
              type="button"
              disabled={status !== "ready"}
              onClick={() => {
                setPaused(true);
                controller.current?.setPaused(true);
                controller.current?.advance();
              }}
            >
              Avançar etapa
            </button>
            <button
              type="button"
              disabled={status !== "ready"}
              onClick={() => controller.current?.resetView()}
            >
              Restaurar câmera
            </button>
            <Link className="compressor-entry" href="/categorias/ignicao/atual">
              Explorar ignição atual ↗
            </Link>
          </div>
          <PartNarrationControls
            narration={narration}
            part={selected}
            className="ignition-narration"
          />
          <div className="suspension-stage">
            <div
              ref={host}
              className="suspension-canvas"
              role="img"
              aria-label="Conjunto de chave e imobilizador em 3D. Use a lista para selecionar peças e ler suas funções."
            />
            {status !== "ready" && (
              <div className="suspension-fallback">
                <svg
                  viewBox="0 0 700 340"
                  role="img"
                  aria-label="Esquema: chave e transponder são lidos pela antena; BCM envia estado à ECU; partida depende da autorização"
                >
                  <g fill="none" stroke="#73bddf" strokeWidth="5">
                    <path d="M120 100H270V190H420M420 190H570V260" />
                  </g>
                  <g fill="#284557" stroke="#c5d9e5" strokeWidth="3">
                    <rect x="70" y="75" width="70" height="45" rx="15" />
                    <path d="M140 92H220V105H140Z" />
                    <circle cx="270" cy="100" r="30" />
                    <rect x="225" y="165" width="80" height="70" rx="10" />
                    <rect x="380" y="165" width="80" height="70" rx="10" />
                    <rect x="520" y="245" width="95" height="50" rx="24" />
                  </g>
                  <g fill="#d8ebfa" fontSize="15" textAnchor="middle">
                    <text x="100" y="150">
                      Chave
                    </text>
                    <text x="265" y="260">
                      BCM
                    </text>
                    <text x="420" y="260">
                      ECU
                    </text>
                    <text x="565" y="325">
                      Partida
                    </text>
                  </g>
                </svg>
                <p>
                  {status === "loading"
                    ? "Carregando chave e partida 3D…"
                    : "Modo esquemático: 3D indisponível. Explore as funções pela lista."}
                </p>
              </div>
            )}
            <span className="suspension-stage-label">
              CHAVE CODIFICADA / EXEMPLO DE AUTORIZAÇÃO
            </span>
          </div>
          <p className="suspension-hint">
            Arraste para girar a câmera. Selecione uma peça ou etiqueta. A
            sequência se repete em câmera lenta.
          </p>
          <div className="hvac-legend" aria-label="Legenda de caminhos">
            <span style={{ "--flow": "#de5a4b" } as React.CSSProperties}>
              Vermelho · alimentação e comando de partida
            </span>
            <span style={{ "--flow": "#69c69a" } as React.CSSProperties}>
              Verde · leitura, autorização e comandos
            </span>
            <span style={{ "--flow": "#65c6ef" } as React.CSSProperties}>
              Anéis azuis · campo de leitura ilustrativo
            </span>
          </div>
          <div
            className="suspension-toolbar"
            aria-label="Cenário de reconhecimento"
          >
            <button
              type="button"
              disabled={status === "fallback"}
              aria-pressed={state.recognized}
              onClick={() => setState((s) => ({ ...s, recognized: true }))}
            >
              Chave reconhecida
            </button>
            <button
              type="button"
              disabled={status === "fallback"}
              aria-pressed={!state.recognized}
              onClick={() => setState((s) => ({ ...s, recognized: false }))}
            >
              Chave não reconhecida
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
          </div>
          <div
            className="ignition-status-panel"
            data-blocked={status === "ready" && step === "blocked"}
            aria-live="polite"
          >
            <span className="eyebrow">TENTATIVA DIDÁTICA DE PARTIDA</span>
            <h3>
              {status === "ready"
                ? ignitionStepLabels[step]
                : "Sequência de reconhecimento e autorização"}
            </h3>
            <p>
              {status !== "ready"
                ? "Veja as funções dos componentes pela lista."
                : step === "blocked"
                  ? "Neste cenário, o BCM não autoriza a tentativa: partida e comandos de injeção/ignição permanecem inativos."
                  : step === "run"
                    ? "Motor em funcionamento no exemplo; motor de partida desacoplado."
                    : step === "crank"
                      ? "Autorização recebida: partida acionada e comandos de motor disponíveis."
                      : step === "authorize"
                        ? "Chave reconhecida: autorização ilustrativa transmitida à ECU."
                        : "Acompanhe a leitura e a comunicação entre os conjuntos."}
              {paused ? " Animação pausada." : ""}
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
          aria-label="Componentes da chave e partida"
        >
          <h3>Peça por peça</h3>
          <p>
            Itens 1–9 da referência. Bateria e motor com volante são contexto
            nos itens 10–11.
          </p>
          <ol>
            {ignitionParts.map((p) => (
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
        <h3>Como os conjuntos se comunicam</h3>
        <ol>
          {[
            { id: 1, name: "Inserção e giro" },
            { id: 4, name: "Leitura do transponder" },
            { id: 5, name: "Verificação pelo BCM" },
            { id: 6, name: "Autorização à ECU" },
            { id: 8, name: "Acionamento da partida" },
            { id: 9, name: "Comandos de motor" },
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
          Trocar o cenário inicia uma nova tentativa didática. A comparação não
          representa retirada de autorização com o veículo em movimento. Em
          alguns veículos, uma chave não reconhecida pode permitir o giro do
          motor de partida e impedir o funcionamento por outros comandos.
        </p>
      </div>
      <p className="suspension-note">
        Modelo genérico inspirado na imagem. Sinais, sequência e divisões de
        função são ilustrativos, sem códigos, programação ou procedimentos de
        imobilizador. Não reproduz uma arquitetura de fabricante, protocolo de
        comunicação ou diagnóstico real. A vista explodida não é procedimento de
        desmontagem.
      </p>
    </section>
  );
}
