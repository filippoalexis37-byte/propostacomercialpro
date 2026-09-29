import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/crud-page";
import { pageHead } from "@/lib/meta";

const TYPES = ["WhatsApp", "Ligação", "E-mail", "Reunião", "Visita", "Proposta", "Outro"];

export const Route = createFileRoute("/_authenticated/atividades")({
  head: pageHead("Atividades", "Histórico de contatos com leads e clientes."),
  component: () => (
    <CrudPage
      table="activities"
      title="Atividades"
      subtitle="Registre cada contato com leads e clientes."
      orderBy="activity_date"
      searchKeys={["description", "activity_type"]}
      filter={{ key: "activity_type", options: TYPES }}
      defaults={{ activity_type: "WhatsApp", activity_date: new Date().toISOString().slice(0, 10) }}
      fields={[
        { name: "activity_type", label: "Tipo", type: "select", options: TYPES, required: true, list: true },
        { name: "activity_date", label: "Data", type: "date", required: true, list: true },
        { name: "lead_id", label: "Lead", type: "relation", relation: { table: "leads", label: "name" }, list: true },
        { name: "client_id", label: "Cliente", type: "relation", relation: { table: "clients", label: "name" }, list: true },
        { name: "next_contact_at", label: "Próximo contato", type: "date", list: true },
        { name: "description", label: "Descrição", type: "textarea", list: true },
      ]}
    />
  ),
});
