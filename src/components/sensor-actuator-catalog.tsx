"use client";

import Link from "next/link";
import { useCallback, useId, useState } from "react";
import { ArrowUpRight, Cpu, Search } from "lucide-react";
import {
  componentOffersUrl,
  filterTechnicalComponents,
  technicalComponents,
  type CatalogScope,
  type ComponentKind,
  type TechnicalComponent,
} from "@/lib/sensor-actuator-catalog";

function ComponentImage({ item }: { item: TechnicalComponent }) {
  const [state, setState] = useState<"pending" | "loaded" | "unavailable">(
    item.photo && !item.photo.unavailable ? "pending" : "unavailable",
  );
  // SSR images can finish or fail before React attaches its event handlers.
  // Read their settled state when the DOM node is attached as well.
  const attachImage = useCallback((element: HTMLImageElement | null) => {
    if (element?.complete) {
      setState(element.naturalWidth > 0 ? "loaded" : "unavailable");
    }
  }, []);
  const col = item.illustrationIndex % 5;
  const row = Math.floor(item.illustrationIndex / 5);
  return (
    <figure className="component-reference">
      <div className="component-reference-visual">
        {state !== "loaded" && (
          <div
            className="component-reference-illustration"
            role="img"
            aria-label={`Ilustração didática gerada: ${item.name}. Formato genérico de referência.`}
            style={{
              backgroundPosition: `${(col / 4) * 100}% ${(row / 7) * 100}%`,
            }}
          />
        )}
        {item.photo && !item.photo.unavailable && state !== "unavailable" && (
          // Supplied proxy URLs are not stable Next Image sources. A local,
          // explicitly labelled illustration remains if the remote photo fails.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={attachImage}
            src={item.photo.url}
            alt={`Foto de referência: ${item.name}. ${item.photo.title}`}
            aria-hidden={state !== "loaded"}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onLoad={() => setState("loaded")}
            onError={() => setState("unavailable")}
          />
        )}
      </div>
      <figcaption>
        {state === "loaded"
          ? "Foto de referência fornecida"
          : "Ilustração didática gerada"}
        {state === "pending" && <span> · carregando foto enviada</span>}
      </figcaption>
    </figure>
  );
}

function ComponentCard({ item }: { item: TechnicalComponent }) {
  return (
    <li>
      <article className="technical-component" id={item.id}>
        <ComponentImage item={item} />
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
          <h3>{item.name}</h3>
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
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nome, sigla ou função: CKP, bobina, pressão…"
              maxLength={160}
            />
          </span>
        </label>
        <label>
          Conteúdo do catálogo
          <select
            value={scope}
            onChange={(event) => setScope(event.target.value as CatalogScope)}
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
            onChange={(event) => setSystem(event.target.value)}
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
              onClick={() => setKind(value)}
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
            <ComponentCard key={item.id} item={item} />
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
