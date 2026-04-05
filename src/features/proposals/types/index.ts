export interface Proposal {
  id: string;
  slug: string;
  client_name: string;
  project_name: string;
  project_number: string | null;
  client_responsible: string | null;
  client_logo: string | null;
  validity_date: string;
  sent_date: string | null;
  briefing: string | null;
  video_url: string | null;
  moodboard_images: string[];
  scope_pre_production: ScopeItem[];
  scope_production: ScopeItem[];
  scope_post_production: ScopeItem[];
  timeline: TimelineItem[];
  base_value: number;
  discount_pct: number;
  final_value: number;
  payment_terms: string;
  status: 'draft' | 'sent' | 'opened' | 'new_version' | 'approved' | 'expired';
  created_by: string | null;
  created_at: string;
  updated_at: string;
  objetivo: string | null;
  diagnostico_dores: DiagnosticoDor[];
  list_price: number | null;
  payment_options: PaymentOption[];
  testimonial_name: string | null;
  testimonial_role: string | null;
  testimonial_text: string | null;
  testimonial_image: string | null;
  entregaveis: any[];
  cases: CaseItem[];
  whatsapp_number: string | null;
  company_description: string | null;
  views_count: number;
  version: number;
  parent_id: string | null;
  is_latest_version: boolean;
}

export interface ScopeItem {
  item: string;
}

export interface TimelineItem {
  week: string;
  description: string;
}

export interface DiagnosticoDor {
  label: string;
  title: string;
  desc: string;
}

export interface PaymentOption {
  titulo: string;
  valor: string;
  descricao: string;
  destaque?: string;
  recomendado?: boolean;
}

export interface CaseItem {
  id?: string;
  tipo?: string;
  titulo?: string;
  descricao?: string;
  vimeoId?: string;
  vimeoHash?: string;
  destaque?: boolean;
}

export interface EntregavelItem {
  titulo: string;
  descricao: string;
  quantidade: string;
  icone: string;
}

export interface InclusoItem {
  nome: string;
  ativo: boolean;
  quantidade?: string;
  custom?: boolean;
}

export interface InclusoCategory {
  categoria: string;
  icone: string;
  subcategorias?: { nome: string; itens: InclusoItem[] }[];
  itens?: InclusoItem[];
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  text: string;
  image: string | null;
  created_by: string | null;
  created_at: string;
}

export interface PainPoint {
  id: string;
  label: string;
  title: string;
  description: string;
  category: string;
  created_by: string | null;
  created_at: string;
}

export interface ProposalCase {
  id: string;
  tipo: string;
  tags: string[];
  client_name: string;
  campaign_name: string;
  vimeo_id: string;
  vimeo_hash: string;
  destaque: boolean;
  created_by: string | null;
  created_at: string;
}

export const CASE_TAG_OPTIONS = [
  'Marketing Digital',
  'Eventos',
  'Criativos',
  'Fotografia',
  'Publicidade',
  'Motion',
  'VFX',
];

export interface ProposalFormData {
  client_name: string;
  project_name: string;
  client_responsible: string;
  client_logo: string;
  whatsapp_number: string;
  company_description: string;
  sent_date: Date;
  validity_date: Date | undefined;
  objetivo: string;
  diagnostico_dores: DiagnosticoDor[];
  selected_case_ids: string[];
  entregaveis: EntregavelItem[];
  incluso_categories: InclusoCategory[];
  base_value: number;
  discount_pct: number;
  list_price: number;
  payment_terms: string;
  payment_options?: PaymentOption[];
  testimonial_name: string;
  testimonial_role: string;
  testimonial_text: string;
  testimonial_image: string;
}

export const ICON_OPTIONS = [
  { value: '🎬', label: 'Cinema' },
  { value: '📱', label: 'Celular' },
  { value: '📷', label: 'Câmera' },
  { value: '📋', label: 'Checklist' },
  { value: '🎨', label: 'Arte' },
  { value: '🖼️', label: 'Imagem' },
  { value: '🎵', label: 'Música' },
  { value: '🖥️', label: 'Monitor' },
  { value: '🎙️', label: 'Microfone' },
  { value: '🎥', label: 'Filmadora' },
  { value: '✂️', label: 'Edição' },
  { value: '📐', label: 'Design' },
  { value: '🚀', label: 'Foguete' },
  { value: '⭐', label: 'Estrela' },
  { value: '💡', label: 'Ideia' },
  { value: '📦', label: 'Pacote' },
  { value: '🎯', label: 'Alvo' },
  { value: '📊', label: 'Gráfico' },
  { value: '🏆', label: 'Troféu' },
  { value: '🔥', label: 'Fogo' },
  { value: '⚡', label: 'Raio' },
  { value: '🎤', label: 'Karaokê' },
  { value: '📸', label: 'Flash' },
  { value: '🎞️', label: 'Película' },
];

export const DEFAULT_INCLUSO_CATEGORIES: InclusoCategory[] = [
  {
    categoria: 'Pré-produção',
    icone: 'ClipboardList',
    itens: [
      { nome: 'Roteiro', ativo: false },
      { nome: 'Storyboard', ativo: false },
      { nome: 'Cenário', ativo: false },
    ],
  },
  {
    categoria: 'Gravação',
    icone: 'Clapperboard',
    subcategorias: [
      {
        nome: 'Equipe',
        itens: [
          { nome: 'Diretor', ativo: false },
          { nome: 'Filmmaker', ativo: false },
          { nome: 'Fotógrafo', ativo: false },
          { nome: 'Making Of', ativo: false },
          { nome: 'Produtor', ativo: false },
          { nome: 'Operador de Som', ativo: false },
          { nome: 'Operador de TP', ativo: false },
          { nome: 'Make e Cabeleireiro', ativo: false },
          { nome: 'Figurino', ativo: false },
        ],
      },
      {
        nome: 'Equipamentos',
        itens: [
          { nome: 'Câmeras', ativo: false, quantidade: '' },
          { nome: 'Iluminação', ativo: false },
          { nome: 'Áudio', ativo: false },
          { nome: 'Drone', ativo: false },
          { nome: 'Teleprompter', ativo: false },
        ],
      },
      {
        nome: 'Produção',
        itens: [
          { nome: 'Estúdio', ativo: false },
          { nome: 'Catering', ativo: false },
          { nome: 'Gerador', ativo: false },
        ],
      },
    ],
  },
  {
    categoria: 'Pós-produção',
    icone: 'Palette',
    itens: [
      { nome: 'Edição', ativo: false },
      { nome: 'Motion Graphics', ativo: false },
      { nome: 'VFX', ativo: false },
      { nome: 'Color Grading', ativo: false },
      { nome: 'Trilha de Banco', ativo: false },
      { nome: 'Banco de Imagens', ativo: false },
      { nome: 'Geração de Cenas com AI', ativo: false },
    ],
  },
];

const DIAGNOSTICO_TEMPLATE = `O objetivo deste projeto é desenvolver [tipo de conteúdo — ex: uma campanha audiovisual completa / um vídeo institucional / uma série de conteúdo digital] para Nome da Empresa Cliente, com foco em [objetivo principal — ex: fortalecer o posicionamento da marca no digital / lançar um novo produto / gerar conteúdo para a campanha de Dia das Mães 2026].

Durante nossa conversa, identificamos os pontos abaixo como prioridades centrais para que o resultado final atenda às expectativas da Nome da Empresa Cliente.`;

export const DOR_EMOJI_OPTIONS = [
  { value: '⭐', label: 'Estrela' },
  { value: '🎯', label: 'Alvo' },
  { value: '⚡', label: 'Raio' },
  { value: '🔥', label: 'Fogo' },
  { value: '💡', label: 'Ideia' },
  { value: '🚀', label: 'Foguete' },
  { value: '⏰', label: 'Relógio' },
  { value: '🛡️', label: 'Escudo' },
  { value: '👁️', label: 'Olho' },
  { value: '❤️', label: 'Coração' },
  { value: '📊', label: 'Gráfico' },
  { value: '🎬', label: 'Cinema' },
  { value: '📱', label: 'Celular' },
  { value: '🏆', label: 'Troféu' },
  { value: '⚠️', label: 'Alerta' },
  { value: '🚫', label: 'Proibido' },
  { value: '📐', label: 'Régua' },
  { value: '🔍', label: 'Lupa' },
  { value: '⚖', label: 'Balança' },
  { value: '📅', label: 'Calendário' },
  { value: '🔄', label: 'Ciclo' },
  { value: '📦', label: 'Pacote' },
  { value: '🚨', label: 'Sirene' },
  { value: '😤', label: 'Frustração' },
  { value: '🤷', label: 'Dúvida' },
  { value: '💸', label: 'Dinheiro' },
  { value: '🧩', label: 'Puzzle' },
  { value: '📉', label: 'Queda' },
  { value: '📵', label: 'Bloqueio' },
  { value: '🎨', label: 'Arte' },
  { value: '🧠', label: 'Cérebro' },
  { value: '⚔️', label: 'Espadas' },
  { value: '🧭', label: 'Bússola' },
  { value: '😴', label: 'Sono' },
  { value: '📈', label: 'Crescimento' },
  { value: '🧮', label: 'Ábaco' },
  { value: '🏷', label: 'Etiqueta' },
  { value: '💰', label: 'Saco' },
  { value: '🏛', label: 'Governo' },
  { value: '📋', label: 'Clipboard' },
  { value: '🔮', label: 'Bola' },
  { value: '🏢', label: 'Prédio' },
  { value: '🏗', label: 'Construção' },
  { value: '🔐', label: 'Cadeado' },
  { value: '📆', label: 'Agenda' },
  { value: '🤝', label: 'Aperto' },
  { value: '🌐', label: 'Globo' },
];

export const defaultFormData: ProposalFormData = {
  client_name: '',
  project_name: '',
  client_responsible: '',
  client_logo: '',
  whatsapp_number: '',
  company_description: 'Produtora audiovisual especializada em criar narrativas visuais que conectam marcas ao seu público.',
  sent_date: new Date(),
  validity_date: undefined,
  objetivo: DIAGNOSTICO_TEMPLATE,
  diagnostico_dores: [],
  selected_case_ids: [],
  entregaveis: [],
  incluso_categories: JSON.parse(JSON.stringify(DEFAULT_INCLUSO_CATEGORIES)),
  list_price: 0,
  base_value: 0,
  discount_pct: 0,
  payment_terms: '50% no fechamento do projeto mediante contrato e os outros 50% na entrega do material final',
  testimonial_name: 'Thiago Nigro',
  testimonial_role: 'CEO, Grupo Primo',
  testimonial_text: 'A Hiro elevou a qualidade do nosso conteúdo a outro patamar. O profissionalismo e a atenção aos detalhes fizeram toda a diferença no resultado final.',
  testimonial_image: '',
};
