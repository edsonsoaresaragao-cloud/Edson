"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  initialStarterState,
  starterParts,
  starterStages,
  starterFaults,
  starterSequence,
} from "@/lib/starter-parts";
import type { StarterRenderer } from "@/lib/starter-renderer";
import { StarterCircuit, StarterSchematic } from "./starter-diagrams";
import { usePartNarration } from "./use-part-narration";
import { PartNarrationControls } from "./part-narration-controls";

function StarterPicture({
  index,
  name,
  assembled = false,
}: {
  index: number;
  name: string;
  assembled?: boolean;
}) {
  return (
    <figure
      className={`starter-picture${assembled ? " starter-assembled-picture" : ""}`}
    >
      <div
        role="img"
        aria-label={`Ilustração didática gerada: ${name}`}
        style={{
          backgroundPosition: `${((index % 4) / 3) * 100}% ${(Math.floor(index / 4) / 2) * 100}%`,
        }}
      />
      <figcaption>Ilustração didática gerada</figcaption>
    </figure>
  );
}

export function StarterExplorer() {
  const [state, setState] = useState(initialStarterState),
    [paused, setPaused] = useState(false),
    [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading"),
    [phase, setPhase] = useState(0),
    [contact, setContact] = useState(false);
  const host = useRef<HTMLDivElement>(null),
    controller = useRef<StarterRenderer | null>(null),
    latest = useRef({ state, paused });
  const narration = usePartNarration();
  const { speak } = narration;
  const select = useCallback(
    (id: number) => {
      const part = starterParts.find((item) => item.id === id);
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
    function fallback() {
      if (!cancelled) {
        setStatus("fallback");
        setPaused(true);
      }
    }
    import("@/lib/starter-renderer")
      .then(({ createStarterRenderer }) => {
        if (cancelled || !host.current) return;
        try {
          controller.current = createStarterRenderer(
            host.current,
            latest.current.state,
            select,
            fallback,
            (index, power) => {
              setPhase(index);
              setContact(power);
            },
          );
          controller.current.setPaused(latest.current.paused);
          setStatus("ready");
        } catch {
          fallback();
        }
      })
      .catch(fallback);
    return () => {
      cancelled = true;
      controller.current?.dispose();
      controller.current = null;
    };
  }, [select]);
  useEffect(() => {
    controller.current?.setState(state);
  }, [state]);
  useEffect(() => {
    controller.current?.setPaused(paused);
  }, [paused]);
  useEffect(() => {
    if (status !== "fallback" || paused || state.speed <= 0) return;
    const timer = window.setInterval(
      () => {
        const bounds = host.current?.getBoundingClientRect();
        if (
          document.hidden ||
          window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
          !bounds ||
          bounds.bottom < 0 ||
          bounds.top > window.innerHeight
        )
          return;
        setPhase((current) => (current + 1) % 5);
      },
      2600 / Math.max(0.1, state.speed),
    );
    return () => window.clearInterval(timer);
  }, [status, paused, state.speed]);
  const selected = starterParts[state.selected - 1];
  const active = starterStages[phase];
  const powered =
    status === "ready" ? contact : starterSequence(phase * 2.6 + 1.3).contact;
  function step(index: number) {
    setPaused(true);
    setPhase(index);
    controller.current?.setStep(index);
  }
  function advance() {
    setPaused(true);
    if (status === "ready") controller.current?.advance();
    else setPhase((current) => (current + 1) % 5);
  }
  function restart() {
    setPhase(0);
    controller.current?.restart();
  }
  return (
    <section
      className="suspension-explorer starter-explorer"
      aria-labelledby="starter-title"
      data-renderer={status}
    >
      <header className="suspension-heading">
        <div>
          <span className="eyebrow">EXPLORE / MOTOR DE PARTIDA</span>
          <h2 id="starter-title">Do comando ao giro do motor.</h2>
          <p>
            11 componentes identificados, vista explodida e acionamento do
            arranque em uma sequência interativa.
          </p>
        </div>
        <StarterPicture index={11} name="Motor de partida montado" assembled />
      </header>
      <div
        className="suspension-subsystems"
        aria-label="Explorar conjuntos do arranque"
      >
        {[
          ["Pinhão e roda livre", 2],
          ["Solenoide e garfo", 5],
          ["Induzido e campo", 7],
          ["Escovas e coletor", 10],
        ].map(([name, id]) => (
          <button
            type="button"
            key={id}
            aria-pressed={state.selected === id}
            onClick={() => select(Number(id))}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="suspension-layout">
        <div>
          <div className="suspension-toolbar">
            <button
              type="button"
              aria-pressed={state.explosion === 0 && !state.cutaway}
              onClick={() =>
                setState((current) => ({
                  ...current,
                  explosion: 0,
                  cutaway: false,
                  isolate: false,
                }))
              }
            >
              Montado
            </button>
            <button
              type="button"
              aria-pressed={state.explosion === 0 && state.cutaway}
              onClick={() =>
                setState((current) => ({
                  ...current,
                  explosion: 0,
                  cutaway: true,
                  isolate: false,
                }))
              }
            >
              Corte em funcionamento
            </button>
            <button
              type="button"
              aria-pressed={state.explosion === 1}
              onClick={() =>
                setState((current) => ({
                  ...current,
                  explosion: 1,
                  cutaway: true,
                  isolate: false,
                }))
              }
            >
              Vista explodida
            </button>
            <button
              type="button"
              aria-pressed={paused}
              onClick={() => setPaused((current) => !current)}
            >
              {paused ? "▶ Reproduzir" : "Ⅱ Pausar"}
            </button>
            <button type="button" onClick={restart}>
              Recomeçar sequência
            </button>
            <button type="button" onClick={advance}>
              Avançar etapa
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
            className="starter-narration"
          />
          <div className="suspension-stage starter-stage">
            <div
              ref={host}
              className="suspension-canvas"
              role="group"
              aria-label="Visualização 3D do motor de partida"
            />
            {status !== "ready" && (
              <div className="starter-schematic-stage">
                <StarterSchematic
                  explosion={state.explosion}
                  phase={phase}
                  selected={state.selected}
                  isolate={state.isolate}
                  onSelect={select}
                />
                <p>
                  {status === "loading"
                    ? "Carregando motor de partida 3D…"
                    : "Vista 2D interativa: o 3D não está disponível neste navegador."}
                </p>
              </div>
            )}
            <span className="suspension-stage-label">
              ARRANQUE / ACIONAMENTO DIRETO · 11 PEÇAS
            </span>
          </div>
          <p className="suspension-hint">
            {status === "ready"
              ? "Arraste para girar; toque nas etiquetas ou use a lista. Isole uma peça para ampliar os detalhes."
              : "Selecione uma peça e avance as etapas. Funções, imagens e esquema permanecem disponíveis."}
          </p>
          <div className="suspension-controls starter-controls">
            <label htmlFor="starter-explosion">
              Separação das peças{" "}
              <output>{Math.round(state.explosion * 100)}%</output>
              <input
                id="starter-explosion"
                type="range"
                min="0"
                max="100"
                value={state.explosion * 100}
                onChange={(event) =>
                  setState((current) => ({
                    ...current,
                    explosion: Number(event.target.value) / 100,
                  }))
                }
              />
            </label>
            <label htmlFor="starter-speed">
              Velocidade didática{" "}
              <output>{Math.round(state.speed * 100)}%</output>
              <input
                id="starter-speed"
                type="range"
                min="0"
                max="100"
                value={state.speed * 100}
                onChange={(event) =>
                  setState((current) => ({
                    ...current,
                    speed: Number(event.target.value) / 100,
                  }))
                }
              />
            </label>
            <div className="starter-toggles">
              <label>
                <input
                  type="checkbox"
                  checked={state.isolate}
                  onChange={(event) =>
                    setState((current) => ({
                      ...current,
                      isolate: event.target.checked,
                    }))
                  }
                />{" "}
                Isolar peça selecionada
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={state.context}
                  onChange={(event) =>
                    setState((current) => ({
                      ...current,
                      context: event.target.checked,
                    }))
                  }
                />{" "}
                Mostrar coroa do volante
              </label>
            </div>
          </div>
          <div className="starter-phase" role="status" aria-live="polite">
            <span>
              ETAPA {phase + 1} DE 5{" "}
              {paused
                ? "· PAUSADA"
                : state.speed === 0
                  ? "· VELOCIDADE ZERO"
                  : ""}
            </span>
            <h3>{active.name}</h3>
            <p>{active.description}</p>
            <div className="starter-signals">
              <span data-active={phase < 3}>
                Comando START {phase < 3 ? "presente" : "liberado"}
              </span>
              <span data-active={powered}>
                Contato de potência {powered ? "fechado" : "aberto"}
              </span>
              <span data-active={phase === 3}>
                Roda livre{" "}
                {phase === 3 ? "em sobrevelocidade" : "sem sobrevelocidade"}
              </span>
            </div>
          </div>
          <div className="starter-selected-detail" aria-live="polite">
            <StarterPicture index={selected.id - 1} name={selected.name} />
            <div>
              <span className="suspension-number">{selected.id}</span>
              <h3>{selected.name}</h3>
              <p>{selected.description}</p>
              <p>
                <strong>Inspeção:</strong> {selected.inspection}
              </p>
              <Link
                href={`/pecas?buy=${encodeURIComponent(selected.name)}`}
                prefetch={false}
              >
                Pesquisar esta peça nas lojas ↗
              </Link>
            </div>
          </div>
        </div>
        <aside
          className="suspension-parts"
          aria-label="Componentes do motor de partida"
        >
          <h3>Peça por peça</h3>
          <p>
            Numeração da referência enviada. Selecione um item para destacar e
            ver sua imagem.
          </p>
          <ol>
            {starterParts.map((part) => (
              <li key={part.id}>
                <button
                  type="button"
                  aria-pressed={state.selected === part.id}
                  onClick={() => select(part.id)}
                >
                  <span className="suspension-number">{part.id}</span>
                  <span
                    className="starter-list-picture"
                    aria-hidden="true"
                    style={{
                      backgroundPosition: `${(((part.id - 1) % 4) / 3) * 100}% ${(Math.floor((part.id - 1) / 4) / 2) * 100}%`,
                    }}
                  />
                  {part.name}
                </button>
              </li>
            ))}
          </ol>
          <p className="starter-context-note">
            A coroa do volante pertence ao motor térmico e aparece apenas como
            contexto de engrenamento.
          </p>
        </aside>
      </div>
      <div className="starter-study">
        <section aria-labelledby="starter-cycle-title">
          <h3 id="starter-cycle-title">Como funciona, passo a passo</h3>
          <ol className="starter-steps">
            {starterStages.map((item, index) => (
              <li key={item.id}>
                <button
                  type="button"
                  aria-pressed={phase === index}
                  onClick={() => {
                    select(item.part);
                    step(index);
                  }}
                >
                  <span>{index + 1}</span>
                  {item.name}
                </button>
              </li>
            ))}
          </ol>
          <p>
            O exemplo usa acionamento direto: durante a partida, induzido e
            pinhão transmitem giro pela roda livre. Após o motor pegar, o pinhão
            pode girar mais rápido sem arrastar o induzido. Arranques com
            redutor planetário têm outra construção.
          </p>
        </section>
        <section
          className="starter-circuit"
          aria-labelledby="starter-circuit-title"
        >
          <h3 id="starter-circuit-title">Esquema elétrico simplificado</h3>
          <StarterCircuit command={phase < 3} contact={powered} />
          <p>
            Comando do solenoide e circuito de alta corrente são caminhos
            distintos. Terminais 30, 50 e 31 são designações usuais; relés,
            intertravamentos e fiação variam conforme o veículo. As cores e
            partículas não são medições elétricas.
          </p>
        </section>
        <section aria-labelledby="starter-faults-title">
          <h3 id="starter-faults-title">Principais falhas e sintomas</h3>
          <div
            className="starter-table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Tabela de falhas e sintomas do arranque"
          >
            <table>
              <thead>
                <tr>
                  <th>Possível falha</th>
                  <th>Sintoma</th>
                  <th>Verificação</th>
                </tr>
              </thead>
              <tbody>
                {starterFaults.map(([fault, symptom, inspection]) => (
                  <tr key={fault}>
                    <th scope="row">{fault}</th>
                    <td>{symptom}</td>
                    <td>{inspection}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section
          className="starter-inspections"
          aria-labelledby="starter-tests-title"
        >
          <h3 id="starter-tests-title">Inspeções básicas na oficina</h3>
          <ul>
            <li>
              <strong>Bateria em repouso:</strong> a referência cita 12,4–12,8 V
              para bateria de chumbo-ácido de 12 V. Tipo, temperatura, carga e
              tempo de repouso alteram a leitura.
            </li>
            <li>
              <strong>Tensão durante o teste:</strong> 9,6 V é um critério comum
              em determinados testes de bateria, nas condições especificadas.
              Não é um limite universal para toda partida.
            </li>
            <li>
              <strong>Corrente de partida:</strong> 80–250 A é a faixa
              ilustrativa da referência. Motor, temperatura, óleo e projeto do
              arranque podem exigir valores fora dela.
            </li>
            <li>
              <strong>Solenoide e alimentação:</strong> conferir comando,
              acionamento e queda de tensão dos contatos, cabos e massa conforme
              o procedimento do fabricante.
            </li>
            <li>
              <strong>Escovas:</strong> medir o comprimento e comparar com o
              limite do modelo. Os 5 mm citados na imagem são um exemplo, não
              uma especificação para todos os arranques.
            </li>
          </ul>
        </section>
        <section aria-labelledby="starter-care-title">
          <h3 id="starter-care-title">Manutenção e sinais no painel</h3>
          <ul>
            <li>
              Conferir estado da bateria, conexões limpas e firmes e integridade
              dos aterramentos.
            </li>
            <li>
              Inspecionar escovas, coletor, buchas ou rolamentos e componentes
              do acionamento.
            </li>
            <li>
              Lubrificar somente os pontos e com o produto previstos no manual;
              coletor, escovas e mecanismos selados têm requisitos próprios.
            </li>
            <li>Substituir componentes desgastados conforme a aplicação.</li>
          </ul>
          <p>
            Não existe uma luz universal de defeito do motor de partida. A luz
            da bateria acesa após o motor funcionar geralmente se relaciona à
            carga. Luz de injeção e mensagens de partida dependem dos módulos do
            veículo e exigem leitura e interpretação dos códigos.
          </p>
        </section>
      </div>
      <p className="suspension-note">
        Modelo 3D genérico e ilustrações geradas com base na referência enviada.
        Não são fotografias de fabricante nem CAD de uma aplicação específica.
        Separação, corte e velocidades foram adaptados para estudo; o movimento
        na vista explodida não representa um conjunto fisicamente montado. Em
        preferência por movimento reduzido, use as etapas manuais. Valores de
        teste, procedimentos e torques devem seguir o manual do veículo.
      </p>
    </section>
  );
}
