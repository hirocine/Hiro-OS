import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ChatSidebar } from '@/features/chat/components/ChatSidebar';
import { ChatConversation } from '@/features/chat/components/ChatConversation';
import { useConversations, useCreateChannel, useOpenDM } from '@/features/chat/hooks/useConversations';
import { useTeamDirectory } from '@/features/chat/hooks/useTeamDirectory';
import { useAuthContext } from '@/contexts/AuthContext';
import { Search } from 'lucide-react';
import { toast } from 'sonner';

function NewChannelDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const { user } = useAuthContext();
  const { data: team = [] } = useTeamDirectory();
  const createChannel = useCreateChannel();

  useEffect(() => {
    if (!open) { setName(''); setDescription(''); setSelected(new Set()); setSearch(''); }
  }, [open]);

  const others = useMemo(
    () => team.filter((t) => t.user_id !== user?.id && (!search || (t.display_name ?? '').toLowerCase().includes(search.toLowerCase()))),
    [team, user?.id, search],
  );

  const submit = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      const conv = await createChannel({ name: name.trim(), description, memberUserIds: Array.from(selected) });
      toast.success('Canal criado');
      onCreated(conv.id);
      onClose();
    } catch (e) {
      toast.error('Falha ao criar canal: ' + (e instanceof Error ? e.message : 'erro'));
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="ds-shell sm:max-w-md">
        <DialogHeader><DialogTitle>Novo canal</DialogTitle></DialogHeader>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', fontWeight: 500 }}>Nome do canal</label>
            <input
              value={name} onChange={(e) => setName(e.target.value)} placeholder="ex: fort-videos-site" autoFocus
              style={{ width: '100%', marginTop: 4, padding: '6px 8px', fontSize: 13, background: 'hsl(var(--ds-bg))', border: '1px solid hsl(var(--ds-line-1))', color: 'hsl(var(--ds-fg-1))', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', fontWeight: 500 }}>Descrição (opcional)</label>
            <input
              value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Pra que serve este canal?"
              style={{ width: '100%', marginTop: 4, padding: '6px 8px', fontSize: 13, background: 'hsl(var(--ds-bg))', border: '1px solid hsl(var(--ds-line-1))', color: 'hsl(var(--ds-fg-1))', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', fontWeight: 500 }}>Adicionar membros ({selected.size} selecionados)</label>
            <input
              value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..."
              style={{ width: '100%', marginTop: 4, padding: '6px 8px', fontSize: 12, background: 'hsl(var(--ds-bg))', border: '1px solid hsl(var(--ds-line-1))', color: 'hsl(var(--ds-fg-1))', outline: 'none' }}
            />
            <div style={{ marginTop: 6, maxHeight: 220, overflowY: 'auto', border: '1px solid hsl(var(--ds-line-1))' }}>
              {others.map((u) => {
                const checked = selected.has(u.user_id);
                return (
                  <label key={u.user_id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', fontSize: 13, cursor: 'pointer', borderBottom: '1px solid hsl(var(--ds-line-1))' }}>
                    <input type="checkbox" checked={checked} onChange={(e) => {
                      const next = new Set(selected);
                      if (e.target.checked) next.add(u.user_id); else next.delete(u.user_id);
                      setSelected(next);
                    }} />
                    <span>{u.display_name ?? 'Sem nome'}</span>
                    {u.position && <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))' }}>· {u.position}</span>}
                  </label>
                );
              })}
            </div>
          </div>
        </div>
        <DialogFooter>
          <button type="button" className="btn" onClick={onClose} disabled={busy}>Cancelar</button>
          <button type="button" className="btn primary" onClick={submit} disabled={!name.trim() || busy}>{busy ? 'Criando...' : 'Criar canal'}</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewDMDialog({ open, onClose, onOpened }: { open: boolean; onClose: () => void; onOpened: (id: string) => void }) {
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const { user } = useAuthContext();
  const { data: team = [] } = useTeamDirectory();
  const openDM = useOpenDM();

  useEffect(() => { if (!open) setSearch(''); }, [open]);

  const others = useMemo(
    () => team.filter((t) => t.user_id !== user?.id && (!search || (t.display_name ?? '').toLowerCase().includes(search.toLowerCase()))),
    [team, user?.id, search],
  );

  const pick = async (uid: string) => {
    if (busy) return;
    setBusy(true);
    try {
      const id = await openDM(uid);
      onOpened(id);
      onClose();
    } catch (e) {
      toast.error('Falha ao abrir DM: ' + (e instanceof Error ? e.message : 'erro'));
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="ds-shell sm:max-w-md">
        <DialogHeader><DialogTitle>Nova conversa direta</DialogTitle></DialogHeader>
        <div style={{ position: 'relative' }}>
          <Search size={13} strokeWidth={1.5} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--ds-fg-3))' }} />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar pessoa..." autoFocus
            style={{ width: '100%', padding: '6px 8px 6px 26px', fontSize: 13, background: 'hsl(var(--ds-bg))', border: '1px solid hsl(var(--ds-line-1))', color: 'hsl(var(--ds-fg-1))', outline: 'none' }}
          />
        </div>
        <div style={{ marginTop: 8, maxHeight: 320, overflowY: 'auto', border: '1px solid hsl(var(--ds-line-1))' }}>
          {others.map((u) => (
            <button key={u.user_id} type="button" disabled={busy} onClick={() => pick(u.user_id)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', width: '100%', background: 'transparent', border: 0, borderBottom: '1px solid hsl(var(--ds-line-1))', cursor: 'pointer', textAlign: 'left' }}>
              <span style={{ fontSize: 13, color: 'hsl(var(--ds-fg-1))' }}>{u.display_name ?? 'Sem nome'}</span>
              {u.position && <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))' }}>· {u.position}</span>}
            </button>
          ))}
          {others.length === 0 && (
            <div style={{ padding: 16, fontSize: 12, color: 'hsl(var(--ds-fg-3))', textAlign: 'center' }}>Nenhum usuário encontrado</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Chat() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { data: conversations = [], isLoading } = useConversations();
  const [newChannelOpen, setNewChannelOpen] = useState(false);
  const [newDMOpen, setNewDMOpen] = useState(false);

  const active = useMemo(
    () => conversations.find((c) => c.id === conversationId) ?? null,
    [conversations, conversationId],
  );

  // when no conversation selected, navigate to the first one
  useEffect(() => {
    if (!conversationId && !isLoading && conversations.length > 0) {
      navigate(`/chat/${conversations[0].id}`, { replace: true });
    }
  }, [conversationId, conversations, isLoading, navigate]);

  return (
    <div className="ds-shell ds-page" style={{ height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', height: '100%' }}>
        <ChatSidebar
          activeId={conversationId ?? null}
          onNewChannel={() => setNewChannelOpen(true)}
          onNewDM={() => setNewDMOpen(true)}
        />
        {active ? (
          <ChatConversation conversation={active} />
        ) : (
          <div style={{ flex: 1, display: 'grid', placeItems: 'center', background: 'hsl(var(--ds-surface))', padding: 32 }}>
            <div style={{ textAlign: 'center', maxWidth: 320 }}>
              <div style={{ fontFamily: '"HN Display", sans-serif', fontSize: 16, fontWeight: 500, letterSpacing: '-0.01em', marginBottom: 6 }}>
                Hiro Chat
              </div>
              <div style={{ fontSize: 13, color: 'hsl(var(--ds-fg-3))' }}>
                {isLoading ? 'Carregando suas conversas...' : 'Selecione uma conversa à esquerda ou inicie uma nova.'}
              </div>
            </div>
          </div>
        )}
      </div>

      <NewChannelDialog open={newChannelOpen} onClose={() => setNewChannelOpen(false)} onCreated={(id) => navigate(`/chat/${id}`)} />
      <NewDMDialog open={newDMOpen} onClose={() => setNewDMOpen(false)} onOpened={(id) => navigate(`/chat/${id}`)} />
    </div>
  );
}
