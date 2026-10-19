import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  LayoutDashboard, Users, Building2, BadgeCheck, CalendarClock, Briefcase, Calculator,
  Package, Target, MessageSquareWarning, Sparkles, BellRing, Settings, LogOut, Menu, X,
  FileText, Receipt, Bot, Search, Handshake, Crosshair, Video, Lock, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/db";

const MASTER_ADMIN_EMAIL = "lucasmktpro158@gmail.com";

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
    { to: "/prospeccao", label: "Prospecção B2B", icon: Crosshair },
    { to: "/leads", label: "Leads", icon: Users },
    { to: "/empresas", label: "Empresas", icon: Building2 },
    { to: "/clientes", label: "Clientes", icon: BadgeCheck },
    { to: "/atividades", label: "Atividades", icon: CalendarClock },
    { to: "/reunioes", label: "Reuniões & Agenda", icon: Video },
    { to: "/followup", label: "Follow-up", icon: BellRing },
  ]},
  { group: "Ofertas", items: [
    { to: "/servicos", label: "Serviços", icon: Briefcase },
    { to: "/precificacao", label: "Precificação", icon: Calculator },
    { to: "/combos", label: "Combos", icon: Package },
    { to: "/propostas", label: "Propostas (PDF)", icon: FileText },
    { to: "/afiliados", label: "Proposta afiliados", icon: Handshake },
    { to: "/recibos", label: "Recibos (PDF)", icon: Receipt },
  ]},
  { group: "Inteligência", items: [
    { to: "/nichos", label: "Nichos", icon: Target },
    { to: "/objecoes", label: "Objeções", icon: MessageSquareWarning },
    { to: "/pesquisa", label: "Pesquisa de mercado", icon: Search },
    { to: "/assistente", label: "Assistente IA", icon: Bot },
    { to: "/prompts", label: "Gerador de prompts", icon: Sparkles },
  ]},
  { group: "Sistema", items: [{ to: "/configuracoes", label: "Configurações", icon: Settings }] },
] as const;

function Layout() {
  const { user } = Route.useRouteContext();
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  // Cadeado de bloqueio para outros e-mails
  if (user.email?.toLowerCase().trim() !== MASTER_ADMIN_EMAIL) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background bg-app-gradient p-4">
        <div className="panel max-w-md w-full p-8 text-center border border-amber-500/30 shadow-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="font-display text-xl font-bold text-foreground">Acesso Bloqueado</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Este sistema possui cadeado de segurança e é de uso exclusivo do administrador (
            <strong className="text-foreground">{MASTER_ADMIN_EMAIL}</strong>).
          </p>
          <div className="mt-3 rounded bg-muted/50 p-2 text-xs text-muted-foreground">
            Conectado atualmente como: <span className="font-mono text-foreground">{user.email}</span>
          </div>
          <Button className="mt-6 w-full gap-2" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            Sair e entrar como Administrador
          </Button>
        </div>
      </div>
    );
  }

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
        <div className="flex items-center gap-1.5 font-medium text-foreground text-sm">
          <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <span className="truncate">{profile?.name || "Lucas Santos"}</span>
        </div>
        <div className="text-[11px] text-muted-foreground truncate">{user.email}</div>
        <div className="mb-3 mt-1.5 inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/20">
          <ShieldCheck className="h-3 w-3" /> Admin Master (Protegido)
        </div>
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
