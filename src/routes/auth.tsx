import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Santos MktPro" },
      { name: "description", content: "Acesse a central comercial da Santos MktPro." },
      { property: "og:title", content: "Entrar — Santos MktPro" },
      { property: "og:description", content: "Acesse a central comercial da Santos MktPro." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return toast.error("E-mail ou senha inválidos");
      navigate({ to: "/dashboard" });
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name }, emailRedirectTo: window.location.origin + "/dashboard" },
      });
      setLoading(false);
      if (error) return toast.error(error.message);
      if (data.session) navigate({ to: "/dashboard" });
      else toast.success("Conta criada! Confirme seu e-mail para entrar.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background bg-app-gradient px-4">
      <div className="panel w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary font-display text-xl font-bold text-primary-foreground">S</div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Santos MktPro</h1>
          <p className="text-sm text-muted-foreground">{mode === "in" ? "Entre na sua conta" : "Crie sua conta"}</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {mode === "up" && (
            <div>
              <Label className="mb-1.5 block">Nome completo</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          )}
          <div>
            <Label className="mb-1.5 block">E-mail</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label className="mb-1.5 block">Senha</Label>
            <Input type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Aguarde..." : mode === "in" ? "Entrar" : "Criar conta"}
          </Button>
        </form>
        <button
          className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
          onClick={() => setMode(mode === "in" ? "up" : "in")}
        >
          {mode === "in" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
        </button>
      </div>
    </div>
  );
}
