import { useState } from 'react';
import { Plus, Edit2, Trash2, Loader2, User, UserCircle, MoreVertical, ArrowRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { type MarketingPersona, useMarketingPersonas } from '@/hooks/useMarketingPersonas';
import { MarketingPersonaDialog } from '@/components/Marketing/MarketingPersonaDialog';
import { MarketingPersonaDetailsDialog } from '@/components/Marketing/MarketingPersonaDetailsDialog';

export function PersonaContent() {
  const { personas, loading, deletePersona } = useMarketingPersonas();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MarketingPersona | null>(null);
  const [viewing, setViewing] = useState<MarketingPersona | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (p: MarketingPersona) => {
    setEditing(p);
    setDialogOpen(true);
  };

  return (
    <>
      <div style={{ border: '1px solid hsl(var(--ds-line-1))', background: 'hsl(var(--ds-surface))' }}>
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid hsl(var(--ds-line-1))',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <UserCircle size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span
              style={{
                fontSize: 11,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                fontWeight: 500,
                color: 'hsl(var(--ds-fg-2))',
              }}
            >
              Persona / ICP
            </span>
            <span style={{ fontSize: 11, color: 'hsl(var(--ds-fg-3))', marginTop: 2 }}>
              Quem é o cliente ideal da Hiro Films
            </span>
          </div>
          <button
            type="button"
            className="btn primary"
            onClick={openNew}
            style={{ marginLeft: 'auto' }}
          >
            <Plus size={13} strokeWidth={1.5} />
            <span>Nova Persona</span>
          </button>
        </div>

        <div style={{ padding: 18 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
              <Loader2
                size={20}
                strokeWidth={1.5}
                className="animate-spin"
                style={{ color: 'hsl(var(--ds-fg-3))' }}
              />
            </div>
          ) : personas.length === 0 ? (
            <button
              type="button"
              onClick={openNew}
              className="group"
              style={{
                width: '100%',
                textAlign: 'left',
                border: '2px dashed hsl(var(--ds-line-1))',
                background: 'transparent',
                padding: 24,
                cursor: 'pointer',
                transition: 'background 0.15s, border-color 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'hsl(var(--ds-line-3))';
                e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'hsl(var(--ds-line-1))';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div
                  style={{
                    height: 48,
                    width: 48,
                    background: 'hsl(var(--ds-accent) / 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Plus size={18} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-accent))' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <h3
                      style={{
                        fontFamily: '"HN Display", sans-serif',
                        fontSize: 15,
                        fontWeight: 600,
                        color: 'hsl(var(--ds-fg-1))',
                      }}
                    >
                      Criar primeira persona
                    </h3>
                    <ArrowRight
                      size={14}
                      strokeWidth={1.5}
                      style={{ color: 'hsl(var(--ds-fg-3))', flexShrink: 0, marginTop: 2 }}
                    />
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      color: 'hsl(var(--ds-fg-3))',
                      marginTop: 4,
                      lineHeight: 1.5,
                    }}
                  >
                    Defina o cliente ideal da Hiro Films: segmento, dores, gatilhos e canais.
                  </p>
                </div>
              </div>
            </button>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: 16,
              }}
            >
              {personas.map((p) => (
                <div
                  key={p.id}
                  className="group"
                  style={{
                    border: '1px solid hsl(var(--ds-line-1))',
                    background: 'hsl(var(--ds-surface))',
                    padding: 18,
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'hsl(var(--ds-line-3))';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'hsl(var(--ds-line-1))';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <Avatar style={{ width: 56, height: 56, flexShrink: 0 }}>
                      <AvatarImage src={p.avatar_url || undefined} alt={p.name} />
                      <AvatarFallback>
                        {p.name ? (
                          p.name.charAt(0).toUpperCase()
                        ) : (
                          <User size={22} strokeWidth={1.5} />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ minWidth: 0 }}>
                          <h3
                            style={{
                              fontFamily: '"HN Display", sans-serif',
                              fontSize: 15,
                              fontWeight: 600,
                              color: 'hsl(var(--ds-fg-1))',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {p.name}
                          </h3>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                            {p.segment && <span className="pill muted">{p.segment}</span>}
                            {p.company_size && <span className="pill muted">{p.company_size}</span>}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="btn"
                              style={{ width: 28, height: 28, padding: 0, justifyContent: 'center' }}
                              aria-label="Mais"
                            >
                              <MoreVertical size={13} strokeWidth={1.5} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(p)}>
                              <Edit2 size={13} strokeWidth={1.5} style={{ marginRight: 8 }} />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              style={{ color: 'hsl(var(--ds-danger))' }}
                              onClick={() => setDeleteId(p.id)}
                            >
                              <Trash2 size={13} strokeWidth={1.5} style={{ marginRight: 8 }} />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {p.description && (
                        <p
                          style={{
                            fontSize: 13,
                            color: 'hsl(var(--ds-fg-3))',
                            marginTop: 12,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.5,
                          }}
                        >
                          {p.description}
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() => setViewing(p)}
                        style={{
                          marginTop: 10,
                          padding: 0,
                          background: 'transparent',
                          border: 0,
                          fontSize: 12,
                          fontWeight: 500,
                          color: 'hsl(var(--ds-accent))',
                          cursor: 'pointer',
                        }}
                      >
                        Ver detalhes →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <MarketingPersonaDialog open={dialogOpen} onOpenChange={setDialogOpen} persona={editing} />
      <MarketingPersonaDetailsDialog
        open={!!viewing}
        onOpenChange={(o) => !o && setViewing(null)}
        persona={viewing}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <span style={{ fontFamily: '"HN Display", sans-serif' }}>Excluir persona?</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteId) await deletePersona(deleteId);
                setDeleteId(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
