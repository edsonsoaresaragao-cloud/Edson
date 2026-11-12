import {
  createVehicleCatalog,
  vehicleCatalogUrl,
} from "@/lib/vehicles/catalog";
export const dynamic = "force-dynamic";
const catalog = createVehicleCatalog();
let start = 0,
  count = 0;
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const headers = { "Cache-Control": "no-store" };
  try {
    vehicleCatalogUrl(params);
  } catch {
    return Response.json(
      { error: "Seleção de veículo inválida." },
      { status: 400, headers },
    );
  }
  if (Date.now() - start > 60000) {
    start = Date.now();
    count = 0;
  }
  if (++count > 120)
    return Response.json(
      { error: "Limite de consultas ao catálogo. Tente novamente." },
      { status: 429, headers },
    );
  try {
    return Response.json(await catalog(params), { headers });
  } catch {
    console.warn("[vehicle-catalog] source_failure", {
      provider: "fipe",
      reason: "unavailable",
    });
    return Response.json(
      {
        error:
          "Catálogo indisponível. Você pode informar os dados manualmente.",
        options: [],
      },
      { status: 503, headers },
    );
  }
}
