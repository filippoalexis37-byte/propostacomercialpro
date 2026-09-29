import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/crud-page";
import { pageHead } from "@/lib/meta";

export const Route = createFileRoute("/_authenticated/followup")({
  head: pageHead("Follow-up", "Leads e próximos contatos."),
  component: () => <CrudPage table="leads" title="Follow-up" subtitle="Leads e próximos contatos." fields={[{name:"name",label:"Nome",required:true,list:true},{name:"status",label:"Status",list:true},{name:"whatsapp",label:"WhatsApp",list:true},{name:"next_contact_at",label:"Próximo contato",type:"date",list:true}]} />,
});
