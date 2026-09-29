import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/crud-page";
import { pageHead } from "@/lib/meta";

export const Route = createFileRoute("/_authenticated/precificacao")({
  head: pageHead("Precificação", "Cálculos de preço e margem."),
  component: () => <CrudPage table="pricing_calculations" title="Precificação" subtitle="Cálculos de preço e margem." fields={[{name:"name",label:"Nome",required:true,list:true},{name:"total_cost",label:"Custo total",type:"money",list:true},{name:"target_margin",label:"Margem alvo (%)",type:"number"},{name:"recommended_price",label:"Preço recomendado",type:"money",list:true},{name:"sale_price",label:"Preço de venda",type:"money",list:true},{name:"profit",label:"Lucro",type:"money",list:true}]} />,
});
