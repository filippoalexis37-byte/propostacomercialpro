
INSERT INTO public.companies (name, trade_name, cnpj, owner_name, phone, whatsapp, email, website, instagram, address, address_number, district, city, state, zip_code, niche, sub_niche, notes, is_demo) VALUES
('Burger House Ltda','Burger House','12.345.678/0001-90','Rafael Souza','(13) 3222-1010','(13) 99811-1010','contato@burgerhouse.com.br','burgerhouse.com.br','@burgerhousesantos','Av. Ana Costa','120','Gonzaga','Santos','SP','11060-002','Hamburguerias','Delivery','Cliente potencial de tráfego pago.',true),
('Clínica Vida Odonto ME','Vida Odonto','98.765.432/0001-11','Dra. Camila Reis','(13) 3233-2020','(13) 99822-2020','contato@vidaodonto.com.br','vidaodonto.com.br','@vidaodonto','Rua Jorge Tibiriçá','455','Vila Mathias','Santos','SP','11075-100','Dentistas','Implantes','Interesse em captação de pacientes.',true),
('Barbearia Navalha Nobre','Navalha Nobre','11.222.333/0001-44','Diego Martins','(13) 3244-3030','(13) 99833-3030','contato@navalhanobre.com.br',NULL,'@navalhanobre','Rua Bahia','89','Boqueirão','Santos','SP','11055-010','Barbearias','Premium','Quer aumentar agendamentos.',true),
('Pet Amigo Comércio','Pet Amigo','22.333.444/0001-55','Juliana Prado','(13) 3255-4040','(13) 99844-4040','contato@petamigo.com.br','petamigo.com.br','@petamigopetshop','Av. Conselheiro Nébias','980','Campo Grande','Santos','SP','11045-002','Pet shops','Banho e tosa','Loja física com delivery.',true),
('Imobiliária Costa Azul','Costa Azul Imóveis','33.444.555/0001-66','Marcelo Ferreira','(13) 3266-5050','(13) 99855-5050','contato@costaazulimoveis.com.br','costaazulimoveis.com.br','@costaazulimoveis','Av. Presidente Wilson','300','José Menino','Santos','SP','11065-200','Imobiliárias','Locação','Foco em leads qualificados.',true);

INSERT INTO public.leads (name, company_name, company_id, owner_name, phone, whatsapp, email, niche, city, state, district, website, instagram, source, status, notes, first_contact_at, last_contact_at, next_contact_at, estimated_value, is_demo) VALUES
('Rafael Souza','Burger House',(SELECT id FROM public.companies WHERE trade_name='Burger House'),'Rafael Souza','(13) 3222-1010','(13) 99811-1010','rafael@burgerhouse.com.br','Hamburguerias','Santos','SP','Gonzaga','burgerhouse.com.br','@burgerhousesantos','Instagram','Proposta','Pediu proposta de tráfego pago + social media.','2026-09-01','2026-09-20','2026-10-02',2500,true),
('Dra. Camila Reis','Vida Odonto',(SELECT id FROM public.companies WHERE trade_name='Vida Odonto'),'Camila Reis','(13) 3233-2020','(13) 99822-2020','camila@vidaodonto.com.br','Dentistas','Santos','SP','Vila Mathias','vidaodonto.com.br','@vidaodonto','Indicação','Negociação','Negociando pacote de captação de pacientes.','2026-08-15','2026-09-22','2026-10-01',3200,true),
('Diego Martins','Navalha Nobre',(SELECT id FROM public.companies WHERE trade_name='Navalha Nobre'),'Diego Martins','(13) 3244-3030','(13) 99833-3030','diego@navalhanobre.com.br','Barbearias','Santos','SP','Boqueirão',NULL,'@navalhanobre','Prospecção ativa','Qualificado','Quer lotar a agenda de terça a quinta.','2026-09-10','2026-09-24','2026-10-03',1200,true),
('Juliana Prado','Pet Amigo',(SELECT id FROM public.companies WHERE trade_name='Pet Amigo'),'Juliana Prado','(13) 3255-4040','(13) 99844-4040','juliana@petamigo.com.br','Pet shops','Santos','SP','Campo Grande','petamigo.com.br','@petamigopetshop','Google','Em conversa','Interessada em automação de WhatsApp.','2026-09-12','2026-09-23','2026-10-05',1800,true),
('Marcelo Ferreira','Costa Azul Imóveis',(SELECT id FROM public.companies WHERE trade_name='Costa Azul Imóveis'),'Marcelo Ferreira','(13) 3266-5050','(13) 99855-5050','marcelo@costaazulimoveis.com.br','Imobiliárias','Santos','SP','José Menino','costaazulimoveis.com.br','@costaazulimoveis','Indicação','Diagnóstico','Diagnóstico digital agendado.','2026-09-05','2026-09-21','2026-09-30',4500,true),
('Patrícia Lima','Studio Bella Estética',NULL,'Patrícia Lima','(13) 3277-6060','(13) 99866-6060','patricia@studiobella.com.br','Estéticas','São Vicente','SP','Centro',NULL,'@studiobellaestetica','Instagram','Contato realizado','Respondeu no direct, aguardando retorno.','2026-09-18','2026-09-19','2026-09-29',900,true),
('Anderson Rocha','Academia Força Total',NULL,'Anderson Rocha','(13) 3288-7070','(13) 99877-7070','anderson@forcatotal.com.br','Academias','Praia Grande','SP','Boqueirão',NULL,'@academiaforcatotal','Prospecção ativa','Lead novo','Ainda não contatado.',NULL,NULL,'2026-09-29',1500,true),
('Sônia Almeida','Salão Sônia Hair',NULL,'Sônia Almeida','(13) 3299-8080','(13) 99888-8080','sonia@soniahair.com.br','Salões','Santos','SP','Embaré',NULL,'@soniahairsantos','Indicação','Lead novo','Indicação de cliente atual.',NULL,NULL,'2026-09-30',800,true),
('Eduardo Pires','Ar Frio Climatização',NULL,'Eduardo Pires','(13) 3211-9090','(13) 99899-9090','eduardo@arfrio.com.br','Ar-condicionado','Guarujá','SP','Enseada',NULL,'@arfrioclimatizacao','Google','Perdido','Fechou com outra agência.','2026-07-10','2026-08-02',NULL,1600,true),
('Renata Castro','Contabilidade Castro',NULL,'Renata Castro','(13) 3212-1212','(13) 99812-1212','renata@contabilidadecastro.com.br','Contabilidades','Santos','SP','Vila Nova',NULL,'@contabilidadecastro','Site','Fechado','Fechou pacote de SEO + site.','2026-06-01','2026-09-15','2026-10-15',2800,true);

INSERT INTO public.clients (name, company_id, lead_id, owner_name, phone, whatsapp, email, status, monthly_value, start_date, notes, is_demo) VALUES
('Burger House',(SELECT id FROM public.companies WHERE trade_name='Burger House'),NULL,'Rafael Souza','(13) 3222-1010','(13) 99811-1010','rafael@burgerhouse.com.br','Ativo',2500,'2026-07-01','Tráfego pago + social media.',true),
('Vida Odonto',(SELECT id FROM public.companies WHERE trade_name='Vida Odonto'),NULL,'Dra. Camila Reis','(13) 3233-2020','(13) 99822-2020','camila@vidaodonto.com.br','Ativo',3200,'2026-05-15','Captação de pacientes e Google Business.',true),
('Costa Azul Imóveis',(SELECT id FROM public.companies WHERE trade_name='Costa Azul Imóveis'),NULL,'Marcelo Ferreira','(13) 3266-5050','(13) 99855-5050','marcelo@costaazulimoveis.com.br','Ativo',4500,'2026-03-10','Site, SEO e tráfego pago.',true);

INSERT INTO public.activities (activity_date, activity_type, description, lead_id, next_contact_at, is_demo) VALUES
(now() - interval '5 days','WhatsApp','Enviada apresentação comercial.',(SELECT id FROM public.leads WHERE name='Rafael Souza'),'2026-10-02',true),
(now() - interval '3 days','Reunião','Reunião de diagnóstico realizada.',(SELECT id FROM public.leads WHERE name='Dra. Camila Reis'),'2026-10-01',true),
(now() - interval '2 days','Ligação','Ligação de qualificação.',(SELECT id FROM public.leads WHERE name='Diego Martins'),'2026-10-03',true),
(now() - interval '1 day','E-mail','Enviado material sobre automação de WhatsApp.',(SELECT id FROM public.leads WHERE name='Juliana Prado'),'2026-10-05',true),
(now(),'Follow-up','Follow-up após envio da proposta.',(SELECT id FROM public.leads WHERE name='Marcelo Ferreira'),'2026-09-30',true);

INSERT INTO public.services (name, category, description, price, promo_price, min_price, cost, margin, setup_fee, periodicity, active, is_demo) VALUES
('Google Ads','Tráfego pago','Gestão de campanhas de pesquisa e display no Google.',1497,1297,997,400,73,497,'Mensal',true,true),
('Meta Ads','Tráfego pago','Gestão de campanhas no Facebook e Instagram.',1397,1197,897,380,72,397,'Mensal',true,true),
('Social Media','Social Media','Planejamento, criação e publicação de conteúdo.',1197,997,797,450,62,297,'Mensal',true,true),
('SEO','SEO','Otimização técnica e de conteúdo para busca orgânica.',1697,1497,1197,500,70,697,'Mensal',true,true),
('Site Institucional','Sites','Criação de site institucional responsivo.',3497,2997,2497,900,74,0,'Único',true,true),
('Landing Page','Sites','Página de conversão focada em campanhas.',1497,1297,997,350,76,0,'Único',true,true),
('Google Business Profile','Marketing local','Otimização e gestão do perfil da empresa no Google.',697,597,497,150,78,297,'Mensal',true,true),
('Automação de WhatsApp','Automação','Implantação de fluxos e atendimento automatizado.',1297,1097,897,300,76,897,'Mensal',true,true),
('Consultoria de Marketing','Consultoria','Consultoria estratégica mensal com plano de ação.',997,897,697,250,74,0,'Mensal',true,true),
('Pesquisa de Mercado','Estratégia','Análise de mercado, concorrentes e oportunidades.',1197,997,797,300,74,0,'Único',true,true);

INSERT INTO public.service_prices (service_id, price, promo_price, min_price, cost)
SELECT id, price, promo_price, min_price, cost FROM public.services;

INSERT INTO public.niches (name, category, description, audience, goals, opportunities, recommended_services, sales_arguments, acquisition_channels, is_demo) VALUES
('Hamburguerias','Alimentação','Lanchonetes e hamburguerias artesanais.','Público 18-45 anos, delivery e salão.','Aumentar pedidos no delivery e movimento em dias fracos.','Campanhas geolocalizadas, combos promocionais, fidelização por WhatsApp.','Meta Ads, Social Media, Google Business Profile','Cada real investido em anúncio local pode virar pedidos no mesmo dia.','Instagram, Google Maps, iFood, WhatsApp',true),
('Restaurantes','Alimentação','Restaurantes à la carte e self-service.','Famílias, executivos no almoço e turistas.','Lotar o salão no almoço e nos fins de semana.','Reservas online, cardápio digital, avaliações no Google.','Google Business Profile, Social Media, Meta Ads','Quem aparece no Maps recebe a visita de quem está perto agora.','Google Maps, Instagram, TripAdvisor',true),
('Salões','Beleza','Salões de beleza e cabeleireiros.','Mulheres 20-55 anos da região.','Encher a agenda em dias de baixa procura.','Agendamento por WhatsApp, pacotes mensais, indicação.','Social Media, Meta Ads, Automação de WhatsApp','Agenda cheia começa com constância de conteúdo e resposta rápida.','Instagram, WhatsApp, indicação',true),
('Barbearias','Beleza','Barbearias tradicionais e premium.','Homens 18-45 anos.','Aumentar recorrência e ticket médio.','Planos de assinatura, combos barba+cabelo.','Meta Ads, Social Media, Automação de WhatsApp','Assinatura mensal transforma cliente eventual em receita previsível.','Instagram, TikTok, Google Maps',true),
('Clínicas','Saúde','Clínicas médicas e multiprofissionais.','Pacientes particulares e convênios.','Captar pacientes particulares de maior valor.','Landing pages por especialidade, remarketing.','Google Ads, SEO, Site Institucional','Paciente particular pesquisa no Google antes de escolher a clínica.','Google, Instagram, indicação',true),
('Dentistas','Saúde','Consultórios e clínicas odontológicas.','Adultos buscando implante, ortodontia e estética.','Agendar avaliações de tratamentos de alto valor.','Campanhas por tratamento, prova social, financiamento.','Google Ads, Landing Page, Social Media','Uma avaliação agendada pode virar um tratamento de milhares de reais.','Google, Instagram, WhatsApp',true),
('Estéticas','Beleza','Clínicas de estética e bem-estar.','Mulheres 25-55 anos.','Vender pacotes de procedimentos.','Ofertas de primeira sessão, antes e depois.','Meta Ads, Social Media, Landing Page','Primeira sessão promocional é a porta de entrada para pacotes.','Instagram, WhatsApp, Meta Ads',true),
('Pet shops','Pet','Pet shops, banho e tosa e clínicas veterinárias.','Tutores de pets da região.','Aumentar recorrência de banho e tosa.','Clube de assinatura, leva e traz, delivery de ração.','Google Business Profile, Meta Ads, Automação de WhatsApp','Tutor compra todo mês: o desafio é ser lembrado antes do concorrente.','Google Maps, Instagram, WhatsApp',true),
('Imobiliárias','Imobiliário','Imobiliárias e corretores autônomos.','Compradores e locatários da região.','Gerar leads qualificados de compra e locação.','Portais, landing pages por empreendimento, remarketing.','Google Ads, SEO, Site Institucional','Lead imobiliário qualificado paga a campanha com uma única comissão.','Google, portais, Instagram',true),
('Academias','Fitness','Academias, estúdios e boxes.','Público 18-50 anos próximo à unidade.','Aumentar matrículas e reduzir cancelamento.','Campanha de aula experimental, planos anuais.','Meta Ads, Social Media, Google Business Profile','Aula experimental gratuita é a oferta com maior conversão do setor.','Instagram, Google Maps, indicação',true),
('Oficinas','Automotivo','Oficinas mecânicas e centros automotivos.','Proprietários de veículos da região.','Encher a agenda de serviços e revisões.','Revisão preventiva, orçamento por WhatsApp.','Google Ads, Google Business Profile, Automação de WhatsApp','Quem quebra o carro procura no Google e liga para o primeiro da lista.','Google Maps, Google Ads, WhatsApp',true),
('Ar-condicionado','Serviços','Instalação e manutenção de climatização.','Residências, comércios e condomínios.','Gerar orçamentos no verão e contratos de manutenção.','Contrato de manutenção preventiva, campanhas sazonais.','Google Ads, Google Business Profile, Landing Page','Demanda urgente: quem aparece primeiro fecha o orçamento.','Google Ads, Google Maps, WhatsApp',true),
('Compra de ouro','Financeiro','Lojas de compra e venda de ouro e joias.','Adultos precisando de liquidez rápida.','Aumentar avaliações presenciais.','Avaliação gratuita, atendimento discreto.','Google Ads, Landing Page, Meta Ads','Decisão é imediata: quem responde rápido compra.','Google Ads, WhatsApp',true),
('Lojas de cosméticos','Varejo','Perfumarias e lojas de cosméticos.','Mulheres 18-55 anos.','Aumentar vendas na loja e no online.','Catálogo no WhatsApp, campanhas sazonais.','Social Media, Meta Ads, Automação de WhatsApp','Datas comemorativas concentram a maior parte do faturamento anual.','Instagram, WhatsApp, Meta Ads',true),
('Contabilidades','Serviços','Escritórios de contabilidade.','Micro e pequenas empresas.','Captar novos CNPJs todo mês.','Conteúdo educativo, abertura de empresa grátis.','SEO, Google Ads, Site Institucional','Cliente contábil é recorrente por anos: o CAC se paga rápido.','Google, LinkedIn, indicação',true);

INSERT INTO public.niche_pains (niche_id, content)
SELECT n.id, p.content FROM public.niches n JOIN (VALUES
('Hamburguerias','Movimento fraco de segunda a quarta'),
('Hamburguerias','Dependência total do iFood e taxas altas'),
('Restaurantes','Salão vazio fora do horário de pico'),
('Salões','Agenda com buracos durante a semana'),
('Barbearias','Clientes que somem e não voltam'),
('Clínicas','Excesso de convênio e pouco particular'),
('Dentistas','Muita avaliação marcada e pouca conversão'),
('Estéticas','Cliente compra uma sessão e não volta'),
('Pet shops','Concorrência de preço no bairro'),
('Imobiliárias','Leads sem perfil e curiosos'),
('Academias','Alta taxa de cancelamento'),
('Oficinas','Agenda irregular e sazonal'),
('Ar-condicionado','Demanda concentrada só no verão'),
('Compra de ouro','Desconfiança do cliente'),
('Lojas de cosméticos','Estoque parado fora das datas'),
('Contabilidades','Dificuldade de captar novos clientes')
) AS p(niche, content) ON n.name = p.niche;

INSERT INTO public.niche_challenges (niche_id, content)
SELECT n.id, c.content FROM public.niches n JOIN (VALUES
('Hamburguerias','Construir pedidos diretos sem depender de aplicativos'),
('Restaurantes','Manter boas avaliações e presença no Google'),
('Salões','Reduzir faltas e remarcar automaticamente'),
('Barbearias','Criar recorrência com planos de assinatura'),
('Clínicas','Aumentar o ticket médio por paciente'),
('Dentistas','Educar o paciente sobre o valor do tratamento'),
('Estéticas','Transformar sessão avulsa em pacote'),
('Pet shops','Fidelizar por serviço e não por preço'),
('Imobiliárias','Qualificar o lead antes do corretor atender'),
('Academias','Engajar o aluno nos primeiros 30 dias'),
('Oficinas','Gerar demanda previsível o ano todo'),
('Ar-condicionado','Vender manutenção preventiva no inverno'),
('Compra de ouro','Transmitir segurança e credibilidade'),
('Lojas de cosméticos','Vender fora das datas comemorativas'),
('Contabilidades','Diferenciar-se de escritórios que só vendem preço')
) AS c(niche, content) ON n.name = c.niche;

INSERT INTO public.niche_needs (niche_id, content)
SELECT n.id, x.content FROM public.niches n JOIN (VALUES
('Hamburguerias','Canal próprio de pedidos e base de clientes no WhatsApp'),
('Restaurantes','Perfil no Google otimizado e cheio de avaliações'),
('Salões','Sistema de agendamento e lembretes automáticos'),
('Barbearias','Plano de assinatura e conteúdo constante'),
('Clínicas','Landing pages por especialidade'),
('Dentistas','Processo comercial claro para avaliações'),
('Estéticas','Oferta de entrada e política de pacotes'),
('Pet shops','Clube de assinatura e lembrete de retorno'),
('Imobiliárias','Formulário de qualificação e CRM'),
('Academias','Campanha de aula experimental'),
('Oficinas','Presença forte no Google Maps'),
('Ar-condicionado','Contrato de manutenção recorrente'),
('Compra de ouro','Prova social e avaliação transparente'),
('Lojas de cosméticos','Catálogo digital e campanhas sazonais'),
('Contabilidades','Conteúdo educativo e autoridade digital')
) AS x(niche, content) ON n.name = x.niche;

INSERT INTO public.niche_objections (niche_id, objection, answer, question, next_step, is_demo) VALUES
(NULL,'Está caro','Entendo. O que define se está caro é o retorno: se o investimento trouxer clientes suficientes para se pagar, ele deixa de ser custo e vira lucro. Posso te mostrar quanto você precisa faturar a mais para o projeto se pagar?','Hoje, quanto vale um cliente novo para você por mês?','Enviar simulação de retorno com o ticket médio do cliente.',true),
(NULL,'Vou pensar','Claro, decisão importante merece reflexão. Só para eu te ajudar melhor: o que exatamente você quer avaliar — o investimento, o prazo ou o resultado esperado?','O que falta para você ter segurança nessa decisão?','Agendar retorno com data definida em até 3 dias.',true),
(NULL,'Já tenho alguém','Ótimo, isso mostra que você já entende a importância do marketing. Muitos clientes nossos também tinham. A pergunta é: os resultados que você tem hoje são os que você esperava?','Você está satisfeito com os resultados atuais?','Oferecer um diagnóstico gratuito como segunda opinião.',true),
(NULL,'Já faço anúncios','Perfeito, então metade do caminho está feito. O que costuma faltar é estratégia e acompanhamento. Posso analisar sua conta e te mostrar onde está vazando dinheiro?','Você acompanha o custo por cliente das suas campanhas?','Fazer análise gratuita da conta de anúncios.',true),
(NULL,'Não tenho dinheiro','Entendo o momento. Justamente por isso existe um plano de entrada menor, focado só no que gera caixa mais rápido. Prefere começar pelo essencial e crescer depois?','Qual valor mensal caberia no seu orçamento hoje?','Apresentar plano de entrada e cronograma de evolução.',true),
(NULL,'Preciso falar com meu sócio','Faz todo sentido. Para facilitar a conversa, posso preparar um resumo com investimento, prazo e resultado esperado. Quando vocês conseguem conversar?','Que informação seu sócio vai querer ver primeiro?','Enviar resumo executivo e marcar reunião com os dois.',true),
(NULL,'Já tentei','Isso é mais comum do que parece, e quase sempre o problema foi falta de estratégia ou de acompanhamento, não o canal. O que exatamente foi feito da última vez?','O que você acha que faltou naquela tentativa?','Mostrar o processo e os pontos de controle do nosso método.',true),
(NULL,'Não acredito em anúncios','Respeito totalmente. Anúncio sem estratégia realmente queima dinheiro. Por isso trabalhamos com metas claras e relatórios. Se em 90 dias não houver resultado mensurável, faz sentido continuar?','O que precisaria acontecer para você mudar de opinião?','Propor um teste de 90 dias com metas acordadas.',true);

INSERT INTO public.prompt_templates (name, channel, tone, template, is_demo) VALUES
('Primeira abordagem WhatsApp','WhatsApp','Consultivo','Olá {{responsavel}}, tudo bem? Aqui é da Santos MktPro. Vi o trabalho da {{empresa}} em {{cidade}} e percebi uma oportunidade clara para {{nicho}}: {{dor}}. Trabalhamos com {{servico}} focado em {{objetivo}}. Posso te mostrar em 5 minutos como isso funcionaria aí?',true),
('Abordagem Instagram (direct)','Instagram','Direto','Oi {{empresa}}! Acompanhei o conteúdo de vocês e tenho uma ideia específica para {{nicho}} em {{cidade}}. Em resumo: {{dor}} tem solução com {{servico}}. Quer que eu envie um diagnóstico rápido, sem compromisso?',true),
('E-mail de prospecção','E-mail','Profissional','Assunto: Uma oportunidade para a {{empresa}}

Olá {{responsavel}},

Analisando o cenário de {{nicho}} em {{cidade}}, identifiquei que {{dor}} é o principal gargalo de crescimento hoje.

Na Santos MktPro trabalhamos com {{servico}} para {{objetivo}}, com metas e relatórios claros.

Posso apresentar um diagnóstico gratuito esta semana?

Atenciosamente,
Santos MktPro — Central Comercial de Marketing Digital',true),
('Roteiro de ligação','Ligação','Consultivo','1) Abertura: Olá {{responsavel}}, aqui é da Santos MktPro, tudo bem? Falo com o responsável pela {{empresa}}?
2) Contexto: Trabalhamos com {{nicho}} em {{cidade}} e um problema que aparece muito é {{dor}}.
3) Pergunta: Isso acontece aí também?
4) Valor: Resolvemos isso com {{servico}}, focando em {{objetivo}}.
5) Fechamento: Faz sentido marcarmos 20 minutos para eu te mostrar o diagnóstico?',true),
('Follow-up 1 (sem resposta)','Follow-up','Leve','Oi {{responsavel}}, tudo certo? Só passando para saber se você chegou a ver minha mensagem sobre {{servico}} para a {{empresa}}. Quer que eu envie o diagnóstico rápido?',true),
('Follow-up 2 (valor)','Follow-up','Consultivo','{{responsavel}}, separei um caso parecido com a {{empresa}}: mesmo nicho, mesma dor de {{dor}}, e o resultado veio em poucas semanas com {{servico}}. Posso te mandar o resumo?',true),
('Follow-up 3 (encerramento)','Follow-up','Direto','{{responsavel}}, não quero insistir à toa. Me diz só uma coisa: faz sentido agora ou prefere que eu retome daqui alguns meses?',true),
('Follow-up após proposta','Follow-up','Profissional','Oi {{responsavel}}, passando para saber se ficou alguma dúvida sobre a proposta da {{empresa}}. Posso ajustar escopo ou condição de pagamento se precisar.',true),
('Follow-up após reunião','Follow-up','Profissional','{{responsavel}}, obrigado pelo tempo de hoje. Resumo do que combinamos: foco em {{objetivo}} com {{servico}}. Te envio a proposta ainda hoje. Confirma para mim?',true),
('Reativação de contato antigo','Follow-up','Leve','Oi {{responsavel}}, quanto tempo! Estamos com uma condição nova para {{nicho}} em {{cidade}} e lembrei da {{empresa}}. Quer dar uma olhada?',true),
('Quebra de objeção','Objeções','Consultivo','Entendo o ponto, {{responsavel}}. Sobre {{dor}}: nosso trabalho com {{servico}} é justamente medir retorno. Se em 90 dias não houver resultado mensurável, revemos tudo. Isso te deixa mais confortável?',true),
('Fechamento','Fechamento','Direto','{{responsavel}}, então fechamos assim: {{servico}} focado em {{objetivo}}, começando esta semana. Te envio o contrato e os dados agora?',true);
