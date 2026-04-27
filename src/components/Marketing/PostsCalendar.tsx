import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, CalendarDays, X, Trash2, Pencil } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';
import { type MarketingPost } from '@/hooks/useMarketingPosts';
import { type MarketingPillar } from '@/hooks/useMarketingPillars';
import { getPillarColor } from '@/lib/marketing-colors';
import {
  getPostFormatLabel, getPostPlatformLabel, getPostStatus,
} from '@/lib/marketing-posts-config';

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

function pillColorClasses(p: MarketingPost, pillars: MarketingPillar[]) {
  const pillar = pillars.find((pp) => pp.id === p.pillar_id);
  const color = getPillarColor(pillar?.color);
  return `${color.bg} ${color.text}`;
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative bg-background border border-border rounded-2xl shadow-2xl w-[440px] max-w-full max-h-[80vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-border flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {format(day, 'EEEE', { locale: ptBR })}
            </p>
            <h3 className="text-lg font-semibold capitalize">
              {format(day, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">{posts.length} post{posts.length === 1 ? '' : 's'}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {posts.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
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
                className={cn(
                  'group rounded-xl border border-border bg-card p-3 hover:border-foreground/20 transition cursor-pointer',
                  cancelled && 'opacity-60'
                )}
                onClick={() => onEdit(p)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 text-center shrink-0">
                    <div className="text-lg font-semibold leading-none">
                      {d ? format(d, 'HH:mm') : '--:--'}
                    </div>
                  </div>
                  <div className="w-px self-stretch bg-border" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {pillar && (
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color.hex }} />
                      )}
                      <p className={cn('text-sm font-medium truncate', cancelled && 'line-through')}>
                        {p.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {p.platform && (
                        <Badge variant="outline" className="text-[10px] h-5">
                          {getPostPlatformLabel(p.platform)}
                        </Badge>
                      )}
                      {p.format && (
                        <Badge variant="outline" className="text-[10px] h-5">
                          {getPostFormatLabel(p.format)}
                        </Badge>
                      )}
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full', status.className)}>
                        {status.emoji} {status.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={(e) => { e.stopPropagation(); onEdit(p); }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(p); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t border-border">
          <Button variant="outline" className="w-full" onClick={() => onCreate(day)}>
            + Novo post neste dia
          </Button>
        </div>
      </div>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover post?</AlertDialogTitle>
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
      <Card>
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Calendário</h3>
                <p className="text-xs text-muted-foreground">
                  {loading ? 'Carregando...' : `${posts.length} posts · ${periodLabel}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {view !== 'list' && (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-[140px] text-center capitalize">{periodLabel}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 ml-1" onClick={() => setCurrentDate(new Date())}>
                    Hoje
                  </Button>
                </div>
              )}

              <div className="flex items-center bg-muted rounded-lg p-0.5">
                {(['month', 'week', 'list'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => { setView(v); setAnimKey((k) => k + 1); }}
                    className={cn(
                      'text-xs px-2.5 py-1 rounded-md transition-all',
                      view === v ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {v === 'month' ? 'Mês' : v === 'week' ? 'Semana' : 'Lista'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div key={animKey} className="animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out">
            {/* Month View */}
            {view === 'month' && (
              <div>
                <div className="grid grid-cols-7 mb-1">
                  {WEEKDAY_LABELS.map((d) => (
                    <div key={d} className="text-[10px] text-muted-foreground uppercase tracking-wider text-center py-1.5 font-medium">
                      {d}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {calendarDays.map((day) => {
                    const sameMonth = isSameMonth(day, currentDate);
                    const dayPosts = sameMonth ? getPostsForDay(day, posts) : [];
                    const today = isToday(day);
                    return (
                      <div
                        key={day.toISOString()}
                        onClick={() => sameMonth && setSelectedDay(day)}
                        className={cn(
                          'min-h-[88px] p-1.5 border border-border/20 transition-colors hover:bg-muted/30 cursor-pointer',
                          !sameMonth && 'opacity-30 bg-muted/20'
                        )}
                      >
                        {today ? (
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium mb-0.5">
                            {format(day, 'd')}
                          </span>
                        ) : (
                          <span className="text-xs block mb-0.5 text-muted-foreground">{format(day, 'd')}</span>
                        )}
                        <div className="space-y-0.5">
                          {dayPosts.slice(0, 3).map((p) => {
                            const cancelled = p.status === 'cancelado';
                            const d = postDate(p);
                            const status = getPostStatus(p.status);
                            return (
                              <Tooltip key={p.id}>
                                <TooltipTrigger asChild>
                                  <div
                                    onClick={(ev) => { ev.stopPropagation(); onEdit(p); }}
                                    className={cn(
                                      'text-[10px] px-1.5 py-0.5 rounded truncate w-full cursor-pointer',
                                      pillColorClasses(p, pillars),
                                      cancelled && 'line-through opacity-50'
                                    )}
                                  >
                                    {d ? format(d, 'HH:mm') + ' ' : ''}{p.title}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">
                                  <div className="font-medium">{p.title}</div>
                                  <div className="text-muted-foreground">
                                    {d ? format(d, 'HH:mm') : '--:--'}
                                    {p.platform ? ` · ${getPostPlatformLabel(p.platform)}` : ''}
                                  </div>
                                  <div className="mt-0.5">{status.emoji} {status.label}</div>
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                          {dayPosts.length > 3 && (
                            <span className="text-[10px] text-muted-foreground px-1.5">+{dayPosts.length - 3} mais</span>
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
              <div className="grid grid-cols-7 gap-px">
                {calendarDays.map((day) => {
                  const dayPosts = getPostsForDay(day, posts);
                  const today = isToday(day);
                  return (
                    <div key={day.toISOString()} className={cn('rounded-lg', today && 'bg-primary/5')}>
                      <div
                        onClick={() => setSelectedDay(day)}
                        className={cn('text-center py-2 border-b border-border cursor-pointer hover:bg-muted/40', today && 'text-primary')}
                      >
                        <div className="text-[10px] uppercase text-muted-foreground">{WEEKDAY_LABELS[day.getDay()]}</div>
                        <div className={cn('text-lg font-semibold', today && 'text-primary')}>{format(day, 'd')}</div>
                      </div>
                      <div className="p-1 space-y-1 min-h-[140px]">
                        {dayPosts.map((p) => {
                          const d = postDate(p);
                          const pillar = pillars.find((pp) => pp.id === p.pillar_id);
                          const color = getPillarColor(pillar?.color);
                          const cancelled = p.status === 'cancelado';
                          return (
                            <div
                              key={p.id}
                              onClick={() => onEdit(p)}
                              className={cn(
                                'rounded-lg p-2 bg-muted/40 border-l-2 cursor-pointer hover:bg-muted/60 transition-colors',
                                cancelled && 'opacity-50'
                              )}
                              style={{ borderLeftColor: color.hex }}
                            >
                              <p className={cn('text-xs font-medium truncate', cancelled && 'line-through')}>{p.title}</p>
                              <p className="text-[10px] text-muted-foreground">
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
                  <div className="py-12 text-center text-sm text-muted-foreground">Carregando posts...</div>
                ) : listPosts.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">Nenhum post nos próximos 60 dias</div>
                ) : (
                  groupPostsForList(listPosts, new Date()).map((group) => (
                    <div key={group.label}>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 pt-4 pb-2 font-medium">
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
                            className={cn(
                              'flex items-center gap-3 px-2 py-3 hover:bg-muted/40 cursor-pointer transition-colors border-b border-border last:border-0',
                              cancelled && 'opacity-50'
                            )}
                            onClick={() => onEdit(p)}
                          >
                            <div className="w-10 text-center shrink-0">
                              <div className="text-2xl font-semibold leading-none">{format(d, 'd')}</div>
                              <div className="text-[10px] text-muted-foreground uppercase">{format(d, 'MMM', { locale: ptBR })}</div>
                            </div>
                            <div className="w-px h-8 bg-border shrink-0" />
                            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color.hex }} />
                            <div className="flex-1 min-w-0">
                              <p className={cn('text-sm font-medium truncate', cancelled && 'line-through')}>{p.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(d, "HH:mm")}
                                {p.platform && ` · ${getPostPlatformLabel(p.platform)}`}
                                {p.format && ` · ${getPostFormatLabel(p.format)}`}
                              </p>
                            </div>
                            <Badge variant="outline" className={cn('shrink-0 text-[10px]', status.className)}>
                              {status.emoji} {status.label}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
