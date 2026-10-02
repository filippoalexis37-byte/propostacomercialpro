import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/crud-page";
import { pageHead } from "@/lib/meta";
import { PlacesSearch } from "@/components/places-search";

export const Route = createFileRoute("/_authenticated/empresas")({
  head: pageHead("Empresas", "Cadastro de empresas prospectadas e clientes."),
  component: () => (
    <>
    <PlacesSearch />
    <CrudPage
      table="companies"
      title="Empresas"
      subtitle="Base de empresas prospectadas e atendidas."
      searchKeys={["name", "trade_name", "city", "niche"]}
      orderBy="name"
      fields={[
        { name: "name", label: "Razão social / Nome", required: true, list: true },
        { name: "trade_name", label: "Nome fantasia" },
        { name: "cnpj", label: "CNPJ" },
        { name: "owner_name", label: "Responsável", list: true },
        { name: "whatsapp", label: "WhatsApp", list: true },
        { name: "phone", label: "Telefone" },
        { name: "email", label: "E-mail" },
        { name: "website", label: "Site" },
        { name: "instagram", label: "Instagram" },
        { name: "niche", label: "Nicho", list: true },
        { name: "sub_niche", label: "Subnicho" },
        { name: "address", label: "Endereço" },
        { name: "district", label: "Bairro" },
        { name: "city", label: "Cidade", list: true },
        { name: "state", label: "UF" },
        { name: "zip_code", label: "CEP" },
        { name: "notes", label: "Observações", type: "textarea" },
      ]}
    />
    </>
  ),
});
