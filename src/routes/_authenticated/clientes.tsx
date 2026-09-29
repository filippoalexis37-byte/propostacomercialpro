import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/crud-page";
import { pageHead } from "@/lib/meta";

export const Route = createFileRoute("/_authenticated/clientes")({
  head: pageHead("Clientes", "Carteira de clientes ativos e mensalidades."),
  component: () => (
    <CrudPage
      table="clients"
      title="Clientes"
      subtitle="Carteira de clientes e receita recorrente."
      searchKeys={["name", "owner_name"]}
      filter={{ key: "status", options: ["Ativo", "Pausado", "Cancelado"] }}
      defaults={{ status: "Ativo" }}
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
  ),
});
