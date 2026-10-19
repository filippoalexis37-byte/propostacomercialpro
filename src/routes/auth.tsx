import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";

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
  const [name, setName] = useState("Lucas Santos");
  const [email, setEmail] = useState("lucasmktpro158@gmail.com");
  const [password, setPassword] = useState("Lucas159357@");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail !== "lucasmktpro158@gmail.com") {
      toast.error("Acesso bloqueado com cadeado de segurança: Este sistema é de uso exclusivo do administrador (lucasmktpro158@gmail.com).");
      return;
    }

    setLoading(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      setLoading(false);
      if (error) {
        toast.error("E-mail ou senha inválidos. Se ainda não ativou a senha, clique em 'Primeiro acesso? Cadastre-se aqui' logo abaixo.");
        return;
      }
      navigate({ to: "/dashboard" });
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { data: { full_name: name }, emailRedirectTo: window.location.origin + "/dashboard" },
      });
      setLoading(false);
      if (error) { toast.error(error.message); return; }
      if (data.session) {
        toast.success("Conta de administrador criada com sucesso!");
        navigate({ to: "/dashboard" });
      } else {
        toast.success("Conta criada! Verifique seu Gmail para confirmar o acesso.");
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background bg-app-gradient px-4">
      <div className="panel w-full max-w-md p-8 border border-border shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary font-display text-xl font-bold text-primary-foreground shadow-lg shadow-primary/20">S</div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Santos MktPro</h1>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400 border border-amber-500/20">
            <Lock className="h-3.5 w-3.5 text-amber-400" /> Acesso Exclusivo com Cadeado de Proteção
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{mode === "in" ? "Entre na sua conta de Administrador" : "Crie sua conta de Administrador"}</p>
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
            {loading ? "Aguarde..." : mode === "in" ? "Entrar" : "Criar conta de Administrador"}
          </Button>
        </form>
        <button
          className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setMode(mode === "in" ? "up" : "in")}
        >
          {mode === "in" ? "Primeiro acesso? Cadastre-se aqui" : "Já tem conta? Entrar"}
        </button>
      </div>
    </div>
  );
}
