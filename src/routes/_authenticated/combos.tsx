import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/crud-page";
import { pageHead } from "@/lib/meta";

export const Route = createFileRoute("/_authenticated/combos")({
  head: pageHead("Combos", "Pacotes de serviços com desconto."),
  component: () => <CrudPage table="service_packages" title="Combos" subtitle="Pacotes de serviços com desconto." fields={[{name:"name",label:"Nome",required:true,list:true},{name:"final_value",label:"Valor final",type:"money",list:true},{name:"discount_percent",label:"Desconto (%)",type:"number",list:true},{name:"payment_type",label:"Pagamento",type:"select",options:["Mensalidade","À vista","Parcelado"],list:true},{name:"active",label:"Ativo",type:"switch",list:true},{name:"description",label:"Descrição",type:"textarea"}]} />,
});
