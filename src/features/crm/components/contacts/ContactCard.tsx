import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Building2, Instagram, Globe } from 'lucide-react';
import { CONTACT_TYPES, type Contact } from '../../types/crm.types';

interface ContactCardProps {
  contact: Contact;
}

export function ContactCard({ contact }: ContactCardProps) {
  const typeLabel = CONTACT_TYPES.find(t => t.value === contact.contact_type)?.label ?? contact.contact_type;

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold">{contact.name}</h3>
            {contact.position && <p className="text-sm text-muted-foreground">{contact.position}</p>}
          </div>
          <Badge variant="secondary">{typeLabel}</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          {contact.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-3.5 w-3.5" /> {contact.email}
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3.5 w-3.5" /> {contact.phone}
            </div>
          )}
          {contact.company_name && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" /> {contact.company_name}
            </div>
          )}
          {contact.instagram && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Instagram className="h-3.5 w-3.5" /> {contact.instagram}
            </div>
          )}
          {contact.company_website && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="h-3.5 w-3.5" /> {contact.company_website}
            </div>
          )}
        </div>

        {contact.notes && (
          <p className="text-sm text-muted-foreground border-t pt-3">{contact.notes}</p>
        )}
      </CardContent>
    </Card>
  );
}
