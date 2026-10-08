import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Video,
  Plus,
  ExternalLink,
  Copy,
  Clock,
  User,
  Building2,
  Mail,
  Send,
  CheckCircle2,
} from "lucide-react";
import { db, fmtDate } from "@/lib/db";
import { pageHead } from "@/lib/meta";
import { PageHeader } from "@/components/crud-page";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScheduleMeetingModal } from "@/components/schedule-meeting-modal";
import { generateGoogleCalendarUrl, generateClientInvitationMessage, openWhatsAppInvite } from "@/lib/calendar";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/reunioes")({
  head: pageHead("Reuniões & Agenda", "Agendamento e envio de reuniões do Google Calendar."),
  component: ReunioesPage,
});

function ReunioesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<{
    name?: string;
    email?: string;
    phone?: string;
  } | null>(null);

  // Busca leads com status de reunião ou follow-up recente
  const { data: leads = [], isLoading: loadingLeads } = useQuery({
    queryKey: ["leads-meetings"],
    queryFn: async () => {
      const { data } = await db
        .from("leads")
        .select("id, name, company_name, email, whatsapp, phone, status, next_contact_at")
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  // Busca atividades de reunião
  const { data: meetingActivities = [] } = useQuery({
    queryKey: ["meeting-activities"],
    queryFn: async () => {
      const { data } = await db
        .from("activities")
        .select("*, lead:leads(name, email, whatsapp), client:clients(name, email, whatsapp)")
        .eq("activity_type", "Reunião")
        .order("activity_date", { ascending: false })
        .limit(10);
      return data ?? [];
    },
  });

  const handleOpenScheduleFor = (item: { name?: string; email?: string; whatsapp?: string; phone?: string }) => {
    setSelectedEntity({
      name: item.name,
      email: item.email,
      phone: item.whatsapp || item.phone,
    });
    setModalOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Reuniões & Google Calendar"
        subtitle="Agende reuniões com clientes e envie links automáticos via Google Meet e Agenda."
        action={
          <Button
            onClick={() => {
              setSelectedEntity(null);
              setModalOpen(true);
            }}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Nova Reunião
          </Button>
        }
      />

      {/* Card informativo sobre a integração */}
      <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-base">Integração Google Calendar Ativa</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Organizador principal: <span className="font-semibold text-foreground">lucasmktpro158@gmail.com</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Os eventos são gerados com convite automático por e-mail e botão direto para Google Meet.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open("https://calendar.google.com", "_blank")}
            className="gap-2 shrink-0"
          >
            <ExternalLink className="h-4 w-4" /> Abrir Google Agenda
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Leads para Agendar */}
        <div className="lg:col-span-2 space-y-4">
          <div className="panel p-5">
            <h2 className="font-display text-lg font-semibold text-foreground mb-1">
              Agendamento Rápido com Leads
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              Clique para gerar reunião com Google Calendar e enviar o convite para o contato.
            </p>

            <div className="divide-y divide-border/60">
              {loadingLeads && <p className="py-6 text-sm text-muted-foreground text-center">Carregando leads...</p>}
              {!loadingLeads && leads.length === 0 && (
                <p className="py-6 text-sm text-muted-foreground text-center">Nenhum lead encontrado.</p>
              )}
              {leads.map((lead: any) => (
                <div key={lead.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground text-sm">{lead.name}</span>
                      {lead.company_name && (
                        <span className="text-xs text-muted-foreground">({lead.company_name})</span>
                      )}
                      <Badge variant="outline" className="text-[10px]">{lead.status || "Lead"}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                      {lead.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {lead.email}
                        </span>
                      )}
                      {(lead.whatsapp || lead.phone) && (
                        <span className="flex items-center gap-1">
                          <Send className="h-3 w-3" /> {lead.whatsapp || lead.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenScheduleFor(lead)}
                    className="gap-1.5 text-xs h-8 shrink-0 hover:bg-primary/10 hover:text-primary hover:border-primary/40"
                  >
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    Agendar Reunião
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Histórico / Próximos passos */}
        <div className="space-y-4">
          <div className="panel p-5">
            <h2 className="font-display text-base font-semibold text-foreground mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Como Funciona
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-xs text-muted-foreground">
              <li>
                <strong className="text-foreground">Defina a data e hora:</strong> Escolha o dia e o tempo da conversa.
              </li>
              <li>
                <strong className="text-foreground">Criar no Google Agenda:</strong> O link abre diretamente a tela do Google Calendar com o organizador <span className="font-mono text-primary">lucasmktpro158@gmail.com</span> e gera a sala do Google Meet.
              </li>
              <li>
                <strong className="text-foreground">Envio com 1 clique:</strong> Copie a mensagem formatada ou envie diretamente para o WhatsApp do cliente.
              </li>
            </ol>
          </div>

          <div className="panel p-5">
            <h2 className="font-display text-base font-semibold text-foreground mb-3 flex items-center gap-2">
              <Video className="h-4 w-4 text-primary" /> Acesso Rápido ao Meet
            </h2>
            <p className="text-xs text-muted-foreground mb-3">
              Precisa abrir uma sala de emergência agora mesmo?
            </p>
            <Button
              className="w-full gap-2 text-xs"
              variant="outline"
              onClick={() => window.open("https://meet.google.com/new", "_blank")}
            >
              <Video className="h-4 w-4" /> Criar Sala Google Meet Imediata
            </Button>
          </div>
        </div>
      </div>

      <ScheduleMeetingModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        defaultClientName={selectedEntity?.name}
        defaultClientEmail={selectedEntity?.email}
        defaultClientPhone={selectedEntity?.phone}
      />
    </div>
  );
}
