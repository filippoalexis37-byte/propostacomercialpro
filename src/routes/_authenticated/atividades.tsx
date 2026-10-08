import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Video } from "lucide-react";
import { CrudPage } from "@/components/crud-page";
import { pageHead } from "@/lib/meta";
import { Button } from "@/components/ui/button";
import { ScheduleMeetingModal } from "@/components/schedule-meeting-modal";

const TYPES = ["WhatsApp", "Ligação", "E-mail", "Reunião", "Visita", "Proposta", "Outro"];

export const Route = createFileRoute("/_authenticated/atividades")({
  head: pageHead("Atividades", "Histórico de contatos com leads e clientes."),
  component: AtividadesPage,
});

function AtividadesPage() {
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);

  return (
    <>
      <CrudPage
        table="activities"
        title="Atividades"
        subtitle="Registre cada contato com leads e clientes."
        orderBy="activity_date"
        searchKeys={["description", "activity_type"]}
        filter={{ key: "activity_type", options: TYPES }}
        defaults={{ activity_type: "WhatsApp", activity_date: new Date().toISOString().slice(0, 10) }}
        rowActions={(r: any) =>
          r.activity_type === "Reunião" ? (
            <Button
              size="icon"
              variant="ghost"
              title="Abrir Agendador Google Calendar"
              onClick={() => setMeetingModalOpen(true)}
            >
              <Video className="h-4 w-4 text-primary" />
            </Button>
          ) : null
        }
        fields={[
          { name: "activity_type", label: "Tipo", type: "select", options: TYPES, required: true, list: true },
          { name: "activity_date", label: "Data", type: "date", required: true, list: true },
          { name: "lead_id", label: "Lead", type: "relation", relation: { table: "leads", label: "name" }, list: true },
          { name: "client_id", label: "Cliente", type: "relation", relation: { table: "clients", label: "name" }, list: true },
          { name: "next_contact_at", label: "Próximo contato", type: "date", list: true },
          { name: "description", label: "Descrição", type: "textarea", list: true },
        ]}
      />

      <ScheduleMeetingModal
        open={meetingModalOpen}
        onOpenChange={setMeetingModalOpen}
      />
    </>
  );
}
