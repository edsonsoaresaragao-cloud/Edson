"use client";
import { useId, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search, X } from "lucide-react";
import {
  mercedesReferenceParts,
  mercedesReferenceAssemblies,
  referenceSystems,
  referenceSystemName,
  filterReferenceParts,
  filterReferenceAssemblies,
  type ReferencePart,
  type ReferenceAssembly,
  type ReferenceSystem,
} from "@/lib/mercedes-reference-catalog";

function ReferenceImage({
  cell,
  kind,
  name,
}: {
  cell: number;
  kind: "part" | "assembly";
  name: string;
}) {
  const columns = kind === "part" ? 4 : 3,
    rows = kind === "part" ? 6 : 2;
  return (
    <figure className="reference-catalog-picture">
      <div
        className={`reference-catalog-art reference-catalog-art-${kind}`}
        role="img"
        aria-label={`Ilustração didática gerada: ${name}`}
        style={{
          backgroundPosition: `${((cell % columns) / (columns - 1)) * 100}% ${(Math.floor(cell / columns) / (rows - 1)) * 100}%`,
        }}
      />
      <figcaption>Ilustração didática gerada</figcaption>
    </figure>
  );
}
type Detail =
  | { kind: "part"; item: ReferencePart }
  | { kind: "assembly"; item: ReferenceAssembly };

export function MercedesReferenceCatalog() {
  const id = useId(),
    dialog = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState(""),
    [system, setSystem] = useState<ReferenceSystem | "all">("all"),
    [order, setOrder] = useState<"number" | "name">("number"),
    [view, setView] = useState<"parts" | "assemblies">("parts"),
    [detail, setDetail] = useState<Detail | null>(null);
  const parts = filterReferenceParts(query, system, order),
    assemblies = filterReferenceAssemblies(query, system);
  const count = view === "parts" ? parts.length : assemblies.length;
  const filtered = !!query || system !== "all" || order !== "number";
  function clear() {
    setQuery("");
    setSystem("all");
    setOrder("number");
  }
  function open(value: Detail) {
    setDetail(value);
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
  }
  function close() {
    dialog.current?.close();
  }
  return (
    <section
      className="mercedes-reference-catalog"
      aria-labelledby={`${id}-title`}
    >
      <header className="reference-catalog-hero">
        <div>
          <span className="reference-catalog-eyebrow">
            CATÁLOGO VISUAL / COMPONENTES DO MOTOR
          </span>
          <h2 id={`${id}-title`}>Mercedes-Benz, peça por peça.</h2>
          <p>
            Referência educativa M264/M260: motor turbo de quatro cilindros em
            linha e injeção direta. Explore os componentes e os subconjuntos
            organizados a partir do cartaz.
          </p>
          <div className="reference-catalog-counts">
            <span>
              <strong>{mercedesReferenceParts.length}</strong> componentes
            </span>
            <span>
              <strong>{mercedesReferenceAssemblies.length}</strong> subconjuntos
            </span>
          </div>
          <Link
            href="/explodedview#engine-detail"
            className="reference-catalog-atlas-link"
          >
            Abrir atlas de motores <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <figure className="reference-catalog-overview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/engines/mercedes-benz-m264.webp"
            width="1024"
            height="1536"
            alt="Ilustração gerada do motor Mercedes-Benz M264 em vista explodida"
            loading="lazy"
            decoding="async"
          />
          <figcaption>Visão geral ilustrativa · M264</figcaption>
        </figure>
      </header>

      <div
        className="reference-catalog-modes"
        role="group"
        aria-label="Exibição do catálogo Mercedes-Benz"
      >
        <button
          type="button"
          aria-pressed={view === "parts"}
          onClick={() => setView("parts")}
        >
          Componentes <span>24</span>
        </button>
        <button
          type="button"
          aria-pressed={view === "assemblies"}
          onClick={() => setView("assemblies")}
        >
          Subconjuntos <span>5</span>
        </button>
      </div>
      <form
        className="reference-catalog-filters"
        role="search"
        aria-label="Pesquisar no catálogo Mercedes-Benz"
        onSubmit={(event) => event.preventDefault()}
      >
        <label className="reference-catalog-search">
          Buscar no catálogo
          <span>
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nome, número ou função: turbo, 20, óleo…"
              maxLength={150}
            />
          </span>
        </label>
        <label>
          Sistema do motor
          <select
            value={system}
            onChange={(event) =>
              setSystem(event.target.value as ReferenceSystem | "all")
            }
          >
            <option value="all">Todos os sistemas</option>
            {referenceSystems.map((item) => (
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
        {count}{" "}
        {view === "parts"
          ? count === 1
            ? "componente encontrado"
            : "componentes encontrados"
          : count === 1
            ? "subconjunto encontrado"
            : "subconjuntos encontrados"}
        {query.trim() && <> para “{query.trim()}”</>}
      </p>

      {view === "parts" ? (
        <ul
          className="reference-catalog-grid"
          aria-label="Componentes principais do motor Mercedes-Benz"
        >
          {parts.map((item) => (
            <li key={item.number}>
              <article className="reference-catalog-card">
                <ReferenceImage
                  cell={item.imageCell}
                  kind="part"
                  name={item.name}
                />
                <div className="reference-catalog-card-body">
                  <div className="reference-catalog-card-meta">
                    <span className="reference-catalog-number">
                      {String(item.number).padStart(2, "0")}
                    </span>
                    <span>{referenceSystemName(item.system)}</span>
                  </div>
                  <h3>{item.name}</h3>
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
          aria-label="Subconjuntos do motor Mercedes-Benz"
        >
          {assemblies.map((item) => (
            <li key={item.id}>
              <article className="reference-catalog-card">
                <ReferenceImage
                  cell={item.imageCell}
                  kind="assembly"
                  name={item.name}
                />
                <div className="reference-catalog-card-body">
                  <span className="reference-catalog-card-system">
                    {referenceSystemName(item.system)}
                  </span>
                  <h3>{item.name}</h3>
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

      <div className="reference-catalog-notes">
        <p>
          Imagens ilustrativas geradas para estudo, organizadas com base na
          referência visual. Não são fotografias de fabricante nem comprovam
          código ou compatibilidade. M264 e M260 não são tratados como motores
          com peças intercambiáveis.
        </p>
        <p>
          A numeração segue os 24 itens da lista principal: corrente de
          distribuição é 20; correia de acessórios é 21. Nos subconjuntos,
          termostato e radiador aparecem como contexto, além dos 24 itens.
        </p>
        <p>
          Cilindrada, potência, torque, presença de GPF, tipo de intercooler e
          acionamento da bomba d’água dependem da versão. Consulte os dados do
          fabricante e a aplicação do veículo.
        </p>
      </div>

      <dialog
        ref={dialog}
        className="reference-catalog-dialog"
        aria-labelledby={`${id}-dialog-title`}
        onClose={() => setDetail(null)}
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
              kind={detail.kind}
              name={detail.item.name}
            />
            <div>
              <span className="reference-catalog-eyebrow">
                {detail.kind === "part"
                  ? `ITEM ${String(detail.item.number).padStart(2, "0")}`
                  : "SUBCONJUNTO"}{" "}
                / {referenceSystemName(detail.item.system)}
              </span>
              <h3 id={`${id}-dialog-title`}>{detail.item.name}</h3>
              <p>{detail.item.description}</p>
              {detail.kind === "part" ? (
                <>
                  <h4>Aplicação e identificação</h4>
                  <p>{detail.item.note}</p>
                  <Link
                    href={`/pecas?buy=${encodeURIComponent(detail.item.name)}`}
                    prefetch={false}
                  >
                    Pesquisar esta peça nas lojas ↗
                  </Link>
                </>
              ) : (
                <>
                  <h4>Elementos em detalhe</h4>
                  <ul>
                    {detail.item.details.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                  <h4>Correspondência no catálogo</h4>
                  <p>
                    {detail.item.partNumbers
                      .map(
                        (number) =>
                          `${number}. ${mercedesReferenceParts.find((part) => part.number === number)!.name}`,
                      )
                      .join(" · ")}
                  </p>
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
