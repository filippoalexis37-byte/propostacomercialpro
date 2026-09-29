import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/crud-page";
import { pageHead } from "@/lib/meta";

export const Route = createFileRoute("/_authenticated/nichos")({
  head: pageHead("Nichos", "Inteligência de mercado por nicho."),
  component: () => <CrudPage table="niches" title="Nichos" subtitle="Inteligência de mercado por nicho." fields={[{name:"name",label:"Nome",required:true,list:true},{name:"category",label:"Categoria",list:true},{name:"audience",label:"Público",list:true},{name:"description",label:"Descrição",type:"textarea"},{name:"opportunities",label:"Oportunidades",type:"textarea"},{name:"recommended_services",label:"Serviços recomendados",type:"textarea"},{name:"sales_arguments",label:"Argumentos de venda",type:"textarea"}]} />,
});
