"use client";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  automaticParts,
  initialAutomaticState,
  automaticRatio,
  automaticPowerPath,
  automaticRangeLabel,
  type AutomaticRange,
  type AutomaticGear,
} from "@/lib/automatic-transmission-parts";
import {
  automaticTransmissionArtwork,
  automaticTransmissionAssemblies,
  automaticTransmissionVisualCatalog,
} from "@/lib/automatic-transmission-reference-catalog";
import { visualArtworkStyle } from "@/lib/visual-reference-catalog";
import type { AutomaticTransmissionRenderer } from "@/lib/automatic-transmission-renderer";
import { PartSelectionPicture } from "./part-selection-picture";
import { PartNarrationControls } from "./part-narration-controls";
import { usePartNarration } from "./use-part-narration";

function AutomaticPicture({ cell, name }: { cell: number; name: string }) {
  return (
    <figure className="transmission-picture">
      <div
        role="img"
        aria-label={`Ilustração didática gerada: ${name}`}
        style={visualArtworkStyle(automaticTransmissionArtwork, cell)}
      />
      <figcaption>Ilustração didática gerada</figcaption>
    </figure>
  );
}
export function AutomaticTransmissionExplorer() {
  const id = useId();
  const [state, setState] = useState(initialAutomaticState),
    [paused, setPaused] = useState(false),
    [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const host = useRef<HTMLDivElement>(null),
    controller = useRef<AutomaticTransmissionRenderer | null>(null),
    latest = useRef({ state, paused });
  const narration = usePartNarration(),
    { speak } = narration;
  const selectPart = useCallback(
    (id: number) => {
      const part = automaticParts.find((item) => item.id === id);
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
    function unavailable() {
      if (!cancelled) {
        setStatus("fallback");
        setPaused(true);
      }
    }
    import("@/lib/automatic-transmission-renderer")
      .then(({ createAutomaticTransmissionRenderer }) => {
        if (cancelled || !host.current) return;
        try {
          controller.current = createAutomaticTransmissionRenderer(
            host.current,
            latest.current.state,
            selectPart,
            unavailable,
            setPaused,
          );
          const reduced = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
          ).matches;
          controller.current.setPaused(latest.current.paused || reduced);
          if (reduced) setPaused(true);
          setStatus("ready");
        } catch {
          unavailable();
        }
      })
      .catch(unavailable);
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
  const selected = automaticParts[state.selected - 1],
    ratio = automaticRatio(state.range, state.gear);
  function chooseRange(range: AutomaticRange) {
    setState((current) => ({
      ...current,
      range,
      lockup: range === "D" && current.lockup,
    }));
  }
  return (
    <section
      className="suspension-explorer automatic-transmission-explorer"
      aria-labelledby={`${id}-title`}
      data-renderer={status}
      data-range={state.range}
      data-gear={state.gear}
    >
      <header className="suspension-heading transmission-heading">
        <div>
          <span className="eyebrow">EXPLORE / TRANSMISSÃO AUTOMÁTICA</span>
          <h2 id={`${id}-title`}>Do conversor às trocas de marcha.</h2>
          <p>
            12 conjuntos identificados, corte da caixa, vista explodida e
            planetários em movimento. Clique na peça, no nome ou na imagem para
            ouvir a função.
          </p>
          <span className="transmission-count">
            Conversor de torque · cinco marchas didáticas · P / R / N / D
          </span>
        </div>
        <AutomaticPicture cell={12} name="Transmissão automática montada" />
      </header>
      <div
        className="suspension-subsystems"
        aria-label="Explorar conjuntos da transmissão automática"
      >
        {[
          { id: 1, name: "Conversor de torque" },
          { id: 3, name: "Planetários" },
          { id: 4, name: "Embreagens e discos" },
          { id: 8, name: "Freios internos" },
          { id: 10, name: "Corpo de válvulas" },
          { id: 11, name: "Solenoides" },
        ].map((item) => (
          <button
            type="button"
            key={item.id}
            aria-pressed={state.selected === item.id}
            onClick={() => selectPart(item.id)}
          >
            {item.name}
          </button>
        ))}
      </div>
      <div className="suspension-layout transmission-layout">
        <div>
          <div
            className="suspension-toolbar transmission-toolbar"
            role="group"
            aria-label="Visualização da transmissão"
          >
            <button
              type="button"
              aria-pressed={
                !state.cutaway && state.explosion === 0 && !state.isolate
              }
              onClick={() =>
                setState((current) => ({
                  ...current,
                  cutaway: false,
                  explosion: 0,
                  isolate: false,
                }))
              }
            >
              Montado
            </button>
            <button
              type="button"
              disabled={status === "fallback"}
              aria-pressed={
                state.cutaway && state.explosion === 0 && !state.isolate
              }
              onClick={() =>
                setState((current) => ({
                  ...current,
                  cutaway: true,
                  explosion: 0,
                  isolate: false,
                }))
              }
            >
              Corte em funcionamento
            </button>
            <button
              type="button"
              aria-pressed={state.explosion === 1 && !state.isolate}
              onClick={() =>
                setState((current) => ({
                  ...current,
                  cutaway: true,
                  explosion: 1,
                  isolate: false,
                }))
              }
            >
              Vista explodida
            </button>
            <button
              type="button"
              aria-pressed={state.isolate}
              onClick={() =>
                setState((current) => ({
                  ...current,
                  isolate: !current.isolate,
                }))
              }
            >
              {state.isolate ? "Mostrar conjunto" : "Focar peça"}
            </button>
            <button
              type="button"
              disabled={status !== "ready"}
              aria-pressed={paused}
              onClick={() => setPaused((current) => !current)}
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
            className="transmission-narration"
          />
          <div className="suspension-stage transmission-stage">
            <div
              ref={host}
              className="suspension-canvas transmission-canvas"
              role="group"
              aria-label="Transmissão automática em 3D: conversor, bomba, planetários, embreagens, freios e comando hidráulico. Selecione pelas etiquetas ou pela lista."
            />
            {status !== "ready" && (
              <div className="transmission-fallback">
                <AutomaticPicture
                  cell={
                    state.isolate
                      ? selected.imageCell
                      : state.explosion > 0
                        ? 13
                        : 12
                  }
                  name={
                    state.isolate
                      ? selected.name
                      : state.explosion > 0
                        ? "Vista explodida da transmissão automática"
                        : "Transmissão automática montada"
                  }
                />
                <p>
                  {status === "loading"
                    ? "Carregando visualização 3D…"
                    : "Referência estática: o 3D está indisponível neste navegador. Explore as imagens, funções e voz pela lista."}
                </p>
              </div>
            )}
            <span className="suspension-stage-label">
              CONVERSOR / CONJUNTOS PLANETÁRIOS
            </span>
            {status === "ready" && (
              <div
                className="transmission-zoom"
                role="group"
                aria-label="Aproximar a transmissão"
              >
                <button
                  type="button"
                  aria-label="Girar modelo à esquerda"
                  onClick={() => controller.current?.rotate(-Math.PI / 8)}
                >
                  ↶
                </button>
                <button
                  type="button"
                  aria-label="Girar modelo à direita"
                  onClick={() => controller.current?.rotate(Math.PI / 8)}
                >
                  ↷
                </button>
                <button
                  type="button"
                  aria-label="Aproximar modelo"
                  onClick={() => controller.current?.zoom(0.8)}
                >
                  ＋
                </button>
                <button
                  type="button"
                  aria-label="Afastar modelo"
                  onClick={() => controller.current?.zoom(1.25)}
                >
                  −
                </button>
              </div>
            )}
          </div>
          <p className="suspension-hint">
            {status === "ready"
              ? "Arraste para girar. Clique na peça, etiqueta, nome ou imagem. Use Focar peça para observar conversor, planetários e discos em detalhe."
              : "Selecione o nome ou a imagem da peça para conhecer sua função."}
          </p>
          <div
            className="transmission-gears automatic-ranges"
            role="group"
            aria-label="Selecionar posição do câmbio"
          >
            <span>Seletor</span>
            {(["P", "R", "N", "D"] as const).map((range) => (
              <button
                type="button"
                key={range}
                aria-label={`Selecionar ${range}: ${automaticRangeLabel(range)}`}
                aria-pressed={state.range === range}
                onClick={() => chooseRange(range)}
              >
                {range}
              </button>
            ))}
          </div>
          <div
            className="transmission-gears"
            role="group"
            aria-label="Marcha demonstrada em D"
          >
            <span>Marcha em D</span>
            {([1, 2, 3, 4, 5] as const).map((gear) => (
              <button
                type="button"
                key={gear}
                aria-label={`Demonstrar ${gear}ª marcha em D`}
                aria-pressed={state.range === "D" && state.gear === gear}
                onClick={() =>
                  setState((current) => ({
                    ...current,
                    range: "D",
                    gear: gear as AutomaticGear,
                  }))
                }
              >
                {gear}ª
              </button>
            ))}
          </div>
          <div className="transmission-controls">
            <label className="transmission-clutch">
              <input
                type="checkbox"
                checked={state.lockup}
                disabled={state.range !== "D"}
                onChange={(event) =>
                  setState((current) => ({
                    ...current,
                    lockup: event.target.checked,
                  }))
                }
              />
              Travamento do conversor (lock-up)
            </label>
            <label htmlFor={`${id}-speed`}>
              Velocidade da animação{" "}
              <output htmlFor={`${id}-speed`}>
                {state.speed.toLocaleString("pt-BR", {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}
                ×
              </output>
              <input
                id={`${id}-speed`}
                type="range"
                min="0"
                max="1.5"
                step="0.1"
                value={state.speed}
                disabled={status !== "ready"}
                onChange={(event) =>
                  setState((current) => ({
                    ...current,
                    speed: Number(event.target.value),
                  }))
                }
              />
            </label>
            <label htmlFor={`${id}-explosion`}>
              Separação das peças{" "}
              <output htmlFor={`${id}-explosion`}>
                {Math.round(state.explosion * 100)}%
              </output>
              <input
                id={`${id}-explosion`}
                type="range"
                min="0"
                max="100"
                value={state.explosion * 100}
                disabled={status !== "ready"}
                onChange={(event) =>
                  setState((current) => ({
                    ...current,
                    explosion: Number(event.target.value) / 100,
                    cutaway: true,
                    isolate: false,
                  }))
                }
              />
            </label>
          </div>
          <p className="transmission-clutch-hint">
            Escolha uma marcha para estudar a relação em D. O lock-up elimina o
            escorregamento ilustrativo do conversor; não muda a relação dos
            planetários.
          </p>
          <div className="transmission-status" role="status">
            <strong>
              {state.range} · {automaticRangeLabel(state.range)}
              {state.range === "D" ? ` · ${state.gear}ª marcha` : ""}
              {ratio === null
                ? " · sem transmissão de torque à saída"
                : ` · ${Math.abs(ratio).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}:1${ratio < 0 ? " · sentido inverso" : ""}`}
            </strong>
            <p>{automaticPowerPath(state)}</p>
            <span>
              {status === "fallback"
                ? "Visualização estática."
                : paused
                  ? "Animação pausada. Você pode reproduzir quando desejar."
                  : state.speed === 0
                    ? "Velocidade da animação em zero."
                    : "Movimento didático em velocidade reduzida."}
            </span>
          </div>
          <div
            className="suspension-detail transmission-selected-detail"
            aria-live="polite"
          >
            <PartSelectionPicture
              name={selected.name}
              onSelect={() => selectPart(selected.id)}
            >
              <AutomaticPicture
                cell={selected.imageCell}
                name={selected.name}
              />
            </PartSelectionPicture>
            <div>
              <span className="suspension-number">{selected.id}</span>
              <h3>{selected.name}</h3>
              <p>{selected.description}</p>
              <p className="transmission-part-note">{selected.note}</p>
            </div>
          </div>
        </div>
        <aside
          className="suspension-parts transmission-parts"
          aria-label="Peças da transmissão automática"
        >
          <h3>Peça por peça</h3>
          <p>
            Numeração 1–12 do corte longitudinal da referência. Selecione para
            destacar e ouvir nome e função.
          </p>
          <ol>
            {automaticParts.map((part) => (
              <li key={part.id}>
                <button
                  type="button"
                  aria-pressed={state.selected === part.id}
                  onClick={() => selectPart(part.id)}
                >
                  <span
                    className="transmission-part-thumbnail"
                    aria-hidden="true"
                    style={visualArtworkStyle(
                      automaticTransmissionArtwork,
                      part.imageCell,
                    )}
                  />
                  <span>
                    <span className="transmission-part-index">
                      {String(part.id).padStart(2, "0")}
                    </span>
                    {part.name}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </aside>
      </div>
      <div className="transmission-power-path">
        <h3>Caminho do torque e comando hidráulico</h3>
        <div>
          {[
            { id: 1, name: "Conversor" },
            { id: 3, name: "Planetários" },
            { id: 4, name: "Embreagens" },
            { id: 8, name: "Freios" },
            { id: 9, name: "Saída" },
            { id: 2, name: "Bomba ATF" },
            { id: 10, name: "Válvulas" },
            { id: 11, name: "Solenoides" },
          ].map((part) => (
            <button
              type="button"
              key={part.id}
              aria-pressed={state.selected === part.id}
              onClick={() => selectPart(part.id)}
            >
              {part.name}
              <span aria-hidden="true"> →</span>
            </button>
          ))}
        </div>
        <p>
          O ATF transmite movimento no conversor e fornece pressão para a
          aplicação dos elementos internos. As linhas de fluxo e os solenoides
          destacados são esquemáticos.
        </p>
      </div>
      <div className="transmission-related">
        <h3>Detalhes da referência</h3>
        <div>
          {automaticTransmissionAssemblies
            .filter(
              (item) => item.id === "conversor" || item.id === "planetario",
            )
            .map((item) => (
              <article key={item.id}>
                <PartSelectionPicture
                  name={item.name}
                  onSelect={() => {
                    selectPart(item.id === "conversor" ? 1 : 3);
                    setState((current) => ({
                      ...current,
                      isolate: true,
                      explosion: 1,
                      cutaway: true,
                    }));
                  }}
                >
                  <AutomaticPicture cell={item.imageCell} name={item.name} />
                </PartSelectionPicture>
                <button
                  type="button"
                  onClick={() => {
                    selectPart(item.id === "conversor" ? 1 : 3);
                    setState((current) => ({
                      ...current,
                      isolate: true,
                      explosion: 1,
                      cutaway: true,
                    }));
                  }}
                >
                  {item.name}
                </button>
                <p>{item.description}</p>
              </article>
            ))}
        </div>
      </div>
      <div className="transmission-reading">
        {automaticTransmissionVisualCatalog.sections?.map((section) => (
          <details key={section.title}>
            <summary>{section.title}</summary>
            {section.description && <p>{section.description}</p>}
            {section.items && (
              <ol>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            )}
            {section.groups && (
              <dl>
                {section.groups.map((item) => (
                  <div key={item.name}>
                    <dt>{item.name}</dt>
                    <dd>{item.text}</dd>
                  </div>
                ))}
              </dl>
            )}
          </details>
        ))}
      </div>
      <p className="suspension-note">
        Modelo didático com conversor de torque e três estágios planetários
        simples. Não representa CVT ou DCT. As cinco relações são calculadas
        para este exemplo; os vínculos, o escorregamento de 18% sem lock-up e os
        comandos hidráulicos são ilustrativos. Sem cálculo de torque, pressão,
        temperatura, carga ou inércia. Não equivale à tabela de aplicação de uma
        caixa comercial. Imagens geradas com base nos conjuntos da referência.
      </p>
      <Link
        className="transmission-catalog-link"
        href="/artigos?catalog=transmissao-automatica"
      >
        Ver catálogo completo de transmissão automática ↗
      </Link>
    </section>
  );
}
