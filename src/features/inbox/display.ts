/**
 * ════════════════════════════════════════════════════════════════
 * INBOX — display configs (ícone, cor, labels)
 * ════════════════════════════════════════════════════════════════
 *
 * Centralizado aqui pra Inbox.tsx (página completa) e NotificationPanel
 * (popover do topbar) compartilharem a mesma fonte. Mantém visual
 * consistente entre o sino e a página.
 */

import {
  ListChecks,
  Film,
  Folder,
  Package,
  Briefcase,
  FileText,
  Radio,
  Key,
  Bell,
  Gift,
  type LucideIcon,
} from 'lucide-react';
import type { InboxType, InboxReason } from './types';

export interface InboxTypeDisplay {
  label: string;
  Icon: LucideIcon;
  color: string;
}

export const TYPE_CONFIG: Record<InboxType, InboxTypeDisplay> = {
  task:      { label: 'Tarefa',      Icon: ListChecks, color: 'hsl(var(--ds-accent))' },
  project:   { label: 'Projeto',     Icon: Folder,     color: 'hsl(var(--ds-info))' },
  loan:      { label: 'Retirada',    Icon: Package,    color: 'hsl(var(--ds-warning))' },
  pp:        { label: 'Esteira',     Icon: Film,       color: 'hsl(var(--ds-accent))' },
  deal:      { label: 'CRM',         Icon: Briefcase,  color: 'hsl(var(--ds-success))' },
  proposal:  { label: 'Orçamento',   Icon: FileText,   color: 'hsl(var(--ds-success))' },
  marketing: { label: 'Marketing',   Icon: Radio,      color: 'hsl(var(--ds-info))' },
  access:    { label: 'Plataforma',  Icon: Key,        color: 'hsl(var(--ds-fg-3))' },
  event:     { label: 'RH',          Icon: Gift,       color: 'hsl(var(--ds-info))' },
  system:    { label: 'Sistema',     Icon: Bell,       color: 'hsl(var(--ds-fg-3))' },
};

export interface InboxReasonDisplay {
  label: string;
  tone: 'muted' | 'info' | 'success' | 'warning' | 'danger' | 'accent';
}

export const REASON_LABEL: Record<InboxReason, InboxReasonDisplay> = {
  assigned:         { label: 'Atribuída',     tone: 'accent' },
  mentioned:        { label: 'Mencionado',    tone: 'info' },
  status_change:    { label: 'Status mudou',  tone: 'info' },
  due_soon:         { label: 'Vencendo',      tone: 'warning' },
  overdue:          { label: 'Atrasada',      tone: 'danger' },
  completed:        { label: 'Concluída',     tone: 'success' },
  approved:         { label: 'Aprovada',      tone: 'success' },
  rejected:         { label: 'Rejeitada',     tone: 'danger' },
  viewed:           { label: 'Visualizada',   tone: 'info' },
  commented:        { label: 'Comentário',    tone: 'muted' },
  new_version:      { label: 'Nova versão',   tone: 'info' },
  birthday:         { label: 'Aniversário',   tone: 'accent' },
  work_anniversary: { label: 'Anos de Hiro',  tone: 'accent' },
};
