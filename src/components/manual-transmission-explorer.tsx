"use client";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  initialTransmissionState,
  transmissionParts,
  transmissionGears,
  transmissionRatio,
  transmissionGearLabel,
  transmissionPowerPath,
  type TransmissionGear,
} from "@/lib/manual-transmission-parts";
import {
  manualTransmissionArtwork,
  manualTransmissionVisualCatalog,
} from "@/lib/manual-transmission-reference-catalog";
import { visualArtworkStyle } from "@/lib/visual-reference-catalog";
import type { ManualTransmissionRenderer } from "@/lib/manual-transmission-renderer";
import { PartSelectionPicture } from "./part-selection-picture";
import { PartNarrationControls } from "./part-narration-controls";
import { usePartNarration } from "./use-part-narration";

function TransmissionPicture({ cell, name }: { cell: number; name: string }) {
  return (
    <figure className="transmission-picture">
      <div
        role="img"
        aria-label={`Ilustração didática gerada: ${name}`}
        style={visualArtworkStyle(manualTransmissionArtwork, cell)}
      />
      <figcaption>Ilustração didática gerada</figcaption>
    </figure>
  );
}

export function ManualTransmissionExplorer() {
  const id = useId();
  const [state, setState] = useState(initialTransmissionState);
  const [paused, setPaused] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">(
    "loading",
  );
  const host = useRef<HTMLDivElement>(null);
  const controller = useRef<ManualTransmissionRenderer | null>(null);
  const latest = useRef({ state, paused });
  const narration = usePartNarration();
  const { speak } = narration;
  const selectPart = useCallback(
    (id: number) => {
      const part = transmissionParts.find((item) => item.id === id);
      if (!part) return;
      setState((current) => ({
        ...current,
        selected: id,
        isolate: id === 10 || id === 16 ? true : current.isolate,
      }));
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
    import("@/lib/manual-transmission-renderer")
      .then(({ createManualTransmissionRenderer }) => {
        if (cancelled || !host.current) return;
        try {
          controller.current = createManualTransmissionRenderer(
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
  const selected = transmissionParts[state.selected - 1];
  const ratio = transmissionRatio(state.gear);
  function chooseGear(gear: TransmissionGear) {
    setState((current) => ({
      ...current,
      gear,
      clutchEngaged: gear === "N" ? current.clutchEngaged : false,
    }));
  }
  return (
    <section
      className="suspension-explorer manual-transmission-explorer"
      aria-labelledby="manual-transmission-title"
      data-renderer={status}
      data-gear={state.gear}
    >
      <header className="suspension-heading transmission-heading">
        <div>
          <span className="eyebrow">EXPLORE / TRANSMISSÃO MANUAL</span>
          <h2 id="manual-transmission-title">Do engate ao movimento.</h2>
          <p>
            13 peças identificadas, corte da caixa, vista explodida e
            engrenagens em movimento. Selecione uma peça para ver sua imagem e
            ouvir a função.
          </p>
          <span className="transmission-count">
            13 componentes · embreagem, alavanca e pedais como contexto
          </span>
        </div>
        <TransmissionPicture cell={13} name="Caixa de marchas manual montada" />
      </header>
      <div
        className="suspension-subsystems"
        aria-label="Explorar conjuntos da transmissão"
      >
        {[
          { id: 2, name: "Eixos e engrenagens" },
          { id: 6, name: "Sincronizador" },
          { id: 8, name: "Garfos e seleção" },
          { id: 14, name: "Embreagem" },
          { id: 15, name: "Alavanca" },
          { id: 16, name: "Pedais" },
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
                state.explosion === 0 && !state.cutaway && !state.isolate
              }
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
              disabled={status === "fallback"}
              aria-pressed={
                state.explosion === 0 && state.cutaway && !state.isolate
              }
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
              aria-pressed={state.explosion === 1 && !state.isolate}
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
              aria-label="Transmissão manual em 3D: engrenagens, eixos, sincronizadores e carcaça. As etiquetas e a lista permitem selecionar cada componente."
            />
            {status !== "ready" && (
              <div className="transmission-fallback">
                <TransmissionPicture
                  cell={
                    state.isolate
                      ? selected.imageCell
                      : state.explosion > 0
                        ? 14
                        : 13
                  }
                  name={
                    state.isolate
                      ? selected.name
                      : state.explosion > 0
                        ? "Vista explodida da caixa"
                        : "Transmissão manual montada"
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
              CAIXA LONGITUDINAL / EXEMPLO DE TRÊS EIXOS
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
              ? "Arraste para girar. Clique na malha, na etiqueta, no nome ou na imagem. Use Focar peça para observar os detalhes."
              : "Selecione o nome ou a imagem da peça para conhecer sua função."}
          </p>
          <div
            className="transmission-gears"
            role="group"
            aria-label="Selecionar marcha da demonstração"
          >
            <span>Marcha</span>
            {transmissionGears.map((gear) => (
              <button
                type="button"
                key={gear}
                aria-label={`Selecionar ${transmissionGearLabel(gear)}`}
                aria-pressed={state.gear === gear}
                onClick={() => chooseGear(gear)}
              >
                {gear}
              </button>
            ))}
          </div>
          <div className="transmission-controls">
            <label className="transmission-clutch">
              <input
                type="checkbox"
                checked={state.clutchEngaged}
                onChange={(event) =>
                  setState((current) => ({
                    ...current,
                    clutchEngaged: event.target.checked,
                  }))
                }
              />
              Embreagem acoplada
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
                disabled={status !== "ready"}
                value={state.explosion * 100}
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
            Selecionar uma marcha desacopla a embreagem no exemplo. Acople-a
            para observar a transmissão do movimento.
          </p>
          <div className="transmission-status" role="status">
            <strong>
              {transmissionGearLabel(state.gear)}
              {ratio === null
                ? " · sem relação engatada"
                : ` · ${Math.abs(ratio).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}:1${ratio < 0 ? " · sentido inverso" : ""}`}
            </strong>
            <p>{transmissionPowerPath(state)}</p>
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
              <TransmissionPicture
                cell={selected.imageCell}
                name={selected.name}
              />
            </PartSelectionPicture>
            <div>
              <span className="suspension-number">
                {selected.kind === "context"
                  ? `C${selected.id - 13}`
                  : selected.id}
              </span>
              <h3>{selected.name}</h3>
              <p>{selected.description}</p>
              <p className="transmission-part-note">{selected.note}</p>
            </div>
          </div>
        </div>
        <aside
          className="suspension-parts transmission-parts"
          aria-label="Peças da transmissão manual"
        >
          <h3>Peça por peça</h3>
          <p>
            Numeração 1–13 da referência. C1–C3 são conjuntos associados. O
            tambor 10 é um exemplo alternativo de seleção sequencial.
          </p>
          <ol>
            {transmissionParts.map((part) => (
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
                      manualTransmissionArtwork,
                      part.imageCell,
                    )}
                  />
                  <span>
                    <span className="transmission-part-index">
                      {part.kind === "context"
                        ? `C${part.id - 13}`
                        : String(part.id).padStart(2, "0")}
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
        <h3>Caminho do torque</h3>
        <div>
          {[
            { id: 14, name: "Embreagem" },
            { id: 2, name: "Entrada" },
            { id: 4, name: "Contraeixo" },
            { id: 5, name: "Engrenagens" },
            { id: 7, name: "Luva" },
            { id: 3, name: "Saída" },
          ].map((part) => (
            <button
              type="button"
              key={part.id}
              onClick={() => selectPart(part.id)}
              aria-pressed={state.selected === part.id}
            >
              {part.name}
              <span aria-hidden="true"> →</span>
            </button>
          ))}
        </div>
        <p>
          A 4ª é direta neste exemplo. Na ré, uma engrenagem intermediária
          inverte o sentido. Em neutro, as engrenagens podem girar livres sem
          acionar a saída.
        </p>
      </div>
      <div className="transmission-related">
        <h3>Detalhes da referência</h3>
        <div>
          {transmissionParts
            .filter((part) => part.kind === "context")
            .map((part) => (
              <article key={part.id}>
                <PartSelectionPicture
                  name={part.name}
                  onSelect={() => selectPart(part.id)}
                >
                  <TransmissionPicture cell={part.imageCell} name={part.name} />
                </PartSelectionPicture>
                <button type="button" onClick={() => selectPart(part.id)}>
                  {part.name}
                </button>
                <p>{part.description}</p>
              </article>
            ))}
        </div>
      </div>
      <div className="transmission-reading">
        {manualTransmissionVisualCatalog.sections?.map((section) => (
          <details key={section.title}>
            <summary>{section.title}</summary>
            {section.description && <p>{section.description}</p>}
            {section.items && (
              <ul>
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
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
        Modelo didático genérico de cinco marchas com entrada e saída coaxiais e
        contraeixo paralelo. Dentes e relações seguem o exemplo cinemático;
        proporções, corte e separação foram adaptados para estudo. Sem cálculo
        de torque, inércia, atrito ou sincronização real. O tambor 10 é exibido
        separadamente como alternativa sequencial; a seleção principal usa
        hastes e garfos. A ré deste modelo usa uma engrenagem intermediária
        deslizante.
      </p>
      <Link
        className="transmission-catalog-link"
        href="/artigos?catalog=transmissao-manual"
      >
        Ver catálogo completo de transmissão manual ↗
      </Link>
    </section>
  );
}
