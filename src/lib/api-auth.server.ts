import { createClient } from "@supabase/supabase-js";

export async function authUser(request: Request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const sb = createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data } = await sb.auth.getClaims(token);
  return data?.claims?.sub ? sb : null;
}

export type Place = {
  id: string; name: string; address: string; phone: string; website: string;
  rating: number | null; reviews: number | null; maps: string; types: string;
};

export async function searchPlaces(query: string, max = 10): Promise<Place[]> {
  const res = await fetch("https://connector-gateway.lovable.dev/google_maps/places/v1/places:searchText", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env["LOVABLE_API_KEY"]}`,
      "X-Connection-Api-Key": process.env["GOOGLE_MAPS_API_KEY"]!,
      "Content-Type": "application/json",
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.googleMapsUri,places.primaryTypeDisplayName",
    },
    body: JSON.stringify({ textQuery: query, pageSize: Math.min(max, 20), languageCode: "pt-BR", regionCode: "BR" }),
  });
  if (!res.ok) throw new Error(`Google Maps [${res.status}]: ${(await res.text()).slice(0, 300)}`);
  const j = (await res.json()) as { places?: any[] }; // eslint-disable-line; // eslint-disable-line @typescript-eslint/no-explicit-any
  return (j.places ?? []).map((p: any) => ({
    id: p.id, name: p.displayName?.text ?? "", address: p.formattedAddress ?? "", phone: p.nationalPhoneNumber ?? "",
    website: p.websiteUri ?? "", rating: p.rating ?? null, reviews: p.userRatingCount ?? null, maps: p.googleMapsUri ?? "",
    types: p.primaryTypeDisplayName?.text ?? "",
  }));
}

export async function aiJson(prompt: string, signal?: AbortSignal): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env["LOVABLE_API_KEY"]}`,
      "Lovable-API-Key": process.env["LOVABLE_API_KEY"]!,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "openai/gpt-6-astra", input: [{ role: "user", content: prompt }], stream: true, store: false,
      reasoning: { effort: "low" }, text: { format: { type: "json_object" } },
    }),
    ...(signal ? { signal } : {}),
  });
  if (!res.ok || !res.body) {
    const msg = res.status === 429 ? "Muitas requisições, tente em instantes." : res.status === 402 ? "Créditos de IA esgotados." : (await res.text()).slice(0, 300);
    throw Object.assign(new Error(msg), { status: res.status });
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "", out = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const l of lines) {
      if (!l.startsWith("data:")) continue;
      try { const ev = JSON.parse(l.slice(5).trim()); if (ev.type === "response.output_text.delta") out += ev.delta; } catch { /* */ }
    }
  }
  return JSON.parse(out.slice(out.indexOf("{"), out.lastIndexOf("}") + 1));
}
