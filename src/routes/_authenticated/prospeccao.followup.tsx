// @ts-nocheck
/**
 * FOLLOW-UP DE PROSPECÇÃO B2B
 * Central de Follow-up com ações rápidas, scripts personalizados e histórico completo.
 */
import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { pageHead } from "@/lib/meta";
import {
  db, fmtDate,
  PROSPECTING_STATUS_COLORS, PROSPECTING_STATUS_ICONS,
} from "@/lib/db";
import { PageHeader } from "@/components/crud-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FollowupActions } from "@/components/FollowupActions";
import { FollowupScriptModal } from "@/components/FollowupScriptModal";
import { ContactRegisterModal } from "@/components/ContactRegisterModal";
import { ScheduleModal } from "@/components/ScheduleModal";
import { HistoryModal } from "@/components/HistoryModal";
import { normalizePhone, formatPhoneDisplay } from "@/lib/phone";
import { AlertTriangle, Search, Filter } from "lucide-react";

export const Route = createFileRoute("/_authenticated/prospeccao/followup")({
  head: pageHead("Follow-up B2B", "Gestão de contatos pendentes, agendados e histórico."),
  component: FollowupProspeccao,
});

type TabKey = "late" | "today" | "upcoming" | "no_date" | "completed";

function FollowupProspeccao() {
  const [q, setQ] = useState("");
  const [nicheFilter, setNicheFilter] = useState("");
  const [tab, setTab] = useState<TabKey>("late");

  // Estados dos modais
  const [scriptCompany, setScriptCompany] = useState<any>(null);
  const [registerCompany, setRegisterCompany] = useState<any>(null);
  const [registerInitialMessage, setRegisterInitialMessage] = useState<string>("");
  const [scheduleCompany, setScheduleCompany] = useState<any>(null);
  const [historyCompany, setHistoryCompany] = useState<any>(null);

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["companies-followup"],
    queryFn: async () => {
      const { data, error } = await db
        .from("companies")
        .select("*")
        .order("next_contact_at", { ascending: true, nullsFirst: false });
      if (error) throw error;
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
    const late: any[] = [];
    const todayList: any[] = [];
    const upcoming: any[] = [];
    const noDate: any[] = [];
    const completed: any[] = [];

    companies.forEach((c: any) => {
      const status = c.prospecting_status || "";
      if (status === "Cliente" || status === "Fechado") {
        completed.push(c);
        return;
      }

      if (!c.next_contact_at) {
        noDate.push(c);
        return;
      }

      const d = new Date(c.next_contact_at + "T12:00:00");
      if (d < today) {
        late.push(c);
      } else if (d >= today && d < tomorrow) {
        todayList.push(c);
      } else if (d >= tomorrow && d <= nextWeek) {
        upcoming.push(c);
      } else {
        upcoming.push(c);
      }
    });

    return {
      late,
      today: todayList,
      upcoming,
      no_date: noDate,
      completed,
    };
  }, [companies]);

  const niches = useMemo(() =>
    [...new Set(companies.map((c: any) => c.niche).filter(Boolean))].sort(),
    [companies]
  );

  const currentList = categorized[tab] || [];
  const filtered = useMemo(() =>
    currentList.filter((c: any) => {
      const qs = q.toLowerCase();
      const matchQ =
        !q ||
        c.name?.toLowerCase().includes(qs) ||
        c.niche?.toLowerCase().includes(qs) ||
        c.whatsapp?.toLowerCase().includes(qs) ||
        c.phone?.toLowerCase().includes(qs);
      const matchNiche = !nicheFilter || c.niche === nicheFilter;
      return matchQ && matchNiche;
    }),
    [currentList, q, nicheFilter]
  );

  const daysSince = (dateStr: string) => {
    if (!dateStr) return 0;
    const d = new Date(dateStr + "T12:00:00");
    return Math.max(1, Math.floor((today.getTime() - d.getTime()) / 86400000));
  };

  const tabs: { key: TabKey; label: string; count: number; color: string }[] = [
    { key: "late", label: "Atrasados", count: categorized.late.length, color: "text-red-600" },
    { key: "today", label: "Hoje", count: categorized.today.length, color: "text-amber-600" },
    { key: "upcoming", label: "Próximos dias", count: categorized.upcoming.length, color: "text-blue-600" },
    { key: "no_date", label: "Sem data definida", count: categorized.no_date.length, color: "text-slate-500" },
    { key: "completed", label: "Fechados / Clientes", count: categorized.completed.length, color: "text-emerald-600" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Follow-up de Prospecção"
        subtitle="Gerencie seus follow-ups com scripts personalizados, histórico completo e ação direta via WhatsApp."
      />

      {/* Resumo em Abas / Cards */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`panel p-3.5 text-left transition-all hover:ring-2 hover:ring-primary/30 ${
              tab === t.key ? "ring-2 ring-primary border-primary bg-primary/5" : ""
            }`}
          >
            <div className={`text-xs font-semibold ${t.color}`}>{t.label}</div>
            <div className="font-display text-2xl font-bold text-foreground mt-1">
              {t.count}
            </div>
          </button>
        ))}
      </div>

      {/* Aviso importante */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>Aviso de conformidade:</strong> O WhatsApp é aberto via link direto (wa.me) no seu navegador para que você autorize e revise o envio. Após o contato, use o botão <strong>Registrar</strong> para salvar o histórico e manter os indicadores atualizados.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por empresa, telefone, nicho..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          value={nicheFilter}
          onChange={(e) => setNicheFilter(e.target.value)}
        >
          <option value="">Todos os nichos</option>
          {niches.map((n: string) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        {(q || nicheFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQ("");
              setNicheFilter("");
            }}
          >
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Tabela de Follow-up */}
      <div className="panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Empresa / Contato</th>
              <th className="px-4 py-3">Nicho</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Último contato</th>
              {tab === "late" && <th className="px-4 py-3 text-red-600">Atraso</th>}
              <th className="px-4 py-3">Próximo contato</th>
              <th className="px-4 py-3 text-center">Tentativas</th>
              <th className="px-4 py-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td className="px-4 py-12 text-center text-muted-foreground" colSpan={99}>
                  Carregando lista de follow-up...
                </td>
              </tr>
            )}

            {!isLoading && filtered.length === 0 && (
              <tr>
                <td className="px-4 py-12 text-center text-muted-foreground" colSpan={99}>
                  {tab === "late"
                    ? "Nenhum follow-up atrasado! Parabéns 🎉"
                    : tab === "today"
                    ? "Nenhum follow-up pendente para hoje."
                    : "Nenhuma empresa encontrada nesta categoria."}
                </td>
              </tr>
            )}

            {filtered.map((c: any) => (
              <tr
                key={c.id}
                className="border-b border-border/60 last:border-0 hover:bg-muted/30 transition-colors"
              >
                {/* Nome & Telefone */}
                <td className="px-4 py-3 font-medium text-foreground">
                  <div>{c.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatPhoneDisplay(c.whatsapp || c.phone)}
                  </div>
                </td>

                {/* Nicho */}
                <td className="px-4 py-3 text-muted-foreground">
                  {c.niche || "—"}
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium ${
                      PROSPECTING_STATUS_COLORS[c.prospecting_status] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {PROSPECTING_STATUS_ICONS[c.prospecting_status] || "⚪"} {c.prospecting_status || "Sem status"}
                  </span>
                </td>

                {/* Último contato */}
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {fmtDate(c.last_attempted_at)}
                  {c.last_attempt_result && (
                    <div className="text-[11px] text-muted-foreground/80 truncate max-w-[140px]">
                      {c.last_attempt_result}
                    </div>
                  )}
                </td>

                {/* Atraso (apenas na aba de atrasados) */}
                {tab === "late" && (
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                      {daysSince(c.next_contact_at)}d de atraso
                    </span>
                  </td>
                )}

                {/* Próximo contato */}
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {fmtDate(c.next_contact_at)}
                </td>

                {/* Tentativas */}
                <td className="px-4 py-3 text-center">
                  <Badge variant="secondary" className="text-xs">
                    {c.attempt_count || 0}
                  </Badge>
                </td>

                {/* 6 Botões de Ação */}
                <td className="px-4 py-3">
                  <FollowupActions
                    company={c}
                    onOpenScript={(comp) => setScriptCompany(comp)}
                    onOpenRegister={(comp) => {
                      setRegisterInitialMessage("");
                      setRegisterCompany(comp);
                    }}
                    onOpenSchedule={(comp) => setScheduleCompany(comp)}
                    onOpenHistory={(comp) => setHistoryCompany(comp)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal 1: Script de Abordagem / Follow-up */}
      {scriptCompany && (
        <FollowupScriptModal
          company={scriptCompany}
          open={!!scriptCompany}
          onClose={() => setScriptCompany(null)}
          onOpenRegister={(msg) => {
            setRegisterInitialMessage(msg);
            setRegisterCompany(scriptCompany);
          }}
        />
      )}

      {/* Modal 2: Registrar Contato */}
      {registerCompany && (
        <ContactRegisterModal
          company={registerCompany}
          initialMessage={registerInitialMessage}
          open={!!registerCompany}
          onClose={() => {
            setRegisterCompany(null);
            setRegisterInitialMessage("");
          }}
        />
      )}

      {/* Modal 3: Agendar Próximo Contato */}
      {scheduleCompany && (
        <ScheduleModal
          company={scheduleCompany}
          open={!!scheduleCompany}
          onClose={() => setScheduleCompany(null)}
        />
      )}

      {/* Modal 4: Histórico de Interações */}
      {historyCompany && (
        <HistoryModal
          company={historyCompany}
          open={!!historyCompany}
          onClose={() => setHistoryCompany(null)}
        />
      )}
    </div>
  );
}
