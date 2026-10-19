import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState, useEffect } from "react";
import { Copy, Send, Square, Bot, Sparkles, Key, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/crud-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { pageHead } from "@/lib/meta";
import { streamOpenAICompletion, getOpenAIApiKey, setOpenAIApiKey } from "@/lib/openai";

export const Route = createFileRoute("/_authenticated/assistente")({
  head: pageHead("Assistente IA", "IA especialista em cada nicho para dúvidas, objeções e sondagem."),
  component: Assistente,
});

type Msg = { role: "user" | "assistant"; content: string };
const MODES = [
  { id: "duvida", label: "Dúvida do cliente" },
  { id: "objecao", label: "Quebrar objeção" },
  { id: "sondagem", label: "Perguntas de sondagem" },
  { id: "mensagem", label: "Mensagem pronta" },
];
const sel = "h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground";

function Assistente() {
  const { data: niches = [] } = useQuery({
    queryKey: ["niches-list"],
    queryFn: async () => (await db.from("niches").select("id, name").order("name")).data ?? [],
  });
  const [niche, setNiche] = useState("");
  const [mode, setMode] = useState("duvida");
  const [q, setQ] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const abort = useRef<AbortController | null>(null);

  // Estado da chave API OpenAI
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showKeyCard, setShowKeyCard] = useState(true);
  const [hasSavedKey, setHasSavedKey] = useState(false);

  useEffect(() => {
    const k = getOpenAIApiKey();
    if (k && k.trim().startsWith("sk-")) {
      setApiKeyInput(k);
      setHasSavedKey(true);
    }
  }, []);

  const handleSaveKey = () => {
    if (!apiKeyInput.trim().startsWith("sk-")) {
      toast.error("Chave inválida. A chave da OpenAI deve começar com 'sk-'");
      return;
    }
    setOpenAIApiKey(apiKeyInput.trim());
    setHasSavedKey(true);
    toast.success("Chave OpenAI salva com sucesso! Agora você pode usar o Assistente.");
  };

  // Busca detalhes do nicho caso selecionado
  const { data: currentNicheData } = useQuery({
    queryKey: ["niche-detail", niche],
    enabled: !!niche,
    queryFn: async () => {
      const { data } = await db
        .from("niches")
        .select("*, niche_pains(content), niche_challenges(content), niche_needs(content), niche_objections(objection, answer)")
        .eq("id", niche)
        .maybeSingle();
      return data;
    },
  });

  const buildSystemPrompt = () => {
    let ctx = "";
    if (currentNicheData) {
      const x = currentNicheData as any;
      const list = (a: { content: string }[] | null) => (a ?? []).map((i) => `- ${i.content}`).join("\n");
      ctx = `\nNICHO ESPECÍFICO: ${x.name}
Público: ${x.audience ?? ""}
Descrição: ${x.description ?? ""}
Gargalos:\n${list(x.niche_pains)}
Desafios:\n${list(x.niche_challenges)}
Necessidades:\n${list(x.niche_needs)}
Solução da agência: ${x.solution ?? x.recommended_services ?? ""}
Argumentos de venda: ${x.sales_arguments ?? ""}
Objeções conhecidas:\n${(x.niche_objections ?? []).map((o: { objection: string; answer: string }) => `- ${o.objection} → ${o.answer ?? ""}`).join("\n")}`;
    }

    const modesDesc: Record<string, string> = {
      duvida: "Responda a dúvida do cliente de forma clara, consultiva e convincente.",
      objecao: "Quebre a objeção com empatia, argumento forte e uma pergunta de avanço para fechar ou agendar reunião.",
      sondagem: "Gere perguntas de sondagem profundas (diagnóstico SPIN) para descobrir dores e urgência.",
      mensagem: "Escreva uma mensagem pronta de prospecção ou follow-up direto no WhatsApp.",
    };

    return `Você é Lucas Santos, consultor comercial sênior e estrategista da Santos MktPro (agência de marketing digital).
${modesDesc[mode] ?? modesDesc["duvida"]}
Escreva em português do Brasil, tom humano, consultivo e persuasivo, pronto para copiar e enviar ao cliente pelo WhatsApp (direto, sem introduções robóticas, sem títulos exagerados). Nunca invente garantias irreais.${ctx}`;
  };

  async function ask() {
    if (!q.trim() || busy) return;

    const currentKey = getOpenAIApiKey();
    if (!currentKey || !currentKey.trim().startsWith("sk-")) {
      toast.error("Por favor, insira e salve sua chave da OpenAI no campo acima para usar o assistente.");
      setShowKeyCard(true);
      return;
    }

    const question = q;
    const history = msgs;
    setQ("");
    setMsgs([...history, { role: "user", content: question }, { role: "assistant", content: "" }]);
    setBusy(true);
    abort.current = new AbortController();

    try {
      // 1. Tenta via Client OpenAI direto com fallback de rota API
      const systemMessage = { role: "system", content: buildSystemPrompt() };
      const formattedMessages = [
        systemMessage,
        ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        { role: "user", content: question },
      ];

      let accumulated = "";
      await streamOpenAICompletion(formattedMessages, {
        signal: abort.current.signal,
        onDelta: (delta) => {
          accumulated += delta;
          setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: accumulated }]);
        },
      });
    } catch (clientErr: any) {
      if (clientErr.name === "AbortError") return;

      console.warn("Client OpenAI call fallback para /api/niche-ai:", clientErr);
      // 2. Se falhar no client, tenta via backend /api/niche-ai
      try {
        const { data } = await supabase.auth.getSession();
        const res = await fetch("/api/niche-ai", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` },
          body: JSON.stringify({ niche_id: niche || undefined, mode, question, history }),
          signal: abort.current.signal,
        });
        if (!res.ok || !res.body) throw new Error((await res.text()) || clientErr.message || "Erro na IA");

        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let acc = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += dec.decode(value, { stream: true });
          setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: acc }]);
        }
      } catch (backendErr: any) {
        if (backendErr.name !== "AbortError") {
          toast.error(backendErr.message || clientErr.message || "Erro ao conectar com a IA da OpenAI");
          setMsgs((m) => (m[m.length - 1]?.content ? m : m.slice(0, -1)));
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Assistente IA por nicho"
        subtitle="Tire dúvidas, quebre objeções e gere sondagens prontas para enviar ao cliente consumindo seus créditos OpenAI."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowKeyCard(!showKeyCard)}
            className="gap-1.5 text-xs"
          >
            <Key className="h-3.5 w-3.5 text-primary" />
            {showKeyCard ? "Ocultar Chave API" : "Configurar Chave API"}
          </Button>
        }
      />

      {/* Caixa de Entrada da Chave OpenAI Fixa no Topo */}
      {showKeyCard && (
        <div className="mb-5 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:p-5 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                  Chave API da OpenAI
                  {hasSavedKey && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-normal text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <Check className="h-3 w-3" /> Conectada
                    </span>
                  )}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Insira sua chave (começa com <strong className="text-foreground font-mono">sk-proj-...</strong>) para usar seus créditos diretamente.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-col sm:flex-row gap-2 max-w-2xl">
            <div className="relative flex-1">
              <Input
                type="password"
                placeholder="Cole sua chave sk-proj-... aqui"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="font-mono text-xs pr-9 bg-background"
              />
            </div>
            <Button
              onClick={handleSaveKey}
              className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs shrink-0 font-medium h-9"
            >
              <Check className="h-4 w-4" /> Salvar Chave
            </Button>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <select className={sel} value={niche} onChange={(e) => setNiche(e.target.value)}>
          <option value="">Escolha o nicho...</option>
          {niches.map((n: { id: string; name: string }) => <option key={n.id} value={n.id}>{n.name}</option>)}
        </select>
        <select className={sel} value={mode} onChange={(e) => setMode(e.target.value)}>
          {MODES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
        {msgs.length > 0 && <Button variant="ghost" onClick={() => setMsgs([])}>Nova conversa</Button>}
      </div>

      <div className="panel mb-4 min-h-[320px] space-y-4 p-5">
        {msgs.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center text-muted-foreground">
            <Bot className="mb-3 h-10 w-10 text-primary" />
            <p className="max-w-md text-sm">Ex.: "O cliente disse que já tentou tráfego pago e não deu certo, o que respondo?"</p>
          </div>
        )}
        {msgs.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="ml-auto max-w-[80%] rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground">{m.content}</div>
          ) : (
            <div key={i} className="max-w-[90%]">
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {m.content || <span className="animate-pulse text-muted-foreground">Consultando OpenAI...</span>}
              </div>
              {m.content && !(busy && i === msgs.length - 1) && (
                <Button size="sm" variant="outline" className="mt-2" onClick={() => { navigator.clipboard.writeText(m.content); toast.success("Copiado! Cole no WhatsApp do cliente."); }}>
                  <Copy className="mr-1 h-3.5 w-3.5" /> Copiar para o cliente
                </Button>
              )}
            </div>
          ),
        )}
      </div>

      <div className="flex gap-2">
        <Textarea rows={2} placeholder="Digite a dúvida, objeção ou situação do cliente..." value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(); } }} />
        {busy ? (
          <Button size="icon" variant="outline" className="h-auto w-12" onClick={() => abort.current?.abort()} aria-label="Parar"><Square className="h-4 w-4" /></Button>
        ) : (
          <Button size="icon" className="h-auto w-12" onClick={ask} aria-label="Enviar"><Send className="h-4 w-4" /></Button>
        )}
      </div>
    </div>
  );
}
