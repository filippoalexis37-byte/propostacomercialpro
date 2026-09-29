import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/crud-page";
import { pageHead } from "@/lib/meta";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: pageHead("Configurações", "Dados da empresa para documentos."),
  component: () => <CrudPage table="settings" title="Configurações" subtitle="Dados da empresa para documentos." fields={[{name:"company_name",label:"Empresa",required:true,list:true},{name:"cnpj",label:"CNPJ",list:true},{name:"whatsapp",label:"WhatsApp",list:true},{name:"email",label:"E-mail"},{name:"website",label:"Site"},{name:"pix_key",label:"Chave PIX"},{name:"document_footer",label:"Rodapé de documentos",type:"textarea"}]} />,
});
