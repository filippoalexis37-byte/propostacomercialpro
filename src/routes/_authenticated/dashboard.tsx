import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { db, brl } from "@/lib/db";
import { PageHeader } from "@/components/crud-page";
import { pageHead } from "@/lib/meta";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: pageHead("Painel", "Indicadores comerciais."),
  component: Dashboard,
});

function Dashboard() {
  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [l, c, s] = await Promise.all([
        db.from("leads").select("status, estimated_value"),
        db.from("clients").select("status, monthly_value"),
        db.from("services").select("id").eq("active", true),
      ]);
      const leads = l.data ?? [];
      const clients = c.data ?? [];
      return {
        leads: leads.length,
        open: leads.filter((x: any) => !["Fechado", "Perdido"].includes(x.status)).length,
        pipeline: leads.reduce((a: number, x: any) => a + (Number(x.estimated_value) || 0), 0),
        clients: clients.filter((x: any) => x.status === "Ativo").length,
        mrr: clients.filter((x: any) => x.status === "Ativo").reduce((a: number, x: any) => a + (Number(x.monthly_value) || 0), 0),
        services: (s.data ?? []).length,
      };
    },
  });
  const cards = [
    ["Leads", data?.leads], ["Leads em aberto", data?.open], ["Pipeline", brl(data?.pipeline)],
    ["Clientes ativos", data?.clients], ["Receita mensal", brl(data?.mrr)], ["Serviços ativos", data?.services],
  ];
  return (
    <div>
      <PageHeader title="Painel" subtitle="Visão geral da operação comercial." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([t, v]) => (
          <div key={String(t)} className="panel p-6">
            <div className="text-sm text-muted-foreground">{t}</div>
            <div className="mt-2 font-display text-3xl font-semibold text-foreground">{v ?? "—"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
