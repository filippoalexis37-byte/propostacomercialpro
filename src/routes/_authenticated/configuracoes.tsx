import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { CrudPage } from "@/components/crud-page";
import { pageHead } from "@/lib/meta";
import { Calendar, Mail, ExternalLink, Key, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getOpenAIApiKey, setOpenAIApiKey } from "@/lib/openai";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: pageHead("Configurações", "Dados da empresa para documentos e integrações."),
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const k = getOpenAIApiKey();
    if (k && k.startsWith("sk-")) {
      setApiKey(k);
    }
  }, []);

  const handleSaveKey = () => {
    if (!apiKey.trim().startsWith("sk-")) {
      toast.error("Chave inválida. A chave da OpenAI deve começar com 'sk-'");
      return;
    }
    setOpenAIApiKey(apiKey.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    toast.success("Chave da OpenAI salva com sucesso no navegador!");
  };

  return (
    <div className="space-y-6">
      {/* Box de Integração Google Agenda / Gmail */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground text-base">Google Calendar & Gmail Integrados</h2>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <Mail className="h-3.5 w-3.5 text-primary" />
                <span>Conta comercial: <strong className="text-foreground">lucasmktpro158@gmail.com</strong></span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Utilizado para gerar salas no Google Meet, registrar eventos de diagnóstico e convidar clientes automaticamente.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open("https://calendar.google.com/calendar/u/0/r", "_blank")}
            className="gap-2 shrink-0"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Abrir Google Agenda
          </Button>
        </div>
      </div>

      {/* Box de Integração OpenAI (Créditos de IA) */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground text-base">Créditos de IA (OpenAI)</h2>
            <p className="text-xs text-muted-foreground">
              Configure sua chave API oficial para utilizar seus próprios créditos da OpenAI no Assistente e na criação de Propostas.
            </p>
          </div>
        </div>

        <div className="pt-2">
          <Label className="text-xs text-muted-foreground">Chave API OpenAI (sk-...)</Label>
          <div className="mt-1.5 flex flex-col sm:flex-row gap-2 max-w-xl">
            <div className="relative flex-1">
              <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-proj-..."
                className="pl-9 font-mono text-xs"
              />
            </div>
            <Button onClick={handleSaveKey} className="gap-2 shrink-0">
              {saved ? <Check className="h-4 w-4 text-green-400" /> : null}
              {saved ? "Chave Salva!" : "Salvar Chave"}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            Sua chave fica armazenada de forma segura e conectada diretamente com a API da OpenAI.
          </p>
        </div>
      </div>

      <CrudPage
        table="settings"
        title="Configurações da Empresa"
        subtitle="Dados da empresa para propostas, recibos e documentos."
        defaults={{
          email: "lucasmktpro158@gmail.com",
        }}
        fields={[
          { name: "company_name", label: "Empresa", required: true, list: true },
          { name: "cnpj", label: "CNPJ", list: true },
          { name: "whatsapp", label: "WhatsApp", list: true },
          { name: "email", label: "E-mail Comercial (Gmail)", list: true },
          { name: "website", label: "Site" },
          { name: "pix_key", label: "Chave PIX" },
          { name: "document_footer", label: "Rodapé de documentos", type: "textarea" },
        ]}
      />
    </div>
  );
}
