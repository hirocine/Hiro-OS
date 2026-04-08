import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { ActivitiesList } from '@/features/crm/components/activities/ActivitiesList';
import { DealForm } from '@/features/crm/components/pipeline/DealForm';
import { useDeals } from '@/features/crm/hooks/useDeals';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Plus, Handshake, Mail, Phone, Building2, Instagram, Globe, MessageCircle } from 'lucide-react';
import { formatBRL, CONTACT_TYPES } from '@/features/crm/types/crm.types';
import { useState } from 'react';
import type { Contact } from '@/features/crm/types/crm.types';

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function getAvatarColor(name: string) {
  const colors = [
    'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500',
    'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500',
  ];
  let hash = 0;
  for (const ch of name) hash = ch.charCodeAt(0) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
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
    <ResponsiveContainer maxWidth="7xl">
      <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-40 w-full" /></div>
    </ResponsiveContainer>
  );
  if (!contact) return <p>Contato não encontrado.</p>;

  const typeLabel = CONTACT_TYPES.find(t => t.value === contact.contact_type)?.label ?? contact.contact_type;
  const phone = contact.phone?.replace(/\D/g, '');

  return (
    <ResponsiveContainer maxWidth="7xl">
      <BreadcrumbNav items={[{ label: 'CRM', href: '/crm' }, { label: contact.name }]} />

      <div className="space-y-6">
        {/* Summary Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-5">
              <div className={`${getAvatarColor(contact.name)} h-16 w-16 rounded-full flex items-center justify-center text-white text-xl font-semibold flex-shrink-0`}>
                {getInitials(contact.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">{contact.name}</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {[contact.position, contact.company_name].filter(Boolean).join(' · ') || '—'}
                    </p>
                  </div>
                  <Badge variant="secondary">{typeLabel}</Badge>
                </div>

                <div className="flex flex-wrap gap-3 mt-4 text-sm">
                  {contact.email && (
                    <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                      <Mail className="h-3.5 w-3.5" /> {contact.email}
                    </a>
                  )}
                  {contact.phone && (
                    <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                      <Phone className="h-3.5 w-3.5" /> {contact.phone}
                    </a>
                  )}
                  {phone && (
                    <a href={`https://wa.me/55${phone}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                      <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                    </a>
                  )}
                  {contact.instagram && (
                    <a href={`https://instagram.com/${contact.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                      <Instagram className="h-3.5 w-3.5" /> {contact.instagram}
                    </a>
                  )}
                  {contact.company_website && (
                    <a href={contact.company_website.startsWith('http') ? contact.company_website : `https://${contact.company_website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                      <Globe className="h-3.5 w-3.5" /> Website
                    </a>
                  )}
                  {contact.company_name && (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5" /> {contact.company_name}
                    </span>
                  )}
                </div>

                {contact.notes && (
                  <p className="text-sm text-muted-foreground mt-3 border-t pt-3">{contact.notes}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deals section */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Handshake className="h-4 w-4" />
                Deals Vinculados
              </div>
              <Button size="sm" variant="outline" onClick={() => setDealFormOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Novo Deal
              </Button>
            </div>

            {dealsLoading ? (
              <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : !deals?.length ? (
              <EmptyState compact icon={Handshake} title="Nenhum deal" description="Crie o primeiro deal para este contato." />
            ) : (
              <div className="space-y-2">
                {deals.map(d => (
                  <div key={d.id} className="flex items-center justify-between py-2 border-b last:border-0 cursor-pointer hover:bg-muted/50 rounded px-2 -mx-2" onClick={() => navigate(`/crm/deals/${d.id}`)}>
                    <div>
                      <p className="text-sm font-medium">{d.title}</p>
                      <p className="text-xs text-muted-foreground">{d.stage_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatBRL(d.estimated_value)}</p>
                      <Badge variant="secondary" className="text-xs" style={{ borderColor: d.stage_color }}>{d.stage_name}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activities */}
        <Card>
          <CardContent className="p-5">
            <ActivitiesList contactId={id} />
          </CardContent>
        </Card>
      </div>

      <DealForm open={dealFormOpen} onOpenChange={setDealFormOpen} defaultContactId={id} />
    </ResponsiveContainer>
  );
}
