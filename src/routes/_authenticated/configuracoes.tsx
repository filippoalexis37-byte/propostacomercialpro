import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/crud-page";
import { pageHead } from "@/lib/meta";
import { Calendar, Mail, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: pageHead("Configurações", "Dados da empresa para documentos e integrações."),
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
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
