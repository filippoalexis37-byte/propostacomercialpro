import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FileDown, Mail, Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import { apiPost } from "@/lib/api";
import { toast } from "sonner";
import { db, brl, fmtDate } from "@/lib/db";
import { PageHeader } from "@/components/crud-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { pageHead } from "@/lib/meta";
import { proposalPdf, documentPdf, capturePdf, type ProposalItem } from "@/lib/pdf";

export const Route = createFileRoute("/_authenticated/propostas")({
  head: pageHead("Propostas", "Propostas comerciais em PDF com gargalos do nicho."),
  component: Propostas,
});

/* eslint-disable @typescript-eslint/no-explicit-any */
type P = {
  id?: string; number?: number; client_name: string; company: string; niche_id: string;
  items: ProposalItem[]; bottlenecks: string; solution: string; discount_percent: number;
  valid_until: string; notes: string; total?: number;
  sub_niche: string; city: string; district: string; audience: string; goal: string;
  diagnosis_notes: string; consultant: string; content: any;
};

const empty = (): P => ({
  client_name: "", company: "", niche_id: "", items: [], bottlenecks: "", solution: "",
  sub_niche: "", city: "", district: "", audience: "", goal: "", diagnosis_notes: "",
  consultant: "Lucas Santos", content: null,
  discount_percent: 0, notes: "Pagamento mensal via PIX. Início em até 7 dias após aprovação.",
  valid_until: new Date(Date.now() + 15 * 864e5).toISOString().slice(0, 10),
});

const sel = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground";

function Propostas() {
  const qc = useQueryClient();
  const [edit, setEdit] = useState<P | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const { data: list = [] } = useQuery({
    queryKey: ["proposals"],
    queryFn: async () => (await db.from("proposals").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: niches = [] } = useQuery({
    queryKey: ["niches-full"],
    queryFn: async () => (await db.from("niches").select("*, niche_pains(content)").order("name")).data ?? [],
  });
  const { data: services = [] } = useQuery({
    queryKey: ["services-active"],
    queryFn: async () => (await db.from("services").select("*").eq("active", true).order("name")).data ?? [],
  });
  const { data: people = [] } = useQuery({
    queryKey: ["proposal-people"],
    queryFn: async () => {
      const [l, c] = await Promise.all([
        db.from("leads").select("name, company_name, niche"),
        db.from("clients").select("name, owner_name"),
      ]);
      return [
        ...(l.data ?? []).map((x: any) => ({ label: `Lead: ${x.name}`, name: x.name, company: x.company_name ?? "", niche: x.niche })),
        ...(c.data ?? []).map((x: any) => ({ label: `Cliente: ${x.name}`, name: x.owner_name || x.name, company: x.name, niche: null })),
      ];
    },
  });

  const subtotal = (p: P) => p.items.reduce((a, i) => a + Number(i.price) * Number(i.qty), 0);
  const total = (p: P) => subtotal(p) * (1 - Number(p.discount_percent || 0) / 100);
  const nicheName = (id: string) => niches.find((n: any) => n.id === id)?.name;

  function applyNiche(id: string, p: P): P {
    const n = niches.find((x: any) => x.id === id);
    if (!n) return { ...p, niche_id: id };
    const pains = (n.niche_pains ?? []).map((x: any) => `• ${x.content}`).join("\n");
    return { ...p, niche_id: id, bottlenecks: pains, solution: n.solution || n.recommended_services || "" };
  }

  async function save(p: P, andPdf = false) {
    if (!p.client_name) return void toast.error("Informe o cliente");
    const payload = { ...p, total: total(p), niche_id: p.niche_id || null, valid_until: p.valid_until || null };
    delete (payload as any).id; delete (payload as any).number; delete (payload as any).niche_pains;
    delete (payload as any).created_at; delete (payload as any).updated_at;
    const res = p.id
      ? await db.from("proposals").update(payload).eq("id", p.id).select().single()
      : await db.from("proposals").insert(payload).select().single();
    if (res.error) return void toast.error(res.error.message);
    toast.success("Proposta salva");
    qc.invalidateQueries({ queryKey: ["proposals"] });
    setEdit(null);
    if (andPdf) await makePdf(res.data);
  }

  async function makePdf(p: any) {
    const c = p.content;
    if (!c) return proposalPdf({ ...p, niche_name: nicheName(p.niche_id) });
    const sub = subtotal(p);
    const list = (a: any) => (Array.isArray(a) ? a.map((x: string) => `• ${x}`).join("\n") : a ?? "");
    await documentPdf({
      title: "Proposta Comercial",
      client: p.company || p.client_name,
      subtitle: [nicheName(p.niche_id), p.sub_niche, [p.city, p.district].filter(Boolean).join(" / "), `Nº ${p.number ?? ""}`].filter(Boolean).join("  •  "),
      filename: `proposta-${(p.company || p.client_name).replace(/\s+/g, "-").toLowerCase()}.pdf`,
      signature: true,
      sections: [
        { title: "Sobre a Santos MktPro", body: c.about },
        { title: "Resumo do projeto", body: c.summary },
        ...(c.diagnosis?.length ? [{ title: "Diagnóstico digital", table: { head: ["Área", "Situação", "Impacto", "Oportunidade", "Prioridade"], rows: c.diagnosis.map((d: any) => [d.area, d.situation, d.impact, d.opportunity, d.priority]) } }] : []),
        { title: `Gargalos identificados${nicheName(p.niche_id) ? " — " + nicheName(p.niche_id) : ""}`, body: p.bottlenecks },
        { title: "Necessidades", body: list(c.needs) },
        { title: "Objetivos", body: list(c.objectives) },
        { title: "Nossa solução", body: p.solution },
        { title: "Estratégia", body: c.strategy },
        ...(c.services ?? []).map((sv: any) => ({ title: sv.name, body: [`Objetivo: ${sv.objective}`, `O que será feito:\n${sv.what}`, `Como: ${sv.how}`, `Por que: ${sv.why}`, `Acompanhamento: ${sv.tracking}`, `Indicadores: ${sv.kpis}`].join("\n\n") })),
        { title: "Investimento", table: { head: ["Serviço", "Qtd", "Valor unit.", "Total"], rows: [...p.items.map((i: any) => [i.name, String(i.qty), brl(i.price), brl(i.price * i.qty)]), ...(p.discount_percent ? [["", "", `Desconto (${p.discount_percent}%)`, "- " + brl(sub - total(p))]] : []), ["", "", "TOTAL", brl(total(p))]] } },
        { title: "Etapas do trabalho", body: list(c.process) },
        { title: "Acompanhamento", body: c.followup },
        { title: "Condições", body: `${p.notes ?? ""}${p.valid_until ? `\nProposta válida até ${fmtDate(p.valid_until)}.` : ""}` },
      ],
    });
  }

  async function sendEmail(p: any) {
    const to = prompt(`E-mail de ${p.client_name}:`);
    if (!to) return;
    const id = toast.loading("Enviando proposta...");
    try {
      const file = await capturePdf(() => makePdf(p));
      await apiPost("/api/send-proposal", {
        to, filename: file.filename, pdfBase64: file.base64,
        subject: `Proposta Comercial Santos MktPro — ${p.company || p.client_name}`,
        message: `Olá, ${p.client_name}!\n\nConforme conversamos, segue em anexo a proposta comercial da Santos MktPro para ${p.company || "sua empresa"}.\n\nFico à disposição para tirar qualquer dúvida.\n\nAbraço,\n${p.consultant || "Lucas Santos"}\nSantos MktPro`,
      });
      toast.success("Proposta enviada para " + to, { id });
    } catch (e: any) { toast.error(e.message, { id }); }
  }

  async function remove(id: string) {
    if (!confirm("Excluir proposta?")) return;
    await db.from("proposals").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["proposals"] });
  }

  if (edit) {
    const setE = (patch: Partial<P>) => setEdit({ ...edit, ...patch });
    const setItem = (i: number, patch: Partial<ProposalItem>) =>
      setE({ items: edit.items.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
    return (
      <div>
        <PageHeader
          title={edit.id ? `Proposta Nº ${edit.number}` : "Nova proposta"}
          action={<Button variant="ghost" onClick={() => setEdit(null)}><X className="mr-1 h-4 w-4" />Fechar</Button>}
        />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="panel grid gap-4 p-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label className="mb-1.5 block text-xs text-muted-foreground">Puxar de lead / cliente</Label>
                <select className={sel} value="" onChange={(e) => {
                  const x = people[Number(e.target.value)]; if (!x) return;
                  let p = { ...edit, client_name: x.name, company: x.company };
                  const n = niches.find((n: any) => n.name?.toLowerCase() === x.niche?.toLowerCase());
                  if (n) p = applyNiche(n.id, p);
                  setEdit(p);
                }}>
                  <option value="">Selecionar...</option>
                  {people.map((x: any, i: number) => <option key={i} value={i}>{x.label}</option>)}
                </select>
              </div>
              <div><Label className="mb-1.5 block text-xs text-muted-foreground">Cliente *</Label><Input value={edit.client_name} onChange={(e) => setE({ client_name: e.target.value })} /></div>
              <div><Label className="mb-1.5 block text-xs text-muted-foreground">Empresa</Label><Input value={edit.company} onChange={(e) => setE({ company: e.target.value })} /></div>
              <div className="sm:col-span-2">
                <Label className="mb-1.5 block text-xs text-muted-foreground">Nicho (preenche gargalos e solução)</Label>
                <select className={sel} value={edit.niche_id} onChange={(e) => setEdit(applyNiche(e.target.value, edit))}>
                  <option value="">—</option>
                  {niches.map((n: any) => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </div>
            </div>
            <div className="panel space-y-4 p-5">
              <div><Label className="mb-1.5 block text-xs text-muted-foreground">Gargalos do nicho (editável)</Label><Textarea rows={6} value={edit.bottlenecks} onChange={(e) => setE({ bottlenecks: e.target.value })} /></div>
              <div><Label className="mb-1.5 block text-xs text-muted-foreground">Minha solução (editável)</Label><Textarea rows={6} value={edit.solution} onChange={(e) => setE({ solution: e.target.value })} /></div>
            </div>
            <div className="panel grid gap-4 p-5 sm:grid-cols-2">
              {([["sub_niche","Subnicho"],["city","Cidade"],["district","Bairro"],["audience","Público-alvo"],["goal","Objetivo principal"],["consultant","Consultor"]] as const).map(([k, l]) => (
                <div key={k}><Label className="mb-1.5 block text-xs text-muted-foreground">{l}</Label><Input value={(edit as any)[k]} onChange={(e) => setE({ [k]: e.target.value } as any)} /></div>
              ))}
              <div className="sm:col-span-2"><Label className="mb-1.5 block text-xs text-muted-foreground">Diagnóstico que eu observei (a IA só usa isso como fato)</Label><Textarea rows={4} value={edit.diagnosis_notes} onChange={(e) => setE({ diagnosis_notes: e.target.value })} /></div>
              <div className="sm:col-span-2">
                <Button type="button" variant="outline" disabled={aiBusy} onClick={async () => {
                  if (!edit.items.length) return void toast.error("Adicione os serviços antes");
                  setAiBusy(true);
                  try { const c = await apiPost<any>("/api/proposal-ai", edit); setE({ content: c }); toast.success("Conteúdo gerado — revise abaixo"); }
                  catch (e: any) { toast.error(e.message); } finally { setAiBusy(false); }
                }}><Sparkles className="mr-1 h-4 w-4" />{aiBusy ? "Gerando... (até 1 min)" : edit.content ? "Gerar de novo com IA" : "Gerar conteúdo com IA"}</Button>
              </div>
            </div>
            {edit.content && (
              <div className="panel space-y-4 p-5">
                <h3 className="font-display font-semibold text-foreground">Texto da proposta (editável)</h3>
                {([["about","Sobre a Santos MktPro"],["summary","Resumo do projeto"],["needs","Necessidades (uma por linha)"],["objectives","Objetivos (um por linha)"],["strategy","Estratégia"],["process","Etapas (uma por linha)"],["followup","Acompanhamento"]] as const).map(([k, l]) => {
                  const v = edit.content[k]; const isArr = Array.isArray(v);
                  return <div key={k}><Label className="mb-1.5 block text-xs text-muted-foreground">{l}</Label><Textarea rows={4} value={isArr ? v.join("\n") : v ?? ""} onChange={(e) => setE({ content: { ...edit.content, [k]: isArr ? e.target.value.split("\n") : e.target.value } })} /></div>;
                })}
                {(edit.content.services ?? []).map((sv: any, i: number) => (
                  <div key={i}><Label className="mb-1.5 block text-xs text-muted-foreground">{sv.name} — o que será feito</Label><Textarea rows={4} value={sv.what ?? ""} onChange={(e) => setE({ content: { ...edit.content, services: edit.content.services.map((x: any, j: number) => j === i ? { ...x, what: e.target.value } : x) } })} /></div>
                ))}
                <p className="text-xs text-muted-foreground">O diagnóstico em tabela ({edit.content.diagnosis?.length ?? 0} áreas) vai no PDF.</p>
              </div>
            )}
            <div className="panel p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="font-display font-semibold text-foreground">Serviços</h3>
                <select className={sel + " max-w-xs"} value="" onChange={(e) => {
                  const s = services.find((x: any) => x.id === e.target.value); if (!s) return;
                  setE({ items: [...edit.items, { name: s.name, price: Number(s.promo_price || s.price), qty: 1 }] });
                }}>
                  <option value="">+ Adicionar serviço</option>
                  {services.map((s: any) => <option key={s.id} value={s.id}>{s.name} — {brl(s.price)}</option>)}
                </select>
              </div>
              {edit.items.length === 0 && <p className="text-sm text-muted-foreground">Nenhum serviço adicionado.</p>}
              <div className="space-y-2">
                {edit.items.map((it, i) => (
                  <div key={i} className="grid grid-cols-12 items-center gap-2">
                    <Input className="col-span-6" value={it.name} onChange={(e) => setItem(i, { name: e.target.value })} />
                    <Input className="col-span-2" type="number" min={1} value={it.qty} onChange={(e) => setItem(i, { qty: Number(e.target.value) })} />
                    <Input className="col-span-3" type="number" step="any" value={it.price} onChange={(e) => setItem(i, { price: Number(e.target.value) })} />
                    <Button size="icon" variant="ghost" onClick={() => setE({ items: edit.items.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                ))}
                <button className="text-sm text-primary" onClick={() => setE({ items: [...edit.items, { name: "Serviço personalizado", price: 0, qty: 1 }] })}>+ Item personalizado</button>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="panel space-y-4 p-5">
              <div><Label className="mb-1.5 block text-xs text-muted-foreground">Desconto (%)</Label><Input type="number" value={edit.discount_percent} onChange={(e) => setE({ discount_percent: Number(e.target.value) })} /></div>
              <div><Label className="mb-1.5 block text-xs text-muted-foreground">Válida até</Label><Input type="date" value={edit.valid_until ?? ""} onChange={(e) => setE({ valid_until: e.target.value })} /></div>
              <div><Label className="mb-1.5 block text-xs text-muted-foreground">Condições</Label><Textarea rows={4} value={edit.notes ?? ""} onChange={(e) => setE({ notes: e.target.value })} /></div>
              <div className="border-t border-border pt-4 text-sm">
                <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{brl(subtotal(edit))}</span></div>
                <div className="mt-2 flex justify-between font-display text-xl font-semibold text-foreground"><span>Total</span><span>{brl(total(edit))}</span></div>
              </div>
              <Button className="w-full" onClick={() => save(edit, true)}><FileDown className="mr-1 h-4 w-4" />Salvar e gerar PDF</Button>
              <Button className="w-full" variant="outline" onClick={() => save(edit)}>Só salvar</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Propostas" subtitle="Monte a proposta com os gargalos do nicho e sua solução, e baixe em PDF."
        action={<Button onClick={() => setEdit(empty())}><Plus className="mr-1 h-4 w-4" />Nova proposta</Button>} />
      <div className="panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
            <th className="px-4 py-3">Nº</th><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Nicho</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Validade</th><th />
          </tr></thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Nenhuma proposta ainda.</td></tr>}
            {list.map((p: any) => (
              <tr key={p.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3 text-muted-foreground">{p.number}</td>
                <td className="px-4 py-3 font-medium text-foreground">{p.client_name}<div className="text-xs text-muted-foreground">{p.company}</div></td>
                <td className="px-4 py-3 text-muted-foreground">{nicheName(p.niche_id) ?? "—"}</td>
                <td className="px-4 py-3 text-foreground">{brl(p.total)}</td>
                <td className="px-4 py-3 text-muted-foreground">{fmtDate(p.valid_until)}</td>
                <td className="whitespace-nowrap px-2 text-right">
                  <Button size="icon" variant="ghost" aria-label="PDF" onClick={() => makePdf(p)}><FileDown className="h-4 w-4 text-primary" /></Button>
                  <Button size="icon" variant="ghost" aria-label="Enviar por e-mail" onClick={() => sendEmail(p)}><Mail className="h-4 w-4 text-primary" /></Button>
                  <Button size="icon" variant="ghost" aria-label="Editar" onClick={() => setEdit({ ...p, company: p.company ?? "", niche_id: p.niche_id ?? "", bottlenecks: p.bottlenecks ?? "", solution: p.solution ?? "", sub_niche: p.sub_niche ?? "", city: p.city ?? "", district: p.district ?? "", audience: p.audience ?? "", goal: p.goal ?? "", diagnosis_notes: p.diagnosis_notes ?? "", consultant: p.consultant ?? "Lucas Santos" })}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" aria-label="Excluir" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
