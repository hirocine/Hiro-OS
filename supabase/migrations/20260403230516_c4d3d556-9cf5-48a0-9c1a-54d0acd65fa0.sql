
-- Add category column to proposal_pain_points
ALTER TABLE public.proposal_pain_points ADD COLUMN IF NOT EXISTS category TEXT DEFAULT '';

-- Clear existing data and seed with categorized pain points
DELETE FROM public.proposal_pain_points;

INSERT INTO public.proposal_pain_points (label, title, description, category) VALUES
-- 01 Qualidade & padrão visual
('🎯', 'Exigência estética não-negociável', 'O posicionamento premium da marca exige conteúdo audiovisual que esteja à altura — qualquer entrega abaixo do padrão compromete a percepção de valor.', 'Qualidade & padrão visual'),
('🚫', 'Reprovações internas recorrentes', 'Entregas anteriores foram reprovadas por stakeholders internos por não atingirem o nível visual esperado, gerando retrabalho e atraso na campanha.', 'Qualidade & padrão visual'),
('📐', 'Inconsistência entre canais', 'O conteúdo produzido para diferentes plataformas perde coesão visual, enfraquecendo a identidade da marca na jornada do consumidor.', 'Qualidade & padrão visual'),
('🔍', 'Gap entre referência e entrega', 'Existe uma distância grande entre o moodboard aprovado e o resultado final, causando frustração e perda de confiança no processo criativo.', 'Qualidade & padrão visual'),
('📊', 'Conteúdo que não reflete o ticket do produto', 'O material audiovisual atual não transmite o valor real do produto, criando uma desconexão entre preço de venda e percepção de marca.', 'Qualidade & padrão visual'),
('⚖', 'Múltiplas marcas, um padrão unificado', 'A campanha precisa manter coerência visual entre diferentes marcas do grupo sem perder a identidade individual de cada uma.', 'Qualidade & padrão visual'),

-- 02 Prazo & velocidade de entrega
('⏰', 'Janela de produção apertada', 'A necessidade de entregar conteúdo de alto nível em janelas de tempo curtas exige uma equipe experiente e processos ágeis de produção.', 'Prazo & velocidade de entrega'),
('📅', 'Data sazonal inegociável', 'Campanhas vinculadas a datas comerciais não podem atrasar — qualquer deslize no cronograma compromete o lançamento e o faturamento previsto.', 'Prazo & velocidade de entrega'),
('🔄', 'Ciclos de aprovação que atrasam tudo', 'Múltiplas camadas de aprovação interna consomem tempo precioso — é essencial acertar na primeira entrega para não estourar o prazo final.', 'Prazo & velocidade de entrega'),
('📦', 'Volume alto em pouco tempo', 'O projeto demanda um grande número de peças em um período curto, exigindo uma operação com capacidade de escalar sem perder qualidade.', 'Prazo & velocidade de entrega'),
('🚨', 'Demanda reativa sem planejamento', 'As demandas surgem com urgência e sem briefing estruturado, exigindo um parceiro capaz de organizar o caos e entregar com previsibilidade.', 'Prazo & velocidade de entrega'),

-- 03 Experiência com fornecedores anteriores
('😤', 'Frustração com o fornecedor anterior', 'Experiências negativas com produtoras que não entregaram o que prometeram criaram desconfiança — o próximo parceiro precisa provar antes de cobrar.', 'Experiência com fornecedores anteriores'),
('🤷', 'Falta de profissionalismo no processo', 'Fornecedores anteriores não tinham processo claro: sem cronograma, sem alinhamento de expectativas e sem comunicação proativa durante o projeto.', 'Experiência com fornecedores anteriores'),
('💸', 'Custo alto sem retorno proporcional', 'O investimento feito em produções anteriores não se traduziu em resultados de performance ou de marca, gerando questionamento sobre o ROI.', 'Experiência com fornecedores anteriores'),
('🧩', 'Muitos fornecedores, zero integração', 'Contratar câmera, luz, edição e motion de fornecedores separados gera retrabalho, perda de tempo e resultado fragmentado.', 'Experiência com fornecedores anteriores'),
('📉', 'Resultado final abaixo do combinado', 'O vídeo ficou diferente do que foi apresentado na proposta — o gap entre o pitch comercial e a entrega real gerou desgaste na relação.', 'Experiência com fornecedores anteriores'),
('📵', 'Comunicação travada na pós-produção', 'Após a gravação, o fornecedor sumiu ou demorou semanas para enviar cortes e responder feedbacks, comprometendo o cronograma da campanha.', 'Experiência com fornecedores anteriores'),

-- 04 Diferencial criativo & estratégico
('🎨', 'Conteúdo genérico que não diferencia', 'O material produzido até agora é funcional, mas não se destaca no feed — a marca precisa de uma linguagem visual proprietária que ninguém copie.', 'Diferencial criativo & estratégico'),
('🧠', 'Precisa de parceiro criativo, não executor', 'O time interno tem o briefing, mas precisa de um parceiro que traga visão criativa, referências novas e soluções visuais que a equipe não consegue produzir sozinha.', 'Diferencial criativo & estratégico'),
('⚔️', 'Concorrência investindo mais em conteúdo', 'Concorrentes diretos estão produzindo conteúdo audiovisual de alta qualidade e ganhando espaço — a marca precisa reagir para não perder relevância.', 'Diferencial criativo & estratégico'),
('🧭', 'Sem direção criativa clara', 'A marca sabe que precisa de vídeo, mas não tem clareza sobre estilo, tom e formato — precisa de alguém que conduza a estratégia visual do zero.', 'Diferencial criativo & estratégico'),
('😴', 'Cansaço visual da mesma fórmula', 'O conteúdo está repetitivo e a audiência parou de engajar — é hora de renovar a linguagem visual sem perder a identidade construída até aqui.', 'Diferencial criativo & estratégico'),

-- 05 Performance & resultado de negócio
('📈', 'Vídeos que não convertem', 'O conteúdo é bonito mas não gera resultado — a produção precisa ser pensada desde o roteiro para os KPIs de campanha, não só para estética.', 'Performance & resultado de negócio'),
('🎯', 'Conteúdo pra múltiplos funis', 'A marca precisa de peças que funcionem em diferentes estágios do funil — awareness, consideração e conversão — a partir de uma mesma captação.', 'Performance & resultado de negócio'),
('📱', 'Adaptação nativa por plataforma', 'Cada plataforma tem linguagem própria — o material precisa ser pensado nativamente para Instagram, YouTube, TikTok e e-commerce, não apenas redimensionado.', 'Performance & resultado de negócio'),
('🧮', 'Pressão por ROI comprovável', 'A diretoria cobra retorno mensurável sobre o investimento em produção audiovisual — o conteúdo precisa justificar cada real investido.', 'Performance & resultado de negócio'),
('🏷', 'Maximizar rendimento por diária', 'O budget é limitado e cada diária de gravação precisa render o máximo de peças possível sem comprometer a qualidade individual de cada entrega.', 'Performance & resultado de negócio'),

-- 06 Orçamento & justificativa de investimento
('💰', 'Budget apertado, expectativa alta', 'O orçamento disponível é menor do que o ideal, mas a exigência de qualidade permanece alta — é preciso otimizar cada recurso sem parecer barato.', 'Orçamento & justificativa de investimento'),
('🏛', 'Aprovação interna do investimento', 'O decisor precisa convencer stakeholders internos de que o investimento faz sentido — a proposta precisa ser clara o suficiente para ser usada como argumento.', 'Orçamento & justificativa de investimento'),
('📋', 'Comparação com concorrentes mais baratos', 'O cliente está comparando propostas e precisa entender por que o investimento maior se justifica em termos de resultado e qualidade.', 'Orçamento & justificativa de investimento'),
('🔮', 'Imprevisibilidade de custos extras', 'Projetos anteriores tiveram custos extras não previstos — o cliente precisa de transparência total e escopo fechado para aprovar o investimento.', 'Orçamento & justificativa de investimento'),

-- 07 Operacional & estrutura de produção
('🏢', 'Sem estrutura interna de produção', 'A empresa não tem time ou equipamento para produzir conteúdo audiovisual internamente e precisa de um parceiro que assuma a operação completa.', 'Operacional & estrutura de produção'),
('🏗', 'Produção complexa com muitas variáveis', 'O projeto envolve locações, talentos, cenografia e logística que exigem um produtor experiente com capacidade de resolver problemas em tempo real.', 'Operacional & estrutura de produção'),
('🔐', 'Sigilo e controle de material sensível', 'O projeto envolve lançamentos confidenciais ou produtos não-anunciados que exigem NDA e controle rigoroso sobre o material durante toda a produção.', 'Operacional & estrutura de produção'),

-- 08 Escala & recorrência
('📆', 'Demanda contínua sem parceiro fixo', 'A marca tem demanda recorrente de conteúdo audiovisual mas opera projeto a projeto, perdendo eficiência e consistência visual a cada troca de fornecedor.', 'Escala & recorrência'),
('📦', 'Escalar sem perder qualidade', 'O volume de conteúdo precisa crescer para atender novas plataformas e campanhas, sem que a qualidade individual de cada peça seja comprometida.', 'Escala & recorrência'),
('🤝', 'Busca por parceiro de longo prazo', 'Cansar de negociar do zero a cada projeto — a marca quer um parceiro que já conheça o tom, as preferências e os processos internos.', 'Escala & recorrência'),
('🌐', 'Expansão de canais exige mais conteúdo', 'A marca está entrando em novas plataformas ou mercados e precisa de um volume maior de conteúdo adaptado sem multiplicar o custo na mesma proporção.', 'Escala & recorrência');
