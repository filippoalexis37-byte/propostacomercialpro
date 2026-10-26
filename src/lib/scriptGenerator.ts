/**
 * Gerador de Scripts de Follow-up B2B
 * Modelos de A a H adaptados ao status e histórico da empresa
 */

export interface ScriptModel {
  id: string;
  name: string;
  category: string;
  description: string;
  template: (lead: any) => string;
}

export const SCRIPT_MODELS: Record<string, ScriptModel> = {
  A: {
    id: "A",
    name: "Modelo A — Abordagem Inicial / Primeiro Contato",
    category: "Prospecção",
    description: "Para empresas que ainda não tiveram interação recente.",
    template: (lead) => {
      const name = lead?.name || "Parceiro";
      const niche = lead?.niche ? ` no segmento de ${lead.niche}` : "";
      return `Olá! Tudo bem? Vi o trabalho da ${name}${niche} e notei ótimas oportunidades para acelerar a captação de clientes qualificados. Você é a pessoa responsável pela área comercial/marketing?`;
    },
  },
  B: {
    id: "B",
    name: "Modelo B — Follow-up 1 (24h a 48h sem resposta)",
    category: "Follow-up Rápido",
    description: "Contato breve relembrando a mensagem anterior.",
    template: (lead) => {
      const name = lead?.name || "Tudo bem?";
      return `Olá ${name}, tudo bem? Passando rapidamente para saber se você conseguiu ver minha mensagem anterior. Sei que a rotina é corrida! Terça ou quinta fica melhor para falarmos 5 minutinhos?`;
    },
  },
  C: {
    id: "C",
    name: "Modelo C — Follow-up 2 (Geração de Valor & Case)",
    category: "Follow-up de Valor",
    description: "Destaca resultados práticos e prova social relevante.",
    template: (lead) => {
      const name = lead?.name || "Olá";
      const niche = lead?.niche ? `no setor de ${lead.niche}` : "neste segmento";
      return `Olá ${name}! Recentemente ajudamos uma empresa ${niche} a dobrar o volume de orçamentos qualificados apenas ajustando a estratégia de conversão. Pensei que poderia fazer sentido para vocês também. Gostaria que eu te enviasse um resumo de 2 minutos?`;
    },
  },
  D: {
    id: "D",
    name: "Modelo D — Follow-up 3 (Quebra de Gelo / Pergunta Direta)",
    category: "Retomada",
    description: "Pergunta objetiva com pouca fricção para resposta rápida.",
    template: (lead) => {
      const name = lead?.name || "Olá";
      return `Oi ${name}, tudo bem? A captação de novos clientes ainda é uma prioridade para a empresa este mês, ou o foco agora está em outra área?`;
    },
  },
  E: {
    id: "E",
    name: "Modelo E — Pós-Proposta Enviada",
    category: "Proposta",
    description: "Follow-up após envio de proposta comercial.",
    template: (lead) => {
      const name = lead?.name || "Olá";
      return `Olá ${name}, tudo bem? Estou entrando em contato para saber o que achou da proposta comercial que te enviamos. Ficou alguma dúvida sobre o escopo ou as condições que possamos alinhar juntos?`;
    },
  },
  F: {
    id: "F",
    name: "Modelo F — Negociação / Fechamento",
    category: "Fechamento",
    description: "Para empresas em negociação final.",
    template: (lead) => {
      const name = lead?.name || "Olá";
      return `Olá ${name}! Estamos planejando os projetos que iniciaremos nas próximas semanas e adoraríamos viabilizar a nossa parceria. Conseguimos agendar uma rápida ligação hoje para definir os detalhes finais e dar início?`;
    },
  },
  G: {
    id: "G",
    name: "Modelo G — Reativação de Contato Antigo",
    category: "Reativação",
    description: "Para leads antigos ou parados há semanas.",
    template: (lead) => {
      const name = lead?.name || "Olá";
      return `Olá ${name}, tudo bem? Conversamos há algum tempo sobre estratégias de crescimento e prospecção. Como estão os resultados desde então? Estamos com novas abordagens que estão gerando excelentes conversões e lembrei da ${lead?.name || "sua empresa"}.`;
    },
  },
  H: {
    id: "H",
    name: "Modelo H — Última Tentativa / Break-up Gentil",
    category: "Encerramento",
    description: "Tira a pressão do lead e frequentemente gera resposta de última hora.",
    template: (lead) => {
      const name = lead?.name || "Olá";
      return `Olá ${name}, tudo bem? Como não tive mais retorno, imagino que o timing atual não seja o ideal para vocês, o que é totalmente compreensível. Vou pausar nossos contatos por aqui para não incomodar. Se em algum momento fizer sentido conversarmos, sigo 100% à disposição! Sucesso nos negócios!`;
    },
  },
};

/**
 * Seleciona automaticamente o melhor modelo de script com base no status e histórico da empresa
 */
export function selectBestScriptModel(lead: any): string {
  const status = (lead?.prospecting_status || "").toLowerCase();
  const attemptCount = lead?.attempt_count || 0;

  if (status.includes("proposta")) return "E";
  if (status.includes("negocia")) return "F";
  if (status.includes("não prospectado") || attemptCount === 0) return "A";
  if (attemptCount === 1) return "B";
  if (attemptCount === 2) return "C";
  if (attemptCount === 3) return "D";
  if (attemptCount >= 4) return "H";
  return "B";
}

/**
 * Gera o texto do script sugerido
 */
export function generateScript(lead: any, modelId?: string): string {
  const selectedKey = modelId && SCRIPT_MODELS[modelId] ? modelId : selectBestScriptModel(lead);
  const model = SCRIPT_MODELS[selectedKey] || SCRIPT_MODELS.A;
  return model.template(lead);
}
