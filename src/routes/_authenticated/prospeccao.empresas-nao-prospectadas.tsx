// @ts-nocheck
/**
 * EMPRESAS NÃO PROSPECTADAS
 * Fila de empresas que ainda não receberam nenhuma tentativa.
 */
import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { pageHead } from "@/lib/meta";
import {
  db, fmtDate,
  PROSPECTING_PRIORITIES, PROSPECTING_POTENTIALS,
  LEAD_SOURCES_DEFAULT,
} from "@/lib/db";
import { PageHeader } from "@/components/crud-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, Zap } from "lucide-react";

export const Route = createFileRoute("/_authenticated/prospeccao/empresas-nao-prospectadas")({
  head: pageHead("Falta Prospectar", "Empresas que ainda não foram contactadas."),
  component: EmpresasNaoProspectadas,
});

// ─── Diálogo: Iniciar prospecção ──────────────────────────────────────────────
function StartProspectingDialog({
  company,
  open,
  onClose,
}: { company: any; open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    channel: "WhatsApp",
    message_used: "",
    result: "Não respondeu",
    notes: "",
    next_contact_at: "",
  });
  const [saving, setSaving] = useState(false);

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function start() {
    setSaving(true);
    const now = new Date().toISOString();
    try {
      // Registrar tentativa
      await db.from("prospecting_attempts").insert({
        company_id: company.id,
        attempt_date: now,
        channel: form.channel,
        attempt_type: "Primeiro contato",
        message_used: form.message_used || null,
        result: form.result,
        notes: form.notes || null,
        next_contact_at: form.next_contact_at || null,
      });
      // Atualizar empresa
      await db.from("companies").update({
        prospecting_status: "Primeiro contato",
        first_prospected_at: now,
        last_attempted_at: now,
        attempt_count: 1,
        last_attempt_result: form.result,
        next_contact_at: form.next_contact_at || null,
      }).eq("id", company.id);

      toast.success(`Primeiro contato com "${company.name}" registrado!`);
      qc.invalidateQueries({ queryKey: ["companies-not-prospected"] });
      qc.invalidateQueries({ queryKey: ["companies-prospecting"] });
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao iniciar prospecção.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Prospectar — {company?.name}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-2">
          Registrar o <strong>primeiro contato</strong> com esta empresa.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Canal *</Label>
            <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground" value={form.channel} onChange={(e) => set("channel", e.target.value)}>
              {["WhatsApp","Telefone","E-mail","Instagram","Facebook","LinkedIn","Outro"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Resultado *</Label>
            <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground" value={form.result} onChange={(e) => set("result", e.target.value)}>
              {["Não respondeu","Respondeu","Interessado","Sem interesse","Pediu retorno","Número inválido","Empresa fechada","Outro"].map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Próximo contato</Label>
            <Input type="date" value={form.next_contact_at} onChange={(e) => set("next_contact_at", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block text-xs text-muted-foreground">Mensagem enviada</Label>
            <Textarea rows={2} value={form.message_used} onChange={(e) => set("message_used", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block text-xs text-muted-foreground">Observações</Label>
            <Textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={start} disabled={saving}>{saving ? "Registrando..." : "Prospectar agora"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
function EmpresasNaoProspectadas() {
  const [q, setQ] = useState("");
  const [nicheFilter, setNicheFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [sortBy, setSortBy] = useState("priority");
  const [selectedCompany, setSelectedCompany] = useState<any>(null);

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["companies-not-prospected"],
    queryFn: async () => {
      const { data } = await db
        .from("companies")
        .select("*")
        .eq("prospecting_status", "Não prospectado")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const niches = useMemo(() => [...new Set(companies.map((c: any) => c.niche).filter(Boolean))].sort(), [companies]);
  const cities = useMemo(() => [...new Set(companies.map((c: any) => c.city).filter(Boolean))].sort(), [companies]);

  const filtered = useMemo(() => {
    let rows = companies.filter((c: any) => {
      const qs = q.toLowerCase();
      const matchQ = !q || c.name?.toLowerCase().includes(qs) || c.trade_name?.toLowerCase().includes(qs);
      const matchNiche = !nicheFilter || c.niche === nicheFilter;
      const matchCity = !cityFilter || c.city === cityFilter;
      const matchPriority = !priorityFilter || c.prospecting_priority === priorityFilter;
      return matchQ && matchNiche && matchCity && matchPriority;
    });

    const priorityOrder: Record<string, number> = { "Alta": 0, "Média": 1, "Baixa": 2 };
    const potentialOrder: Record<string, number> = { "Alto": 0, "Médio": 1, "Baixo": 2 };

    rows.sort((a: any, b: any) => {
      if (sortBy === "priority") return (priorityOrder[a.prospecting_priority] ?? 1) - (priorityOrder[b.prospecting_priority] ?? 1);
      if (sortBy === "potential") return (potentialOrder[a.prospecting_potential] ?? 1) - (potentialOrder[b.prospecting_potential] ?? 1);
      if (sortBy === "niche") return (a.niche || "").localeCompare(b.niche || "");
      if (sortBy === "city") return (a.city || "").localeCompare(b.city || "");
      if (sortBy === "date") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return 0;
    });

    return rows;
  }, [companies, q, nicheFilter, cityFilter, priorityFilter, sortBy]);

  const priorityIcon: Record<string, string> = { "Alta": "🔴", "Média": "🟡", "Baixa": "🟢" };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Empresas Não Prospectadas"
        subtitle="Fila de empresas aguardando primeiro contato."
        action={
          <div className="text-sm text-muted-foreground font-medium">
            {filtered.length} empresa(s) aguardando
          </div>
        }
      />

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar empresa..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground" value={nicheFilter} onChange={(e) => setNicheFilter(e.target.value)}>
          <option value="">Todos os nichos</option>
          {niches.map((n: string) => <option key={n}>{n}</option>)}
        </select>
        <select className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
          <option value="">Todas as cidades</option>
          {cities.map((c: string) => <option key={c}>{c}</option>)}
        </select>
        <select className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="">Todas as prioridades</option>
          {PROSPECTING_PRIORITIES.map((p) => <option key={p}>{p}</option>)}
        </select>
        <select className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="priority">Ordenar: Prioridade</option>
          <option value="potential">Ordenar: Potencial</option>
          <option value="niche">Ordenar: Nicho</option>
          <option value="city">Ordenar: Cidade</option>
          <option value="date">Ordenar: Cadastro</option>
        </select>
        {(q || nicheFilter || cityFilter || priorityFilter) && (
          <Button variant="ghost" size="sm" onClick={() => { setQ(""); setNicheFilter(""); setCityFilter(""); setPriorityFilter(""); }}>
            Limpar
          </Button>
        )}
      </div>

      {/* Tabela */}
      <div className="panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Empresa</th>
              <th className="px-4 py-3">Nicho</th>
              <th className="px-4 py-3">Cidade</th>
              <th className="px-4 py-3">Telefone</th>
              <th className="px-4 py-3">WhatsApp</th>
              <th className="px-4 py-3">Origem</th>
              <th className="px-4 py-3">Cadastro</th>
              <th className="px-4 py-3">Prioridade</th>
              <th className="px-4 py-3">Potencial</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td className="px-4 py-8 text-muted-foreground" colSpan={99}>Carregando...</td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr><td className="px-4 py-10 text-center text-muted-foreground" colSpan={99}>
                Nenhuma empresa aguardando prospecção! 🎉
              </td></tr>
            )}
            {filtered.map((c: any) => (
              <tr key={c.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-medium text-foreground">
                  {c.name}
                  {c.trade_name && <div className="text-xs text-muted-foreground">{c.trade_name}</div>}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{c.niche || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.city || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.phone || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.whatsapp || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.prospecting_source || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{fmtDate(c.created_at)}</td>
                <td className="px-4 py-3">
                  <span className="text-sm">{priorityIcon[c.prospecting_priority] || "🟡"} {c.prospecting_priority || "Média"}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{c.prospecting_potential || "Médio"}</td>
                <td className="px-4 py-3">
                  <Button size="sm" onClick={() => setSelectedCompany(c)}>
                    <Zap className="h-3.5 w-3.5 mr-1" /> Prospectar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedCompany && (
        <StartProspectingDialog
          company={selectedCompany}
          open={!!selectedCompany}
          onClose={() => setSelectedCompany(null)}
        />
      )}
    </div>
  );
}
