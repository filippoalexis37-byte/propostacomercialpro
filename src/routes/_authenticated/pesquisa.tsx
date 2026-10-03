import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileDown, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/crud-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { pageHead } from "@/lib/meta";
import { apiPost } from "@/lib/api";
import { brl } from "@/lib/db";
import { documentPdf, type DocSection } from "@/lib/pdf";

export const Route = createFileRoute("/_authenticated/pesquisa")({
  head: pageHead("Pesquisa de mercado", "Pesquisa de mercado e concorrência com dados do Google Maps."),
  component: Pesquisa,
});

/* eslint-disable @typescript-eslint/no-explicit-any */
const LEVELS = [
  { id: "Essencial", price: 497, desc: "Mercado + 10 concorrentes + presença digital" },
  { id: "Profissional", price: 997, desc: "+ 15 concorrentes, preços, oportunidades e estratégia" },
  { id: "Completo", price: 1497, desc: "+ 20 concorrentes, análise regional, cliente ideal e plano 30/60/90" },
];

function Pesquisa() {
  const [f, setF] = useState({ company: "", niche: "", city: "", district: "", services: "", audience: "", notes: "", level: "Profissional" });
  const [r, setR] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setF({ ...f, [k]: v });

  async function run() {
    if (!f.niche || !f.city) return void toast.error("Informe nicho e cidade");
    setBusy(true);
    try { setR(await apiPost("/api/market-research", f)); toast.success("Pesquisa pronta"); }
    catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  }

  function pdf() {
    const list = (a?: string[]) => (a ?? []).map((x) => `• ${x}`).join("\n");
    const secs: DocSection[] = [
      { title: "Resumo executivo", body: r.summary },
      { title: "Mercado e demanda", body: r.market },
      { title: `Concorrentes mapeados (${r.competitors.length})`, table: { head: ["Empresa", "Nota", "Avaliações", "Site", "Endereço"], rows: r.competitors.map((c: any) => [c.name, String(c.rating ?? "-"), String(c.reviews ?? 0), c.website ? "Sim" : "Não", c.address]) } },
      { title: "Análise da concorrência", body: r.competitors_analysis },
      ...(r.competitor_notes?.length ? [{ title: "Pontos fortes e fracos", table: { head: ["Concorrente", "Pontos fortes", "Pontos fracos"], rows: r.competitor_notes.map((c: any) => [c.name, c.strengths, c.weaknesses]) } }] : []),
      ...(r.prices ? [{ title: "Preços", body: r.prices }] : []),
      { title: "Público", body: r.audience },
      ...(r.icp ? [{ title: "Cliente ideal (ICP)", body: r.icp }] : []),
      { title: "Oportunidades", body: list(r.opportunities) },
      { title: "Estratégia recomendada", table: { head: ["Canal", "Ação"], rows: (r.strategy ?? []).map((s: any) => [s.channel, s.action]) } },
      ...(r.action_plan?.length ? [{ title: "Plano de ação", table: { head: ["Período", "Ações"], rows: r.action_plan.map((a: any) => [a.period, a.actions]) } }] : []),
      { title: "Próximos passos", body: r.next_steps },
    ];
    documentPdf({ title: "Pesquisa de Mercado e Concorrência", subtitle: `${f.niche} • ${f.district ? f.district + ", " : ""}${f.city}`, client: f.company || f.niche, sections: secs, filename: `pesquisa-${(f.company || f.niche).toLowerCase().replace(/\s+/g, "-")}.pdf` });
  }

  return (
    <div>
      <PageHeader title="Pesquisa de mercado" subtitle="Concorrentes reais do Google Maps + análise da IA, pronta em PDF para o cliente." />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {LEVELS.map((l) => (
          <button key={l.id} onClick={() => set("level", l.id)} className={`panel p-4 text-left transition ${f.level === l.id ? "ring-2 ring-primary" : ""}`}>
            <div className="font-display font-semibold text-foreground">{l.id}</div>
            <div className="text-lg text-primary">{brl(l.price)}</div>
            <div className="text-xs text-muted-foreground">{l.desc}</div>
          </button>
        ))}
      </div>
      <div className="panel grid gap-4 p-5 sm:grid-cols-2">
        {[["company", "Empresa cliente"], ["niche", "Nicho *"], ["city", "Cidade *"], ["district", "Bairro/região"], ["services", "Serviços da empresa"], ["audience", "Público-alvo"]].map(([k = "", l]) => (
          <div key={k}><Label className="mb-1.5 block text-xs text-muted-foreground">{l}</Label><Input value={(f as any)[k]} onChange={(e) => set(k, e.target.value)} /></div>
        ))}
        <div className="sm:col-span-2"><Label className="mb-1.5 block text-xs text-muted-foreground">Observações (o que você já sabe do cliente)</Label><Textarea rows={3} value={f.notes} onChange={(e) => set("notes", e.target.value)} /></div>
        <div className="flex gap-2 sm:col-span-2">
          <Button onClick={run} disabled={busy}><Search className="mr-1 h-4 w-4" />{busy ? "Pesquisando (até 1 min)..." : "Gerar pesquisa"}</Button>
          {r && <Button variant="outline" onClick={pdf}><FileDown className="mr-1 h-4 w-4" />Baixar PDF</Button>}
        </div>
      </div>
      {r && (
        <div className="panel mt-6 space-y-4 p-5 text-sm">
          <h3 className="font-display text-lg text-foreground">Prévia</h3>
          <p className="whitespace-pre-wrap text-muted-foreground">{r.summary}</p>
          <div className="text-foreground">{r.competitors.length} concorrentes encontrados no Google Maps:</div>
          <ul className="list-disc pl-5 text-muted-foreground">{r.competitors.map((c: any) => <li key={c.id}>{c.name} — {c.rating ?? "-"} ★ ({c.reviews ?? 0})</li>)}</ul>
        </div>
      )}
    </div>
  );
}
