"use client";
import { useState } from "react";
import {
  ReferenceOverview,
  VisualReferenceCatalog,
} from "./visual-reference-catalog";
import {
  technicalCatalogs,
  defaultTechnicalCatalog,
  type TechnicalCatalogId,
} from "@/lib/technical-catalogs";
export type { TechnicalCatalogId } from "@/lib/technical-catalogs";
export function TechnicalCatalogLibrary({
  initialCatalog = defaultTechnicalCatalog,
}: {
  initialCatalog?: TechnicalCatalogId;
}) {
  const [selected, setSelected] = useState(initialCatalog);
  // Native history updates keep the article filters and avoid reloading content.
  function select(id: TechnicalCatalogId) {
    setSelected(id);
    const url = new URL(window.location.href);
    url.searchParams.set("catalog", id);
    window.history.replaceState(null, "", url);
  }
  const catalog = technicalCatalogs[selected];
  return (
    <div className="technical-catalog-library">
      <h2>Catálogos técnicos ilustrados</h2>
      <p className="technical-catalog-intro">
        Escolha um conjunto para explorar as imagens, funções e detalhes de cada
        componente.
      </p>
      <div
        className="technical-catalog-choices"
        role="group"
        aria-label="Escolher catálogo técnico"
      >
        {Object.values(technicalCatalogs).map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={selected === item.id}
            aria-label={`Abrir catálogo ${item.name}`}
            onClick={() => select(item.id as TechnicalCatalogId)}
          >
            <ReferenceOverview overview={item.overview} />
            <span className="technical-catalog-choice-text">
              <strong>{item.name}</strong>
              <span>
                {item.parts.length} {item.partLabels?.plural ?? "componentes"} ·{" "}
                {item.assemblies.length} {item.assemblyNoun[1]}
              </span>
              <span className="technical-catalog-choice-action">
                {selected === item.id
                  ? "Catálogo aberto"
                  : "Explorar catálogo →"}
              </span>
            </span>
          </button>
        ))}
      </div>
      <VisualReferenceCatalog key={selected} catalog={catalog} />
    </div>
  );
}
