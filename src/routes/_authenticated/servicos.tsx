import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/crud-page";
import { pageHead } from "@/lib/meta";

const CATS = ["Consultoria", "Tráfego pago", "Social media", "Sites", "Design", "Automação", "SEO", "Outro"];

export const Route = createFileRoute("/_authenticated/servicos")({
  head: pageHead("Serviços", "Catálogo de serviços e preços."),
  component: () => (
    <CrudPage
      table="services"
      title="Serviços"
      subtitle="Catálogo de serviços, preços e margens."
      orderBy="name"
      filter={{ key: "category", options: CATS }}
      defaults={{ category: "Consultoria", periodicity: "Mensal", active: true }}
      fields={[
        { name: "name", label: "Nome", required: true, list: true },
        { name: "category", label: "Categoria", type: "select", options: CATS, list: true },
        { name: "price", label: "Preço", type: "money", required: true, list: true },
        { name: "promo_price", label: "Preço promocional", type: "money" },
        { name: "min_price", label: "Preço mínimo", type: "money", list: true },
        { name: "cost", label: "Custo", type: "money" },
        { name: "setup_fee", label: "Taxa de setup", type: "money" },
        { name: "periodicity", label: "Periodicidade", type: "select", options: ["Mensal", "Único", "Trimestral", "Anual"], list: true },
        { name: "active", label: "Ativo", type: "switch", list: true },
        { name: "description", label: "Descrição", type: "textarea" },
      ]}
    />
  ),
});
