import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Video } from "lucide-react";
import { CrudPage } from "@/components/crud-page";
import { LEAD_STATUSES } from "@/lib/db";
import { pageHead } from "@/lib/meta";
import { Button } from "@/components/ui/button";
import { ScheduleMeetingModal } from "@/components/schedule-meeting-modal";
import { PlacesSearch } from "@/components/places-search";

export const Route = createFileRoute("/_authenticated/leads")({
  head: pageHead("Leads", "Funil de leads e oportunidades."),
  component: LeadsPage,
});

function LeadsPage() {
  const [meetingTarget, setMeetingTarget] = useState<{
    name?: string;
    email?: string;
    phone?: string;
  } | null>(null);

  return (
    <>
      <PlacesSearch />
      <CrudPage
        table="leads"
        title="Leads"
        subtitle="Acompanhe cada oportunidade no funil comercial."
        searchKeys={["name", "company_name", "city", "niche"]}
        filter={{ key: "status", options: LEAD_STATUSES }}
        defaults={{ status: "Lead novo" }}
        rowActions={(r: any) => (
          <Button
            size="icon"
            variant="ghost"
            title="Agendar Reunião no Google Calendar"
            onClick={() =>
              setMeetingTarget({
                name: r.name,
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
          { name: "company_name", label: "Empresa", list: true },
          { name: "company_id", label: "Empresa vinculada", type: "relation", relation: { table: "companies", label: "name" } },
          { name: "owner_name", label: "Responsável" },
          { name: "whatsapp", label: "WhatsApp", list: true },
          { name: "phone", label: "Telefone" },
          { name: "email", label: "E-mail" },
          { name: "niche", label: "Nicho", list: true },
          { name: "city", label: "Cidade", list: true },
          { name: "state", label: "UF" },
          { name: "instagram", label: "Instagram" },
          { name: "website", label: "Site" },
          { name: "source", label: "Origem", type: "select", options: ["Instagram", "Google Maps", "Indicação", "Site", "WhatsApp", "Outro"] },
          { name: "status", label: "Status", type: "select", options: LEAD_STATUSES, list: true },
          { name: "estimated_value", label: "Valor estimado", type: "money", list: true },
          { name: "next_contact_at", label: "Próximo contato", type: "date", list: true },
          { name: "notes", label: "Observações", type: "textarea" },
        ]}
      />

      <ScheduleMeetingModal
        open={!!meetingTarget}
        onOpenChange={(open) => !open && setMeetingTarget(null)}
        defaultClientName={meetingTarget?.name}
        defaultClientEmail={meetingTarget?.email}
        defaultClientPhone={meetingTarget?.phone}
      />
    </>
  );
}
