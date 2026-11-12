"use client";
import { useEffect, useId, useState } from "react";
import type { SearchInput } from "@/lib/automotive-search/contracts";
import type { VehicleOption } from "@/lib/vehicles/catalog";
import { normalizePartText } from "@/lib/parts/catalog";
const brands = [
  "Chevrolet",
  "Fiat",
  "Ford",
  "Volkswagen",
  "Hyundai",
  "Toyota",
  "Honda",
  "Renault",
  "Nissan",
  "Peugeot",
  "Citroën",
  "Jeep",
  "Mitsubishi",
  "Kia",
  "BYD",
  "Caoa Chery",
];
function useCatalog(query: string | null) {
  const [state, setState] = useState<{
    query: string | null;
    options: VehicleOption[];
    error: string;
    loading: boolean;
  }>({ query: null, options: [], error: "", loading: false });
  useEffect(() => {
    if (query === null) return;
    const abort = new AbortController();
    async function load() {
      setState({ query, options: [], error: "", loading: true });
      try {
        const response = await fetch("/api/vehicle-catalog" + query, {
          signal: abort.signal,
        });
        const body = await response.json();
        if (!response.ok) throw new Error("catalog_unavailable");
        const options = Array.isArray(body.options)
          ? body.options.filter(
              (v: VehicleOption) =>
                typeof v.id === "string" && typeof v.name === "string",
            )
          : [];
        if (!abort.signal.aborted)
          setState({ query, options, error: "", loading: false });
      } catch {
        if (!abort.signal.aborted)
          setState({
            query,
            options: [],
            error: "Catálogo indisponível. Informe os dados manualmente.",
            loading: false,
          });
      }
    }
    void load();
    return () => abort.abort();
  }, [query]);
  return state.query === query
    ? state
    : { query, options: [], error: "", loading: query !== null };
}
const brandIdentity = (s: string) =>
  normalizePartText(s)
    .replace(/^gm chevrolet$/, "chevrolet")
    .replace(/^vw volkswagen$/, "volkswagen");
export function VehicleFilters({
  value,
  onChange,
}: {
  value: SearchInput;
  onChange: (value: SearchInput) => void;
}) {
  const id = useId(),
    makes = useCatalog("");
  const make = makes.options.find(
    (b) => brandIdentity(b.name) === brandIdentity(value.brand),
  );
  const models = useCatalog(make ? "?brand=" + make.id : null);
  const model = models.options.find(
    (m) => normalizePartText(m.name) === normalizePartText(value.model),
  );
  const years = useCatalog(
    make && model ? "?brand=" + make.id + "&model=" + model.id : null,
  );
  const year = years.options.find((y) => y.id.split("-")[0] === value.year);
  const version = useCatalog(
    make && model && year
      ? "?brand=" + make.id + "&model=" + model.id + "&year=" + year.id
      : null,
  );
  const notice = [makes, models, years, version].find((s) => s.error)?.error;
  const loading = [makes, models, years, version].some((s) => s.loading);
  return (
    <>
      <div className="auto-grid">
        <label>
          Marca do veículo
          <input
            value={value.brand}
            list={`${id}-brands`}
            maxLength={60}
            autoComplete="off"
            onChange={(e) =>
              onChange({
                ...value,
                brand: e.target.value,
                model: "",
                year: "",
                engine: "",
              })
            }
          />
        </label>
        <datalist id={`${id}-brands`}>
          {[...new Set([...makes.options.map((v) => v.name), ...brands])]
            .sort()
            .map((name) => (
              <option key={name} value={name} />
            ))}
        </datalist>
        <label>
          Modelo
          <input
            value={value.model}
            list={`${id}-models`}
            maxLength={150}
            autoComplete="off"
            placeholder={
              make
                ? "Selecione ou digite o modelo"
                : "Informe a montadora ou digite"
            }
            onChange={(e) =>
              onChange({
                ...value,
                model: e.target.value,
                year: "",
                engine: "",
              })
            }
          />
        </label>
        <datalist id={`${id}-models`}>
          {models.options.map((v) => (
            <option key={v.id} value={v.name} />
          ))}
        </datalist>
        <label>
          Ano
          <input
            value={value.year}
            list={`${id}-years`}
            inputMode="numeric"
            maxLength={4}
            autoComplete="off"
            onChange={(e) =>
              onChange({ ...value, year: e.target.value, engine: "" })
            }
          />
        </label>
        <datalist id={`${id}-years`}>
          {[...new Set(years.options.map((y) => y.id.split("-")[0]))]
            .sort()
            .reverse()
            .map((y) => (
              <option key={y} value={y} />
            ))}
        </datalist>
        <label>
          Motor / versão
          <input
            value={value.engine}
            list={`${id}-versions`}
            maxLength={160}
            autoComplete="off"
            placeholder="Selecione a versão ou informe o motor"
            onChange={(e) => onChange({ ...value, engine: e.target.value })}
          />
        </label>
        <datalist id={`${id}-versions`}>
          {version.options.map((v) => (
            <option key={v.id} value={v.name} />
          ))}
        </datalist>
        <label>
          Código da peça informado
          <input
            value={value.code}
            maxLength={60}
            onChange={(e) => onChange({ ...value, code: e.target.value })}
          />
        </label>
        <label>
          Fonte técnica (web)
          <select
            value={value.source}
            onChange={(e) =>
              onChange({
                ...value,
                source: e.target.value as SearchInput["source"],
              })
            }
          >
            <option value="all">Todas as fontes</option>
            {[
              "bosch",
              "ngk",
              "delphi",
              "denso",
              "continental",
              "mahle",
              "gates",
              "oficina",
            ].map((s) => (
              <option key={s} value={s}>
                {s === "oficina" ? "Oficina Brasil" : s.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="auto-catalog-note">
        {notice ||
          (loading
            ? "Carregando opções do catálogo…"
            : "Opções de veículo: tabela FIPE via API Parallelum. Versão selecionável quando disponível; dados manuais também são aceitos.")}{" "}
        A seleção não confirma aplicação de peças.
      </p>
    </>
  );
}
