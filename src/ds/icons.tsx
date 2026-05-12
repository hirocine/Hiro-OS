import {
  Home,
  Inbox,
  ListChecks,
  Film,
  Folder,
  Package,
  Users,
  Building2,
  BarChart3,
  Radio,
  FileText,
  Key,
  HardDrive,
  Settings,
  Scroll,
  Receipt,
  TrendingUp,
  Search,
  Bell,
  Sun,
  Moon,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ArrowUp,
  Plus,
  Pencil,
  Cloud,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  Calendar,
  Instagram,
  Image as ImageIcon,
  FileBox,
  Lock,
  Filter,
  Download,
  type LucideProps,
} from "lucide-react";

const SIZE = 16;
const STROKE = 1.5;

const i = (Cmp: React.ComponentType<LucideProps>) => (
  <Cmp size={SIZE} strokeWidth={STROKE} />
);

/**
 * Hiro DS icon set — Lucide, 16px, stroke 1.5.
 * Names below match how the rest of the codebase already references them
 * (some are aliases that map two names to the same Lucide icon).
 */
export const I = {
  // Sections / nav items
  home:     i(Home),
  inbox:    i(Inbox),         // Caixa de Entrada
  task:     i(ListChecks),    // Tarefas — checklist semantics
  film:     i(Film),
  folder:   i(Folder),
  layers:   i(Folder),        // Projetos
  package:  i(Package),
  pkg:      i(Package),
  camera:   i(Package),       // Equipamentos (was Retiradas)
  fileBox:  i(FileBox),
  users:    i(Users),
  contact:  i(Users),         // CRM
  building: i(Building2),
  chart:    i(BarChart3),
  radio:    i(Radio),
  mega:     i(Radio),         // Marketing
  doc:      i(FileText),
  fileText: i(FileText),
  receipt:  i(FileText),      // Orçamentos / Propostas
  notas:    i(Receipt),       // Notas & recibos
  key:      i(Key),
  drive:    i(HardDrive),
  cog:      i(Settings),
  settings: i(Settings),
  scroll:   i(Scroll),
  trending: i(TrendingUp),
  calendar: i(Calendar),
  instagram:i(Instagram),
  image:    i(ImageIcon),
  lock:     i(Lock),

  // Topbar / chrome
  search:   i(Search),
  bell:     i(Bell),
  sun:      i(Sun),
  moon:     i(Moon),
  ext:      i(ExternalLink),
  chev:     i(ChevronRight),
  chevL:    i(ChevronLeft),
  chevR:    i(ChevronRight),
  arrR:     i(ArrowRight),
  arrUp:    i(ArrowUp),
  plus:     i(Plus),
  edit:     i(Pencil),
  cloud:    i(Cloud),
  sparkle:  i(Sparkles),
  collapse: i(PanelLeftClose),
  expand:   i(PanelLeftOpen),
  filter:   i(Filter),
  download: i(Download),
};
