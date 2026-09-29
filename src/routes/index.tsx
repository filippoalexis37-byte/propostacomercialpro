import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, Calculator, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Santos MktPro — Central Comercial de Marketing Digital" },
      { name: "description", content: "CRM de leads, clientes, precificação de serviços e prospecção para marketing digital." },
      { property: "og:title", content: "Santos MktPro — Central Comercial" },
      { property: "og:description", content: "CRM, precificação e inteligência comercial em um só lugar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const FEATURES = [
  { icon: Users, t: "CRM de leads", d: "Funil completo, do primeiro contato ao fechamento." },
  { icon: Calculator, t: "Precificação", d: "Custos, margem e preço ideal para cada serviço." },
  { icon: Sparkles, t: "Prospecção", d: "Prompts por nicho, objeções e follow-up." },
  { icon: BarChart3, t: "Painel", d: "Indicadores e receita recorrente em tempo real." },
];

function Index() {
  return (
    <div className="min-h-screen bg-background bg-app-gradient">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-display font-bold text-primary-foreground">S</div>
          <span className="font-display font-semibold text-foreground">Santos MktPro</span>
        </div>
        <Button asChild variant="outline"><Link to="/auth">Entrar</Link></Button>
      </header>
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="font-display text-4xl font-bold leading-tight text-foreground md:text-6xl">
          Sua central comercial de <span className="text-gradient-brand">marketing digital</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Organize leads, clientes, serviços e propostas. Precifique com segurança e prospecte com mensagens prontas por nicho.
        </p>
        <Button asChild size="lg" className="mt-8"><Link to="/auth">Acessar a plataforma</Link></Button>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <div key={f.t} className="panel p-6">
            <f.icon className="mb-3 h-6 w-6 text-primary" />
            <h3 className="font-display font-semibold text-foreground">{f.t}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
