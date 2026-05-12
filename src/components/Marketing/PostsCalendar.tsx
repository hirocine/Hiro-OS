import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, CalendarDays, X, Trash2, Pencil } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addMonths, addWeeks, subMonths, subWeeks, addDays,
  isSameMonth, isToday, parseISO, eachDayOfInterval, startOfDay,
  isSameDay, isSameWeek,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { type MarketingPost } from '@/hooks/useMarketingPosts';
import { type MarketingPillar } from '@/hooks/useMarketingPillars';
import { getPillarColor } from '@/lib/marketing-colors';
import {
  getPostFormatLabel, getPostPlatformLabel, getPostStatus,
} from '@/lib/marketing-posts-config';
import { StatusPill } from '@/ds/components/StatusPill';

interface Props {
  posts: MarketingPost[];
  pillars: MarketingPillar[];
  loading?: boolean;
  onCreate: (date?: Date) => void;
  onEdit: (post: MarketingPost) => void;
  onDelete: (id: string) => void;
}

function postDate(p: MarketingPost): Date | null {
  return p.scheduled_at ? parseISO(p.scheduled_at) : null;
}

function getPostsForDay(day: Date, posts: MarketingPost[]): MarketingPost[] {
  return posts.filter((p) => {
    const d = postDate(p);
    return d && isSameDay(d, day);
  });
}

function DayDetailPopover({
  day, posts, pillars, onClose, onEdit, onDelete, onCreate,
}: {
  day: Date;
  posts: MarketingPost[];
  pillars: MarketingPillar[];
  onClose: () => void;
  onEdit: (p: MarketingPost) => void;
  onDelete: (id: string) => void;
  onCreate: (date: Date) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState<MarketingPost | null>(null);

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(4px)',
        }}
      />
      <div
        style={{
          position: 'relative',
          background: 'hsl(var(--ds-surface))',
          border: '1px solid hsl(var(--ds-line-1))',
          width: 440,
          maxWidth: '100%',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '18px 20px',
            borderBottom: '1px solid hsl(var(--ds-line-1))',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            <p
              style={{
                fontSize: 11,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                fontWeight: 500,
                color: 'hsl(var(--ds-fg-3))',
              }}
            >
              {format(day, 'EEEE', { locale: ptBR })}
            </p>
            <h3
              style={{
                fontFamily: '"HN Display", sans-serif',
                fontSize: 18,
                fontWeight: 600,
                textTransform: 'capitalize',
                color: 'hsl(var(--ds-fg-1))',
                marginTop: 2,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {format(day, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </h3>
            <p
              style={{
                fontSize: 11,
                color: 'hsl(var(--ds-fg-3))',
                marginTop: 4,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {posts.length} post{posts.length === 1 ? '' : 's'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn"
            style={{ width: 32, height: 32, padding: 0, justifyContent: 'center' }}
            aria-label="Fechar"
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {posts.length === 0 ? (
            <div
              style={{
                padding: '40px 0',
                textAlign: 'center',
                fontSize: 13,
                color: 'hsl(var(--ds-fg-3))',
              }}
            >
              Nenhum post agendado para este dia.
            </div>
          ) : posts.map((p) => {
            const d = postDate(p);
            const status = getPostStatus(p.status);
            const pillar = pillars.find((pp) => pp.id === p.pillar_id);
            const color = getPillarColor(pillar?.color);
            const cancelled = p.status === 'cancelado';
            return (
              <div
                key={p.id}
                className="group"
                style={{
                  border: '1px solid hsl(var(--ds-line-1))',
                  background: 'hsl(var(--ds-surface))',
                  padding: 12,
                  cursor: 'pointer',
                  opacity: cancelled ? 0.6 : 1,
                  transition: 'border-color 0.15s',
                }}
                onClick={() => onEdit(p)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'hsl(var(--ds-line-3))';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'hsl(var(--ds-line-1))';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 44, textAlign: 'center', flexShrink: 0 }}>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 600,
                        lineHeight: 1,
                        color: 'hsl(var(--ds-fg-1))',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {d ? format(d, 'HH:mm') : '--:--'}
                    </div>
                  </div>
                  <div style={{ width: 1, alignSelf: 'stretch', background: 'hsl(var(--ds-line-1))' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      {pillar && (
                        <span
                          style={{
                            height: 8,
                            width: 8,
                            borderRadius: '50%',
                            flexShrink: 0,
                            background: color.hex,
                          }}
                        />
                      )}
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: 'hsl(var(--ds-fg-1))',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          textDecoration: cancelled ? 'line-through' : 'none',
                        }}
                      >
                        {p.title}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {p.platform && (
                        <span className="pill muted" style={{ fontSize: 10 }}>
                          {getPostPlatformLabel(p.platform)}
                        </span>
                      )}
                      {p.format && (
                        <span className="pill muted" style={{ fontSize: 10 }}>
                          {getPostFormatLabel(p.format)}
                        </span>
                      )}
                      <StatusPill label={status.label} tone="muted" icon={status.emoji} />
                    </div>
                  </div>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    className="post-actions"
                  >
                    <button
                      type="button"
                      className="btn"
                      style={{ width: 28, height: 28, padding: 0, justifyContent: 'center' }}
                      onClick={(e) => { e.stopPropagation(); onEdit(p); }}
                      aria-label="Editar"
                    >
                      <Pencil size={12} strokeWidth={1.5} />
                    </button>
                    <button
                      type="button"
                      className="btn"
                      style={{
                        width: 28,
                        height: 28,
                        padding: 0,
                        justifyContent: 'center',
                        color: 'hsl(var(--ds-danger))',
                      }}
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(p); }}
                      aria-label="Remover"
                    >
                      <Trash2 size={12} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ padding: 12, borderTop: '1px solid hsl(var(--ds-line-1))' }}>
          <button
            type="button"
            className="btn"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => onCreate(day)}
          >
            + Novo post neste dia
          </button>
        </div>
      </div>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <span style={{ fontFamily: '"HN Display", sans-serif' }}>Remover post?</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              "{confirmDelete?.title}" será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete) onDelete(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>,
    document.body
  );
}

function groupPostsForList(posts: MarketingPost[], today: Date) {
  const groups: { label: string; items: MarketingPost[] }[] = [
    { label: 'Esta semana', items: [] },
    { label: 'Próxima semana', items: [] },
    { label: 'Este mês', items: [] },
    { label: 'Próximos meses', items: [] },
  ];
  const nextWeekStart = addWeeks(startOfWeek(today, { weekStartsOn: 0 }), 1);
  posts.forEach((p) => {
    const d = postDate(p);
    if (!d) return;
    if (isSameWeek(d, today, { weekStartsOn: 0 })) groups[0].items.push(p);
    else if (isSameWeek(d, nextWeekStart, { weekStartsOn: 0 })) groups[1].items.push(p);
    else if (isSameMonth(d, today)) groups[2].items.push(p);
    else groups[3].items.push(p);
  });
  return groups.filter((g) => g.items.length > 0);
}

export function PostsCalendar({ posts, pillars, loading, onCreate, onEdit, onDelete }: Props) {
  const [view, setView] = useState<'month' | 'week' | 'list'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [animKey, setAnimKey] = useState(0);

  const periodLabel = useMemo(() => {
    if (view === 'month') return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
    if (view === 'week') {
      const ws = startOfWeek(currentDate, { weekStartsOn: 0 });
      const we = endOfWeek(currentDate, { weekStartsOn: 0 });
      return `${format(ws, 'dd MMM', { locale: ptBR })} – ${format(we, 'dd MMM yyyy', { locale: ptBR })}`;
    }
    return 'Próximos 60 dias';
  }, [view, currentDate]);

  const navigate = (dir: 1 | -1) => {
    if (view === 'month') setCurrentDate((d) => (dir === 1 ? addMonths(d, 1) : subMonths(d, 1)));
    else if (view === 'week') setCurrentDate((d) => (dir === 1 ? addWeeks(d, 1) : subWeeks(d, 1)));
  };

  const calendarDays = useMemo(() => {
    if (view === 'month') {
      const mStart = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
      const mEnd = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
      return eachDayOfInterval({ start: mStart, end: mEnd });
    }
    if (view === 'week') {
      const ws = startOfWeek(currentDate, { weekStartsOn: 0 });
      const we = endOfWeek(currentDate, { weekStartsOn: 0 });
      return eachDayOfInterval({ start: ws, end: we });
    }
    return [];
  }, [view, currentDate]);

  const listPosts = useMemo(() => {
    const today = startOfDay(new Date());
    const limit = addDays(today, 60);
    return posts.filter((p) => {
      const d = postDate(p);
      return d && d >= today && d <= limit;
    }).sort((a, b) => (postDate(a)!.getTime() - postDate(b)!.getTime()));
  }, [posts]);

  const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const selectedDayPosts = selectedDay ? getPostsForDay(selectedDay, posts) : [];

  return (
    <TooltipProvider delayDuration={150}>
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
          <CalendarDays size={14} strokeWidth={1.5} style={{ color: 'hsl(var(--ds-fg-3))' }} />
          <span
            style={{
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              fontWeight: 500,
              color: 'hsl(var(--ds-fg-2))',
            }}
          >
            Calendário
          </span>
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 11,
              color: 'hsl(var(--ds-fg-3))',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {loading ? 'Carregando...' : `${posts.length} posts · ${periodLabel}`}
          </span>
        </div>

        <div style={{ padding: 18 }}>
          {/* Toolbar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {view !== 'list' && (
                <>
                  <button
                    type="button"
                    className="btn"
                    style={{ width: 32, height: 32, padding: 0, justifyContent: 'center' }}
                    onClick={() => navigate(-1)}
                    aria-label="Anterior"
                  >
                    <ChevronLeft size={14} strokeWidth={1.5} />
                  </button>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      minWidth: 140,
                      textAlign: 'center',
                      textTransform: 'capitalize',
                      color: 'hsl(var(--ds-fg-1))',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {periodLabel}
                  </span>
                  <button
                    type="button"
                    className="btn"
                    style={{ width: 32, height: 32, padding: 0, justifyContent: 'center' }}
                    onClick={() => navigate(1)}
                    aria-label="Próximo"
                  >
                    <ChevronRight size={14} strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    className="btn"
                    style={{ marginLeft: 4 }}
                    onClick={() => setCurrentDate(new Date())}
                  >
                    Hoje
                  </button>
                </>
              )}
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                border: '1px solid hsl(var(--ds-line-1))',
                background: 'hsl(var(--ds-line-2) / 0.3)',
                padding: 2,
              }}
            >
              {(['month', 'week', 'list'] as const).map((v) => {
                const active = view === v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => { setView(v); setAnimKey((k) => k + 1); }}
                    style={{
                      fontSize: 11,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      fontWeight: 500,
                      padding: '4px 10px',
                      background: active ? 'hsl(var(--ds-surface))' : 'transparent',
                      color: active ? 'hsl(var(--ds-fg-1))' : 'hsl(var(--ds-fg-3))',
                      border: 0,
                      cursor: 'pointer',
                      transition: 'color 0.15s, background 0.15s',
                    }}
                  >
                    {v === 'month' ? 'Mês' : v === 'week' ? 'Semana' : 'Lista'}
                  </button>
                );
              })}
            </div>
          </div>

          <div key={animKey} className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
            {/* Month View */}
            {view === 'month' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
                  {WEEKDAY_LABELS.map((d) => (
                    <div
                      key={d}
                      style={{
                        fontSize: 10,
                        color: 'hsl(var(--ds-fg-3))',
                        textTransform: 'uppercase',
                        letterSpacing: '0.14em',
                        textAlign: 'center',
                        padding: '6px 0',
                        fontWeight: 500,
                      }}
                    >
                      {d}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                  {calendarDays.map((day) => {
                    const sameMonth = isSameMonth(day, currentDate);
                    const dayPosts = sameMonth ? getPostsForDay(day, posts) : [];
                    const today = isToday(day);
                    return (
                      <div
                        key={day.toISOString()}
                        onClick={() => sameMonth && setSelectedDay(day)}
                        style={{
                          minHeight: 88,
                          padding: 6,
                          border: '1px solid hsl(var(--ds-line-1))',
                          marginLeft: -1,
                          marginTop: -1,
                          cursor: 'pointer',
                          opacity: sameMonth ? 1 : 0.3,
                          background: sameMonth ? 'transparent' : 'hsl(var(--ds-line-2) / 0.2)',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          if (sameMonth) e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = sameMonth ? 'transparent' : 'hsl(var(--ds-line-2) / 0.2)';
                        }}
                      >
                        {today ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 22,
                              height: 22,
                              background: 'hsl(var(--ds-accent))',
                              color: 'hsl(var(--ds-surface))',
                              fontSize: 11,
                              fontWeight: 500,
                              marginBottom: 2,
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {format(day, 'd')}
                          </span>
                        ) : (
                          <span
                            style={{
                              fontSize: 11,
                              display: 'block',
                              marginBottom: 2,
                              color: 'hsl(var(--ds-fg-3))',
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {format(day, 'd')}
                          </span>
                        )}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {dayPosts.slice(0, 3).map((p) => {
                            const cancelled = p.status === 'cancelado';
                            const d = postDate(p);
                            const status = getPostStatus(p.status);
                            const pillar = pillars.find((pp) => pp.id === p.pillar_id);
                            const c = getPillarColor(pillar?.color);
                            return (
                              <Tooltip key={p.id}>
                                <TooltipTrigger asChild>
                                  <div
                                    onClick={(ev) => { ev.stopPropagation(); onEdit(p); }}
                                    style={{
                                      fontSize: 10,
                                      padding: '2px 6px',
                                      width: '100%',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      cursor: 'pointer',
                                      borderLeft: `2px solid ${c.hex}`,
                                      background: 'hsl(var(--ds-line-2) / 0.4)',
                                      color: 'hsl(var(--ds-fg-1))',
                                      textDecoration: cancelled ? 'line-through' : 'none',
                                      opacity: cancelled ? 0.5 : 1,
                                      fontVariantNumeric: 'tabular-nums',
                                    }}
                                  >
                                    {d ? format(d, 'HH:mm') + ' ' : ''}{p.title}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">
                                  <div style={{ fontWeight: 500 }}>{p.title}</div>
                                  <div style={{ color: 'hsl(var(--ds-fg-3))', fontVariantNumeric: 'tabular-nums' }}>
                                    {d ? format(d, 'HH:mm') : '--:--'}
                                    {p.platform ? ` · ${getPostPlatformLabel(p.platform)}` : ''}
                                  </div>
                                  <div style={{ marginTop: 2 }}>{status.emoji} {status.label}</div>
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                          {dayPosts.length > 3 && (
                            <span
                              style={{
                                fontSize: 10,
                                color: 'hsl(var(--ds-fg-3))',
                                padding: '0 6px',
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            >
                              +{dayPosts.length - 3} mais
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Week View */}
            {view === 'week' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0 }}>
                {calendarDays.map((day) => {
                  const dayPosts = getPostsForDay(day, posts);
                  const today = isToday(day);
                  return (
                    <div
                      key={day.toISOString()}
                      style={{
                        border: '1px solid hsl(var(--ds-line-1))',
                        marginLeft: -1,
                        marginTop: -1,
                        background: today ? 'hsl(var(--ds-accent) / 0.05)' : 'transparent',
                      }}
                    >
                      <div
                        onClick={() => setSelectedDay(day)}
                        style={{
                          textAlign: 'center',
                          padding: '8px 0',
                          borderBottom: '1px solid hsl(var(--ds-line-1))',
                          cursor: 'pointer',
                          color: today ? 'hsl(var(--ds-accent))' : 'hsl(var(--ds-fg-1))',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <div
                          style={{
                            fontSize: 10,
                            textTransform: 'uppercase',
                            color: 'hsl(var(--ds-fg-3))',
                            letterSpacing: '0.14em',
                          }}
                        >
                          {WEEKDAY_LABELS[day.getDay()]}
                        </div>
                        <div
                          style={{
                            fontSize: 18,
                            fontWeight: 600,
                            color: today ? 'hsl(var(--ds-accent))' : 'hsl(var(--ds-fg-1))',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {format(day, 'd')}
                        </div>
                      </div>
                      <div
                        style={{
                          padding: 4,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                          minHeight: 140,
                        }}
                      >
                        {dayPosts.map((p) => {
                          const d = postDate(p);
                          const pillar = pillars.find((pp) => pp.id === p.pillar_id);
                          const color = getPillarColor(pillar?.color);
                          const cancelled = p.status === 'cancelado';
                          return (
                            <div
                              key={p.id}
                              onClick={() => onEdit(p)}
                              style={{
                                padding: 8,
                                background: 'hsl(var(--ds-line-2) / 0.4)',
                                borderLeft: `2px solid ${color.hex}`,
                                cursor: 'pointer',
                                opacity: cancelled ? 0.5 : 1,
                                transition: 'background 0.15s',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.6)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.4)';
                              }}
                            >
                              <p
                                style={{
                                  fontSize: 12,
                                  fontWeight: 500,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  color: 'hsl(var(--ds-fg-1))',
                                  textDecoration: cancelled ? 'line-through' : 'none',
                                }}
                              >
                                {p.title}
                              </p>
                              <p
                                style={{
                                  fontSize: 10,
                                  color: 'hsl(var(--ds-fg-3))',
                                  fontVariantNumeric: 'tabular-nums',
                                }}
                              >
                                {d ? format(d, 'HH:mm') : '--:--'}
                                {p.platform && ` · ${getPostPlatformLabel(p.platform)}`}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* List View */}
            {view === 'list' && (
              <div>
                {loading ? (
                  <div
                    style={{
                      padding: '48px 0',
                      textAlign: 'center',
                      fontSize: 13,
                      color: 'hsl(var(--ds-fg-3))',
                    }}
                  >
                    Carregando posts...
                  </div>
                ) : listPosts.length === 0 ? (
                  <div
                    style={{
                      padding: '48px 0',
                      textAlign: 'center',
                      fontSize: 13,
                      color: 'hsl(var(--ds-fg-3))',
                    }}
                  >
                    Nenhum post nos próximos 60 dias
                  </div>
                ) : (
                  groupPostsForList(listPosts, new Date()).map((group) => (
                    <div key={group.label}>
                      <div
                        style={{
                          fontSize: 10,
                          textTransform: 'uppercase',
                          letterSpacing: '0.14em',
                          color: 'hsl(var(--ds-fg-3))',
                          padding: '16px 8px 8px',
                          fontWeight: 500,
                        }}
                      >
                        {group.label}
                      </div>
                      {group.items.map((p) => {
                        const d = postDate(p)!;
                        const status = getPostStatus(p.status);
                        const pillar = pillars.find((pp) => pp.id === p.pillar_id);
                        const color = getPillarColor(pillar?.color);
                        const cancelled = p.status === 'cancelado';
                        return (
                          <div
                            key={p.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              padding: '12px 8px',
                              cursor: 'pointer',
                              borderBottom: '1px solid hsl(var(--ds-line-1))',
                              opacity: cancelled ? 0.5 : 1,
                              transition: 'background 0.15s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'hsl(var(--ds-line-2) / 0.4)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                            onClick={() => onEdit(p)}
                          >
                            <div style={{ width: 40, textAlign: 'center', flexShrink: 0 }}>
                              <div
                                style={{
                                  fontFamily: '"HN Display", sans-serif',
                                  fontSize: 22,
                                  fontWeight: 600,
                                  lineHeight: 1,
                                  color: 'hsl(var(--ds-fg-1))',
                                  fontVariantNumeric: 'tabular-nums',
                                }}
                              >
                                {format(d, 'd')}
                              </div>
                              <div
                                style={{
                                  fontSize: 10,
                                  color: 'hsl(var(--ds-fg-3))',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.14em',
                                }}
                              >
                                {format(d, 'MMM', { locale: ptBR })}
                              </div>
                            </div>
                            <div style={{ width: 1, height: 32, background: 'hsl(var(--ds-line-1))', flexShrink: 0 }} />
                            <span
                              style={{
                                height: 8,
                                width: 8,
                                borderRadius: '50%',
                                flexShrink: 0,
                                background: color.hex,
                              }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p
                                style={{
                                  fontSize: 13,
                                  fontWeight: 500,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  color: 'hsl(var(--ds-fg-1))',
                                  textDecoration: cancelled ? 'line-through' : 'none',
                                }}
                              >
                                {p.title}
                              </p>
                              <p
                                style={{
                                  fontSize: 11,
                                  color: 'hsl(var(--ds-fg-3))',
                                  fontVariantNumeric: 'tabular-nums',
                                }}
                              >
                                {format(d, 'HH:mm')}
                                {p.platform && ` · ${getPostPlatformLabel(p.platform)}`}
                                {p.format && ` · ${getPostFormatLabel(p.format)}`}
                              </p>
                            </div>
                            <StatusPill label={status.label} tone="muted" icon={status.emoji} />
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedDay && (
        <DayDetailPopover
          day={selectedDay}
          posts={selectedDayPosts}
          pillars={pillars}
          onClose={() => setSelectedDay(null)}
          onEdit={(p) => { setSelectedDay(null); onEdit(p); }}
          onDelete={onDelete}
          onCreate={(d) => { setSelectedDay(null); onCreate(d); }}
        />
      )}
    </TooltipProvider>
  );
}
