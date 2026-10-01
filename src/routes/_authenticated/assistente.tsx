import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Copy, Send, Square, Bot } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/crud-page";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { pageHead } from "@/lib/meta";

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

  async function ask() {
    if (!q.trim() || busy) return;
    const question = q;
    const history = msgs;
    setQ("");
    setMsgs([...history, { role: "user", content: question }, { role: "assistant", content: "" }]);
    setBusy(true);
    abort.current = new AbortController();
    try {
      const { data } = await supabase.auth.getSession();
      const res = await fetch("/api/niche-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token ?? ""}` },
        body: JSON.stringify({ niche_id: niche || undefined, mode, question, history }),
        signal: abort.current.signal,
      });
      if (!res.ok || !res.body) throw new Error((await res.text()) || "Erro na IA");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMsgs((m) => [...m.slice(0, -1), { role: "assistant", content: acc }]);
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        toast.error((e as Error).message);
        setMsgs((m) => (m[m.length - 1]?.content ? m : m.slice(0, -1)));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="Assistente IA por nicho" subtitle="Tire dúvidas, quebre objeções e gere sondagens prontas para enviar ao cliente." />
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
                {m.content || <span className="animate-pulse text-muted-foreground">Pensando...</span>}
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
