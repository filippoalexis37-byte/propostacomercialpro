// @ts-nocheck
/**
 * EMPRESAS JÁ PROSPECTADAS
 * Empresas que tiveram pelo menos uma tentativa de prospecção.
 */
import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { pageHead } from "@/lib/meta";
import {
  db, brl, fmtDate,
  PROSPECTING_STATUSES, PROSPECTING_STATUS_COLORS, PROSPECTING_STATUS_ICONS,
  ATTEMPT_CHANNELS, ATTEMPT_RESULTS, ATTEMPT_TYPES,
} from "@/lib/db";
import { PageHeader } from "@/components/crud-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, Plus, Clock, History } from "lucide-react";

export const Route = createFileRoute("/_authenticated/prospeccao/empresas-prospectadas")({
  head: pageHead("Empresas Prospectadas", "Empresas que já receberam tentativa de prospecção."),
  component: EmpresasProspectadas,
});

const NEGATIVES = ["Sem interesse", "Número inválido", "Empresa fechada", "Fora do perfil", "Duplicado"];

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium ${PROSPECTING_STATUS_COLORS[status] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
      {PROSPECTING_STATUS_ICONS[status]} {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    "Alta": "🔴 Alta",
    "Média": "🟡 Média",
    "Baixa": "🟢 Baixa",
  };
  return <span className="text-xs">{map[priority] || priority}</span>;
}

// ─── Diálogo: Registrar Tentativa ─────────────────────────────────────────────
function RegisterAttemptDialog({
  company,
  open,
  onClose,
}: { company: any; open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    attempt_date: new Date().toISOString().slice(0, 10),
    channel: "WhatsApp",
    attempt_type: "Follow-up",
    message_used: "",
    result: "Não respondeu",
    notes: "",
    next_contact_at: "",
    new_status: "",
  });
  const [saving, setSaving] = useState(false);

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    setSaving(true);
    try {
      // 1. Inserir tentativa
      const { error: ae } = await db.from("prospecting_attempts").insert({
        company_id: company.id,
        attempt_date: form.attempt_date,
        channel: form.channel,
        attempt_type: form.attempt_type,
        message_used: form.message_used || null,
        result: form.result,
        notes: form.notes || null,
        next_contact_at: form.next_contact_at || null,
      });
      if (ae) throw ae;

      // 2. Atualizar empresa
      const update: any = {
        last_attempted_at: form.attempt_date,
        attempt_count: (company.attempt_count || 0) + 1,
        last_attempt_result: form.result,
        last_message_used: form.message_used || null,
      };
      if (form.next_contact_at) update.next_contact_at = form.next_contact_at;
      if (form.new_status) update.prospecting_status = form.new_status;
      if (!company.first_prospected_at) update.first_prospected_at = form.attempt_date;

      // Auto-status baseado no resultado
      if (!form.new_status) {
        const resultStatusMap: Record<string, string> = {
          "Respondeu": "Respondeu",
          "Interessado": "Qualificado",
          "Sem interesse": "Sem interesse",
          "Número inválido": "Número inválido",
          "Empresa fechada": "Empresa fechada",
          "Fora do perfil": "Fora do perfil",
          "Pediu proposta": "Proposta enviada",
        };
        if (resultStatusMap[form.result]) update.prospecting_status = resultStatusMap[form.result];
        else if (company.prospecting_status === "Não prospectado") update.prospecting_status = "Tentativa realizada";
      }

      const { error: ce } = await db.from("companies").update(update).eq("id", company.id);
      if (ce) throw ce;

      toast.success("Tentativa registrada com sucesso!");
      qc.invalidateQueries({ queryKey: ["companies-prospecting"] });
      qc.invalidateQueries({ queryKey: ["companies-prospected"] });
      qc.invalidateQueries({ queryKey: ["prospecting-attempts", company.id] });
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao registrar tentativa.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Contato — {company?.name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Data *</Label>
            <Input type="date" value={form.attempt_date} onChange={(e) => set("attempt_date", e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Canal *</Label>
            <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground" value={form.channel} onChange={(e) => set("channel", e.target.value)}>
              {ATTEMPT_CHANNELS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Tipo *</Label>
            <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground" value={form.attempt_type} onChange={(e) => set("attempt_type", e.target.value)}>
              {ATTEMPT_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Resultado *</Label>
            <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground" value={form.result} onChange={(e) => set("result", e.target.value)}>
              {ATTEMPT_RESULTS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Próximo contato</Label>
            <Input type="date" value={form.next_contact_at} onChange={(e) => set("next_contact_at", e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Alterar status (opcional)</Label>
            <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground" value={form.new_status} onChange={(e) => set("new_status", e.target.value)}>
              <option value="">Auto (baseado no resultado)</option>
              {PROSPECTING_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block text-xs text-muted-foreground">Mensagem utilizada</Label>
            <Textarea rows={2} value={form.message_used} onChange={(e) => set("message_used", e.target.value)} placeholder="Cole aqui a mensagem enviada..." />
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block text-xs text-muted-foreground">Observações</Label>
            <Textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Salvando..." : "Registrar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Diálogo: Histórico ───────────────────────────────────────────────────────
function HistoryDialog({ company, open, onClose }: { company: any; open: boolean; onClose: () => void }) {
  const { data: attempts = [], isLoading } = useQuery({
    queryKey: ["prospecting-attempts", company?.id],
    enabled: !!company?.id && open,
    queryFn: async () => {
      const { data } = await db
        .from("prospecting_attempts")
        .select("*")
        .eq("company_id", company.id)
        .order("attempt_date", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico — {company?.name}</DialogTitle>
        </DialogHeader>
        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {!isLoading && attempts.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma tentativa registrada ainda.</p>
        )}
        <div className="space-y-4">
          {attempts.map((a: any, i: number) => (
            <div key={a.id} className="relative pl-6 pb-4 border-l-2 border-border last:border-transparent">
              <div className="absolute left-[-5px] top-1 h-2.5 w-2.5 rounded-full bg-primary" />
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <div className="text-sm font-medium text-foreground">{a.attempt_type}</div>
                  <div className="text-xs text-muted-foreground">{fmtDate(a.attempt_date)} · {a.channel}</div>
                </div>
                <Badge variant="outline">{a.result}</Badge>
              </div>
              {a.message_used && (
                <div className="mt-2 rounded bg-muted px-3 py-2 text-xs text-foreground whitespace-pre-wrap">
                  {a.message_used}
                </div>
              )}
              {a.notes && <p className="mt-1 text-xs text-muted-foreground">{a.notes}</p>}
              {a.next_contact_at && (
                <p className="mt-1 text-xs text-blue-600">→ Próximo: {fmtDate(a.next_contact_at)}</p>
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
function EmpresasProspectadas() {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [nicheFilter, setNicheFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [registerCompany, setRegisterCompany] = useState<any>(null);
  const [historyCompany, setHistoryCompany] = useState<any>(null);
  const qc = useQueryClient();

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["companies-prospected"],
    queryFn: async () => {
      const { data } = await db
        .from("companies")
        .select("*")
        .neq("prospecting_status", "Não prospectado")
        .order("last_attempted_at", { ascending: false });
      return data ?? [];
    },
  });

  const niches = useMemo(() => [...new Set(companies.map((c: any) => c.niche).filter(Boolean))].sort(), [companies]);
  const cities = useMemo(() => [...new Set(companies.map((c: any) => c.city).filter(Boolean))].sort(), [companies]);

  const filtered = useMemo(() =>
    companies.filter((c: any) => {
      const qs = q.toLowerCase();
      const matchQ = !q ||
        c.name?.toLowerCase().includes(qs) ||
        c.trade_name?.toLowerCase().includes(qs) ||
        c.contact_name?.toLowerCase().includes(qs);
      const matchStatus = !statusFilter || c.prospecting_status === statusFilter;
      const matchNiche = !nicheFilter || c.niche === nicheFilter;
      const matchCity = !cityFilter || c.city === cityFilter;
      return matchQ && matchStatus && matchNiche && matchCity;
    }),
    [companies, q, statusFilter, nicheFilter, cityFilter]
  );

  async function changeStatus(company: any, status: string) {
    await db.from("companies").update({ prospecting_status: status }).eq("id", company.id);
    qc.invalidateQueries({ queryKey: ["companies-prospected"] });
    qc.invalidateQueries({ queryKey: ["companies-prospecting"] });
    toast.success(`Status alterado para "${status}"`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Empresas Prospectadas"
        subtitle="Empresas que já receberam pelo menos uma tentativa de contato."
        action={
          <div className="text-sm text-muted-foreground">
            {filtered.length} empresa(s)
          </div>
        }
      />

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos os status</option>
          {PROSPECTING_STATUSES.filter((s) => s !== "Não prospectado").map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground" value={nicheFilter} onChange={(e) => setNicheFilter(e.target.value)}>
          <option value="">Todos os nichos</option>
          {niches.map((n: string) => <option key={n}>{n}</option>)}
        </select>
        <select className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
          <option value="">Todas as cidades</option>
          {cities.map((c: string) => <option key={c}>{c}</option>)}
        </select>
        {(q || statusFilter || nicheFilter || cityFilter) && (
          <Button variant="ghost" size="sm" onClick={() => { setQ(""); setStatusFilter(""); setNicheFilter(""); setCityFilter(""); }}>
            Limpar filtros
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
              <th className="px-4 py-3">Contato</th>
              <th className="px-4 py-3">Última tentativa</th>
              <th className="px-4 py-3">Tentativas</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Próx. follow-up</th>
              <th className="px-4 py-3">Prioridade</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td className="px-4 py-8 text-muted-foreground" colSpan={99}>Carregando...</td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr><td className="px-4 py-10 text-center text-muted-foreground" colSpan={99}>Nenhuma empresa encontrada.</td></tr>
            )}
            {filtered.map((c: any) => (
              <tr key={c.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-medium text-foreground">
                  {c.name}
                  {c.trade_name && <div className="text-xs text-muted-foreground">{c.trade_name}</div>}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{c.niche || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.city || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {c.contact_name && <div className="text-xs font-medium text-foreground">{c.contact_name}</div>}
                  {c.whatsapp || c.phone || "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{fmtDate(c.last_attempted_at)}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{c.attempt_count || 0}</td>
                <td className="px-4 py-3"><StatusBadge status={c.prospecting_status} /></td>
                <td className="px-4 py-3 text-muted-foreground">{fmtDate(c.next_contact_at)}</td>
                <td className="px-4 py-3"><PriorityBadge priority={c.prospecting_priority} /></td>
                <td className="px-2 py-2 text-right whitespace-nowrap flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => setRegisterCompany(c)}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Registrar
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setHistoryCompany(c)} title="Histórico">
                    <History className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {registerCompany && (
        <RegisterAttemptDialog
          company={registerCompany}
          open={!!registerCompany}
          onClose={() => setRegisterCompany(null)}
        />
      )}
      {historyCompany && (
        <HistoryDialog
          company={historyCompany}
          open={!!historyCompany}
          onClose={() => setHistoryCompany(null)}
        />
      )}
    </div>
  );
}
