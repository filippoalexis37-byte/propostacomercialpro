import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/crud-page";
import { pageHead } from "@/lib/meta";

export const Route = createFileRoute("/_authenticated/prompts")({
  head: pageHead("Modelos de prompt", "Mensagens prontas para prospecção."),
  component: () => <CrudPage table="prompt_templates" title="Modelos de prompt" subtitle="Mensagens prontas para prospecção." fields={[{name:"name",label:"Nome",required:true,list:true},{name:"channel",label:"Canal",type:"select",options:["WhatsApp","Instagram","E-mail","Ligação"],list:true},{name:"tone",label:"Tom",list:true},{name:"template",label:"Modelo",type:"textarea",required:true}]} />,
});
