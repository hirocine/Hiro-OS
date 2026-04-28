import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { ArrowDown, ArrowUp, ArrowUpDown, Check, ChevronsUpDown, ExternalLink, Image as ImageIcon, Trophy } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { useMarketingPostMetrics, type PostWithMetrics } from '@/hooks/useMarketingPostMetrics';
import { getPillarColor } from '@/lib/marketing-colors';
import {
  POST_PLATFORMS,
  POST_FORMATS,
  getPostPlatformLabel,
  getPostFormatLabel,
} from '@/lib/marketing-posts-config';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { MarketingPostDialog } from '@/components/Marketing/MarketingPostDialog';
import type { MarketingPost } from '@/hooks/useMarketingPosts';

type SortKey =
  | 'views'
  | 'likes'
  | 'comments'
  | 'shares'
  | 'saves'
  | 'reach'
  | 'engagement_rate'
  | 'scheduled_at';
type SortDir = 'asc' | 'desc';

type PeriodOption = '7' | '30' | '90' | 'all';

const PERIOD_OPTIONS: { value: PeriodOption; label: string }[] = [
  { value: '7', label: 'Últimos 7 dias' },
  { value: '30', label: 'Últimos 30 dias' },
  { value: '90', label: 'Últimos 90 dias' },
  { value: 'all', label: 'Todo o período' },
];

function engagementColor(rate: number | null | undefined): string {
  const r = rate ?? 0;
  if (r > 5) return 'text-emerald-500';
  if (r >= 2) return 'text-yellow-500';
  return 'text-muted-foreground';
}

function MultiSelect({
  label,
  options,
  values,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel =
    values.length === 0
      ? label
      : values.length === 1
        ? options.find((o) => o.value === values[0])?.label ?? label
        : `${label} (${values.length})`;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 justify-between min-w-[160px]">
          <span className="truncate">{selectedLabel}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-50 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <Command>
          <CommandInput placeholder={`Buscar ${label.toLowerCase()}...`} />
          <CommandEmpty>Nenhum resultado</CommandEmpty>
          <CommandGroup>
            {options.map((opt) => {
              const checked = values.includes(opt.value);
              return (
                <CommandItem
                  key={opt.value}
                  onSelect={() => {
                    onChange(
                      checked ? values.filter((v) => v !== opt.value) : [...values, opt.value]
                    );
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4', checked ? 'opacity-100' : 'opacity-0')} />
                  {opt.label}
                </CommandItem>
              );
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function PillarDot({ post }: { post: PostWithMetrics }) {
  if (!post.pillar) return <span className="text-muted-foreground text-xs">—</span>;
  const c = getPillarColor(post.pillar.color);
  return (
    <div className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.hex }} />
      <span className="text-sm truncate">{post.pillar.name}</span>
    </div>
  );
}

function Cover({ post }: { post: PostWithMetrics }) {
  if (post.cover_url) {
    return (
      <img
        src={post.cover_url}
        alt={post.title}
        className="h-10 w-10 rounded-md object-cover"
      />
    );
  }
  return (
    <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
      <ImageIcon className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}

export default function MarketingRanking() {
  const { publishedPosts, pillars, loading } = useMarketingPostMetrics();
  const { isMobile } = useResponsiveLayout();

  const [platforms, setPlatforms] = useState<string[]>([]);
  const [pillarIds, setPillarIds] = useState<string[]>([]);
  const [formats, setFormats] = useState<string[]>([]);
  const [period, setPeriod] = useState<PeriodOption>('all');

  const [sortKey, setSortKey] = useState<SortKey>('views');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const [dialogPost, setDialogPost] = useState<MarketingPost | null>(null);

  const pillarOptions = useMemo(
    () => pillars.map((p) => ({ value: p.id, label: p.name })),
    [pillars]
  );

  const filtered = useMemo(() => {
    const now = Date.now();
    const cutoff =
      period === 'all' ? null : now - parseInt(period, 10) * 24 * 60 * 60 * 1000;
    return publishedPosts.filter((p) => {
      if (platforms.length > 0 && !platforms.includes(p.platform ?? '')) return false;
      if (pillarIds.length > 0 && !pillarIds.includes(p.pillar_id ?? '')) return false;
      if (formats.length > 0 && !formats.includes(p.format ?? '')) return false;
      if (cutoff && p.scheduled_at) {
        const t = new Date(p.scheduled_at).getTime();
        if (t < cutoff) return false;
      } else if (cutoff && !p.scheduled_at) {
        return false;
      }
      return true;
    });
  }, [publishedPosts, platforms, pillarIds, formats, period]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let av: number | string = 0;
      let bv: number | string = 0;
      if (sortKey === 'scheduled_at') {
        av = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
        bv = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;
      } else {
        av = (a[sortKey] as number) ?? 0;
        bv = (b[sortKey] as number) ?? 0;
      }
      if (av === bv) return 0;
      const cmp = av < bv ? -1 : 1;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const totals = useMemo(() => {
    const totalViews = filtered.reduce((s, p) => s + (p.views ?? 0), 0);
    const avgEng =
      filtered.length === 0
        ? 0
        : filtered.reduce((s, p) => s + (p.engagement_rate ?? 0), 0) / filtered.length;
    // best pillar by views
    const byPillar = new Map<string, { name: string; color: string; views: number }>();
    filtered.forEach((p) => {
      if (!p.pillar) return;
      const cur = byPillar.get(p.pillar.id) ?? {
        name: p.pillar.name,
        color: p.pillar.color,
        views: 0,
      };
      cur.views += p.views ?? 0;
      byPillar.set(p.pillar.id, cur);
    });
    const bestPillar = [...byPillar.values()].sort((a, b) => b.views - a.views)[0];
    return { count: filtered.length, totalViews, avgEng, bestPillar };
  }, [filtered]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  function SortHeader({ k, label, align = 'left' }: { k: SortKey; label: string; align?: 'left' | 'right' }) {
    const active = sortKey === k;
    return (
      <button
        type="button"
        onClick={() => toggleSort(k)}
        className={cn(
          'inline-flex items-center gap-1 text-xs font-medium hover:text-foreground transition-colors',
          align === 'right' && 'flex-row-reverse',
          active ? 'text-foreground' : 'text-muted-foreground'
        )}
      >
        {label}
        {active ? (
          sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-50" />
        )}
      </button>
    );
  }

  const filtersRow = (
    <div className="flex flex-wrap gap-2">
      <MultiSelect
        label="Plataforma"
        options={POST_PLATFORMS}
        values={platforms}
        onChange={setPlatforms}
      />
      <MultiSelect
        label="Pilar"
        options={pillarOptions}
        values={pillarIds}
        onChange={setPillarIds}
      />
      <MultiSelect
        label="Formato"
        options={POST_FORMATS}
        values={formats}
        onChange={setFormats}
      />
      <Select value={period} onValueChange={(v) => setPeriod(v as PeriodOption)}>
        <SelectTrigger className="h-9 w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PERIOD_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const summaryCards = (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Card>
        <CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Posts publicados</div>
          <div className="text-2xl font-semibold mt-1">{totals.count}</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Total de views</div>
          <div className="text-2xl font-semibold mt-1">{totals.totalViews.toLocaleString('pt-BR')}</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Engajamento médio</div>
          <div className={cn('text-2xl font-semibold mt-1', engagementColor(totals.avgEng))}>
            {totals.avgEng.toFixed(2)}%
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Melhor pilar</div>
          {totals.bestPillar ? (
            <div className="flex items-center gap-2 mt-1">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: getPillarColor(totals.bestPillar.color).hex }}
              />
              <span className="text-base font-semibold truncate">{totals.bestPillar.name}</span>
            </div>
          ) : (
            <div className="text-base text-muted-foreground mt-1">—</div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const empty = (
    <EmptyState
      icon={Trophy}
      title="Nenhum post publicado ainda"
      description='Quando você marcar posts como "Publicado" eles aparecerão aqui ranqueados por performance.'
    />
  );

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'views', label: 'Views' },
    { key: 'likes', label: 'Curtidas' },
    { key: 'comments', label: 'Comentários' },
    { key: 'shares', label: 'Shares' },
    { key: 'saves', label: 'Saves' },
    { key: 'reach', label: 'Alcance' },
    { key: 'engagement_rate', label: 'Engajamento' },
    { key: 'scheduled_at', label: 'Data publicada' },
  ];

  return (
    <ResponsiveContainer maxWidth="7xl">
      <PageHeader
        title="Ranking de Conteúdos"
        subtitle="Performance de todos os posts publicados"
      />

      <div className="space-y-4">
        {filtersRow}
        {summaryCards}

        {loading ? (
          <div className="rounded-xl border border-border p-12 text-center text-muted-foreground">
            Carregando...
          </div>
        ) : sorted.length === 0 ? (
          empty
        ) : isMobile ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{sorted.length} posts</span>
              <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                <SelectTrigger className="h-9 w-[180px]">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((o) => (
                    <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {sorted.map((p) => (
              <Card key={p.id} className="cursor-pointer" onClick={() => setDialogPost(p)}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Cover post={p} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{p.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        {p.platform && (
                          <Badge variant="secondary" className="text-xs">
                            {getPostPlatformLabel(p.platform)}
                          </Badge>
                        )}
                        <PillarDot post={p} />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      ['Views', p.views],
                      ['Curtidas', p.likes],
                      ['Coment.', p.comments],
                      ['Shares', p.shares],
                      ['Saves', p.saves],
                      ['Alcance', p.reach],
                      ['Eng.', `${(p.engagement_rate ?? 0).toFixed(1)}%`],
                      [
                        'Data',
                        p.scheduled_at
                          ? new Date(p.scheduled_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                            })
                          : '—',
                      ],
                    ].map(([label, val]) => (
                      <div key={label as string} className="rounded-md bg-muted/40 p-2">
                        <div className="text-[10px] text-muted-foreground uppercase">{label}</div>
                        <div className="text-sm font-medium mt-0.5">{val ?? 0}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">Capa</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Plataforma</TableHead>
                  <TableHead>Pilar</TableHead>
                  <TableHead><SortHeader k="scheduled_at" label="Publicada" /></TableHead>
                  <TableHead className="text-right"><SortHeader k="views" label="Views" align="right" /></TableHead>
                  <TableHead className="text-right"><SortHeader k="likes" label="Curtidas" align="right" /></TableHead>
                  <TableHead className="text-right"><SortHeader k="comments" label="Coment." align="right" /></TableHead>
                  <TableHead className="text-right"><SortHeader k="shares" label="Shares" align="right" /></TableHead>
                  <TableHead className="text-right"><SortHeader k="saves" label="Saves" align="right" /></TableHead>
                  <TableHead className="text-right"><SortHeader k="reach" label="Alcance" align="right" /></TableHead>
                  <TableHead className="text-right"><SortHeader k="engagement_rate" label="Eng. %" align="right" /></TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((p) => (
                  <TableRow key={p.id} className="cursor-pointer" onClick={() => setDialogPost(p)}>
                    <TableCell><Cover post={p} /></TableCell>
                    <TableCell className="max-w-[240px]">
                      <div className="truncate font-medium">{p.title}</div>
                      {p.format && (
                        <div className="text-xs text-muted-foreground">{getPostFormatLabel(p.format)}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {p.platform ? (
                        <Badge variant="secondary" className="text-xs">
                          {getPostPlatformLabel(p.platform)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell><PillarDot post={p} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.scheduled_at
                        ? new Date(p.scheduled_at).toLocaleDateString('pt-BR')
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{(p.views ?? 0).toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="text-right tabular-nums">{(p.likes ?? 0).toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="text-right tabular-nums">{(p.comments ?? 0).toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="text-right tabular-nums">{(p.shares ?? 0).toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="text-right tabular-nums">{(p.saves ?? 0).toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="text-right tabular-nums">{(p.reach ?? 0).toLocaleString('pt-BR')}</TableCell>
                    <TableCell className={cn('text-right tabular-nums font-medium', engagementColor(p.engagement_rate))}>
                      {(p.engagement_rate ?? 0).toFixed(2)}%
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDialogPost(p);
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <MarketingPostDialog
        open={!!dialogPost}
        onOpenChange={(o) => { if (!o) setDialogPost(null); }}
        post={dialogPost}
      />
    </ResponsiveContainer>
  );
}
