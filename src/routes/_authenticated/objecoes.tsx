import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/crud-page";
import { pageHead } from "@/lib/meta";

export const Route = createFileRoute("/_authenticated/objecoes")({
  head: pageHead("Objeções", "Banco de objeções e respostas comerciais."),
  component: () => (
    <CrudPage
      table="niche_objections"
      title="Objeções"
      subtitle="Respostas prontas para as objeções mais comuns."
      searchKeys={["objection", "answer"]}
      fields={[
        { name: "objection", label: "Objeção", required: true, list: true, full: true },
        { name: "niche_id", label: "Nicho", type: "relation", relation: { table: "niches", label: "name" }, list: true },
        { name: "answer", label: "Resposta", type: "textarea", list: true },
        { name: "question", label: "Pergunta de retorno", type: "textarea" },
        { name: "next_step", label: "Próximo passo", type: "textarea" },
      ]}
    />
  ),
});
