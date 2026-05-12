import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { ActivitiesList } from '@/features/crm/components/activities/ActivitiesList';
import { DealForm } from '@/features/crm/components/pipeline/DealForm';
import { useDeals } from '@/features/crm/hooks/useDeals';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Plus, Handshake, Mail, Phone, Building2, Instagram, Globe, MessageCircle, FileText } from 'lucide-react';
import { formatBRL, CONTACT_TYPES } from '@/features/crm/types/crm.types';
import { useState } from 'react';
import type { Contact } from '@/features/crm/types/crm.types';
import { StatusPill } from '@/ds/components/StatusPill';
import { Money } from '@/ds/components/Money';

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function getAvatarHue(name: string) {
  let hash = 0;
  for (const ch of name) hash = ch.charCodeAt(0) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
}

export default function CRMContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dealFormOpen, setDealFormOpen] = useState(false);

  const { data: contact, isLoading } = useQuery<Contact>({
    queryKey: ['crm-contacts', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('crm_contacts').select('*').eq('id', id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: deals, isLoading: dealsLoading } = useDeals(id);

  if (isLoading) return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </div>
  );
  if (!contact) return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner" style={{ textAlign: 'center', padding: '64px 0', color: 'hsl(var(--ds-fg-3))' }}>
        Contato não encontrado.
      </div>
    </div>
  );

  const typeLabel = CONTACT_TYPES.find(t => t.value === contact.contact_type)?.label ?? contact.contact_type;
  const phone = contact.phone?.replace(/\D/g, '');
  const hue = getAvatarHue(contact.name);

  const linkStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    color: 'hsl(var(--ds-fg-3))',
    transition: 'color 150ms',
    textDecoration: 'none',
  };

  return (
    <div className="ds-shell ds-page">
      <div className="ds-page-inner">
        <BreadcrumbNav items={[{ label: 'CRM', href: '/crm' }, { label: contact.name }]} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Summary */}
        <div style={{ border: '1px solid hsl(var(--ds-line-1))', background: 'hsl(var(--ds-surface))', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
            <div
              style={{
                background: `hsl(${hue}, 60%, 50%)`,
                width: 64,
                height: 64,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 20,
                fontWeight: 600,
                flexShrink: 0,
                fontFamily: '"HN Display", sans-serif',
              }}
            >
              {getInitials(contact.name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 600, color: 'hsl(var(--ds-fg-1))', fontFamily: '"HN Display", sans-serif' }}>
                    {contact.name}
                  </h2>
                  <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))', marginTop: 2 }}>
                    {[contact.position, contact.company_name].filter(Boolean).join(' · ') || '—'}
                  </p>
                </div>
                <span
                  className="pill muted"
                  style={{
                    color: 'hsl(var(--ds-fg-2))',
                  }}
                >
                  {typeLabel}
                </span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 16, fontSize: 13 }}>
                {contact.email && (
                  <a href={`mailto:${contact.email}`} style={linkStyle}>
                    <Mail size={14} strokeWidth={1.5} /> {contact.email}
                  </a>
                )}
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} style={linkStyle}>
                    <Phone size={14} strokeWidth={1.5} /> <span style={{ fontVariantNumeric: 'tabular-nums' }}>{contact.phone}</span>
                  </a>
                )}
                {phone && (
                  <a href={`https://wa.me/55${phone}`} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                    <MessageCircle size={14} strokeWidth={1.5} /> WhatsApp
                  </a>
                )}
                {contact.instagram && (
                  <a href={`https://instagram.com/${contact.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                    <Instagram size={14} strokeWidth={1.5} /> {contact.instagram}
                  </a>
                )}
                {contact.company_website && (
                  <a href={contact.company_website.startsWith('http') ? contact.company_website : `https://${contact.company_website}`} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                    <Globe size={14} strokeWidth={1.5} /> Website
                  </a>
                )}
                {contact.company_name && (
                  <span style={{ ...linkStyle, cursor: 'default' }}>
                    <Building2 size={14} strokeWidth={1.5} /> {contact.company_name}
                  </span>
                )}
              </div>

              {contact.notes && (
                <p style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))', marginTop: 12, borderTop: '1px solid hsl(var(--ds-line-1))', paddingTop: 12 }}>
                  {contact.notes}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Deals section */}
        <div style={{ border: '1px solid hsl(var(--ds-line-1))', background: 'hsl(var(--ds-surface))' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid hsl(var(--ds-line-1))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Handshake size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
              <span style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 500, color: 'hsl(var(--ds-fg-2))' }}>
                Deals Vinculados
              </span>
            </div>
            <button type="button" className="btn" onClick={() => setDealFormOpen(true)}>
              <Plus size={13} strokeWidth={1.5} />
              <span>Novo Deal</span>
            </button>
          </div>
          <div style={{ padding: 18 }}>
            {dealsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : !deals?.length ? (
              <EmptyState compact icon={Handshake} title="Nenhum deal" description="Crie o primeiro deal para este contato." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {deals.map((d, idx) => (
                  <div
                    key={d.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 8px',
                      borderBottom: idx === deals.length - 1 ? 'none' : '1px solid hsl(var(--ds-line-1))',
                      cursor: 'pointer',
                      margin: '0 -8px',
                      transition: 'background 150ms',
                    }}
                    onClick={() => navigate(`/crm/deals/${d.id}`)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.3)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>{d.title}</p>
                        {d.proposal_id && (
                          <StatusPill
                            label="Com proposta"
                            tone="info"
                            icon={<FileText size={10} strokeWidth={1.5} />}
                          />
                        )}
                      </div>
                      <p style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))' }}>{d.stage_name}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: 'hsl(var(--ds-fg-1))' }}>
                        <Money value={d.estimated_value} />
                      </p>
                      <span
                        className="pill muted"
                        style={{ fontSize: 10, borderColor: d.stage_color }}
                      >
                        {d.stage_name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Activities */}
        <div style={{ border: '1px solid hsl(var(--ds-line-1))', background: 'hsl(var(--ds-surface))', padding: 18 }}>
          <ActivitiesList contactId={id} />
        </div>
      </div>

        <DealForm open={dealFormOpen} onOpenChange={setDealFormOpen} defaultContactId={id} />
      </div>
    </div>
  );
}
