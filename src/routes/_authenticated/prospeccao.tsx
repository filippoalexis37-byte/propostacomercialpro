/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FileText, History, PhoneCall, Plus, Rocket, Trash2, Upload } from "lucide-react";
import { db, brl, fmtDate } from "@/lib/db";
import { PageHeader } from "@/components/crud-page";
import { pageHead } from "@/lib/meta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ALL_STATUS, CHANNELS, CONTACT_TYPES, LIST_STATUS, LOST, POTENTIALS, PRIORITIES, QUALIFY_YESNO, RESULTS, SERVICES_INTEREST,
  SOURCES, STAGES, TEMPS, WON, calcTemperature, findDuplicate, mapCsvRow, parseCsv, stats, statusFromResult,
} from "@/lib/prospect";

export const Route = createFileRoute("/_authenticated/prospeccao")({
  head: pageHead("Prospecção B2B", "Controle completo da prospecção por nicho, cidade e status."),
  component: Prospeccao,
});

const sel = "h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground";
const today = () => new Date().toISOString().slice(0, 10);
const addDays = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const prioDot: Record<string, string> = { Alta: "🔴", Média: "🟡", Baixa: "🟢" };
const prioRank: Record<string, number> = { Alta: 0, Média: 1, Baixa: 2, Alto: 0, Médio: 1, Baixo: 2 };

function Sel({ value, onChange, options, all, className = "" }: { value: string; onChange: (v: string) => void; options: string[]; all?: string; className?: string }) {
  return (
    <select className={`${sel} ${className}`} value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
      {all !== undefined && <option value="">{all}</option>}
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Prospeccao() {
  const qc = useQueryClient();
  const { data: companies = [] } = useQuery({
    queryKey: ["prosp-companies"],
    queryFn: async () => (await db.from("companies").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: attempts = [] } = useQuery({
    queryKey: ["prosp-attempts"],
    queryFn: async () => (await db.from("prospect_attempts").select("company_id, happened_at, result").order("happened_at")).data ?? [],
  });
  const { data: lists = [] } = useQuery({ queryKey: ["prospect_lists"], queryFn: async () => (await db.from("prospect_lists").select("*").order("created_at", { ascending: false })).data ?? [] });
  const { data: cadences = [] } = useQuery({ queryKey: ["cadences"], queryFn: async () => (await db.from("cadences").select("*").order("name")).data ?? [] });
  const refresh = () => ["prosp-companies", "prosp-attempts", "prospect_lists", "cadences", "companies", "followup-alerts"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));

  const [f, setF] = useState({ q: "", niche: "", city: "", status: "", priority: "", source: "", list: "", temp: "", sort: "prioridade" });
  const [open, setOpen] = useState<{ c: any; mode: "edit" | "contact" | "history" } | null>(null);

  const niches = useMemo(() => [...new Set(companies.map((c: any) => c.niche).filter(Boolean))].sort() as string[], [companies]);
  const cities = useMemo(() => [...new Set(companies.map((c: any) => c.city).filter(Boolean))].sort() as string[], [companies]);

  const filtered = useMemo(() => {
    const r = companies.filter((c: any) =>
      (!f.q || `${c.name} ${c.trade_name ?? ""} ${c.owner_name ?? ""} ${c.phone ?? ""}`.toLowerCase().includes(f.q.toLowerCase())) &&
      (!f.niche || c.niche === f.niche) && (!f.city || c.city === f.city) && (!f.status || c.prospect_status === f.status) &&
      (!f.priority || c.priority === f.priority) && (!f.source || c.source === f.source) && (!f.list || c.list_id === f.list) &&
      (!f.temp || c.temperature === f.temp));
    const key = f.sort;
    return [...r].sort((a: any, b: any) =>
      key === "prioridade" ? (prioRank[a.priority] ?? 1) - (prioRank[b.priority] ?? 1) || (prioRank[a.potential] ?? 1) - (prioRank[b.potential] ?? 1)
      : key === "potencial" ? (prioRank[a.potential] ?? 1) - (prioRank[b.potential] ?? 1)
      : key === "proximo" ? String(a.next_contact_at ?? "9999").localeCompare(String(b.next_contact_at ?? "9999"))
      : String(b.last_attempt_at ?? "").localeCompare(String(a.last_attempt_at ?? "")));
  }, [companies, f]);

  const notProsp = filtered.filter((c: any) => !c.attempts);
  const prosp = filtered.filter((c: any) => c.attempts > 0);
  const followups = filtered
    .filter((c: any) => c.next_contact_at && c.next_contact_at <= today() && !LOST.includes(c.prospect_status) && !WON.includes(c.prospect_status))
    .sort((a: any, b: any) => a.next_contact_at.localeCompare(b.next_contact_at));
  const s = stats(filtered);

  async function setStatus(c: any, status: string) {
    await db.from("companies").update({ prospect_status: status }).eq("id", c.id);
    await db.from("prospect_attempts").insert({ company_id: c.id, channel: "Outro", contact_type: "Alteração de status", result: status, notes: `Status alterado de "${c.prospect_status}" para "${status}"` });
    refresh();
  }

  const filters = (
    <div className="panel mb-4 flex flex-wrap gap-2 p-3">
      <Input className="h-9 w-48" placeholder="Buscar empresa..." value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} />
      <Sel value={f.niche} onChange={(v) => setF({ ...f, niche: v })} options={niches} all="Todos os nichos" />
      <Sel value={f.city} onChange={(v) => setF({ ...f, city: v })} options={cities} all="Todas as cidades" />
      <Sel value={f.status} onChange={(v) => setF({ ...f, status: v })} options={ALL_STATUS} all="Todos os status" />
      <Sel value={f.priority} onChange={(v) => setF({ ...f, priority: v })} options={PRIORITIES} all="Prioridade" />
      <Sel value={f.temp} onChange={(v) => setF({ ...f, temp: v })} options={TEMPS} all="Temperatura" />
      <Sel value={f.source} onChange={(v) => setF({ ...f, source: v })} options={SOURCES} all="Origem" />
      <select className={sel} value={f.list} onChange={(e) => setF({ ...f, list: e.target.value })}>
        <option value="">Todas as listas</option>
        {lists.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
      </select>
      <select className={sel} value={f.sort} onChange={(e) => setF({ ...f, sort: e.target.value })}>
        <option value="prioridade">Ordenar: prioridade</option><option value="potencial">Ordenar: potencial</option>
        <option value="proximo">Ordenar: próximo contato</option><option value="ultima">Ordenar: última tentativa</option>
      </select>
    </div>
  );

  const actions = (c: any) => (
    <div className="flex justify-end gap-1 whitespace-nowrap">
      {!c.attempts
        ? <Button size="sm" onClick={() => setOpen({ c, mode: "contact" })}><Rocket className="mr-1 h-3.5 w-3.5" />Prospectar</Button>
        : <Button size="sm" variant="outline" onClick={() => setOpen({ c, mode: "contact" })}><PhoneCall className="mr-1 h-3.5 w-3.5" />Registrar</Button>}
      <Button size="icon" variant="ghost" aria-label="Histórico" onClick={() => setOpen({ c, mode: "history" })}><History className="h-4 w-4" /></Button>
      <Button size="sm" variant="ghost" onClick={() => setOpen({ c, mode: "edit" })}>Ver</Button>
    </div>
  );

  const name = (c: any) => (
    <button className="text-left font-medium text-foreground hover:text-primary" onClick={() => setOpen({ c, mode: "edit" })}>
      {prioDot[c.priority] ?? ""} {c.trade_name || c.name}
      <div className="text-xs font-normal text-muted-foreground">{c.temperature}{c.potential ? ` • potencial ${c.potential.toLowerCase()}` : ""}</div>
    </button>
  );

  return (
    <div>
      <PageHeader title="Prospecção B2B" subtitle="Quem já foi prospectado, quem falta e qual o próximo passo."
        action={<Button onClick={() => setOpen({ c: { prospect_status: "Não prospectado", priority: "Média", potential: "Médio", temperature: "Frio", source: "Prospecção manual", services_interest: [], qualification: {} }, mode: "edit" })}><Plus className="mr-1 h-4 w-4" />Nova empresa</Button>} />
      {filters}
      <Tabs defaultValue="painel">
        <TabsList className="mb-4 flex h-auto flex-wrap justify-start">
          <TabsTrigger value="painel">Painel</TabsTrigger>
          <TabsTrigger value="falta">Falta prospectar ({notProsp.length})</TabsTrigger>
          <TabsTrigger value="ja">Já prospectadas ({prosp.length})</TabsTrigger>
          <TabsTrigger value="follow">Follow-ups ({followups.length})</TabsTrigger>
          <TabsTrigger value="nichos">Nichos e cidades</TabsTrigger>
          <TabsTrigger value="listas">Listas</TabsTrigger>
          <TabsTrigger value="cadencias">Cadências</TabsTrigger>
          <TabsTrigger value="importar">Importar</TabsTrigger>
        </TabsList>

        <TabsContent value="painel"><Painel s={s} rows={filtered} attempts={attempts} /></TabsContent>

        <TabsContent value="falta">
          <Table head={["Empresa", "Nicho", "Cidade", "Telefone", "WhatsApp", "E-mail", "Origem", "Cadastro", ""]} empty="Nenhuma empresa por prospectar."
            rows={notProsp.map((c: any) => [name(c), c.niche, c.city, c.phone, c.whatsapp, c.email, c.source, fmtDate(c.created_at), actions(c)])} />
        </TabsContent>

        <TabsContent value="ja">
          <Table head={["Empresa", "Nicho", "Cidade", "Contato", "Última tentativa", "Tentativas", "Status", "Resultado", "Próximo", ""]} empty="Nenhuma empresa prospectada ainda."
            rows={prosp.map((c: any) => [name(c), c.niche, c.city, c.owner_name || c.whatsapp || c.phone, fmtDate(c.last_attempt_at), c.attempts,
              <Sel key="s" className="h-8 text-xs" value={c.prospect_status} onChange={(v) => setStatus(c, v)} options={ALL_STATUS} />,
              c.last_result, c.next_contact_at ? <span className={c.next_contact_at < today() ? "text-destructive" : ""}>{fmtDate(c.next_contact_at)}</span> : "—", actions(c)])} />
        </TabsContent>

        <TabsContent value="follow">
          <div className="panel mb-4 p-4 text-sm text-foreground">Você possui <b className="text-primary">{followups.length}</b> follow-ups para realizar ({s.late} atrasados). Nenhuma mensagem é enviada automaticamente.</div>
          <Table head={["Empresa", "Nicho", "Último contato", "Dias", "Próxima ação", "Canal", "Data", ""]} empty="Nenhum follow-up para hoje."
            rows={followups.map((c: any) => {
              const cad = cadences.find((x: any) => x.id === c.cadence_id);
              const step = cad?.steps?.[c.cadence_step];
              return [name(c), c.niche, fmtDate(c.last_attempt_at), c.last_attempt_at ? Math.floor((Date.now() - new Date(c.last_attempt_at).getTime()) / 864e5) : "—",
                step?.action ?? "Follow-up", c.preferred_channel || cad?.channel || "WhatsApp",
                <span key="d" className={c.next_contact_at < today() ? "text-destructive" : "text-primary"}>{fmtDate(c.next_contact_at)}</span>, actions(c)];
            })} />
        </TabsContent>

        <TabsContent value="nichos"><NichosCidades rows={filtered} onNiche={(n) => setF({ ...f, niche: n })} /></TabsContent>
        <TabsContent value="listas"><Listas lists={lists} companies={companies} onOpen={(id) => setF({ ...f, list: id })} refresh={refresh} /></TabsContent>
        <TabsContent value="cadencias"><Cadencias cadences={cadences} refresh={refresh} /></TabsContent>
        <TabsContent value="importar"><Importar companies={companies} lists={lists} refresh={refresh} /></TabsContent>
      </Tabs>

      {open && <CompanyDialog key={open.c.id ?? "new"} initial={open.c} mode={open.mode} lists={lists} cadences={cadences} companies={companies}
        onClose={() => setOpen(null)} refresh={refresh} />}
    </div>
  );
}

function Table({ head, rows, empty }: { head: string[]; rows: any[][]; empty: string }) {
  return (
    <div className="panel overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">{head.map((h, i) => <th key={i} className="px-3 py-3">{h}</th>)}</tr></thead>
        <tbody>
          {rows.length === 0 && <tr><td colSpan={head.length} className="px-4 py-10 text-center text-muted-foreground">{empty}</td></tr>}
          {rows.map((r, i) => <tr key={i} className="border-b border-border/60 last:border-0">{r.map((v, j) => <td key={j} className="px-3 py-2 text-muted-foreground">{v ?? "—"}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}

function Painel({ s, rows, attempts }: { s: ReturnType<typeof stats>; rows: any[]; attempts: any[] }) {
  const [period, setPeriod] = useState<"dia" | "semana" | "mes">("dia");
  const ids = new Set(rows.map((r) => r.id));
  const chart = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const a of attempts) {
      if (!ids.has(a.company_id)) continue;
      const d = new Date(a.happened_at);
      let k = d.toISOString().slice(0, 10);
      if (period === "mes") k = k.slice(0, 7);
      if (period === "semana") { const x = new Date(d); x.setDate(d.getDate() - d.getDay()); k = x.toISOString().slice(0, 10); }
      if (!m.has(k)) m.set(k, new Set());
      m.get(k)!.add(a.company_id);
    }
    return [...m.entries()].sort().slice(-30).map(([k, v]) => ({ k: period === "mes" ? k : fmtDate(k).slice(0, 5), n: v.size }));
  }, [attempts, period, rows]);
  const cards: [string, any, string?][] = [
    ["Total de empresas", s.total], ["Não prospectadas", s.notProsp], ["Prospectadas", s.prosp, `${s.pctProsp}%`], ["Em contato", s.inContact],
    ["Qualificadas", s.qualified], ["Proposta enviada", s.proposals], ["Clientes", s.won], ["Sem interesse", s.noInterest],
    ["Sem resposta", s.noAnswer], ["Follow-up hoje", s.today], ["Follow-ups atrasados", s.late], ["Valor potencial", brl(s.potential)], ["Valor fechado", brl(s.closed)],
  ];
  const funnel = STAGES.map((st) => ({ st, n: st === "Não prospectado" ? s.notProsp : rows.filter((r) => r.prospect_status === st).length }));
  const max = Math.max(1, ...funnel.map((x) => x.n));
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map(([t, v, sub]) => (
          <div key={t} className="panel p-4">
            <div className="text-xs text-muted-foreground">{t}</div>
            <div className={`mt-1 font-display text-2xl font-semibold ${t.includes("atrasados") && v ? "text-destructive" : "text-foreground"}`}>{v}</div>
            {sub && <div className="text-xs text-primary">{sub}</div>}
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        {[["Taxa de resposta", s.respRate], ["Taxa de qualificação", s.qualRate], ["Taxa de proposta", s.propRate], ["Taxa de fechamento", s.convRate]].map(([t, v]) => (
          <div key={t as string} className="panel p-4"><div className="text-xs text-muted-foreground">{t}</div><div className="font-display text-2xl font-semibold text-primary">{v}%</div></div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="panel p-5">
          <h3 className="mb-4 font-display font-semibold text-foreground">Funil de prospecção</h3>
          {funnel.map((x) => (
            <div key={x.st} className="mb-1.5 flex items-center gap-2 text-xs">
              <div className="w-36 shrink-0 text-muted-foreground">{x.st}</div>
              <div className="h-5 rounded bg-primary/80" style={{ width: `${Math.max(2, (x.n / max) * 100)}%` }} />
              <div className="text-foreground">{x.n}</div>
            </div>
          ))}
        </div>
        <div className="panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display font-semibold text-foreground">Empresas prospectadas</h3>
            <select className={sel} value={period} onChange={(e) => setPeriod(e.target.value as any)}><option value="dia">por dia</option><option value="semana">por semana</option><option value="mes">por mês</option></select>
          </div>
          <div className="h-64">
            {chart.length === 0 ? <p className="text-sm text-muted-foreground">Registre contatos para ver o gráfico.</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="k" stroke="var(--muted-foreground)" fontSize={11} /><YAxis allowDecimals={false} stroke="var(--muted-foreground)" fontSize={11} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} /><Bar dataKey="n" name="Empresas" fill="var(--primary)" radius={[4, 4, 0, 0]} /></BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function NichosCidades({ rows, onNiche }: { rows: any[]; onNiche: (n: string) => void }) {
  const group = (key: string) => {
    const m = new Map<string, any[]>();
    for (const r of rows) { const k = r[key] || "Sem " + (key === "niche" ? "nicho" : "cidade"); if (!m.has(k)) m.set(k, []); m.get(k)!.push(r); }
    return [...m.entries()].map(([k, v]) => ({ k, s: stats(v) })).sort((a, b) => b.s.total - a.s.total);
  };
  const cityNiche = (() => {
    const m = new Map<string, any[]>();
    for (const r of rows) { const k = `${r.city || "—"}|${r.niche || "—"}`; if (!m.has(k)) m.set(k, []); m.get(k)!.push(r); }
    return [...m.entries()].map(([k, v]) => ({ k: k.split("|"), s: stats(v) })).sort((a, b) => a.k[0]!.localeCompare(b.k[0]!));
  })();
  return (
    <div className="space-y-6">
      <h3 className="font-display font-semibold text-foreground">Comparação entre nichos <span className="text-xs font-normal text-muted-foreground">(clique para filtrar)</span></h3>
      <Table head={["Nicho", "Empresas", "Prospectadas", "% prosp.", "Faltam", "Em conversa", "Qualificadas", "Propostas", "Clientes", "Sem resposta", "Sem interesse", "Resp.", "Conv.", "Potencial", "Fechado"]} empty="Sem dados."
        rows={group("niche").map(({ k, s }) => [<button key="n" className="font-medium text-foreground hover:text-primary" onClick={() => onNiche(k)}>{k}</button>, s.total, s.prosp, `${s.pctProsp}%`, s.notProsp, s.inContact, s.qualified, s.proposals, s.won, s.noAnswer, s.noInterest, `${s.respRate}%`, `${s.convRate}%`, brl(s.potential), brl(s.closed)])} />
      <h3 className="font-display font-semibold text-foreground">Por cidade e nicho</h3>
      <Table head={["Cidade", "Nicho", "Total", "Prospectadas", "Não prospectadas", "Em contato", "Clientes"]} empty="Sem dados."
        rows={cityNiche.map(({ k, s }) => [<span key="c" className="font-medium text-foreground">{k[0]}</span>, k[1], s.total, s.prosp, s.notProsp, s.inContact, s.won])} />
    </div>
  );
}

function Listas({ lists, companies, onOpen, refresh }: { lists: any[]; companies: any[]; onOpen: (id: string) => void; refresh: () => void }) {
  const [n, setN] = useState({ name: "", niche: "", region: "", city: "", owner: "Lucas Santos", status: "Rascunho" });
  async function add() {
    if (!n.name) return void toast.error("Dê um nome à lista");
    const { error } = await db.from("prospect_lists").insert(n);
    if (error) return void toast.error(error.message);
    setN({ ...n, name: "" }); refresh();
  }
  return (
    <div className="space-y-4">
      <div className="panel flex flex-wrap items-end gap-2 p-4">
        {(["name", "niche", "region", "city", "owner"] as const).map((k) => (
          <div key={k}><Label className="text-xs text-muted-foreground">{{ name: "Nome *", niche: "Nicho", region: "Região", city: "Cidade", owner: "Responsável" }[k]}</Label><Input className="h-9 w-40" value={n[k]} onChange={(e) => setN({ ...n, [k]: e.target.value })} placeholder={k === "name" ? "Campinas — Serralherias" : ""} /></div>
        ))}
        <Button onClick={add}><Plus className="mr-1 h-4 w-4" />Criar lista</Button>
      </div>
      <p className="text-xs text-muted-foreground">Para colocar empresas numa lista, abra a empresa e escolha a lista, ou escolha a lista ao importar.</p>
      <Table head={["Lista", "Nicho", "Região/Cidade", "Criada", "Responsável", "Empresas", "Prospectadas", "Restantes", "Status", ""]} empty="Nenhuma lista criada."
        rows={lists.map((l) => {
          const cs = companies.filter((c) => c.list_id === l.id); const p = cs.filter((c) => c.attempts > 0).length;
          return [<button key="n" className="font-medium text-foreground hover:text-primary" onClick={() => onOpen(l.id)}>{l.name}</button>, l.niche, [l.region, l.city].filter(Boolean).join(" / "), fmtDate(l.created_at), l.owner, cs.length, p, cs.length - p,
            <Sel key="s" className="h-8 text-xs" value={l.status} options={LIST_STATUS} onChange={async (v) => { await db.from("prospect_lists").update({ status: v }).eq("id", l.id); refresh(); }} />,
            <Button key="d" size="icon" variant="ghost" onClick={async () => { if (confirm("Excluir lista? (as empresas continuam)")) { await db.from("prospect_lists").delete().eq("id", l.id); refresh(); } }}><Trash2 className="h-4 w-4 text-destructive" /></Button>];
        })} />
    </div>
  );
}

function Cadencias({ cadences, refresh }: { cadences: any[]; refresh: () => void }) {
  const [e, setE] = useState<any>(null);
  async function save() {
    if (!e.name) return void toast.error("Dê um nome");
    const payload = { name: e.name, description: e.description, objective: e.objective, channel: e.channel, steps: e.steps.filter((x: any) => x.action) };
    const r = e.id ? await db.from("cadences").update(payload).eq("id", e.id) : await db.from("cadences").insert(payload);
    if (r.error) return void toast.error(r.error.message);
    setE(null); refresh();
  }
  return (
    <div className="space-y-4">
      <Button onClick={() => setE({ name: "", description: "", objective: "", channel: "WhatsApp", steps: [{ day: 1, action: "Primeiro contato", message: "" }] })}><Plus className="mr-1 h-4 w-4" />Nova cadência</Button>
      <div className="grid gap-4 md:grid-cols-2">
        {cadences.map((c) => (
          <div key={c.id} className="panel p-5">
            <div className="flex items-start justify-between gap-2">
              <div><h3 className="font-display font-semibold text-foreground">{c.name}</h3><p className="text-xs text-muted-foreground">{c.description} • {c.channel} • {c.steps.length} etapas • objetivo: {c.objective || "—"}</p></div>
              <div className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => setE({ ...c, steps: [...c.steps] })}>Editar</Button>
                <Button size="icon" variant="ghost" onClick={async () => { if (confirm("Excluir cadência?")) { await db.from("cadences").delete().eq("id", c.id); refresh(); } }}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
            </div>
            <ol className="mt-3 space-y-1 text-sm">{c.steps.map((s: any, i: number) => <li key={i} className="text-foreground"><span className="text-primary">Dia {s.day}:</span> {s.action}{s.message ? <span className="text-muted-foreground"> — “{s.message.slice(0, 60)}…”</span> : null}</li>)}</ol>
          </div>
        ))}
      </div>
      <Dialog open={!!e} onOpenChange={(o) => !o && setE(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>{e?.id ? "Editar" : "Nova"} cadência</DialogTitle></DialogHeader>
          {e && <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label className="text-xs">Nome</Label><Input value={e.name} onChange={(x) => setE({ ...e, name: x.target.value })} /></div>
              <div><Label className="text-xs">Canal</Label><Sel className="w-full" value={e.channel} onChange={(v) => setE({ ...e, channel: v })} options={CHANNELS} /></div>
              <div><Label className="text-xs">Descrição</Label><Input value={e.description ?? ""} onChange={(x) => setE({ ...e, description: x.target.value })} /></div>
              <div><Label className="text-xs">Objetivo</Label><Input value={e.objective ?? ""} onChange={(x) => setE({ ...e, objective: x.target.value })} /></div>
            </div>
            <Label className="text-xs">Etapas</Label>
            {e.steps.map((s: any, i: number) => (
              <div key={i} className="grid grid-cols-12 gap-2">
                <Input className="col-span-2" type="number" min={1} value={s.day} onChange={(x) => setE({ ...e, steps: e.steps.map((y: any, j: number) => j === i ? { ...y, day: Number(x.target.value) } : y) })} />
                <Input className="col-span-4" placeholder="Ação" value={s.action} onChange={(x) => setE({ ...e, steps: e.steps.map((y: any, j: number) => j === i ? { ...y, action: x.target.value } : y) })} />
                <Input className="col-span-5" placeholder="Mensagem (opcional)" value={s.message ?? ""} onChange={(x) => setE({ ...e, steps: e.steps.map((y: any, j: number) => j === i ? { ...y, message: x.target.value } : y) })} />
                <Button size="icon" variant="ghost" onClick={() => setE({ ...e, steps: e.steps.filter((_: any, j: number) => j !== i) })}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <button className="text-sm text-primary" onClick={() => setE({ ...e, steps: [...e.steps, { day: (e.steps.at(-1)?.day ?? 0) + 2, action: "Follow-up", message: "" }] })}>+ Etapa</button>
            <Button className="w-full" onClick={save}>Salvar cadência</Button>
          </div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Importar({ companies, lists, refresh }: { companies: any[]; lists: any[]; refresh: () => void }) {
  const [rows, setRows] = useState<{ c: any; dup: any }[]>([]);
  const [list, setList] = useState("");
  const [busy, setBusy] = useState(false);
  async function onFile(file: File) {
    const parsed = parseCsv(await file.text()).map(mapCsvRow).filter((c) => c.name);
    const seen: any[] = [];
    setRows(parsed.map((c) => { const dup = findDuplicate(c, companies) || findDuplicate(c, seen); seen.push(c); return { c, dup }; }));
  }
  const news = rows.filter((r) => !r.dup);
  async function doImport() {
    setBusy(true);
    const payload = news.map(({ c }) => ({ ...c, list_id: list || null }));
    for (let i = 0; i < payload.length; i += 200) {
      const { error } = await db.from("companies").insert(payload.slice(i, i + 200));
      if (error) { setBusy(false); return void toast.error(error.message); }
    }
    setBusy(false); toast.success(`${payload.length} empresas importadas`); setRows([]); refresh();
  }
  return (
    <div className="space-y-4">
      <div className="panel space-y-3 p-5">
        <p className="text-sm text-muted-foreground">Envie um arquivo CSV (Excel → Salvar como CSV). Colunas aceitas: Nome/Empresa, Nicho, Cidade, Estado, Bairro, Endereço, Telefone, WhatsApp, E-mail, Site, Instagram, Google, Origem, CNPJ, Responsável.</p>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm text-foreground hover:bg-muted"><Upload className="h-4 w-4" />Escolher CSV
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} /></label>
          <select className={sel} value={list} onChange={(e) => setList(e.target.value)}><option value="">Sem lista</option>{lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select>
        </div>
      </div>
      {rows.length > 0 && <>
        <div className="panel flex flex-wrap items-center gap-4 p-4 text-sm">
          <span className="text-success"><b>{news.length}</b> empresas novas</span>
          <span className="text-warning"><b>{rows.length - news.length}</b> possíveis duplicadas (serão ignoradas)</span>
          <Button disabled={busy || !news.length} onClick={doImport}>{busy ? "Importando..." : "Importar novas"}</Button>
          <Button variant="ghost" onClick={() => setRows([])}>Cancelar</Button>
        </div>
        <Table head={["Empresa", "Nicho", "Cidade", "Telefone", "E-mail", "Situação"]} empty=""
          rows={rows.slice(0, 300).map(({ c, dup }) => [c.name, c.niche, c.city, c.phone || c.whatsapp, c.email, dup ? <Badge key="b" variant="outline" className="text-warning">Duplicada: {dup.name}</Badge> : <Badge key="b">Nova</Badge>])} />
      </>}
    </div>
  );
}

function CompanyDialog({ initial, mode, lists, cadences, companies, onClose, refresh }: { initial: any; mode: "edit" | "contact" | "history"; lists: any[]; cadences: any[]; companies: any[]; onClose: () => void; refresh: () => void }) {
  const navigate = useNavigate();
  const [c, setC] = useState<any>({ services_interest: [], qualification: {}, ...initial });
  const [tab, setTab] = useState(mode === "edit" ? "dados" : mode === "contact" ? "contato" : "historico");
  const set = (k: string, v: any) => setC({ ...c, [k]: v });
  const setQ = (k: string, v: any) => setC({ ...c, qualification: { ...(c.qualification ?? {}), [k]: v } });
  const cad = cadences.find((x) => x.id === c.cadence_id);
  const nextStep = cad?.steps?.[(c.cadence_step ?? 0) + (c.attempts ? 1 : 0)];
  const curStep = cad?.steps?.[c.attempts ? (c.cadence_step ?? 0) + 1 : 0];
  const [a, setA] = useState<any>(() => ({
    date: today(), time: new Date().toTimeString().slice(0, 5), channel: c.preferred_channel || cad?.channel || "WhatsApp", owner: "Lucas Santos",
    contact_type: c.attempts ? "Follow-up" : "Primeiro contato", message: curStep?.message ?? "", result: "Não respondeu", notes: "", value: "",
    next_contact_at: "",
  }));
  const { data: timeline = [] } = useQuery({
    queryKey: ["timeline", c.id], enabled: !!c.id,
    queryFn: async () => (await db.from("prospect_attempts").select("*").eq("company_id", c.id).order("happened_at", { ascending: false })).data ?? [],
  });

  const FIELDS = ["name", "trade_name", "cnpj", "niche", "sub_niche", "category", "city", "state", "district", "address", "zip_code", "phone", "whatsapp", "email", "website", "instagram", "facebook", "gbp_url", "linkedin", "notes",
    "owner_name", "contact_role", "preferred_channel", "prospect_status", "source", "priority", "potential", "temperature", "next_contact_at", "services_interest", "potential_value", "closed_value", "qualification", "list_id", "cadence_id"];

  async function save(close = true) {
    if (!c.name) return void toast.error("Informe a razão social / nome"), null;
    const payload: any = {};
    for (const k of FIELDS) payload[k] = c[k] === "" ? null : c[k];
    payload.services_interest = c.services_interest ?? [];
    payload.qualification = c.qualification ?? {};
    for (const k of ["prospect_status", "priority", "potential", "temperature"]) if (!payload[k]) delete payload[k];
    if (!c.id) {
      const dup = findDuplicate(c, companies);
      if (dup && !confirm(`Parece que "${dup.name}" já está cadastrada. Salvar mesmo assim?`)) return null;
    }
    const r = c.id ? await db.from("companies").update(payload).eq("id", c.id).select().single() : await db.from("companies").insert(payload).select().single();
    if (r.error) return void toast.error(r.error.message), null;
    toast.success("Empresa salva"); refresh();
    if (close) onClose(); else setC({ ...c, ...r.data });
    return r.data;
  }

  async function registerContact() {
    let row = c;
    if (!row.id) { row = await save(false); if (!row) return; }
    const happened = new Date(`${a.date}T${a.time || "12:00"}:00`).toISOString();
    let next = a.next_contact_at;
    if (!next && nextStep && cad) { const first = cad.steps[0]?.day ?? 1; next = addDays(Math.max(1, nextStep.day - (curStep?.day ?? first))); }
    const { error } = await db.from("prospect_attempts").insert({
      company_id: row.id, happened_at: happened, channel: a.channel, contact_type: a.contact_type, owner: a.owner, message: a.message || null,
      result: a.result, notes: a.notes || null, next_contact_at: next || null, value: a.value ? Number(a.value) : null,
    });
    if (error) return void toast.error(error.message);
    const status = statusFromResult(a.result, a.contact_type, row.prospect_status ?? "Não prospectado");
    const upd: any = {
      attempts: (row.attempts ?? 0) + 1, last_attempt_at: happened, last_result: a.result, prospect_status: status,
      next_contact_at: LOST.includes(status) ? null : next || null, first_prospect_at: row.first_prospect_at ?? happened,
    };
    if (cad && row.attempts) upd.cadence_step = Math.min((row.cadence_step ?? 0) + 1, cad.steps.length - 1);
    if (a.value && a.contact_type === "Proposta enviada") upd.potential_value = Number(a.value);
    await db.from("companies").update(upd).eq("id", row.id);
    toast.success(`Contato registrado — status: ${status}${upd.next_contact_at ? `, próximo em ${fmtDate(upd.next_contact_at)}` : ""}`);
    refresh(); onClose();
  }

  function createProposal() {
    sessionStorage.setItem("proposal-prefill", JSON.stringify({
      client_name: c.owner_name || c.trade_name || c.name, company: c.trade_name || c.name, niche: c.niche, sub_niche: c.sub_niche, city: c.city, district: c.district,
      goal: c.qualification?.goal ?? "", services: c.services_interest ?? [],
      diagnosis_notes: [c.qualification?.problem && `Principal problema: ${c.qualification.problem}`,
        ...QUALIFY_YESNO.filter(([k]) => c.qualification?.[k] !== undefined).map(([k, l]) => `${l} ${c.qualification[k] ? "Sim" : "Não"}`),
        c.notes && `Observações: ${c.notes}`].filter(Boolean).join("\n"),
    }));
    navigate({ to: "/propostas" });
  }

  const inp = (k: string, l: string, type = "text") => (
    <div key={k}><Label className="mb-1 block text-xs text-muted-foreground">{l}</Label><Input type={type} value={c[k] ?? ""} onChange={(e) => set(k, type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value)} /></div>
  );
  const pick = (k: string, l: string, opts: string[]) => (
    <div key={k}><Label className="mb-1 block text-xs text-muted-foreground">{l}</Label><Sel className="w-full" value={c[k] ?? ""} onChange={(v) => set(k, v)} options={opts} all="—" /></div>
  );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader><DialogTitle>{c.id ? c.trade_name || c.name : "Nova empresa"} {c.id && <Badge variant="outline" className="ml-2">{c.prospect_status}</Badge>}</DialogTitle></DialogHeader>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex h-auto flex-wrap justify-start">
            <TabsTrigger value="dados">Empresa</TabsTrigger><TabsTrigger value="prosp">Prospecção</TabsTrigger><TabsTrigger value="qualif">Qualificação</TabsTrigger>
            <TabsTrigger value="contato">Registrar contato</TabsTrigger><TabsTrigger value="historico">Histórico ({timeline.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="grid gap-3 sm:grid-cols-3">
            {inp("name", "Razão social *")}{inp("trade_name", "Nome fantasia")}{inp("cnpj", "CNPJ")}
            {inp("niche", "Nicho")}{inp("sub_niche", "Subnicho")}{inp("category", "Categoria")}
            {inp("city", "Cidade")}{inp("state", "Estado")}{inp("district", "Bairro")}
            {inp("address", "Endereço")}{inp("zip_code", "CEP")}{inp("phone", "Telefone")}
            {inp("whatsapp", "WhatsApp")}{inp("email", "E-mail")}{inp("website", "Site")}
            {inp("instagram", "Instagram")}{inp("facebook", "Facebook")}{inp("gbp_url", "Google Business Profile")}
            {inp("linkedin", "LinkedIn")}{inp("owner_name", "Nome do responsável")}{inp("contact_role", "Cargo")}
            {pick("preferred_channel", "Canal preferencial", CHANNELS)}
            <div className="sm:col-span-3"><Label className="mb-1 block text-xs text-muted-foreground">Observações</Label><Textarea rows={3} value={c.notes ?? ""} onChange={(e) => set("notes", e.target.value)} /></div>
          </TabsContent>

          <TabsContent value="prosp" className="grid gap-3 sm:grid-cols-3">
            {pick("prospect_status", "Status", ALL_STATUS)}{pick("source", "Origem", SOURCES)}{pick("priority", "Prioridade", PRIORITIES)}
            {pick("potential", "Potencial comercial", POTENTIALS)}{inp("potential_value", "Valor potencial (R$)", "number")}{inp("closed_value", "Valor fechado (R$)", "number")}
            {inp("next_contact_at", "Próximo contato", "date")}
            <div><Label className="mb-1 block text-xs text-muted-foreground">Lista</Label><select className={sel + " w-full"} value={c.list_id ?? ""} onChange={(e) => set("list_id", e.target.value || null)}><option value="">—</option>{lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
            <div><Label className="mb-1 block text-xs text-muted-foreground">Cadência</Label><select className={sel + " w-full"} value={c.cadence_id ?? ""} onChange={(e) => setC({ ...c, cadence_id: e.target.value || null, cadence_step: 0 })}><option value="">—</option>{cadences.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></div>
            <div className="sm:col-span-3 text-xs text-muted-foreground">
              Tentativas: <b className="text-foreground">{c.attempts ?? 0}</b> • Primeira prospecção: {fmtDate(c.first_prospect_at)} • Última: {fmtDate(c.last_attempt_at)} • Último resultado: {c.last_result ?? "—"}
            </div>
            <div className="sm:col-span-3">
              <Label className="mb-1 block text-xs text-muted-foreground">Serviços de interesse</Label>
              <div className="flex flex-wrap gap-2">
                {SERVICES_INTEREST.map((s) => {
                  const on = (c.services_interest ?? []).includes(s);
                  return <button key={s} type="button" onClick={() => set("services_interest", on ? c.services_interest.filter((x: string) => x !== s) : [...(c.services_interest ?? []), s])}
                    className={`rounded-full border px-3 py-1 text-xs ${on ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}>{s}</button>;
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="qualif" className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-3">
              {QUALIFY_YESNO.map(([k, l]) => (
                <div key={k} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                  <span className="text-foreground">{l}</span>
                  <select className="bg-transparent text-sm text-foreground" value={c.qualification?.[k] === undefined ? "" : c.qualification[k] ? "1" : "0"} onChange={(e) => setQ(k, e.target.value === "" ? undefined : e.target.value === "1")}>
                    <option value="">—</option><option value="1">Sim</option><option value="0">Não</option>
                  </select>
                </div>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[["problem", "Principal problema"], ["goal", "Principal objetivo"], ["budget", "Orçamento estimado (R$)"]].map(([k, l]) => (
                <div key={k}><Label className="mb-1 block text-xs text-muted-foreground">{l}</Label><Input value={c.qualification?.[k!] ?? ""} onChange={(e) => setQ(k!, e.target.value)} /></div>
              ))}
              <div><Label className="mb-1 block text-xs text-muted-foreground">Urgência</Label><Sel className="w-full" value={c.qualification?.urgency ?? ""} onChange={(v) => setQ("urgency", v)} options={["Alta", "Média", "Baixa"]} all="—" /></div>
              <div><Label className="mb-1 block text-xs text-muted-foreground">Data prevista para decisão</Label><Input type="date" value={c.qualification?.decision_date ?? ""} onChange={(e) => setQ("decision_date", e.target.value)} /></div>
              <div><Label className="mb-1 block text-xs text-muted-foreground">Temperatura</Label>
                <div className="flex gap-2"><Sel className="flex-1" value={c.temperature ?? "Frio"} onChange={(v) => set("temperature", v)} options={TEMPS} />
                  <Button type="button" size="sm" variant="outline" onClick={() => set("temperature", calcTemperature(c))}>Calcular</Button></div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="contato" className="space-y-3">
            {cad && curStep && <div className="rounded-md border border-primary/40 bg-primary/10 p-3 text-sm text-foreground">Cadência <b>{cad.name}</b> — etapa atual: Dia {curStep.day}: {curStep.action}{nextStep && nextStep !== curStep ? ` • próxima: Dia ${nextStep.day}` : ""}</div>}
            <div className="grid gap-3 sm:grid-cols-4">
              <div><Label className="mb-1 block text-xs text-muted-foreground">Data</Label><Input type="date" value={a.date} onChange={(e) => setA({ ...a, date: e.target.value })} /></div>
              <div><Label className="mb-1 block text-xs text-muted-foreground">Hora</Label><Input type="time" value={a.time} onChange={(e) => setA({ ...a, time: e.target.value })} /></div>
              <div><Label className="mb-1 block text-xs text-muted-foreground">Canal</Label><Sel className="w-full" value={a.channel} onChange={(v) => setA({ ...a, channel: v })} options={CHANNELS} /></div>
              <div><Label className="mb-1 block text-xs text-muted-foreground">Responsável</Label><Input value={a.owner} onChange={(e) => setA({ ...a, owner: e.target.value })} /></div>
              <div><Label className="mb-1 block text-xs text-muted-foreground">Tipo de contato</Label><Sel className="w-full" value={a.contact_type} onChange={(v) => setA({ ...a, contact_type: v })} options={CONTACT_TYPES} /></div>
              <div><Label className="mb-1 block text-xs text-muted-foreground">Resultado</Label><Sel className="w-full" value={a.result} onChange={(v) => setA({ ...a, result: v })} options={RESULTS} /></div>
              <div><Label className="mb-1 block text-xs text-muted-foreground">Próximo contato</Label><Input type="date" value={a.next_contact_at} onChange={(e) => setA({ ...a, next_contact_at: e.target.value })} />
                <div className="mt-1 flex gap-1">{[1, 2, 3, 7].map((d) => <button key={d} type="button" className="text-xs text-primary" onClick={() => setA({ ...a, next_contact_at: addDays(d) })}>+{d}d</button>)}</div></div>
              {a.contact_type === "Proposta enviada" && <div><Label className="mb-1 block text-xs text-muted-foreground">Valor (R$)</Label><Input type="number" value={a.value} onChange={(e) => setA({ ...a, value: e.target.value })} /></div>}
            </div>
            <div><Label className="mb-1 block text-xs text-muted-foreground">Mensagem utilizada</Label><Textarea rows={3} value={a.message} onChange={(e) => setA({ ...a, message: e.target.value })} /></div>
            <div><Label className="mb-1 block text-xs text-muted-foreground">Observação</Label><Textarea rows={2} value={a.notes} onChange={(e) => setA({ ...a, notes: e.target.value })} /></div>
            <p className="text-xs text-muted-foreground">Sem data de próximo contato, o sistema usa a próxima etapa da cadência (se houver).</p>
            <Button className="w-full" onClick={registerContact}><PhoneCall className="mr-1 h-4 w-4" />Registrar contato</Button>
          </TabsContent>

          <TabsContent value="historico">
            {timeline.length === 0 && <p className="text-sm text-muted-foreground">Nenhum contato registrado.</p>}
            <ol className="relative ml-2 border-l border-border">
              {timeline.map((t: any) => (
                <li key={t.id} className="mb-4 ml-4">
                  <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-primary" />
                  <div className="text-xs text-muted-foreground">{new Date(t.happened_at).toLocaleString("pt-BR")} • {t.owner ?? ""}</div>
                  <div className="text-sm font-medium text-foreground">{t.contact_type} — Canal: {t.channel} — Resultado: {t.result}</div>
                  {t.value && <div className="text-sm text-primary">Valor: {brl(t.value)}</div>}
                  {t.message && <div className="text-xs text-muted-foreground">Mensagem: {t.message}</div>}
                  {t.notes && <div className="text-xs text-muted-foreground">{t.notes}</div>}
                  {t.next_contact_at && <div className="text-xs text-muted-foreground">Próximo contato: {fmtDate(t.next_contact_at)}</div>}
                </li>
              ))}
            </ol>
            <p className="text-xs text-muted-foreground">O histórico é permanente e não pode ser apagado.</p>
          </TabsContent>
        </Tabs>
        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
          {c.id && <Button variant="outline" onClick={createProposal}><FileText className="mr-1 h-4 w-4" />Criar proposta</Button>}
          {tab !== "contato" && tab !== "historico" && <Button onClick={() => save()}>Salvar empresa</Button>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
