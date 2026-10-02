import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FileDown } from "lucide-react";
import { toast } from "sonner";
import { db, brl } from "@/lib/db";
import { PageHeader } from "@/components/crud-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { pageHead } from "@/lib/meta";
import { documentPdf } from "@/lib/pdf";

export const Route = createFileRoute("/_authenticated/afiliados")({
  head: pageHead("Proposta para afiliados", "Proposta de consultoria completa para afiliados."),
  component: Afiliados,
});

/* eslint-disable @typescript-eslint/no-explicit-any */
function Afiliados() {
  const { data: services = [] } = useQuery({
    queryKey: ["services-afiliados"],
    queryFn: async () => (await db.from("services").select("*").eq("category", "Afiliados").eq("active", true).order("price")).data ?? [],
  });
  const [f, setF] = useState({ name: "", whatsapp: "", product: "", experience: "Iniciante", budget: "", goal: "", notes: "", discount: 0, conditions: "Pagamento via PIX ou parcelado no cartão. Início em até 7 dias após a confirmação." });
  const [sel, setSel] = useState<Record<string, number>>({});
  const set = (k: string, v: any) => setF({ ...f, [k]: v });
  const chosen = services.filter((s: any) => s.id in sel);
  const subtotal = chosen.reduce((a: number, s: any) => a + (sel[s.id] ?? Number(s.price)), 0);
  const total = subtotal * (1 - Number(f.discount || 0) / 100);

  function pdf() {
    if (!f.name || chosen.length === 0) return void toast.error("Informe o nome e escolha ao menos um serviço");
    documentPdf({
      title: "Proposta de Consultoria para Afiliado",
      subtitle: f.product ? `Produto: ${f.product}` : "Operação de afiliado de produtos físicos",
      client: f.name,
      signature: true,
      filename: `proposta-afiliado-${f.name.toLowerCase().replace(/\s+/g, "-")}.pdf`,
      sections: [
        { title: "Sobre a Santos MktPro", body: "A Santos MktPro estrutura operações de vendas para afiliados de produtos físicos: da escolha do produto à campanha de tráfego pago, captação de leads e atendimento pelo WhatsApp. Trabalhamos com método, acompanhamento próximo e transferência de conhecimento, sem promessas de ganhos garantidos." },
        { title: "Seu momento", body: `Nível de experiência: ${f.experience}\nProduto/nicho de interesse: ${f.product || "a definir na consultoria"}\nVerba disponível para anúncios: ${f.budget || "a definir"}\nObjetivo: ${f.goal || "iniciar e estruturar vendas como afiliado"}${f.notes ? `\n\n${f.notes}` : ""}` },
        { title: "Principais desafios de quem está começando", body: "• Escolher um produto com boa margem e demanda real\n• Montar uma oferta e um público corretos antes de investir\n• Configurar campanhas sem desperdiçar verba\n• Transformar contatos em vendas com um atendimento organizado no WhatsApp\n• Ter rotina de acompanhamento e otimização" },
        ...chosen.map((s: any) => ({ title: s.name, body: `${s.description ?? ""}\n\nInvestimento: ${brl(sel[s.id] ?? Number(s.price))} (${s.periodicity})` })),
        { title: "Como vamos trabalhar", body: "1. Diagnóstico e definição do produto e da oferta\n2. Definição do público e planejamento da campanha\n3. Estruturação do tráfego pago e da captação de leads\n4. Organização do atendimento e da automação do WhatsApp\n5. Treinamento para você operar e acompanhar\n6. Acompanhamento e ajustes com base nos indicadores" },
        { title: "Investimento", table: { head: ["Serviço", "Periodicidade", "Valor"], rows: [...chosen.map((s: any) => [s.name, s.periodicity, brl(sel[s.id] ?? Number(s.price))]), ...(f.discount ? [["Desconto", "", `${f.discount}%`]] : []), ["TOTAL", "", brl(total)]] } },
        { title: "Condições", body: `${f.conditions}\n\nA verba de anúncios é paga diretamente às plataformas e não está inclusa nos valores acima. Resultados dependem de produto, verba e execução; não há garantia de faturamento.` },
      ],
    });
  }

  const box = "mb-1.5 block text-xs text-muted-foreground";
  return (
    <div>
      <PageHeader title="Proposta para afiliados" subtitle="Monte a proposta de consultoria para quem quer vender como afiliado e baixe o PDF assinado." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="panel grid gap-4 p-5 sm:grid-cols-2 lg:col-span-2">
          <div><Label className={box}>Nome do afiliado *</Label><Input value={f.name} onChange={(e) => set("name", e.target.value)} /></div>
          <div><Label className={box}>WhatsApp</Label><Input value={f.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} /></div>
          <div><Label className={box}>Produto / nicho de interesse</Label><Input value={f.product} onChange={(e) => set("product", e.target.value)} /></div>
          <div><Label className={box}>Experiência</Label>
            <select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground" value={f.experience} onChange={(e) => set("experience", e.target.value)}>
              {["Iniciante", "Já vendeu algumas vezes", "Já anuncia, quer escalar"].map((o) => <option key={o}>{o}</option>)}
            </select></div>
          <div><Label className={box}>Verba para anúncios</Label><Input placeholder="Ex.: R$ 30/dia" value={f.budget} onChange={(e) => set("budget", e.target.value)} /></div>
          <div><Label className={box}>Objetivo</Label><Input value={f.goal} onChange={(e) => set("goal", e.target.value)} /></div>
          <div className="sm:col-span-2"><Label className={box}>Observações</Label><Textarea rows={3} value={f.notes} onChange={(e) => set("notes", e.target.value)} /></div>
          <div className="sm:col-span-2"><Label className={box}>Condições</Label><Textarea rows={2} value={f.conditions} onChange={(e) => set("conditions", e.target.value)} /></div>
        </div>
        <div className="panel space-y-3 p-5">
          <h3 className="font-display font-semibold text-foreground">Serviços para afiliados</h3>
          {services.length === 0 && <p className="text-sm text-muted-foreground">Cadastre serviços na categoria "Afiliados".</p>}
          {services.map((s: any) => (
            <div key={s.id} className="rounded-md border border-border p-3">
              <label className="flex items-start gap-2 text-sm text-foreground">
                <Checkbox checked={s.id in sel} onCheckedChange={(c) => { const n = { ...sel }; if (c) n[s.id] = Number(s.price); else delete n[s.id]; setSel(n); }} />
                <span>{s.name}<span className="block text-xs text-muted-foreground">{s.periodicity}</span></span>
              </label>
              {s.id in sel && <Input className="mt-2" type="number" value={sel[s.id]} onChange={(e) => setSel({ ...sel, [s.id]: Number(e.target.value) })} />}
            </div>
          ))}
          <div><Label className={box}>Desconto (%)</Label><Input type="number" value={f.discount} onChange={(e) => set("discount", Number(e.target.value))} /></div>
          <div className="flex justify-between border-t border-border pt-3 font-display text-xl text-foreground"><span>Total</span><span className="text-primary">{brl(total)}</span></div>
          <Button className="w-full" onClick={pdf}><FileDown className="mr-1 h-4 w-4" />Gerar PDF da proposta</Button>
        </div>
      </div>
    </div>
  );
}
