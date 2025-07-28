-- Inserir projetos de exemplo para demonstrar diferentes etapas do workflow
INSERT INTO public.projects (name, description, start_date, expected_end_date, status, step, step_history, responsible_name, responsible_email, department, equipment_count, loan_ids, notes) VALUES
-- Projeto ativo em separação
('Documentário Amazônia', 'Produção de documentário sobre a biodiversidade amazônica', '2024-01-15', '2024-03-30', 'active', 'pending_separation', 
 '[{"step": "pending_separation", "timestamp": "2024-01-15T10:00:00Z", "notes": "Projeto iniciado, aguardando separação dos equipamentos"}]',
 'Maria Silva', 'maria.silva@empresa.com', 'Produção', 3, '{}', 'Projeto em parceria com Instituto Nacional de Pesquisas'),

-- Projeto com equipamentos separados
('Campanha Publicitária Tech', 'Campanha para novo produto de tecnologia', '2024-01-20', '2024-02-28', 'active', 'separated',
 '[{"step": "pending_separation", "timestamp": "2024-01-20T09:00:00Z", "notes": "Projeto iniciado"}, {"step": "separated", "timestamp": "2024-01-22T14:30:00Z", "notes": "Equipamentos separados e prontos para uso"}]',
 'João Santos', 'joao.santos@empresa.com', 'Marketing', 2, '{}', 'Cliente: TechCorp'),

-- Projeto em uso
('Série Web Juventude', 'Série web sobre questões sociais dos jovens', '2024-01-10', '2024-04-15', 'active', 'in_use',
 '[{"step": "pending_separation", "timestamp": "2024-01-10T08:00:00Z", "notes": "Projeto iniciado"}, {"step": "separated", "timestamp": "2024-01-12T10:00:00Z", "notes": "Equipamentos separados"}, {"step": "in_use", "timestamp": "2024-01-15T09:00:00Z", "notes": "Gravações iniciadas em estúdio"}]',
 'Ana Costa', 'ana.costa@empresa.com', 'Produção', 5, '{}', 'Produção para plataforma streaming'),

-- Projeto pendente verificação
('Treinamento Corporativo', 'Vídeos de treinamento para funcionários', '2024-01-05', '2024-02-20', 'active', 'pending_verification',
 '[{"step": "pending_separation", "timestamp": "2024-01-05T09:00:00Z", "notes": "Projeto iniciado"}, {"step": "separated", "timestamp": "2024-01-06T11:00:00Z", "notes": "Equipamentos separados"}, {"step": "in_use", "timestamp": "2024-01-08T08:30:00Z", "notes": "Gravações iniciadas"}, {"step": "pending_verification", "timestamp": "2024-02-18T16:00:00Z", "notes": "Gravações finalizadas, equipamentos retornados para verificação"}]',
 'Carlos Oliveira', 'carlos.oliveira@empresa.com', 'RH', 4, '{}', 'Material para onboarding de novos funcionários'),

-- Projeto concluído
('Evento Lançamento Produto', 'Cobertura do evento de lançamento', '2023-12-01', '2023-12-15', 'completed', 'verified',
 '[{"step": "pending_separation", "timestamp": "2023-12-01T10:00:00Z", "notes": "Projeto iniciado"}, {"step": "separated", "timestamp": "2023-12-02T09:00:00Z", "notes": "Equipamentos separados"}, {"step": "in_use", "timestamp": "2023-12-05T07:00:00Z", "notes": "Evento coberto com sucesso"}, {"step": "pending_verification", "timestamp": "2023-12-06T18:00:00Z", "notes": "Equipamentos retornados"}, {"step": "verified", "timestamp": "2023-12-08T10:00:00Z", "notes": "Equipamentos verificados e projeto finalizado"}]',
 'Pedro Lima', 'pedro.lima@empresa.com', 'Marketing', 6, '{}', 'Evento realizado no centro de convenções'),

-- Projeto arquivado
('Piloto Programa TV', 'Piloto para programa de televisão', '2023-10-01', '2023-11-30', 'archived', 'verified',
 '[{"step": "pending_separation", "timestamp": "2023-10-01T08:00:00Z", "notes": "Projeto iniciado"}, {"step": "separated", "timestamp": "2023-10-02T14:00:00Z", "notes": "Equipamentos separados"}, {"step": "in_use", "timestamp": "2023-10-05T09:00:00Z", "notes": "Gravações do piloto"}, {"step": "pending_verification", "timestamp": "2023-11-28T17:00:00Z", "notes": "Gravações finalizadas"}, {"step": "verified", "timestamp": "2023-11-30T11:00:00Z", "notes": "Projeto finalizado - piloto não aprovado pela emissora"}]',
 'Sofia Ferreira', 'sofia.ferreira@empresa.com', 'Produção', 8, '{}', 'Projeto cancelado - piloto não aprovado');

-- Inserir empréstimos de exemplo para demonstrar diferentes status
INSERT INTO public.loans (equipment_id, equipment_name, borrower_name, borrower_email, borrower_phone, department, project, loan_date, expected_return_date, actual_return_date, status, notes, return_condition, return_notes) VALUES
-- Empréstimos ativos
((SELECT id FROM public.equipments WHERE name = 'Canon EOS R5' LIMIT 1), 'Canon EOS R5', 'Maria Silva', 'maria.silva@empresa.com', '(11) 99999-1234', 'Produção', 'Documentário Amazônia', '2024-01-23', '2024-03-30', NULL, 'active', 'Câmera principal para documentário', NULL, NULL),

((SELECT id FROM public.equipments WHERE name = 'Rode VideoMic Pro Plus' LIMIT 1), 'Rode VideoMic Pro Plus', 'Ana Costa', 'ana.costa@empresa.com', '(11) 99999-5678', 'Produção', 'Série Web Juventude', '2024-01-16', '2024-04-15', NULL, 'active', 'Microfone para gravações de estúdio', NULL, NULL),

((SELECT id FROM public.equipments WHERE name = 'Godox SL-60W' LIMIT 1), 'Godox SL-60W', 'Ana Costa', 'ana.costa@empresa.com', '(11) 99999-5678', 'Produção', 'Série Web Juventude', '2024-01-16', '2024-04-15', NULL, 'active', 'Iluminação para set', NULL, NULL),

-- Empréstimos em atraso (expected_return_date no passado)
((SELECT id FROM public.equipments WHERE name = 'Sony A7 III' LIMIT 1), 'Sony A7 III', 'João Santos', 'joao.santos@empresa.com', '(11) 99999-9012', 'Marketing', 'Campanha Publicitária Tech', '2024-01-25', '2024-02-28', NULL, 'overdue', 'Câmera para shooting da campanha - ATRASADO', NULL, NULL),

((SELECT id FROM public.equipments WHERE name = 'Zoom H6' LIMIT 1), 'Zoom H6', 'Carlos Oliveira', 'carlos.oliveira@empresa.com', '(11) 99999-3456', 'RH', 'Treinamento Corporativo', '2024-01-10', '2024-02-20', NULL, 'overdue', 'Gravador para áudio dos vídeos - ATRASADO', NULL, NULL),

-- Empréstimos retornados (histórico)
((SELECT id FROM public.equipments WHERE name = 'Canon RF 24-70mm f/2.8L' LIMIT 1), 'Canon RF 24-70mm f/2.8L', 'Pedro Lima', 'pedro.lima@empresa.com', '(11) 99999-7890', 'Marketing', 'Evento Lançamento Produto', '2023-12-03', '2023-12-15', '2023-12-06', 'returned', 'Lente para cobertura do evento', 'excellent', 'Equipamento retornado em perfeitas condições'),

((SELECT id FROM public.equipments WHERE name = 'Shure SM7B' LIMIT 1), 'Shure SM7B', 'Sofia Ferreira', 'sofia.ferreira@empresa.com', '(11) 99999-2468', 'Produção', 'Piloto Programa TV', '2023-10-06', '2023-11-30', '2023-11-28', 'returned', 'Microfone para gravações do piloto', 'good', 'Pequeno desgaste no cabo, mas funcionando perfeitamente'),

((SELECT id FROM public.equipments WHERE name = 'Manfrotto 055CXPRO3' LIMIT 1), 'Manfrotto 055CXPRO3', 'Pedro Lima', 'pedro.lima@empresa.com', '(11) 99999-7890', 'Marketing', 'Evento Lançamento Produto', '2023-12-03', '2023-12-15', '2023-12-06', 'returned', 'Tripé para estabilização das câmeras', 'fair', 'Algumas marcas de uso, mas totalmente funcional'),

((SELECT id FROM public.equipments WHERE name = 'Aputure AL-MX' LIMIT 1), 'Aputure AL-MX', 'Sofia Ferreira', 'sofia.ferreira@empresa.com', '(11) 99999-2468', 'Produção', 'Piloto Programa TV', '2023-10-06', '2023-11-30', '2023-11-28', 'returned', 'LED compacto para iluminação auxiliar', 'excellent', 'Retornado em estado impecável');