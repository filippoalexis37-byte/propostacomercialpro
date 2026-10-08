// @ts-nocheck
/**
 * RESULTADOS / RELATÓRIO DE PROSPECÇÃO
 */
import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { pageHead } from "@/lib/meta";
import { db, brl, fmtDate } from "@/lib/db";
import { PageHeader } from "@/components/crud-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/prospeccao/resultados")({
  head: pageHead("Resultados B2B", "Relatório de prospecção por período, nicho e cidade."),
  component: ResultadosProspeccao,
});

function pct(a: number, b: number) {
  return b > 0 ? `${Math.round((a / b) * 100)}%` : "0%";
}

function ResultadosProspeccao() {
  const [period, setPeriod] = useState("30");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["companies-results"],
    queryFn: async () => {
      const { data } = await db.from("companies").select(
        "niche, city, state, prospecting_status, attempt_count, " +
        "first_prospected_at, last_attempted_at, estimated_contract_value, last_attempt_result"
      );
      return data ?? [];
    },
  });

  const { data: attempts = [] } = useQuery({
    queryKey: ["attempts-results"],
    queryFn: async () => {
      const { data } = await db.from("prospecting_attempts").select("result, channel, attempt_date, company_id");
      return data ?? [];
    },
  });

  // Filtro por período
  const filtered = useMemo(() => {
    if (!companies.length) return companies;
    const now = new Date();
    let cutoff: Date | null = null;
    if (period !== "custom") {
      cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - Number(period));
    } else if (from) {
      cutoff = new Date(from);
    }
    const endDate = period === "custom" && to ? new Date(to) : null;

    return companies.filter((c: any) => {
      if (!cutoff) return true;
      const d = c.first_prospected_at ? new Date(c.first_prospected_at) : null;
      if (!d) return false;
      if (endDate) return d >= cutoff && d <= endDate;
      return d >= cutoff;
    });
  }, [companies, period, from, to]);

  // Resumo geral
  const summary = useMemo(() => {
    const total = filtered.length;
    const prospected = filtered.filter((c: any) => c.prospecting_status !== "Não prospectado").length;
    const responded = filtered.filter((c: any) =>
      ["Respondeu","Qualificado","Reunião/Diagnóstico","Proposta enviada","Negociação","Fechado","Cliente"].includes(c.prospecting_status)
    ).length;
    const qualified = filtered.filter((c: any) =>
      ["Qualificado","Reunião/Diagnóstico","Proposta enviada","Negociação","Fechado","Cliente"].includes(c.prospecting_status)
    ).length;
    const proposal = filtered.filter((c: any) =>
      ["Proposta enviada","Negociação","Fechado","Cliente"].includes(c.prospecting_status)
    ).length;
    const clients = filtered.filter((c: any) => c.prospecting_status === "Cliente").length;
    const potentialValue = filtered.reduce((a: number, c: any) => a + (Number(c.estimated_contract_value) || 0), 0);
    return { total, prospected, responded, qualified, proposal, clients, potentialValue };
  }, [filtered]);

  // Por nicho
  const nicheStats = useMemo(() => {
    const map: Record<string, any> = {};
    for (const c of filtered) {
      const n = c.niche || "Sem nicho";
      if (!map[n]) map[n] = { niche: n, total: 0, prospected: 0, responded: 0, qualified: 0, proposal: 0, clients: 0, potential: 0 };
      map[n].total++;
      if (c.prospecting_status !== "Não prospectado") map[n].prospected++;
      if (["Respondeu","Qualificado","Reunião/Diagnóstico","Proposta enviada","Negociação","Fechado","Cliente"].includes(c.prospecting_status)) map[n].responded++;
      if (["Qualificado","Reunião/Diagnóstico","Proposta enviada","Negociação","Fechado","Cliente"].includes(c.prospecting_status)) map[n].qualified++;
      if (["Proposta enviada","Negociação","Fechado","Cliente"].includes(c.prospecting_status)) map[n].proposal++;
      if (c.prospecting_status === "Cliente") map[n].clients++;
      map[n].potential += Number(c.estimated_contract_value) || 0;
    }
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [filtered]);

  // Por cidade
  const cityStats = useMemo(() => {
    const map: Record<string, any> = {};
    for (const c of filtered) {
      const city = [c.city, c.state].filter(Boolean).join(" / ") || "Sem cidade";
      if (!map[city]) map[city] = { city, total: 0, prospected: 0, clients: 0, potential: 0 };
      map[city].total++;
      if (c.prospecting_status !== "Não prospectado") map[city].prospected++;
      if (c.prospecting_status === "Cliente") map[city].clients++;
      map[city].potential += Number(c.estimated_contract_value) || 0;
    }
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 15);
  }, [filtered]);

  function MetricCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
    return (
      <div className="panel p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-display text-2xl font-semibold text-foreground mt-1">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resultados de Prospecção"
        subtitle="Análise completa da operação comercial B2B."
      />

      {/* Filtro de período */}
      <div className="flex flex-wrap gap-2 items-center">
        {[
          { v: "1", l: "Hoje" },
          { v: "7", l: "7 dias" },
          { v: "30", l: "30 dias" },
          { v: "90", l: "90 dias" },
          { v: "0", l: "Tudo" },
          { v: "custom", l: "Personalizado" },
        ].map((p) => (
          <Button
            key={p.v}
            size="sm"
            variant={period === p.v ? "default" : "outline"}
            onClick={() => setPeriod(p.v)}
          >
            {p.l}
          </Button>
        ))}
        {period === "custom" && (
          <>
            <Input type="date" className="h-8 w-36" value={from} onChange={(e) => setFrom(e.target.value)} />
            <span className="text-muted-foreground text-sm">até</span>
            <Input type="date" className="h-8 w-36" value={to} onChange={(e) => setTo(e.target.value)} />
          </>
        )}
      </div>

      {/* Métricas principais */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total prospectado" value={summary.prospected} sub={`de ${summary.total} empresas`} />
        <MetricCard label="Responderam" value={summary.responded} sub={`Taxa: ${pct(summary.responded, summary.prospected)}`} />
        <MetricCard label="Qualificadas" value={summary.qualified} sub={`Taxa: ${pct(summary.qualified, summary.responded)}`} />
        <MetricCard label="Propostas" value={summary.proposal} sub={`Taxa: ${pct(summary.proposal, summary.qualified)}`} />
        <MetricCard label="Clientes" value={summary.clients} sub={`Conversão: ${pct(summary.clients, summary.prospected)}`} />
        <MetricCard label="Valor potencial" value={brl(summary.potentialValue)} />
        <MetricCard label="Taxa de resposta" value={pct(summary.responded, summary.prospected)} />
        <MetricCard label="Taxa de conversão" value={pct(summary.clients, summary.prospected)} />
      </div>

      {/* Por nicho — tabela comparativa */}
      <div className="panel p-6">
        <h2 className="font-display text-base font-semibold mb-4 text-foreground">Comparativo por Nicho</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2">Nicho</th>
                <th className="px-3 py-2 text-right">Empresas</th>
                <th className="px-3 py-2 text-right">Prosp.</th>
                <th className="px-3 py-2 text-right">Respostas</th>
                <th className="px-3 py-2 text-right">Qualif.</th>
                <th className="px-3 py-2 text-right">Propostas</th>
                <th className="px-3 py-2 text-right">Clientes</th>
                <th className="px-3 py-2 text-right">Tx. Resp.</th>
                <th className="px-3 py-2 text-right">Tx. Conv.</th>
                <th className="px-3 py-2 text-right">Potencial</th>
              </tr>
            </thead>
            <tbody>
              {nicheStats.map((n: any) => (
                <tr key={n.niche} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="px-3 py-2 font-medium text-foreground">{n.niche}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{n.total}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{n.prospected}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{n.responded}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{n.qualified}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{n.proposal}</td>
                  <td className="px-3 py-2 text-right font-medium text-green-600">{n.clients}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{pct(n.responded, n.prospected)}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{pct(n.clients, n.prospected)}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{brl(n.potential)}</td>
                </tr>
              ))}
              {nicheStats.length === 0 && (
                <tr><td className="px-3 py-6 text-center text-muted-foreground" colSpan={10}>Nenhum dado disponível.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Por cidade */}
      <div className="panel p-6">
        <h2 className="font-display text-base font-semibold mb-4 text-foreground">Por Cidade (Top 15)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2">Cidade</th>
                <th className="px-3 py-2 text-right">Empresas</th>
                <th className="px-3 py-2 text-right">Prospectadas</th>
                <th className="px-3 py-2 text-right">Clientes</th>
                <th className="px-3 py-2 text-right">% Prosp.</th>
                <th className="px-3 py-2 text-right">Potencial</th>
              </tr>
            </thead>
            <tbody>
              {cityStats.map((c: any) => (
                <tr key={c.city} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="px-3 py-2 font-medium text-foreground">{c.city}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{c.total}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{c.prospected}</td>
                  <td className="px-3 py-2 text-right font-medium text-green-600">{c.clients}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{pct(c.prospected, c.total)}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{brl(c.potential)}</td>
                </tr>
              ))}
              {cityStats.length === 0 && (
                <tr><td className="px-3 py-6 text-center text-muted-foreground" colSpan={6}>Nenhum dado disponível.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
