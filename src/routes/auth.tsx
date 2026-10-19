import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, ShieldCheck, ShieldAlert, MailCheck, KeyRound, Sparkles } from "lucide-react";

export const MASTER_ADMIN_EMAIL = "lucasmktpro158@gmail.com";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Santos MktPro" },
      { name: "description", content: "Acesso administrativo restrito da Santos MktPro." },
      { property: "og:title", content: "Entrar — Santos MktPro" },
      { property: "og:description", content: "Acesso administrativo restrito da Santos MktPro." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(MASTER_ADMIN_EMAIL);
  const [password, setPassword] = useState("Lucas159357@");
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        const userEmail = data.session.user?.email?.toLowerCase().trim();
        if (userEmail === MASTER_ADMIN_EMAIL) {
          navigate({ to: "/dashboard" });
        } else {
          supabase.auth.signOut();
          setErrorMsg(`O e-mail ${userEmail} está bloqueado. Acesso restrito a ${MASTER_ADMIN_EMAIL}.`);
        }
      }
    });
  }, [navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const cleanEmail = email.trim().toLowerCase();

    // Bloqueio rigoroso de outros e-mails com cadeado de segurança
    if (cleanEmail !== MASTER_ADMIN_EMAIL) {
      setErrorMsg(`Cadeado de segurança ativo: Este sistema é de uso exclusivo do administrador (${MASTER_ADMIN_EMAIL}). Outros e-mails não são permitidos.`);
      toast.error("Acesso bloqueado: apenas o administrador tem acesso.", { icon: "🔒" });
      return;
    }

    setLoading(true);

    try {
      // 1. Tentar login direto com senha
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (!error && data.session) {
        toast.success("Bem-vindo de volta, Lucas Santos!");
        navigate({ to: "/dashboard" });
        return;
      }

      // 2. Se a senha ou login falhou, analisar o motivo
      const rawMsg = error?.message || "";
      const lower = rawMsg.toLowerCase();

      // Caso A: Usuário ainda não foi cadastrado no Supabase
      if (lower.includes("invalid login credentials") || lower.includes("user not found") || lower.includes("invalid grant")) {
        // Tentar cadastrar a conta de administrador automaticamente
        const signUpRes = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { full_name: "Lucas Santos (Admin)" },
            emailRedirectTo: window.location.origin + "/dashboard",
          },
        });

        if (signUpRes.error) {
          // Se disse que usuário já está registrado, a senha pode ser diferente ou e-mail não confirmado
          if (signUpRes.error.message.toLowerCase().includes("already registered")) {
            setErrorMsg("Credenciais incorretas ou seu e-mail ainda precisa ser confirmado no Gmail. Use o botão abaixo para receber o link direto de acesso no Gmail.");
          } else {
            setErrorMsg(`Erro de registro no Supabase: ${signUpRes.error.message}`);
          }
          setLoading(false);
          return;
        }

        if (signUpRes.data.session) {
          toast.success("Conta de administrador criada e autenticada!");
          navigate({ to: "/dashboard" });
          return;
        } else {
          setInfoMsg("Conta de administrador criada com sucesso! Um link de confirmação foi enviado para " + cleanEmail + ". Abra seu Gmail e clique no link para validar.");
          setLoading(false);
          return;
        }
      }

      // Caso B: E-mail ainda não confirmado
      if (lower.includes("email not confirmed")) {
        setErrorMsg("Seu e-mail ainda não foi confirmado. Verifique a caixa de entrada (ou spam) de " + cleanEmail + " para confirmar, ou clique em 'Enviar link de acesso direto'.");
        setLoading(false);
        return;
      }

      setErrorMsg(rawMsg || "Não foi possível autenticar. Verifique seus dados.");
    } catch (err: any) {
      setErrorMsg(err.message || "Erro inesperado ao conectar");
    } finally {
      setLoading(false);
    }
  }

  // Login direto sem senha (Magic Link enviado para o Gmail oficial)
  async function handleMagicLink() {
    setErrorMsg(null);
    setInfoMsg(null);
    setOtpLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: MASTER_ADMIN_EMAIL,
        options: {
          emailRedirectTo: window.location.origin + "/dashboard",
        },
      });

      if (error) {
        setErrorMsg(`Erro ao enviar link para o Gmail: ${error.message}`);
      } else {
        setInfoMsg(`Link de acesso enviado com sucesso para ${MASTER_ADMIN_EMAIL}! Basta abrir seu Gmail e clicar no botão para entrar direto.`);
        toast.success("Link enviado para seu Gmail!");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao conectar com o serviço de e-mail");
    } finally {
      setOtpLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background bg-app-gradient px-4 py-8">
      <div className="panel w-full max-w-md p-8 border border-border/80 shadow-2xl relative overflow-hidden">
        {/* Faixa superior de bloqueio / segurança */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-primary to-amber-500" />

        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary font-display text-xl font-bold text-primary-foreground shadow-lg shadow-primary/20">
            S
          </div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Santos MktPro</h1>
          <p className="text-xs text-muted-foreground mt-1">Central Comercial & Gestão de Propostas</p>
        </div>

        {/* Card de Cadeado / Proteção de Administrador */}
        <div className="mb-5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200">
          <div className="flex items-start gap-2.5">
            <Lock className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                Cadeado de Segurança Ativo
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Acesso exclusivo para o Administrador Master (<span className="text-foreground font-mono font-medium">{MASTER_ADMIN_EMAIL}</span>). Outros e-mails são automaticamente rejeitados.
              </p>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3.5 text-xs text-destructive space-y-1">
            <div className="flex items-center gap-1.5 font-semibold">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>Atenção</span>
            </div>
            <p className="leading-relaxed">{errorMsg}</p>
          </div>
        )}

        {infoMsg && (
          <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-xs text-emerald-300 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold">
              <MailCheck className="h-4 w-4 shrink-0" />
              <span>Instrução de Acesso</span>
            </div>
            <p className="leading-relaxed">{infoMsg}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label className="mb-1.5 block text-xs">E-mail do Administrador</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="lucasmktpro158@gmail.com"
              required
            />
          </div>

          <div>
            <Label className="mb-1.5 block text-xs">Senha</Label>
            <Input
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha de acesso"
              required
            />
          </div>

          <Button type="submit" className="w-full gap-2" disabled={loading || otpLoading}>
            <Lock className="h-4 w-4" />
            {loading ? "Verificando credenciais..." : "Entrar no Sistema"}
          </Button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Ou acesse pelo Gmail</span></div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full gap-2 text-xs"
          disabled={loading || otpLoading}
          onClick={handleMagicLink}
        >
          <MailCheck className="h-4 w-4 text-primary" />
          {otpLoading ? "Enviando link..." : "Receber link de acesso direto no Gmail"}
        </Button>

        <div className="mt-5 border-t border-border pt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setEmail(MASTER_ADMIN_EMAIL);
              setPassword("Lucas159357@");
              setErrorMsg(null);
              setInfoMsg(null);
            }}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            Restaurar credenciais padrão do Administrador
          </button>
        </div>
      </div>
    </div>
  );
}
