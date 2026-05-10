import { Mail, Phone, Building2, Instagram, Globe, type LucideIcon } from 'lucide-react';
import { CONTACT_TYPES, type Contact } from '../../types/crm.types';

interface ContactCardProps {
  contact: Contact;
}

const Field = ({ Icon, value }: { Icon: LucideIcon; value: string }) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      fontSize: 12,
      color: 'hsl(var(--ds-fg-3))',
    }}
  >
    <Icon size={12} strokeWidth={1.5} />
    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
  </div>
);

export function ContactCard({ contact }: ContactCardProps) {
  const typeLabel = CONTACT_TYPES.find((t) => t.value === contact.contact_type)?.label ?? contact.contact_type;

  return (
    <div
      style={{
        border: '1px solid hsl(var(--ds-line-1))',
        background: 'hsl(var(--ds-surface))',
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <h3
            style={{
              fontFamily: '"HN Display", sans-serif',
              fontSize: 16,
              fontWeight: 600,
              color: 'hsl(var(--ds-fg-1))',
              lineHeight: 1.25,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {contact.name}
          </h3>
          {contact.position && (
            <p style={{ fontSize: 12, color: 'hsl(var(--ds-fg-3))', marginTop: 2 }}>{contact.position}</p>
          )}
        </div>
        <span className="pill muted">{typeLabel}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        {contact.email && <Field Icon={Mail} value={contact.email} />}
        {contact.phone && <Field Icon={Phone} value={contact.phone} />}
        {contact.company_name && <Field Icon={Building2} value={contact.company_name} />}
        {contact.instagram && <Field Icon={Instagram} value={contact.instagram} />}
        {contact.company_website && <Field Icon={Globe} value={contact.company_website} />}
      </div>

      {contact.notes && (
        <p
          style={{
            fontSize: 12,
            color: 'hsl(var(--ds-fg-3))',
            paddingTop: 12,
            borderTop: '1px solid hsl(var(--ds-line-2))',
            lineHeight: 1.5,
          }}
        >
          {contact.notes}
        </p>
      )}
    </div>
  );
}
