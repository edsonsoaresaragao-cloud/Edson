import { readPartsResponse } from "../parts/http";
export type VehicleOption = { id: string; name: string };
export type VehicleCatalog = {
  options: VehicleOption[];
  source: string;
  consultedAt: string;
};
const origin = "https://parallelum.com.br/fipe/api/v1/carros/marcas";
const object = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
export function vehicleCatalogUrl(params: URLSearchParams) {
  const allowed = new Set(["brand", "model", "year"]);
  if ([...params.keys()].some((k) => !allowed.has(k)))
    throw new Error("invalid_query");
  const brand = params.get("brand"),
    model = params.get("model"),
    year = params.get("year");
  if (
    (brand && !/^\d{1,5}$/.test(brand)) ||
    (model && (!brand || !/^\d{1,7}$/.test(model))) ||
    (year && (!model || !/^(19|20)\d{2}-[1-9]$/.test(year)))
  )
    throw new Error("invalid_query");
  return (
    origin +
    (brand ? "/" + brand + "/modelos" : "") +
    (model ? "/" + model + "/anos" : "") +
    (year ? "/" + year : "")
  );
}
export function parseVehicleCatalog(
  body: unknown,
  params: URLSearchParams,
): VehicleOption[] {
  if (params.get("year")) {
    const r = object(body),
      name = typeof r.Modelo === "string" ? r.Modelo : "";
    return name
      ? [
          {
            id: params.get("year")!,
            name:
              name +
              (typeof r.Combustivel === "string" ? " · " + r.Combustivel : ""),
          },
        ]
      : [];
  }
  const list =
    params.get("brand") && !params.get("model") ? object(body).modelos : body;
  if (!Array.isArray(list)) throw new Error("invalid_response");
  const seen = new Set<string>();
  return list.slice(0, 1500).flatMap((v) => {
    const r = object(v),
      id = String(r.codigo ?? ""),
      name = typeof r.nome === "string" ? r.nome.trim() : "";
    if (
      !name ||
      name.length > 150 ||
      seen.has(id) ||
      !(params.get("model") ? /^(19|20)\d{2}-[1-9]$/ : /^\d{1,7}$/).test(id)
    )
      return [];
    seen.add(id);
    return [{ id, name }];
  });
}
export function createVehicleCatalog(
  fetcher: typeof fetch = fetch,
  now = Date.now,
) {
  const cache = new Map<string, { expiry: number; data: VehicleCatalog }>();
  const pending = new Map<string, Promise<VehicleCatalog>>();
  return async (params: URLSearchParams): Promise<VehicleCatalog> => {
    const url = vehicleCatalogUrl(params),
      saved = cache.get(url);
    if (saved && saved.expiry > now()) return saved.data;
    if (pending.has(url)) return pending.get(url)!;
    const task = (async () => {
      const response = await fetcher(url, {
        signal: AbortSignal.timeout(6000),
        redirect: "error",
        headers: { accept: "application/json" },
        cache: "no-store",
      });
      const options = parseVehicleCatalog(
        JSON.parse(await readPartsResponse(response)),
        params,
      );
      const data = {
        options,
        source: "Tabela FIPE · API pública Parallelum",
        consultedAt: new Date(now()).toISOString(),
      };
      cache.set(url, { expiry: now() + 6 * 3600000, data });
      while (cache.size > 300) cache.delete(cache.keys().next().value!);
      return data;
    })();
    pending.set(url, task);
    try {
      return await task;
    } finally {
      pending.delete(url);
    }
  };
}
