"use client";

import Link from "next/link";
import { ComponentReferenceImage } from "./component-reference-image";
import { PartSelectionPicture } from "./part-selection-picture";
import { PartNarrationControls } from "./part-narration-controls";
import { usePartNarration } from "./use-part-narration";
import { useId, useState } from "react";
import { ArrowUpRight, Cpu, Search } from "lucide-react";
import {
  componentOffersUrl,
  filterTechnicalComponents,
  technicalComponents,
  type CatalogScope,
  type ComponentKind,
  type TechnicalComponent,
} from "@/lib/sensor-actuator-catalog";

function ComponentCard({
  item,
  selected,
  onSelect,
}: {
  item: TechnicalComponent;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <article
        className="technical-component"
        id={item.id}
        data-selected={selected}
      >
        <PartSelectionPicture name={item.name} onSelect={onSelect}>
          <ComponentReferenceImage item={item} />
        </PartSelectionPicture>
        <div className="technical-component-body">
          <div className="technical-component-meta">
            <span>
              {item.kind === "sensor" ? "Sensor" : "Atuador"}{" "}
              {String(item.number).padStart(2, "0")}
            </span>
            <span>
              {item.scope === "additional" ? "Adicional" : "Essencial"}
            </span>
          </div>
          <h3>
            <button
              type="button"
              className="part-name-select"
              aria-pressed={selected}
              onClick={onSelect}
            >
              {item.name}
            </button>
          </h3>
          <span className="technical-component-system">{item.system}</span>
          <dl>
            <dt>Função</dt>
            <dd>{item.function}</dd>
            <dt>Inspeção básica</dt>
            <dd>{item.inspection}</dd>
          </dl>
          <details className="technical-component-details">
            <summary>Detalhes e referência da imagem</summary>
            {item.note && <p>{item.note}</p>}
            {item.photo ? (
              <p>
                Referência enviada pelo usuário: <span>{item.photo.title}</span>
                .{" "}
                <a
                  href={item.photo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  referrerPolicy="no-referrer"
                >
                  Abrir{" "}
                  {item.photo.unavailable
                    ? "referência enviada"
                    : "imagem enviada"}{" "}
                  ↗
                </a>
              </p>
            ) : (
              <p>
                Não foi fornecida uma foto para este item. A ilustração foi
                gerada para identificação didática do componente.
              </p>
            )}
            <p>
              Formato, conectores e localização variam conforme fabricante, ano,
              motor e sistema. A imagem não confirma aplicação.
            </p>
          </details>
          <div className="technical-component-links">
            <Link
              href={componentOffersUrl(item)}
              prefetch={false}
              aria-label={`Pesquisar ofertas: ${item.name}`}
            >
              Pesquisar ofertas <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
            {item.explore && (
              <Link href={item.explore.href}>{item.explore.label} →</Link>
            )}
          </div>
        </div>
      </article>
    </li>
  );
}

export function SensorActuatorCatalog() {
  const id = useId();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<ComponentKind | "all">("all");
  const [scope, setScope] = useState<CatalogScope>("main");
  const [system, setSystem] = useState("all");
  const [selected, setSelected] = useState<TechnicalComponent | null>(null);
  const narration = usePartNarration();
  function select(item: TechnicalComponent) {
    setSelected(item);
    narration.speak({ name: item.name, description: item.function });
  }
  function resetSelection() {
    narration.stop();
    setSelected(null);
  }
  const items = filterTechnicalComponents({ query, kind, scope, system });
  const scopedItems = technicalComponents.filter(
    (item) => scope === "all" || item.scope === scope,
  );
  const counts = {
    all: scopedItems.length,
    sensor: scopedItems.filter((item) => item.kind === "sensor").length,
    actuator: scopedItems.filter((item) => item.kind === "actuator").length,
  };
  const systems = [
    ...new Set(technicalComponents.map((item) => item.system)),
  ].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const filtered =
    !!query || kind !== "all" || system !== "all" || scope !== "main";
  function clear() {
    resetSelection();
    setQuery("");
    setKind("all");
    setSystem("all");
    setScope("main");
  }
  return (
    <section
      className="sensor-actuator-catalog"
      aria-labelledby={`${id}-title`}
    >
      <header className="component-catalog-header">
        <div>
          <span className="component-catalog-eyebrow">
            CATÁLOGO TÉCNICO / OFICINAS MECÂNICAS
          </span>
          <h2 id={`${id}-title`}>Conheça a peça. Entenda o sinal.</h2>
          <p>
            Catálogo Técnico de Sensores e Atuadores Automotivos. Material
            educativo para oficinas mecânicas, com veículos nacionais e
            importados.
          </p>
        </div>
        <div className="component-catalog-total">
          <strong>40</strong>
          <span>
            componentes
            <br />
            24 essenciais + 16 adicionais
          </span>
        </div>
      </header>

      <PartNarrationControls
        narration={narration}
        part={
          selected
            ? { name: selected.name, description: selected.function }
            : null
        }
        surface
      />

      <div
        className="component-signal-flow"
        aria-label="Como sensores e atuadores se relacionam com a ECU"
      >
        <div>
          <strong>Sensores → ECU</strong>
          <p>Enviam informações de temperatura, pressão, rotação e posição.</p>
        </div>
        <Cpu size={32} aria-hidden="true" />
        <div>
          <strong>ECU → Atuadores</strong>
          <p>
            Recebem comandos e executam ações: injetar combustível, movimentar
            válvulas e acionar motores elétricos.
          </p>
        </div>
      </div>
      <p className="component-catalog-intro">
        Os 24 componentes essenciais abrangem injeção eletrônica, ignição,
        controle do motor, transmissão e freios ABS. Explore também os 16
        componentes adicionais de outros sistemas.
      </p>

      <form
        className="component-catalog-filters"
        role="search"
        aria-label="Pesquisar no catálogo técnico"
        onSubmit={(event) => event.preventDefault()}
      >
        <label className="component-catalog-search">
          Buscar componente
          <span>
            <Search size={19} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => {
                resetSelection();
                setQuery(event.target.value);
              }}
              placeholder="Nome, sigla ou função: CKP, bobina, pressão…"
              maxLength={160}
            />
          </span>
        </label>
        <label>
          Conteúdo do catálogo
          <select
            value={scope}
            onChange={(event) => {
              resetSelection();
              setScope(event.target.value as CatalogScope);
            }}
          >
            <option value="main">24 componentes essenciais</option>
            <option value="additional">16 componentes adicionais</option>
            <option value="all">Todos os 40 componentes</option>
          </select>
        </label>
        <label>
          Sistema do componente
          <select
            value={system}
            onChange={(event) => {
              resetSelection();
              setSystem(event.target.value);
            }}
          >
            <option value="all">Todos os sistemas</option>
            {systems.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </form>
      <div className="component-catalog-toolbar">
        <div
          className="component-kind-buttons"
          role="group"
          aria-label="Tipo de componente"
        >
          {(
            [
              ["all", "Todos"],
              ["sensor", "Sensores"],
              ["actuator", "Atuadores"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={kind === value}
              onClick={() => {
                resetSelection();
                setKind(value);
              }}
            >
              {label} <span>{counts[value]}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="component-clear"
          onClick={clear}
          disabled={!filtered}
        >
          Limpar filtros do catálogo
        </button>
      </div>
      <div
        className="component-catalog-status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {items.length}{" "}
        {items.length === 1
          ? "componente encontrado"
          : "componentes encontrados"}
        {query.trim() && <> para “{query.trim()}”</>}
      </div>

      {items.length ? (
        <ul
          className="technical-components-grid"
          aria-label="Fichas técnicas dos componentes"
        >
          {items.map((item) => (
            <ComponentCard
              key={item.id}
              item={item}
              selected={selected?.id === item.id}
              onSelect={() => select(item)}
            />
          ))}
        </ul>
      ) : (
        <div className="component-catalog-empty">
          <h3>Nenhum componente encontrado</h3>
          <p>
            Experimente outra sigla ou função, ou selecione todos os sistemas e
            componentes.
          </p>
          <button type="button" onClick={clear}>
            Restaurar catálogo
          </button>
        </div>
      )}
      <div className="component-catalog-footer">
        <p>
          Imagens de referência: fotos enviadas pelo usuário, quando
          disponíveis. Na ausência ou falha da foto, a ficha exibe uma
          ilustração didática gerada e identificada como tal.
        </p>
        <p>
          Consulte as especificações do fabricante para aplicação, pinagem,
          valores de teste e procedimentos de inspeção. “Pesquisar ofertas” abre
          a busca de peças; confirme código e compatibilidade antes de comprar.
        </p>
      </div>
    </section>
  );
}
