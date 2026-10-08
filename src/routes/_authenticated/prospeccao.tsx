// @ts-nocheck
import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { pageHead } from "@/lib/meta";
import {
  db, brl, fmtDate,
  PROSPECTING_STATUSES, PROSPECTING_STATUS_COLORS, PROSPECTING_STATUS_ICONS,
  ACTIVE_PROSPECTING_STATUSES,
} from "@/lib/db";
import { PageHeader } from "@/components/crud-page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2, Users, Target, TrendingUp, CheckCircle2,
  AlertCircle, Clock, XCircle, FileText, Search,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/prospeccao")(({
  head: pageHead("Prospecção B2B", "Central de prospecção comercial."),
  component: ProspeccaoDashboard,
}));

// ─── helpers ──────────────────────────────────────────────────────────────────
function StatCard({
  label, value, icon: Icon, color = "text-foreground", sub,
}: {
  label: string; value: string | number | undefined; icon: any;
  color?: string; sub?: string;
}) {
  return (
    <div className="panel p-5 flex items-start gap-4">
      <div className={`rounded-lg p-2 bg-muted ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
        <div className="font-display text-2xl font-semibold text-foreground">
          {value ?? "—"}
        </div>
        {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function FunnelBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-36 text-xs text-muted-foreground truncate">{label}</div>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="w-16 text-right text-xs font-medium text-foreground">{count} <span className="text-muted-foreground">({pct}%)</span></div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
function ProspeccaoDashboard() {
  const [nicheFilter, setNicheFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");

  const { data: companies = [] } = useQuery({
    queryKey: ["companies-prospecting"],
    queryFn: async () => {
      const { data } = await db.from("companies").select(
        "id, name, niche, city, prospecting_status, prospecting_priority, " +
        "next_contact_at, last_attempted_at, attempt_count, estimated_contract_value"
      );
      return data ?? [];
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stats = useMemo(() => {
    const total = companies.length;
    const notProspected = companies.filter((c) => c.prospecting_status === "Não prospectado").length;
    const prospected = total - notProspected;
    const inContact = companies.filter((c) =>
      ["Respondeu", "Qualificado", "Reunião/Diagnóstico"].includes(c.prospecting_status)
    ).length;
    const qualified = companies.filter((c) =>
      ["Qualificado", "Reunião/Diagnóstico"].includes(c.prospecting_status)
    ).length;
    const proposal = companies.filter((c) =>
      ["Proposta enviada", "Negociação"].includes(c.prospecting_status)
    ).length;
    const clients = companies.filter((c) => c.prospecting_status === "Cliente").length;
    const noInterest = companies.filter((c) => c.prospecting_status === "Sem interesse").length;
    const noAnswer = companies.filter((c) => c.prospecting_status === "Não respondeu").length;

    const followupToday = companies.filter((c) => {
      if (!c.next_contact_at) return false;
      const d = new Date(c.next_contact_at + "T12:00:00");
      return d <= today;
    }).length;

    const followupLate = companies.filter((c) => {
      if (!c.next_contact_at) return false;
      const d = new Date(c.next_contact_at + "T12:00:00");
      return d < today;
    }).length;

    const potentialValue = companies.reduce(
      (acc, c) => acc + (Number(c.estimated_contract_value) || 0), 0
    );

    return {
      total, notProspected, prospected, inContact, qualified,
      proposal, clients, noInterest, noAnswer,
      followupToday, followupLate, potentialValue,
      pctProspected: total > 0 ? Math.round((prospected / total) * 100) : 0,
    };
  }, [companies]);

  // Nichos
  const nicheStats = useMemo(() => {
    const map: Record<string, { total: number; prospected: number; clients: number; potential: number }> = {};
    for (const c of companies) {
      const n = c.niche || "Sem nicho";
      if (!map[n]) map[n] = { total: 0, prospected: 0, clients: 0, potential: 0 };
      map[n].total++;
      if (c.prospecting_status !== "Não prospectado") map[n].prospected++;
      if (c.prospecting_status === "Cliente") map[n].clients++;
      map[n].potential += Number(c.estimated_contract_value) || 0;
    }
    return Object.entries(map)
      .sort((a, b) => b[1].total - a[1].total)
      .filter(([n]) => !nicheFilter || n.toLowerCase().includes(nicheFilter.toLowerCase()));
  }, [companies, nicheFilter]);

  // Cidades
  const cityStats = useMemo(() => {
    const map: Record<string, { total: number; prospected: number; clients: number }> = {};
    for (const c of companies) {
      const city = c.city || "Sem cidade";
      if (!map[city]) map[city] = { total: 0, prospected: 0, clients: 0 };
      map[city].total++;
      if (c.prospecting_status !== "Não prospectado") map[city].prospected++;
      if (c.prospecting_status === "Cliente") map[city].clients++;
    }
    return Object.entries(map)
      .sort((a, b) => b[1].total - a[1].total)
      .filter(([c]) => !cityFilter || c.toLowerCase().includes(cityFilter.toLowerCase()));
  }, [companies, cityFilter]);

  // Próximas ações
  const nextActions = useMemo(() =>
    companies
      .filter((c) => {
        if (!c.next_contact_at) return false;
        const d = new Date(c.next_contact_at + "T12:00:00");
        return d <= today;
      })
      .sort((a, b) => new Date(a.next_contact_at).getTime() - new Date(b.next_contact_at).getTime())
      .slice(0, 8),
    [companies]
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Prospecção B2B"
        subtitle="Central de prospecção comercial — Santos MktPro"
        action={
          <div className="flex gap-2">
            <Link to="/prospeccao/empresas-nao-prospectadas">
              <Button variant="outline">⚪ Falta prospectar</Button>
            </Link>
            <Link to="/prospeccao/empresas-prospectadas">
              <Button>🟢 Já prospectadas</Button>
            </Link>
          </div>
        }
      />

      {/* Cards de status */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total de empresas" value={stats.total} icon={Building2} />
        <StatCard
          label="Não prospectadas"
          value={stats.notProspected}
          icon={AlertCircle}
          color="text-gray-500"
          sub={`${100 - stats.pctProspected}% restante`}
        />
        <StatCard
          label="Prospectadas"
          value={stats.prospected}
          icon={CheckCircle2}
          color="text-green-600"
          sub={`${stats.pctProspected}% do total`}
        />
        <StatCard label="Em contato" value={stats.inContact} icon={Users} color="text-blue-600" />
        <StatCard label="Qualificadas" value={stats.qualified} icon={Target} color="text-purple-600" />
        <StatCard label="Proposta enviada" value={stats.proposal} icon={FileText} color="text-orange-600" />
        <StatCard label="Clientes" value={stats.clients} icon={CheckCircle2} color="text-green-700" />
        <StatCard label="Sem interesse" value={stats.noInterest} icon={XCircle} color="text-red-500" />
        <StatCard label="Sem resposta" value={stats.noAnswer} icon={AlertCircle} color="text-slate-500" />
        <StatCard
          label="Follow-ups hoje"
          value={stats.followupToday}
          icon={Clock}
          color={stats.followupToday > 0 ? "text-amber-600" : "text-muted-foreground"}
        />
        <StatCard
          label="Follow-ups atrasados"
          value={stats.followupLate}
          icon={Clock}
          color={stats.followupLate > 0 ? "text-red-600" : "text-muted-foreground"}
        />
        <StatCard label="Valor potencial" value={brl(stats.potentialValue)} icon={TrendingUp} color="text-emerald-600" />
      </div>

      {/* Funil visual */}
      <div className="panel p-6">
        <h2 className="font-display text-base font-semibold mb-4 text-foreground">Funil de Prospecção</h2>
        <div className="space-y-3">
          {ACTIVE_PROSPECTING_STATUSES.map((st) => {
            const count = companies.filter((c) => c.prospecting_status === st).length;
            const colors: Record<string, string> = {
              "Não prospectado": "bg-gray-400",
              "Primeiro contato": "bg-blue-400",
              "Tentativa realizada": "bg-yellow-400",
              "Respondeu": "bg-cyan-500",
              "Qualificado": "bg-purple-500",
              "Reunião/Diagnóstico": "bg-indigo-500",
              "Proposta enviada": "bg-orange-500",
              "Negociação": "bg-amber-500",
            };
            return (
              <FunnelBar
                key={st}
                label={`${PROSPECTING_STATUS_ICONS[st] || ""} ${st}`}
                count={count}
                total={stats.total}
                color={colors[st] || "bg-gray-400"}
              />
            );
          })}
        </div>
      </div>

      {/* Próximas ações */}
      {nextActions.length > 0 && (
        <div className="panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-semibold text-foreground">
              Follow-ups de Hoje / Atrasados
            </h2>
            <Link to="/prospeccao/followup">
              <Button variant="outline" size="sm">Ver todos</Button>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2">Empresa</th>
                  <th className="px-3 py-2">Nicho</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Próximo contato</th>
                  <th className="px-3 py-2">Tentativas</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {nextActions.map((c) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="px-3 py-2 font-medium text-foreground">{c.name}</td>
                    <td className="px-3 py-2 text-muted-foreground">{c.niche || "—"}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium ${PROSPECTING_STATUS_COLORS[c.prospecting_status] || ""}`}>
                        {PROSPECTING_STATUS_ICONS[c.prospecting_status]} {c.prospecting_status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{fmtDate(c.next_contact_at)}</td>
                    <td className="px-3 py-2 text-muted-foreground">{c.attempt_count || 0}</td>
                    <td className="px-3 py-2">
                      <Link to="/prospeccao/empresas-prospectadas">
                        <Button size="sm" variant="outline">Registrar</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Nichos */}
        <div className="panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-semibold text-foreground">Por Nicho</h2>
            <div className="relative">
              <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                className="h-7 pl-6 text-xs w-40"
                placeholder="Filtrar..."
                value={nicheFilter}
                onChange={(e) => setNicheFilter(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {nicheStats.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum nicho encontrado.</p>
            )}
            {nicheStats.map(([niche, s]) => (
              <div key={niche} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
                <div>
                  <div className="text-sm font-medium text-foreground">{niche}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.prospected}/{s.total} prospectadas · {s.clients} cliente(s)
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">{brl(s.potential)}</div>
                  <div className="text-xs text-green-600 font-medium">
                    {s.total > 0 ? Math.round((s.prospected / s.total) * 100) : 0}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cidades */}
        <div className="panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-semibold text-foreground">Por Cidade</h2>
            <div className="relative">
              <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                className="h-7 pl-6 text-xs w-40"
                placeholder="Filtrar..."
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {cityStats.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma cidade encontrada.</p>
            )}
            {cityStats.map(([city, s]) => (
              <div key={city} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
                <div>
                  <div className="text-sm font-medium text-foreground">{city}</div>
                  <div className="text-xs text-muted-foreground">
                    {s.prospected}/{s.total} prospectadas · {s.clients} cliente(s)
                  </div>
                </div>
                <div className="text-xs text-green-600 font-medium">
                  {s.total > 0 ? Math.round((s.prospected / s.total) * 100) : 0}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Links rápidos */}
      <div className="panel p-6">
        <h2 className="font-display text-base font-semibold mb-4 text-foreground">Acesso Rápido</h2>
        <div className="flex flex-wrap gap-2">
          <Link to="/prospeccao/empresas-nao-prospectadas"><Button variant="outline" size="sm">⚪ Não prospectadas</Button></Link>
          <Link to="/prospeccao/empresas-prospectadas"><Button variant="outline" size="sm">🟢 Já prospectadas</Button></Link>
          <Link to="/prospeccao/listas"><Button variant="outline" size="sm">📋 Listas</Button></Link>
          <Link to="/prospeccao/cadencias"><Button variant="outline" size="sm">🔄 Cadências</Button></Link>
          <Link to="/prospeccao/followup"><Button variant="outline" size="sm">⏰ Follow-ups</Button></Link>
          <Link to="/prospeccao/metas"><Button variant="outline" size="sm">🎯 Metas</Button></Link>
          <Link to="/prospeccao/importacao"><Button variant="outline" size="sm">📥 Importar</Button></Link>
          <Link to="/prospeccao/resultados"><Button variant="outline" size="sm">📊 Resultados</Button></Link>
        </div>
      </div>
    </div>
  );
}
