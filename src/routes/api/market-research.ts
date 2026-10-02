import { createFileRoute } from "@tanstack/react-router";
import { authUser, searchPlaces, aiJson, type Place } from "@/lib/api-auth.server";

export const Route = createFileRoute("/api/market-research")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!(await authUser(request))) return new Response("Unauthorized", { status: 401 });
        const b = (await request.json()) as {
          company: string; niche: string; city: string; district?: string; services?: string; audience?: string; level: string; notes?: string;
        };
        if (!b.niche || !b.city) return new Response("Informe nicho e cidade", { status: 400 });
        const n = b.level === "Essencial" ? 10 : b.level === "Profissional" ? 15 : 20;
        let competitors: Place[] = [];
        try {
          competitors = (await searchPlaces(`${b.niche} em ${b.district ? b.district + ", " : ""}${b.city}`, n))
            .filter((p) => p.name.toLowerCase() !== b.company?.toLowerCase());
        } catch { /* sem dados do Maps */ }

        const comp = competitors.map((c, i) => `${i + 1}. ${c.name} | nota ${c.rating ?? "-"} (${c.reviews ?? 0} avaliações) | site: ${c.website || "não encontrado"} | ${c.address}`).join("\n");
        const extra = b.level === "Essencial" ? "" : b.level === "Profissional"
          ? "Inclua também análise de preços (apenas faixas típicas de mercado, deixando claro que são estimativas a validar) e estratégia."
          : "Inclua tudo: preços estimados, análise regional, perfil do cliente ideal (ICP), estratégia comercial e plano de ação 30/60/90 dias.";
        try {
          const data = await aiJson(`Você é analista de mercado da Santos MktPro. Elabore uma PESQUISA DE MERCADO (${b.level}) profissional em português do Brasil para:
Empresa cliente: ${b.company || "-"} | Nicho: ${b.niche} | Local: ${b.district || ""} ${b.city} | Serviços da empresa: ${b.services || "-"} | Público: ${b.audience || "-"} | Observações do consultor: ${b.notes || "-"}
Concorrentes reais encontrados no Google Maps (USE APENAS ESTES DADOS, não invente concorrentes):
${comp || "nenhum dado do Maps disponível"}
${extra}
Regras: não invente números de mercado; quando for estimativa, diga "estimativa". Seja específico para o nicho e a cidade.
Responda SOMENTE JSON:
{"summary":"resumo executivo","market":"análise do mercado e demanda local","competitors_analysis":"análise geral da concorrência e posicionamento","competitor_notes":[{"name":"","strengths":"","weaknesses":""}],"prices":"análise de preços ou vazio","audience":"perfil e dores do público","icp":"cliente ideal ou vazio","opportunities":["..."],"strategy":[{"channel":"Google Ads|Meta Ads|Google Meu Negócio|SEO local|Landing page|WhatsApp|Conteúdo","action":""}],"action_plan":[{"period":"30 dias|60 dias|90 dias","actions":""}],"next_steps":"recomendação final e convite para execução"}`, request.signal);
          return Response.json({ ...data, competitors });
        } catch (e) {
          return new Response((e as Error).message, { status: (e as { status?: number }).status ?? 502 });
        }
      },
    },
  },
});
