import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Video } from "lucide-react";
import { CrudPage } from "@/components/crud-page";
import { pageHead } from "@/lib/meta";
import { Button } from "@/components/ui/button";
import { ScheduleMeetingModal } from "@/components/schedule-meeting-modal";

export const Route = createFileRoute("/_authenticated/clientes")({
  head: pageHead("Clientes", "Carteira de clientes ativos e mensalidades."),
  component: ClientesPage,
});

function ClientesPage() {
  const [meetingTarget, setMeetingTarget] = useState<{
    name?: string;
    email?: string;
    phone?: string;
  } | null>(null);

  return (
    <>
      <CrudPage
        table="clients"
        title="Clientes"
        subtitle="Carteira de clientes e receita recorrente."
        searchKeys={["name", "owner_name"]}
        filter={{ key: "status", options: ["Ativo", "Pausado", "Cancelado"] }}
        defaults={{ status: "Ativo" }}
        rowActions={(r: any) => (
          <Button
            size="icon"
            variant="ghost"
            title="Agendar Reunião de Alinhamento no Google Calendar"
            onClick={() =>
              setMeetingTarget({
                name: r.owner_name || r.name,
                email: r.email,
                phone: r.whatsapp || r.phone,
              })
            }
          >
            <Video className="h-4 w-4 text-primary" />
          </Button>
        )}
        fields={[
          { name: "name", label: "Nome", required: true, list: true },
          { name: "company_id", label: "Empresa", type: "relation", relation: { table: "companies", label: "name" } },
          { name: "owner_name", label: "Responsável", list: true },
          { name: "whatsapp", label: "WhatsApp", list: true },
          { name: "phone", label: "Telefone" },
          { name: "email", label: "E-mail" },
          { name: "status", label: "Status", type: "select", options: ["Ativo", "Pausado", "Cancelado"], list: true },
          { name: "monthly_value", label: "Mensalidade", type: "money", list: true },
          { name: "start_date", label: "Início", type: "date", list: true },
          { name: "notes", label: "Observações", type: "textarea" },
        ]}
      />

      <ScheduleMeetingModal
        open={!!meetingTarget}
        onOpenChange={(open) => !open && setMeetingTarget(null)}
        defaultClientName={meetingTarget?.name}
        defaultClientEmail={meetingTarget?.email}
        defaultClientPhone={meetingTarget?.phone}
        defaultTitle="Reunião de Alinhamento & Resultados — Santos MktPro"
      />
    </>
  );
}
