import { type NextRequest } from "next/server";

// ─── Constantes (server-side only, não expostas ao cliente) ──────────────────
const PVWATTS_API_KEY = process.env.PVWATTS_API_KEY || "";
const PVWATTS_API_URL = "https://developer.nrel.gov/api/pvwatts/v8.json";

// Parâmetros permitidos para a API PVWatts (whitelist de segurança)
const ALLOWED_PARAMS = new Set([
  "lat",
  "lon",
  "system_capacity",
  "module_type",
  "losses",
  "array_type",
  "tilt",
  "azimuth",
  "dc_ac_ratio",
  "inv_eff",
  "gcr",
  "timeframe",
  "dataset",
  "albedo",
  "bifaciality",
  "soiling",
]);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Construir query string apenas com parâmetros permitidos
  const params = new URLSearchParams();
  params.set("api_key", PVWATTS_API_KEY);

  for (const key of ALLOWED_PARAMS) {
    const value = searchParams.get(key);
    if (value !== null && value.trim() !== "") {
      params.set(key, value);
    }
  }

  // Validar campos obrigatórios
  if (!params.has("lat") || !params.has("lon") || !params.has("system_capacity")) {
    return Response.json(
      { errors: ["Parâmetros obrigatórios ausentes: lat, lon, system_capacity"] },
      { status: 400 }
    );
  }

  try {
    const nrelResponse = await fetch(`${PVWATTS_API_URL}?${params.toString()}`, {
      headers: {
        "Accept": "application/json",
      },
    });

    // Repassar resposta da NREL (status + corpo) intacta
    const data = await nrelResponse.json();

    return Response.json(data, { status: nrelResponse.status });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro de conexão com a API NREL";

    return Response.json(
      { errors: [message] },
      { status: 502 }
    );
  }
}
