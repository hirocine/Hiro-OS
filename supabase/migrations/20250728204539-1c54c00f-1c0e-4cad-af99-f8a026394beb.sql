-- Inserir equipamentos de exemplo para demonstrar a funcionalidade
INSERT INTO public.equipments (name, brand, model, category, status, item_type, serial_number, description, patrimony_number, store, invoice, value, depreciated_value, purchase_date, receive_date) VALUES
-- Câmeras principais
('Canon EOS R5', 'Canon', 'EOS R5', 'camera', 'available', 'main', 'R5001234', 'Câmera mirrorless profissional 45MP', 'CAM001', 'Amazon', 'INV001', 15000.00, 13500.00, '2023-01-15', '2023-01-20'),
('Sony A7 III', 'Sony', 'A7 III', 'camera', 'available', 'main', 'A7III001', 'Câmera full-frame mirrorless', 'CAM002', 'B&H Photo', 'INV002', 8500.00, 7650.00, '2023-02-10', '2023-02-15'),
('Canon EOS 5D Mark IV', 'Canon', '5D Mark IV', 'camera', 'maintenance', 'main', '5D4001', 'Câmera DSLR profissional', 'CAM003', 'Adorama', 'INV003', 12000.00, 9600.00, '2022-06-01', '2022-06-05'),

-- Lentes como acessórios
('Canon RF 24-70mm f/2.8L', 'Canon', 'RF 24-70mm f/2.8L', 'camera', 'available', 'accessory', 'RF2470001', 'Lente zoom profissional para Canon RF', 'LENS001', 'Amazon', 'INV004', 4500.00, 4050.00, '2023-01-15', '2023-01-20'),
('Sony FE 85mm f/1.4', 'Sony', 'FE 85mm f/1.4', 'camera', 'available', 'accessory', 'FE85001', 'Lente prime retrato para Sony E-mount', 'LENS002', 'B&H Photo', 'INV005', 2800.00, 2520.00, '2023-02-10', '2023-02-15'),

-- Equipamentos de áudio
('Rode VideoMic Pro Plus', 'Rode', 'VideoMic Pro Plus', 'audio', 'available', 'main', 'RVM001', 'Microfone direcional para câmeras', 'MIC001', 'Sweetwater', 'INV006', 850.00, 765.00, '2023-03-01', '2023-03-05'),
('Shure SM7B', 'Shure', 'SM7B', 'audio', 'available', 'main', 'SM7B001', 'Microfone dinâmico profissional', 'MIC002', 'Guitar Center', 'INV007', 1200.00, 1080.00, '2023-03-15', '2023-03-20'),
('Zoom H6', 'Zoom', 'H6', 'audio', 'available', 'main', 'ZH6001', 'Gravador digital portátil 6 canais', 'REC001', 'Sweetwater', 'INV008', 950.00, 855.00, '2023-04-01', '2023-04-05'),

-- Iluminação
('Godox SL-60W', 'Godox', 'SL-60W', 'lighting', 'available', 'main', 'GSL60001', 'LED contínuo 60W para vídeo', 'LED001', 'Adorama', 'INV009', 350.00, 315.00, '2023-05-01', '2023-05-05'),
('Aputure AL-MX', 'Aputure', 'AL-MX', 'lighting', 'available', 'main', 'AMX001', 'LED pocket compacto RGB', 'LED002', 'B&H Photo', 'INV010', 89.00, 80.10, '2023-05-15', '2023-05-20'),

-- Acessórios gerais
('Manfrotto 055CXPRO3', 'Manfrotto', '055CXPRO3', 'accessories', 'available', 'accessory', 'M055001', 'Tripé de fibra de carbono profissional', 'TRIP001', 'Amazon', 'INV011', 450.00, 405.00, '2023-06-01', '2023-06-05'),
('SanDisk Extreme Pro 128GB', 'SanDisk', 'Extreme Pro 128GB', 'accessories', 'available', 'accessory', 'SDXC001', 'Cartão de memória SDXC UHS-I', 'MEM001', 'Best Buy', 'INV012', 89.99, 80.99, '2023-06-15', '2023-06-20');