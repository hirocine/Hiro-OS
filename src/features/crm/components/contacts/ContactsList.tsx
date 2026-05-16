import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContacts, useContactMutations } from '../../hooks/useContacts';
import { useTeamProfiles } from '../../hooks/useTeamProfiles';
import { ContactForm } from './ContactForm';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Search, Users, Trash2, Pencil } from 'lucide-react';
import { EmptyState } from '@/ds/components/EmptyState';
import { CONTACT_TYPES, LEAD_SOURCES, type Contact } from '../../types/crm.types';
import { useDebounce } from '@/hooks/useDebounce';

const CONTACT_COLS = '1.2fr 1fr 110px 1.2fr 130px 64px';

export function ContactsList() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 300);
  const navigate = useNavigate();

  const { data: contacts, isLoading } = useContacts({
    search: debouncedSearch,
    contactType: typeFilter || undefined,
    leadSource: sourceFilter || undefined,
    assignedTo: assigneeFilter || undefined,
  });
  const { deleteContact } = useContactMutations();
  const { data: profiles } = useTeamProfiles();

  const typeLabel = (type: string) => CONTACT_TYPES.find((t) => t.value === type)?.label ?? type;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth: 320 }}>
          <Search
            size={14}
            strokeWidth={1.5}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'hsl(var(--ds-fg-4))',
              pointerEvents: 'none',
            }}
          />
          <Input
            placeholder="Buscar contatos…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 34 }}
          />
        </div>
        <Select value={typeFilter || 'all'} onValueChange={(v) => setTypeFilter(v === 'all' ? '' : v)}>
          <SelectTrigger style={{ width: 140 }}><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {CONTACT_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sourceFilter || 'all'} onValueChange={(v) => setSourceFilter(v === 'all' ? '' : v)}>
          <SelectTrigger style={{ width: 140 }}><SelectValue placeholder="Origem" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as origens</SelectItem>
            {LEAD_SOURCES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={assigneeFilter || 'all'} onValueChange={(v) => setAssigneeFilter(v === 'all' ? '' : v)}>
          <SelectTrigger style={{ width: 160 }}><SelectValue placeholder="Responsável" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {profiles?.map((p) => <SelectItem key={p.user_id} value={p.user_id}>{p.display_name}</SelectItem>)}
          </SelectContent>
        </Select>

        <button
          type="button"
          className="btn primary"
          style={{ marginLeft: 'auto' }}
          onClick={() => { setEditingContact(null); setFormOpen(true); }}
        >
          <Plus size={14} strokeWidth={1.5} />
          <span>Novo Contato</span>
        </button>
      </div>

      <div className="tbl" style={{ gridTemplateColumns: CONTACT_COLS, border: '1px solid hsl(var(--ds-line-1))' }}>
        <div className="tbl-head">
          <div>Nome</div>
          <div>Empresa</div>
          <div>Tipo</div>
          <div>E-mail</div>
          <div>Telefone</div>
          <div></div>
        </div>

        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={`sk-${i}`} className={'tbl-row' + (i === 4 ? ' last' : '')}>
              <div><span className="sk line lg" style={{ width: 140 }} /></div>
              <div><span className="sk line" style={{ width: 100 }} /></div>
              <div><span className="sk line" style={{ width: 60 }} /></div>
              <div><span className="sk line" style={{ width: 140 }} /></div>
              <div><span className="sk line" style={{ width: 90 }} /></div>
              <div></div>
            </div>
          ))
        ) : !contacts?.length ? (
          <div style={{ gridColumn: '1 / -1' }}>
            <EmptyState
              icon={Users}
              title="Nenhum contato encontrado"
              description="Adicione seu primeiro contato para começar."
              variant="bare"
              action={
                <button className="btn primary" onClick={() => { setEditingContact(null); setFormOpen(true); }} type="button">
                  <Plus size={14} strokeWidth={1.5} />
                  <span>Novo contato</span>
                </button>
              }
            />
          </div>
        ) : (
          contacts.map((c, idx) => {
            const isLast = idx === contacts.length - 1;
            return (
              <div
                key={c.id}
                className={'tbl-row' + (isLast ? ' last' : '')}
                onClick={() => navigate(`/crm/contatos/${c.id}`)}
              >
                <div>
                  <span className="t-title">{c.name}</span>
                </div>
                <div style={{ fontSize: 13, color: 'hsl(var(--ds-fg-2))' }}>{c.company_name || '—'}</div>
                <div>
                  <span className="pill muted">{typeLabel(c.contact_type)}</span>
                </div>
                <div style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.email || '—'}
                </div>
                <div style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))', fontVariantNumeric: 'tabular-nums' }}>
                  {c.phone || '—'}
                </div>
                <div style={{ justifyContent: 'flex-end', display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => { setEditingContact(c); setFormOpen(true); }}
                    style={{
                      width: 26, height: 26, display: 'grid', placeItems: 'center',
                      color: 'hsl(var(--ds-fg-3))', background: 'transparent', border: 0, cursor: 'pointer',
                    }}
                    aria-label="Editar"
                  >
                    <Pencil size={13} strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingContactId(c.id)}
                    style={{
                      width: 26, height: 26, display: 'grid', placeItems: 'center',
                      color: 'hsl(var(--ds-danger))', background: 'transparent', border: 0, cursor: 'pointer',
                    }}
                    aria-label="Excluir"
                  >
                    <Trash2 size={13} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ContactForm open={formOpen} onOpenChange={setFormOpen} contact={editingContact} />

      <AlertDialog open={!!deletingContactId} onOpenChange={(open) => { if (!open) setDeletingContactId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir contato</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este contato? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[hsl(0_84%_60%)] hover:bg-[hsl(0_84%_60%)]/90"
              onClick={() => {
                if (deletingContactId) deleteContact.mutate(deletingContactId);
                setDeletingContactId(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
