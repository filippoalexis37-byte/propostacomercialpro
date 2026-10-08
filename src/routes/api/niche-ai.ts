import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/niche-ai")({
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

        const body = (await request.json()) as {
          niche_id?: string; mode?: string; question?: string; history?: { role: string; content: string }[];
        };
        if (!body.question?.trim()) return new Response("Pergunta vazia", { status: 400 });

        let ctx = "";
        if (body.niche_id) {
          const { data: n } = await sb
            .from("niches")
            .select("*, niche_pains(content), niche_challenges(content), niche_needs(content), niche_objections(objection, answer)")
            .eq("id", body.niche_id)
            .maybeSingle();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const x = n as any;
          if (x) {
            const list = (a: { content: string }[] | null) => (a ?? []).map((i) => `- ${i.content}`).join("\n");
            ctx = `NICHO: ${x.name}
Público: ${x.audience ?? ""}
Descrição: ${x.description ?? ""}
Gargalos:\n${list(x.niche_pains)}
Desafios:\n${list(x.niche_challenges)}
Necessidades:\n${list(x.niche_needs)}
Solução da agência: ${x.solution ?? x.recommended_services ?? ""}
Argumentos de venda: ${x.sales_arguments ?? ""}
Objeções conhecidas:\n${(x.niche_objections ?? []).map((o: { objection: string; answer: string }) => `- ${o.objection} → ${o.answer ?? ""}`).join("\n")}`;
          }
        }

        const modes: Record<string, string> = {
          duvida: "Responda a dúvida do cliente de forma clara e convincente.",
          objecao: "Quebre a objeção com empatia, argumento e uma pergunta de avanço.",
          sondagem: "Gere perguntas de sondagem (diagnóstico SPIN) para descobrir dores e urgência.",
          mensagem: "Escreva uma mensagem pronta de prospecção/follow-up.",
        };

        const system = `Você é um consultor comercial especialista em marketing digital da agência Santos MktPro, especializado no nicho abaixo.
${modes[body.mode ?? "duvida"] ?? modes["duvida"]}
Escreva em português do Brasil, tom humano e consultivo, pronto para copiar e enviar ao cliente pelo WhatsApp (curto, sem markdown pesado, sem títulos). Nunca invente números ou resultados garantidos.
${ctx}`;

        const input = [
          { role: "system", content: system },
          ...(body.history ?? []).slice(-10),
          { role: "user", content: body.question },
        ];

import { openAiChatStream } from "@/lib/openai.server";

        try {
          const stream = await openAiChatStream(input, { model: "gpt-4o-mini", signal: request.signal });
          return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache, no-transform" } });
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
              body: JSON.stringify({ model: "openai/gpt-4o-mini", input, stream: true, store: false, reasoning: { effort: "low" } }),
              signal: request.signal,
            });
            if (res.ok && res.body) {
              const decoder = new TextDecoder();
              const encoder = new TextEncoder();
              let buf = "";
              const stream = res.body.pipeThrough(
                new TransformStream<Uint8Array, Uint8Array>({
                  transform(chunk, ctrl) {
                    buf += decoder.decode(chunk, { stream: true });
                    const parts = buf.split("\n");
                    buf = parts.pop() ?? "";
                    for (const line of parts) {
                      if (!line.startsWith("data:")) continue;
                      const d = line.slice(5).trim();
                      if (!d || d === "[DONE]") continue;
                      try {
                        const ev = JSON.parse(d);
                        if (ev.type === "response.output_text.delta" && ev.delta) ctrl.enqueue(encoder.encode(ev.delta));
                      } catch { /* partial */ }
                    }
                  },
                }),
              );
              return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache, no-transform" } });
            }
          }
          return new Response(err.message || "Erro no streaming de IA", { status: 502 });
        }
      },
    },
  },
});
