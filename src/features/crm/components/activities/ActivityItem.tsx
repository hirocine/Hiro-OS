import { Checkbox } from '@/components/ui/checkbox';
import { Phone, Mail, Calendar, StickyNote, MessageCircle, Bell, FileText, MapPin, MoreHorizontal, type LucideIcon } from 'lucide-react';
import type { Activity } from '../../types/crm.types';
import { useActivityMutations } from '../../hooks/useActivities';

const iconMap: Record<string, LucideIcon> = {
  nota: StickyNote,
  ligacao: Phone,
  whatsapp: MessageCircle,
  email: Mail,
  reuniao: Calendar,
  follow_up: Bell,
  proposta: FileText,
  visita: MapPin,
  outro: MoreHorizontal,
};

const typeLabels: Record<string, string> = {
  nota: 'Nota',
  ligacao: 'Ligação',
  whatsapp: 'WhatsApp',
  email: 'E-mail',
  reuniao: 'Reunião',
  follow_up: 'Follow-up',
  proposta: 'Proposta',
  visita: 'Visita',
  outro: 'Outro',
};

interface ActivityItemProps {
  activity: Activity;
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const Icon = iconMap[activity.activity_type] ?? StickyNote;
  const { toggleComplete } = useActivityMutations();
  const isCompleted = activity.is_completed ?? false;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '12px 0',
        borderBottom: '1px solid hsl(var(--ds-line-2))',
      }}
    >
      <div style={{ paddingTop: 2 }}>
        <Checkbox
          checked={isCompleted}
          onCheckedChange={(checked) => toggleComplete.mutate({ id: activity.id, isCompleted: !!checked })}
        />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon size={12} strokeWidth={1.5} />
          <span
            style={{
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontWeight: 500,
              color: 'hsl(var(--ds-fg-3))',
            }}
          >
            {typeLabels[activity.activity_type] ?? activity.activity_type}
          </span>
          {activity.scheduled_at && (
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 11,
                color: 'hsl(var(--ds-fg-4))',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {new Date(activity.scheduled_at).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
        <p
          style={{
            fontSize: 13,
            color: isCompleted ? 'hsl(var(--ds-fg-3))' : 'hsl(var(--ds-fg-1))',
            textDecoration: isCompleted ? 'line-through' : undefined,
            marginTop: 4,
          }}
        >
          {activity.title}
        </p>
        {activity.description && (
          <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', marginTop: 4, lineHeight: 1.4 }}>
            {activity.description}
          </p>
        )}
      </div>
    </div>
  );
}
