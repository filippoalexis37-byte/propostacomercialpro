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
import {
  Search, Zap, Plus, Phone, MessageSquare, Copy, Globe, Eye, Edit2, Trash2, ExternalLink,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/prospeccao/empresas-nao-prospectadas")({
  head: pageHead("Falta Prospectar", "Empresas que ainda não foram contactadas."),
  component: EmpresasNaoProspectadas,
});

// ─── Helpers de Telefone e WhatsApp ───────────────────────────────────────────
function normalizePhone(phone: string): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

function handleOpenWhatsApp(phone: string, companyName: string) {
  const norm = normalizePhone(phone);
  if (!norm || norm.length < 10) {
    toast.error("Telefone/WhatsApp inválido para envio.");
    return;
  }
  const msg = encodeURIComponent(`Olá, tudo bem? Gostaria de conversar com o responsável da ${companyName}.`);
  window.open(`https://wa.me/${norm}?text=${msg}`, "_blank");
}

function handleCopyPhone(phone: string) {
  if (!phone) {
    toast.error("Nenhum telefone cadastrado.");
    return;
  }
  navigator.clipboard.writeText(phone);
  toast.success(`Telefone ${phone} copiado para a área de transferência!`);
}

function handleOpenSite(site: string) {
  if (!site) return;
  const url = site.startsWith("http") ? site : `https://${site}`;
  window.open(url, "_blank");
}

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
      // Registrar tentativa no histórico
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

      // Atualizar status da empresa
      await db.from("companies").update({
        prospecting_status: form.result === "Interessado" ? "Respondeu" : "Primeiro contato",
        first_prospected_at: now,
        last_attempted_at: now,
        attempt_count: 1,
        last_attempt_result: form.result,
        next_contact_at: form.next_contact_at || null,
      }).eq("id", company.id);

      toast.success(`Primeiro contato com "${company.name}" registrado!`);
      qc.invalidateQueries({ queryKey: ["companies-not-prospected"] });
      qc.invalidateQueries({ queryKey: ["companies-prospecting"] });
      qc.invalidateQueries({ queryKey: ["companies-followup"] });
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao iniciar prospecção.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Prospectar — {company?.name}</DialogTitle>
        </DialogHeader>

        <div className="bg-muted/40 p-3 rounded text-xs space-y-1 mb-2">
          <p><strong>Responsável:</strong> {company?.contact_name || "Não informado"}</p>
          <p><strong>Telefone:</strong> {company?.phone || "—"} {company?.whatsapp ? `| WhatsApp: ${company.whatsapp}` : ""}</p>
          <p><strong>Nicho:</strong> {company?.niche || "—"} | <strong>Cidade:</strong> {company?.city || "—"}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Canal Utilizado *</Label>
            <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground" value={form.channel} onChange={(e) => set("channel", e.target.value)}>
              {["WhatsApp","Ligação/Telefone","E-mail","Instagram Direct","LinkedIn","Presencial","Outro"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">Resultado da Tentativa *</Label>
            <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground" value={form.result} onChange={(e) => set("result", e.target.value)}>
              {["Não respondeu","Respondeu","Interessado","Sem interesse","Pediu retorno","Número inválido","Empresa fechada","Outro"].map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block text-xs text-muted-foreground">Próxima Data de Follow-up</Label>
            <Input type="date" value={form.next_contact_at} onChange={(e) => set("next_contact_at", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block text-xs text-muted-foreground">Mensagem enviada / Resumo da abordagem</Label>
            <Textarea rows={2} placeholder="Descreva brevemente o texto enviado ou a resposta obtida..." value={form.message_used} onChange={(e) => set("message_used", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block text-xs text-muted-foreground">Observações adicionais</Label>
            <Textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={start} disabled={saving}>{saving ? "Registrando..." : "Registrar Contato"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Diálogo: Adicionar Empresa ───────────────────────────────────────────────
function AddCompanyDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    contact_name: "",
    phone: "",
    whatsapp: "",
    email: "",
    website: "",
    instagram: "",
    city: "",
    state: "SP",
    niche: "",
    potential_service: "",
    potential_value: "",
    notes: "",
    lead_source: "Prospecção Ativa",
  });
  const [saving, setSaving] = useState(false);

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    if (!form.name.trim()) {
      toast.error("Nome da empresa é obrigatório!");
      return;
    }
    setSaving(true);
    try {
      // Validação de duplicidades
      if (form.phone || form.whatsapp || form.website) {
        let orConditions = [];
        if (form.phone) orConditions.push(`phone.eq.${form.phone}`);
        if (form.whatsapp) orConditions.push(`whatsapp.eq.${form.whatsapp}`);
        if (form.website) orConditions.push(`website.eq.${form.website}`);

        const { data: dup } = await db
          .from("companies")
          .select("id, name")
          .or(orConditions.join(","));

        if (dup && dup.length > 0) {
          toast.error(`Já existe empresa cadastrada com telefone, WhatsApp ou site informado: "${dup[0].name}"`);
          setSaving(false);
          return;
        }
      }

      const { error } = await db.from("companies").insert({
        name: form.name.trim(),
        contact_name: form.contact_name.trim() || null,
        phone: form.phone.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        email: form.email.trim() || null,
        website: form.website.trim() || null,
        instagram: form.instagram.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        niche: form.niche.trim() || null,
        potential_service: form.potential_service.trim() || null,
        estimated_contract_value: form.potential_value ? Number(form.potential_value.replace(/\D/g, "")) / 100 || null : null,
        notes: form.notes.trim() || null,
        prospecting_source: form.lead_source.trim() || null,
        prospecting_status: "Não prospectado",
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success(`Empresa "${form.name}" salva com sucesso!`);
      qc.invalidateQueries({ queryKey: ["companies-not-prospected"] });
      qc.invalidateQueries({ queryKey: ["companies-prospecting"] });
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao salvar empresa");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>+ Adicionar Empresa para Prospecção</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2 py-2">
          <div className="sm:col-span-2">
            <Label className="mb-1 block text-xs font-semibold">Nome da empresa *</Label>
            <Input placeholder="Ex: Climatização Santos" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <Label className="mb-1 block text-xs">Nome do responsável</Label>
            <Input placeholder="Ex: Carlos Eduardo" value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)} />
          </div>
          <div>
            <Label className="mb-1 block text-xs">Telefone comercial</Label>
            <Input placeholder="(13) 3333-3333" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div>
            <Label className="mb-1 block text-xs">WhatsApp</Label>
            <Input placeholder="(13) 99999-9999" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
          </div>
          <div>
            <Label className="mb-1 block text-xs">E-mail</Label>
            <Input type="email" placeholder="contato@empresa.com.br" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div>
            <Label className="mb-1 block text-xs">Site</Label>
            <Input placeholder="https://empresa.com.br" value={form.website} onChange={(e) => set("website", e.target.value)} />
          </div>
          <div>
            <Label className="mb-1 block text-xs">Instagram</Label>
            <Input placeholder="@empresa" value={form.instagram} onChange={(e) => set("instagram", e.target.value)} />
          </div>
          <div>
            <Label className="mb-1 block text-xs">Cidade</Label>
            <Input placeholder="Santos" value={form.city} onChange={(e) => set("city", e.target.value)} />
          </div>
          <div>
            <Label className="mb-1 block text-xs">Estado</Label>
            <Input placeholder="SP" value={form.state} onChange={(e) => set("state", e.target.value)} />
          </div>
          <div>
            <Label className="mb-1 block text-xs">Nicho / Segmento</Label>
            <Input placeholder="Ex: Ar Condicionado, Clínicas" value={form.niche} onChange={(e) => set("niche", e.target.value)} />
          </div>
          <div>
            <Label className="mb-1 block text-xs">Serviço Potencial</Label>
            <Input placeholder="Ex: Gestão de Tráfego, Google Ads" value={form.potential_service} onChange={(e) => set("potential_service", e.target.value)} />
          </div>
          <div>
            <Label className="mb-1 block text-xs">Valor Potencial Estimado (R$)</Label>
            <Input placeholder="Ex: 2500" value={form.potential_value} onChange={(e) => set("potential_value", e.target.value)} />
          </div>
          <div>
            <Label className="mb-1 block text-xs">Origem do Lead</Label>
            <Input placeholder="Ex: Google Maps, Instagram, Indicação" value={form.lead_source} onChange={(e) => set("lead_source", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1 block text-xs">Observações</Label>
            <Textarea rows={2} placeholder="Anotações comerciais, concorrentes, dores..." value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar Empresa"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Diálogo: Editar Empresa ──────────────────────────────────────────────────
function EditCompanyDialog({ company, open, onClose }: { company: any; open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: company?.name || "",
    contact_name: company?.contact_name || "",
    phone: company?.phone || "",
    whatsapp: company?.whatsapp || "",
    email: company?.email || "",
    website: company?.website || "",
    instagram: company?.instagram || "",
    city: company?.city || "",
    state: company?.state || "SP",
    niche: company?.niche || "",
    notes: company?.notes || "",
  });
  const [saving, setSaving] = useState(false);

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function update() {
    if (!form.name.trim()) { toast.error("Nome é obrigatório"); return; }
    setSaving(true);
    try {
      await db.from("companies").update({
        name: form.name.trim(),
        contact_name: form.contact_name.trim() || null,
        phone: form.phone.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        email: form.email.trim() || null,
        website: form.website.trim() || null,
        instagram: form.instagram.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        niche: form.niche.trim() || null,
        notes: form.notes.trim() || null,
      }).eq("id", company.id);

      toast.success("Empresa atualizada com sucesso!");
      qc.invalidateQueries({ queryKey: ["companies-not-prospected"] });
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao atualizar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Empresa — {company?.name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2 py-2">
          <div className="sm:col-span-2">
            <Label className="text-xs">Nome *</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Responsável</Label>
            <Input value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Telefone</Label>
            <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">WhatsApp</Label>
            <Input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">E-mail</Label>
            <Input value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs">Site</Label>
            <Input value={form.website} onChange={(e) => set("website", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Cidade</Label>
            <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Nicho</Label>
            <Input value={form.niche} onChange={(e) => set("niche", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs">Observações</Label>
            <Textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={update} disabled={saving}>{saving ? "Salvando..." : "Salvar Alterações"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Diálogo: Ver Detalhes ────────────────────────────────────────────────────
function CompanyDetailsDialog({ company, open, onClose }: { company: any; open: boolean; onClose: () => void }) {
  if (!company) return null;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{company.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm py-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <p><strong>Responsável:</strong> {company.contact_name || "—"}</p>
            <p><strong>Nicho:</strong> {company.niche || "—"}</p>
            <p><strong>Telefone:</strong> {company.phone || "—"}</p>
            <p><strong>WhatsApp:</strong> {company.whatsapp || "—"}</p>
            <p><strong>E-mail:</strong> {company.email || "—"}</p>
            <p><strong>Cidade/UF:</strong> {company.city ? `${company.city}/${company.state || ""}` : "—"}</p>
            <p><strong>Origem:</strong> {company.prospecting_source || "—"}</p>
            <p><strong>Cadastro:</strong> {fmtDate(company.created_at)}</p>
          </div>
          {company.website && (
            <div className="text-xs">
              <strong>Site:</strong>{" "}
              <a href={company.website.startsWith("http") ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                {company.website}
              </a>
            </div>
          )}
          {company.notes && (
            <div className="p-2.5 bg-muted/50 rounded text-xs">
              <strong>Observações:</strong>
              <p className="mt-1 text-muted-foreground">{company.notes}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
function EmpresasNaoProspectadas() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [nicheFilter, setNicheFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [sortBy, setSortBy] = useState("priority");

  // Dialog states
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [addCompanyOpen, setAddCompanyOpen] = useState(false);
  const [viewCompany, setViewCompany] = useState<any>(null);
  const [editCompany, setEditCompany] = useState<any>(null);

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

  async function handleDeleteCompany(c: any) {
    if (!confirm(`Tem certeza que deseja excluir permanentemente a empresa "${c.name}"?`)) {
      return;
    }
    try {
      await db.from("companies").delete().eq("id", c.id);
      toast.success(`Empresa "${c.name}" excluída.`);
      qc.invalidateQueries({ queryKey: ["companies-not-prospected"] });
      qc.invalidateQueries({ queryKey: ["companies-prospecting"] });
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao excluir empresa.");
    }
  }

  const niches = useMemo(() => [...new Set(companies.map((c: any) => c.niche).filter(Boolean))].sort(), [companies]);
  const cities = useMemo(() => [...new Set(companies.map((c: any) => c.city).filter(Boolean))].sort(), [companies]);

  const filtered = useMemo(() => {
    let rows = companies.filter((c: any) => {
      const qs = q.toLowerCase();
      const matchQ = !q || c.name?.toLowerCase().includes(qs) || c.trade_name?.toLowerCase().includes(qs) || c.contact_name?.toLowerCase().includes(qs);
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
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground">{filtered.length} empresa(s)</span>
            <Button variant="default" size="sm" onClick={() => setAddCompanyOpen(true)} className="gap-1.5 shadow-sm">
              <Plus className="h-4 w-4" /> Adicionar empresa
            </Button>
          </div>
        }
      />

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por empresa ou contato..." value={q} onChange={(e) => setQ(e.target.value)} />
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

      {/* Tabela de Empresas */}
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
              <th className="px-4 py-3">Prioridade</th>
              <th className="px-4 py-3 text-right">Ações</th>
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
            {filtered.map((c: any) => {
              const activePhone = c.whatsapp || c.phone;
              return (
                <tr key={c.id} className="border-b border-border/60 last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">
                    <div className="font-semibold">{c.name}</div>
                    {c.contact_name && <div className="text-xs text-muted-foreground">Contato: {c.contact_name}</div>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.niche || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.city ? `${c.city}/${c.state || ""}` : "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.phone ? (
                      <div className="flex items-center gap-1">
                        <span>{c.phone}</span>
                        <button title="Copiar telefone" onClick={() => handleCopyPhone(c.phone)} className="text-muted-foreground hover:text-foreground">
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.whatsapp ? (
                      <div className="flex items-center gap-1">
                        <span>{c.whatsapp}</span>
                        <button title="Abrir WhatsApp" onClick={() => handleOpenWhatsApp(c.whatsapp, c.name)} className="text-green-600 hover:text-green-700">
                          <MessageSquare className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{c.prospecting_source || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs">{priorityIcon[c.prospecting_priority] || "🟡"} {c.prospecting_priority || "Média"}</span>
                  </td>

                  {/* Ações completas */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Prospectar Agora */}
                      <Button size="sm" variant="default" onClick={() => setSelectedCompany(c)} className="h-8 gap-1 text-xs">
                        <Zap className="h-3.5 w-3.5" /> Prospectar
                      </Button>

                      {/* WhatsApp Direto */}
                      {activePhone && (
                        <Button size="icon" variant="outline" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" title="Abrir WhatsApp" onClick={() => handleOpenWhatsApp(activePhone, c.name)}>
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      )}

                      {/* Abrir Site */}
                      {c.website && (
                        <Button size="icon" variant="ghost" className="h-8 w-8" title="Abrir Site" onClick={() => handleOpenSite(c.website)}>
                          <Globe className="h-4 w-4 text-blue-600" />
                        </Button>
                      )}

                      {/* Ver Detalhes */}
                      <Button size="icon" variant="ghost" className="h-8 w-8" title="Ver Detalhes" onClick={() => setViewCompany(c)}>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </Button>

                      {/* Editar */}
                      <Button size="icon" variant="ghost" className="h-8 w-8" title="Editar Empresa" onClick={() => setEditCompany(c)}>
                        <Edit2 className="h-4 w-4 text-muted-foreground" />
                      </Button>

                      {/* Excluir */}
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10" title="Excluir Empresa" onClick={() => handleDeleteCompany(c)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Dialog: Prospectar Agora */}
      {selectedCompany && (
        <StartProspectingDialog
          company={selectedCompany}
          open={!!selectedCompany}
          onClose={() => setSelectedCompany(null)}
        />
      )}

      {/* Dialog: Adicionar Empresa */}
      {addCompanyOpen && (
        <AddCompanyDialog
          open={addCompanyOpen}
          onClose={() => setAddCompanyOpen(false)}
        />
      )}

      {/* Dialog: Ver Detalhes */}
      {viewCompany && (
        <CompanyDetailsDialog
          company={viewCompany}
          open={!!viewCompany}
          onClose={() => setViewCompany(null)}
        />
      )}

      {/* Dialog: Editar Empresa */}
      {editCompany && (
        <EditCompanyDialog
          company={editCompany}
          open={!!editCompany}
          onClose={() => setEditCompany(null)}
        />
      )}
    </div>
  );
}
