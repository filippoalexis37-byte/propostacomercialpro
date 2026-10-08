// @ts-nocheck
/**
 * FOLLOW-UP DE PROSPECÇÃO
 * Empresas com próximo contato vencido ou para hoje.
 */
import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { pageHead } from "@/lib/meta";
import {
  db, fmtDate,
  PROSPECTING_STATUS_COLORS, PROSPECTING_STATUS_ICONS,
  ATTEMPT_CHANNELS, ATTEMPT_RESULTS, ATTEMPT_TYPES, PROSPECTING_STATUSES,
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
import { Clock, AlertTriangle, Plus, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/prospeccao/followup")({
  head: pageHead("Follow-up B2B", "Empresas que precisam de novo contato."),
  component: FollowupProspeccao,
});

function RegisterAttemptDialog({ company, open, onClose }: { company: any; open: boolean; onClose: () => void }) {
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

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function save() {
    setSaving(true);
    try {
      await db.from("prospecting_attempts").insert({
        company_id: company.id,
        attempt_date: form.attempt_date,
        channel: form.channel,
        attempt_type: form.attempt_type,
        message_used: form.message_used || null,
        result: form.result,
        notes: form.notes || null,
        next_contact_at: form.next_contact_at || null,
      });
      const update: any = {
        last_attempted_at: form.attempt_date,
        attempt_count: (company.attempt_count || 0) + 1,
        last_attempt_result: form.result,
      };
      if (form.next_contact_at) update.next_contact_at = form.next_contact_at;
      else update.next_contact_at = null;
      if (form.new_status) update.prospecting_status = form.new_status;
      await db.from("companies").update(update).eq("id", company.id);
      toast.success("Follow-up registrado!");
      qc.invalidateQueries({ queryKey: ["companies-followup"] });
      qc.invalidateQueries({ queryKey: ["companies-prospecting"] });
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao registrar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Follow-up — {company?.name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Data *</Label>
            <Input type="date" value={form.attempt_date} onChange={(e) => set("attempt_date", e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Canal *</Label>
            <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.channel} onChange={(e) => set("channel", e.target.value)}>
              {ATTEMPT_CHANNELS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Tipo</Label>
            <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.attempt_type} onChange={(e) => set("attempt_type", e.target.value)}>
              {ATTEMPT_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Resultado *</Label>
            <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.result} onChange={(e) => set("result", e.target.value)}>
              {ATTEMPT_RESULTS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Próximo contato</Label>
            <Input type="date" value={form.next_contact_at} onChange={(e) => set("next_contact_at", e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Alterar status</Label>
            <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.new_status} onChange={(e) => set("new_status", e.target.value)}>
              <option value="">Manter atual</option>
              {PROSPECTING_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block text-xs text-muted-foreground">Mensagem utilizada</Label>
            <Textarea rows={2} value={form.message_used} onChange={(e) => set("message_used", e.target.value)} />
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

function FollowupProspeccao() {
  const [q, setQ] = useState("");
  const [nicheFilter, setNicheFilter] = useState("");
  const [tab, setTab] = useState<"late" | "today" | "upcoming">("late");
  const [registerCompany, setRegisterCompany] = useState<any>(null);

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["companies-followup"],
    queryFn: async () => {
      const { data } = await db
        .from("companies")
        .select("*")
        .not("next_contact_at", "is", null)
        .not("prospecting_status", "in", '("Cliente","Sem interesse","Número inválido","Empresa fechada","Fora do perfil","Duplicado")')
        .order("next_contact_at", { ascending: true });
      return data ?? [];
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const categorized = useMemo(() => {
    return {
      late: companies.filter((c: any) => {
        const d = new Date(c.next_contact_at + "T12:00:00");
        return d < today;
      }),
      today: companies.filter((c: any) => {
        const d = new Date(c.next_contact_at + "T12:00:00");
        return d >= today && d < tomorrow;
      }),
      upcoming: companies.filter((c: any) => {
        const d = new Date(c.next_contact_at + "T12:00:00");
        return d >= tomorrow && d <= nextWeek;
      }),
    };
  }, [companies]);

  const niches = useMemo(() =>
    [...new Set(companies.map((c: any) => c.niche).filter(Boolean))].sort(),
    [companies]
  );

  const current = categorized[tab];
  const filtered = useMemo(() =>
    current.filter((c: any) => {
      const qs = q.toLowerCase();
      const matchQ = !q || c.name?.toLowerCase().includes(qs) || c.niche?.toLowerCase().includes(qs);
      const matchNiche = !nicheFilter || c.niche === nicheFilter;
      return matchQ && matchNiche;
    }),
    [current, q, nicheFilter]
  );

  const daysSince = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    return Math.floor((today.getTime() - d.getTime()) / 86400000);
  };

  const tabs = [
    { key: "late", label: "Atrasados", count: categorized.late.length, color: "text-red-600" },
    { key: "today", label: "Hoje", count: categorized.today.length, color: "text-amber-600" },
    { key: "upcoming", label: "Próximos 7 dias", count: categorized.upcoming.length, color: "text-blue-600" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Follow-up de Prospecção"
        subtitle="Empresas que precisam de novo contato. Nunca envie mensagem sem autorização."
      />

      {/* Resumo */}
      <div className="grid gap-3 sm:grid-cols-3">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`panel p-4 text-left transition-all hover:ring-2 hover:ring-primary/30 ${tab === t.key ? "ring-2 ring-primary" : ""}`}
          >
            <div className={`text-xs font-medium ${t.color}`}>{t.label}</div>
            <div className="font-display text-3xl font-semibold text-foreground mt-1">{t.count}</div>
          </button>
        ))}
      </div>

      {/* Aviso importante */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-800">
          <strong>Atenção:</strong> O sistema nunca envia mensagens automaticamente. Você precisa registrar cada contato manualmente após realizá-lo.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={nicheFilter} onChange={(e) => setNicheFilter(e.target.value)}>
          <option value="">Todos os nichos</option>
          {niches.map((n: string) => <option key={n}>{n}</option>)}
        </select>
        {(q || nicheFilter) && (
          <Button variant="ghost" size="sm" onClick={() => { setQ(""); setNicheFilter(""); }}>Limpar</Button>
        )}
      </div>

      {/* Tabela */}
      <div className="panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Empresa</th>
              <th className="px-4 py-3">Nicho</th>
              <th className="px-4 py-3">Último contato</th>
              {tab === "late" && <th className="px-4 py-3">Atraso</th>}
              <th className="px-4 py-3">Próximo contato</th>
              <th className="px-4 py-3">Tentativas</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Canal preferencial</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td className="px-4 py-8 text-muted-foreground" colSpan={99}>Carregando...</td></tr>}
            {!isLoading && filtered.length === 0 && (
              <tr><td className="px-4 py-10 text-center text-muted-foreground" colSpan={99}>
                {tab === "late" ? "Nenhum follow-up atrasado 🎉" : "Nenhum follow-up para este período."}
              </td></tr>
            )}
            {filtered.map((c: any) => (
              <tr key={c.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3 font-medium text-foreground">
                  {c.name}
                  {c.whatsapp && <div className="text-xs text-muted-foreground">{c.whatsapp}</div>}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{c.niche || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{fmtDate(c.last_attempted_at)}</td>
                {tab === "late" && (
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-red-600">
                      {daysSince(c.next_contact_at)}d atraso
                    </span>
                  </td>
                )}
                <td className="px-4 py-3 text-muted-foreground">{fmtDate(c.next_contact_at)}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{c.attempt_count || 0}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium ${PROSPECTING_STATUS_COLORS[c.prospecting_status] || ""}`}>
                    {PROSPECTING_STATUS_ICONS[c.prospecting_status]} {c.prospecting_status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{c.contact_channel || "—"}</td>
                <td className="px-4 py-3">
                  <Button size="sm" onClick={() => setRegisterCompany(c)}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Registrar
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
    </div>
  );
}
