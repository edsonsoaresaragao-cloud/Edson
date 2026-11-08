"use client";
import { useId, useRef, useState } from "react";
import Link from "next/link";
import { PartSelectionPicture } from "./part-selection-picture";
import { PartNarrationControls } from "./part-narration-controls";
import { usePartNarration } from "./use-part-narration";
import { ArrowUpRight, Search, X } from "lucide-react";
import {
  filterVisualParts,
  filterVisualAssemblies,
  visualSystemName,
  visualArtworkStyle,
  type VisualPart,
  type VisualAssembly,
  type VisualArtwork,
  type VisualCatalog,
  type VisualOverview,
} from "@/lib/visual-reference-catalog";

function ReferenceImage({
  cell,
  artwork,
  name,
}: {
  cell: number;
  artwork: VisualArtwork;
  name: string;
}) {
  return (
    <figure className="reference-catalog-picture">
      <div
        className="reference-catalog-art"
        role="img"
        aria-label={`${artwork.caption ?? "Ilustração didática gerada"}: ${name}`}
        style={visualArtworkStyle(artwork, cell)}
      />
      <figcaption>{artwork.caption ?? "Ilustração didática gerada"}</figcaption>
    </figure>
  );
}
export function ReferenceOverview({ overview }: { overview: VisualOverview }) {
  return (
    <figure className="reference-catalog-overview">
      {overview.kind === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={overview.src}
          width={overview.width}
          height={overview.height}
          alt={overview.alt}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div
          className="reference-catalog-art"
          role="img"
          aria-label={overview.alt}
          style={visualArtworkStyle(overview.artwork, overview.cell)}
        />
      )}
      <figcaption>{overview.caption}</figcaption>
    </figure>
  );
}
type Detail =
  | { kind: "part"; item: VisualPart }
  | { kind: "assembly"; item: VisualAssembly };

export function VisualReferenceCatalog({
  catalog,
}: {
  catalog: VisualCatalog;
}) {
  const id = useId(),
    dialog = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState(""),
    [system, setSystem] = useState("all"),
    [order, setOrder] = useState<"number" | "name">("number"),
    [view, setView] = useState<"parts" | "assemblies">("parts"),
    [detail, setDetail] = useState<Detail | null>(null);
  const narration = usePartNarration();
  const [selected, setSelected] = useState<Detail["item"] | null>(null);
  const parts = filterVisualParts(catalog, query, system, order),
    assemblies = filterVisualAssemblies(catalog, query, system);
  const count = view === "parts" ? parts.length : assemblies.length;
  const partLabels = catalog.partLabels ?? {
    tab: "Componentes",
    singular: "componente",
    plural: "componentes",
    feminine: false,
  };
  const resultNoun =
    view === "parts"
      ? partLabels
      : {
          singular: catalog.assemblyNoun[0],
          plural: catalog.assemblyNoun[1],
          feminine: catalog.assemblyNoun[0] === "vista",
        };
  const filtered = !!query || system !== "all" || order !== "number";
  function clear() {
    narration.stop();
    setQuery("");
    setSystem("all");
    setOrder("number");
  }
  function open(value: Detail) {
    setDetail(value);
    setSelected(value.item);
    narration.speak(value.item);
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
  }
  function close() {
    dialog.current?.close();
  }
  return (
    <section
      className={`visual-reference-catalog ${catalog.className}`}
      aria-labelledby={`${id}-title`}
    >
      <header className="reference-catalog-hero">
        <div>
          <span className="reference-catalog-eyebrow">{catalog.eyebrow}</span>
          <h2 id={`${id}-title`}>{catalog.title}</h2>
          <p>{catalog.description}</p>
          <div className="reference-catalog-counts">
            <span>
              <strong>{catalog.parts.length}</strong> {partLabels.plural}
            </span>
            <span>
              <strong>{catalog.assemblies.length}</strong>{" "}
              {catalog.assemblyNoun[1]}
            </span>
          </div>
          <Link
            href={catalog.interactiveHref}
            className="reference-catalog-atlas-link"
          >
            {catalog.interactiveLabel}{" "}
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <ReferenceOverview overview={catalog.overview} />
      </header>

      {!detail && (
        <PartNarrationControls narration={narration} part={selected} surface />
      )}

      <div
        className="reference-catalog-modes"
        role="group"
        aria-label={`Exibição do catálogo ${catalog.name}`}
      >
        <button
          type="button"
          aria-pressed={view === "parts"}
          onClick={() => {
            narration.stop();
            setView("parts");
          }}
        >
          {partLabels.tab} <span>{catalog.parts.length}</span>
        </button>
        <button
          type="button"
          aria-pressed={view === "assemblies"}
          onClick={() => {
            narration.stop();
            setView("assemblies");
          }}
        >
          {catalog.assemblyLabel} <span>{catalog.assemblies.length}</span>
        </button>
      </div>
      <form
        className="reference-catalog-filters"
        role="search"
        aria-label={`Pesquisar no catálogo ${catalog.name}`}
        onSubmit={(event) => event.preventDefault()}
        onChange={() => narration.stop()}
      >
        <label className="reference-catalog-search">
          Buscar no catálogo
          <span>
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={catalog.searchPlaceholder}
              maxLength={150}
            />
          </span>
        </label>
        <label>
          {catalog.systemLabel}
          <select
            value={system}
            onChange={(event) => setSystem(event.target.value)}
          >
            <option value="all">Todos os sistemas</option>
            {catalog.systems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Organizar componentes
          <select
            value={order}
            disabled={view === "assemblies"}
            onChange={(event) =>
              setOrder(event.target.value as "number" | "name")
            }
          >
            <option value="number">Numeração da referência</option>
            <option value="name">Nome de A a Z</option>
          </select>
        </label>
        <button
          type="button"
          className="reference-catalog-clear"
          onClick={clear}
          disabled={!filtered}
        >
          Limpar filtros do catálogo
        </button>
      </form>
      <p
        className="reference-catalog-result"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {count} {count === 1 ? resultNoun.singular : resultNoun.plural}{" "}
        {resultNoun.feminine
          ? count === 1
            ? "encontrada"
            : "encontradas"
          : count === 1
            ? "encontrado"
            : "encontrados"}
        {query.trim() && <> para “{query.trim()}”</>}
      </p>

      {view === "parts" ? (
        <ul
          className="reference-catalog-grid"
          aria-label={`${partLabels.tab} principais — ${catalog.name}`}
        >
          {parts.map((item) => (
            <li key={item.number}>
              <article className="reference-catalog-card">
                <PartSelectionPicture
                  name={item.name}
                  onSelect={() => open({ kind: "part", item })}
                >
                  <ReferenceImage
                    cell={item.imageCell}
                    artwork={catalog.partArtwork}
                    name={item.name}
                  />
                </PartSelectionPicture>
                <div className="reference-catalog-card-body">
                  <div className="reference-catalog-card-meta">
                    <span className="reference-catalog-number">
                      {String(item.number).padStart(2, "0")}
                    </span>
                    <span>
                      {item.kind === "context"
                        ? "Fluxo / contexto"
                        : visualSystemName(catalog, item.system)}
                    </span>
                  </div>
                  <h3>
                    <button
                      type="button"
                      className="part-name-select"
                      onClick={() => open({ kind: "part", item })}
                    >
                      {item.name}
                    </button>
                  </h3>
                  <p>{item.description}</p>
                  <button
                    type="button"
                    className="reference-catalog-details"
                    aria-label={`Ver ficha: ${item.name}`}
                    onClick={() => open({ kind: "part", item })}
                  >
                    Ampliar imagem e ver detalhes{" "}
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </button>
                </div>
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <ul
          className="reference-catalog-grid reference-catalog-assembly-grid"
          aria-label={`${catalog.assemblyLabel} — ${catalog.name}`}
        >
          {assemblies.map((item) => (
            <li key={item.id}>
              <article className="reference-catalog-card">
                <PartSelectionPicture
                  name={item.name}
                  onSelect={() => open({ kind: "assembly", item })}
                >
                  <ReferenceImage
                    cell={item.imageCell}
                    artwork={item.artwork ?? catalog.assemblyArtwork}
                    name={item.name}
                  />
                </PartSelectionPicture>
                <div className="reference-catalog-card-body">
                  <span className="reference-catalog-card-system">
                    {visualSystemName(catalog, item.system)}
                  </span>
                  <h3>
                    <button
                      type="button"
                      className="part-name-select"
                      onClick={() => open({ kind: "assembly", item })}
                    >
                      {item.name}
                    </button>
                  </h3>
                  <p>{item.description}</p>
                  <ul className="reference-catalog-subparts">
                    {item.details.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="reference-catalog-details"
                    aria-label={`Ver conjunto: ${item.name}`}
                    onClick={() => open({ kind: "assembly", item })}
                  >
                    Ampliar conjunto{" "}
                    <ArrowUpRight size={15} aria-hidden="true" />
                  </button>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
      {!count && (
        <div className="reference-catalog-empty">
          <h3>Nenhuma imagem corresponde aos filtros</h3>
          <p>Experimente outro nome ou selecione todos os sistemas.</p>
          <button type="button" onClick={clear}>
            Restaurar filtros
          </button>
        </div>
      )}

      {catalog.sections && (
        <div className="reference-catalog-context">
          {catalog.sections.map((section) => (
            <section key={section.title}>
              <h3>{section.title}</h3>
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
                  {section.groups.map((group) => (
                    <div key={group.name}>
                      <dt>{group.name}</dt>
                      <dd>{group.text}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </section>
          ))}
        </div>
      )}
      <div className="reference-catalog-notes">
        {catalog.notes.map((note) => (
          <p key={note}>{note}</p>
        ))}
      </div>

      <dialog
        ref={dialog}
        className="reference-catalog-dialog"
        aria-labelledby={`${id}-dialog-title`}
        onClose={() => {
          narration.stop();
          setDetail(null);
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <button
          type="button"
          className="reference-catalog-close"
          onClick={close}
          aria-label="Fechar ficha ampliada"
        >
          <X size={22} aria-hidden="true" />
        </button>
        {detail && (
          <div className="reference-catalog-dialog-body">
            <ReferenceImage
              cell={detail.item.imageCell}
              artwork={
                detail.kind === "part"
                  ? catalog.partArtwork
                  : (detail.item.artwork ?? catalog.assemblyArtwork)
              }
              name={detail.item.name}
            />
            <div>
              <span className="reference-catalog-eyebrow">
                {detail.kind === "part"
                  ? `ITEM ${String(detail.item.number).padStart(2, "0")}`
                  : "SUBCONJUNTO"}{" "}
                / {visualSystemName(catalog, detail.item.system)}
              </span>
              <h3 id={`${id}-dialog-title`}>{detail.item.name}</h3>
              <p>{detail.item.description}</p>
              <PartNarrationControls
                narration={narration}
                part={detail.item}
                surface
              />
              {detail.kind === "part" ? (
                <>
                  <h4>
                    {detail.item.kind === "context"
                      ? "Leitura da ilustração"
                      : "Aplicação e identificação"}
                  </h4>
                  <p>{detail.item.note}</p>
                  {detail.item.kind !== "context" && (
                    <Link
                      href={`/pecas?buy=${encodeURIComponent(detail.item.name)}`}
                      prefetch={false}
                    >
                      Pesquisar esta peça nas lojas ↗
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <h4>Elementos em detalhe</h4>
                  <ul>
                    {detail.item.details.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                  {detail.item.partNumbers.length > 0 && (
                    <>
                      <h4>Correspondência no catálogo</h4>
                      <p>
                        {detail.item.partNumbers
                          .map(
                            (number) =>
                              `${number}. ${catalog.parts.find((part) => part.number === number)!.name}`,
                          )
                          .join(" · ")}
                      </p>
                    </>
                  )}
                </>
              )}
              <p className="reference-catalog-dialog-note">
                Imagem didática gerada; confirme código, versão e motor antes de
                selecionar uma peça para o veículo.
              </p>
            </div>
          </div>
        )}
      </dialog>
    </section>
  );
}
