import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/proposal-ai")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace("Bearer ", "");
        if (!token) return new Response("Unauthorized", { status: 401 });
        const sb = createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: claims } = await sb.auth.getClaims(token);
        if (!claims?.claims?.sub) return new Response("Unauthorized", { status: 401 });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p = (await request.json()) as any;
        let nicheCtx = "";
        if (p.niche_id) {
          const { data } = await sb
            .from("niches")
            .select("*, niche_pains(content), niche_needs(content)")
            .eq("id", p.niche_id)
            .maybeSingle();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const n = data as any;
          if (n)
            nicheCtx = `Nicho: ${n.name}. Público típico: ${n.audience ?? ""}. Gargalos comuns do nicho: ${(n.niche_pains ?? []).map((x: { content: string }) => x.content).join("; ")}. Necessidades comuns: ${(n.niche_needs ?? []).map((x: { content: string }) => x.content).join("; ")}. Solução padrão da agência: ${n.solution ?? ""}.`;
        }

        const prompt = `Você é Lucas Santos, consultor da Santos MktPro (agência de marketing digital). Crie o conteúdo de uma PROPOSTA COMERCIAL consultiva, detalhada e personalizada, em português do Brasil.

DADOS DO CLIENTE
Empresa: ${p.company || p.client_name}
Responsável: ${p.client_name}
Subnicho: ${p.sub_niche || "-"}
Cidade/Bairro: ${p.city || "-"} / ${p.district || "-"}
Público-alvo: ${p.audience || "-"}
Objetivo principal: ${p.goal || "-"}
${nicheCtx}
Gargalos levantados: ${p.bottlenecks || "-"}
Diagnóstico observado pelo consultor (ÚNICA fonte de fatos sobre a situação atual): ${p.diagnosis_notes || "nenhum diagnóstico detalhado informado"}
Solução proposta: ${p.solution || "-"}
Serviços contratados: ${(p.items ?? []).map((i: { name: string }) => i.name).join(", ")}

REGRAS
- Nunca prometa resultados garantidos nem percentuais. Use "buscar aumentar", "ampliar", "estruturar", "otimizar", "criar oportunidades".
- No diagnóstico, só afirme problemas presentes no diagnóstico do consultor ou nos gargalos levantados. Áreas não analisadas: situação "A ser avaliado no onboarding".
- Inclua no diagnóstico apenas áreas relevantes aos serviços e ao nicho (entre: Google, Google Maps, Site, SEO, Instagram, Facebook, WhatsApp, Google Ads, Meta Ads, Conteúdo, Conversão, Posicionamento, Presença local, Concorrência). 4 a 8 áreas.
- Para CADA serviço contratado, crie um detalhamento adaptado ao nicho (ex.: Google Ads para hamburgueria foca em "hambúrguer perto de mim", "delivery"; ar-condicionado em instalação/manutenção). Atividades concretas, separadas por "\\n".
- Texto profissional, específico para esta empresa, sem genéricos.

Responda SOMENTE com JSON válido, sem markdown, neste formato:
{"about":"parágrafo sobre a Santos MktPro","summary":"resumo executivo personalizado (2 parágrafos)","diagnosis":[{"area":"","situation":"","impact":"","opportunity":"","priority":"Alta|Média|Baixa"}],"needs":["..."],"objectives":["..."],"strategy":"como os serviços trabalham juntos; uma linha por serviço no formato 'Serviço → papel'","services":[{"name":"nome exato do serviço","objective":"","what":"atividades separadas por \\n","how":"","why":"","tracking":"","kpis":"indicadores separados por vírgula"}],"process":["etapa 1: ...","etapa 2: ..."],"followup":"como será o acompanhamento e relatórios"}`;

import { openAiChatJson } from "@/lib/openai.server";

        try {
          const json = await openAiChatJson(prompt, { model: "gpt-4o", signal: request.signal });
          return Response.json(json);
        } catch (err: any) {
          if (process.env["LOVABLE_API_KEY"]) {
            const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env["LOVABLE_API_KEY"]}`,
                "Lovable-API-Key": process.env["LOVABLE_API_KEY"]!,
                "X-Lovable-AIG-SDK": "fetch",
              },
              body: JSON.stringify({
                model: "openai/gpt-4o-mini",
                input: [{ role: "user", content: prompt }],
                stream: true,
                store: false,
                reasoning: { effort: "low" },
                text: { format: { type: "json_object" } },
              }),
              signal: request.signal,
            });
            if (res.ok && res.body) {
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
                  try {
                    const ev = JSON.parse(l.slice(5).trim());
                    if (ev.type === "response.output_text.delta") out += ev.delta;
                  } catch { /* ignore */ }
                }
              }
              const json = out.slice(out.indexOf("{"), out.lastIndexOf("}") + 1);
              return Response.json(JSON.parse(json));
            }
          }
          return new Response(err.message || "Erro ao processar IA", { status: 502 });
        }
      },
    },
  },
});
