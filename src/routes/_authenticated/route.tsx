import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  LayoutDashboard, Users, Building2, BadgeCheck, CalendarClock, Briefcase, Calculator,
  Package, Target, MessageSquareWarning, Sparkles, BellRing, Settings, LogOut, Menu, X, FileText, Receipt,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: Layout,
});

const NAV = [
  { group: "Comercial", items: [
    { to: "/dashboard", label: "Painel", icon: LayoutDashboard },
    { to: "/leads", label: "Leads", icon: Users },
    { to: "/empresas", label: "Empresas", icon: Building2 },
    { to: "/clientes", label: "Clientes", icon: BadgeCheck },
    { to: "/atividades", label: "Atividades", icon: CalendarClock },
    { to: "/followup", label: "Follow-up", icon: BellRing },
  ]},
  { group: "Ofertas", items: [
    { to: "/servicos", label: "Serviços", icon: Briefcase },
    { to: "/precificacao", label: "Precificação", icon: Calculator },
    { to: "/combos", label: "Combos", icon: Package },
    { to: "/propostas", label: "Propostas (PDF)", icon: FileText },
    { to: "/recibos", label: "Recibos (PDF)", icon: Receipt },
  ]},
  { group: "Inteligência", items: [
    { to: "/nichos", label: "Nichos", icon: Target },
    { to: "/objecoes", label: "Objeções", icon: MessageSquareWarning },
    { to: "/prompts", label: "Gerador de prompts", icon: Sparkles },
  ]},
  { group: "Sistema", items: [{ to: "/configuracoes", label: "Configurações", icon: Settings }] },
] as const;

function Layout() {
  const { user } = Route.useRouteContext();
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: profile } = useQuery({
    queryKey: ["me", user.id],
    queryFn: async () => {
      const [{ data: p }, { data: r }] = await Promise.all([
        db.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
        db.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      return { name: p?.full_name || user.email, roles: (r ?? []).map((x: { role: string }) => x.role) };
    },
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const sidebar = (
    <aside className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-display font-bold text-primary-foreground">S</div>
        <div>
          <div className="font-display text-sm font-semibold text-foreground">Santos MktPro</div>
          <div className="text-[11px] text-muted-foreground">Central Comercial</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {NAV.map((g) => (
          <div key={g.group} className="mb-4">
            <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">{g.group}</div>
            {g.items.map((i) => (
              <Link
                key={i.to}
                to={i.to}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                activeProps={{ className: "bg-sidebar-accent !text-foreground font-medium" }}
              >
                <i.icon className="h-4 w-4" />
                {i.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="border-t border-sidebar-border p-4">
        <div className="truncate text-sm font-medium text-foreground">{profile?.name}</div>
        <div className="mb-3 text-xs capitalize text-muted-foreground">{profile?.roles.join(", ") || "usuário"}</div>
        <button onClick={signOut} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-background bg-app-gradient">
      <div className="sticky top-0 hidden h-screen lg:block">{sidebar}</div>
      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {sidebar}
          <button className="flex-1 bg-background/70" onClick={() => setOpen(false)} aria-label="Fechar menu">
            <X className="ml-4 h-6 w-6 text-foreground" />
          </button>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <header className="flex items-center gap-3 border-b border-border px-4 py-3 lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu className="h-5 w-5 text-foreground" /></button>
          <span className="font-display font-semibold text-foreground">Santos MktPro</span>
        </header>
        <main className="mx-auto max-w-7xl p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
