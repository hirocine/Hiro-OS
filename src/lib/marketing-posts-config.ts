export type PostStatus = 'em_producao' | 'agendado' | 'publicado' | 'cancelado';

export const POST_STATUSES: { value: PostStatus; label: string; emoji: string; className: string }[] = [
  { value: 'em_producao', label: 'Em produção', emoji: '🎬', className: 'bg-blue-500/15 text-blue-500' },
  { value: 'agendado',    label: 'Agendado',    emoji: '📅', className: 'bg-amber-500/15 text-amber-500' },
  { value: 'publicado',   label: 'Publicado',   emoji: '🚀', className: 'bg-emerald-500/15 text-emerald-500' },
  { value: 'cancelado',   label: 'Cancelado',   emoji: '❌', className: 'bg-muted text-muted-foreground' },
];

export const POST_PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube',   label: 'YouTube' },
  { value: 'tiktok',    label: 'TikTok' },
  { value: 'linkedin',  label: 'LinkedIn' },
  { value: 'other',     label: 'Outro' },
];

export const POST_FORMATS = [
  { value: 'reels',       label: 'Reels' },
  { value: 'carrossel',   label: 'Carrossel' },
  { value: 'video_longo', label: 'Vídeo longo' },
  { value: 'foto',        label: 'Foto' },
  { value: 'stories',     label: 'Stories' },
  { value: 'short',       label: 'Short' },
  { value: 'outro',       label: 'Outro' },
];

export function getPostStatus(value: string | null | undefined) {
  return POST_STATUSES.find((s) => s.value === value) ?? POST_STATUSES[0];
}

export function getPostPlatformLabel(value: string | null | undefined) {
  return POST_PLATFORMS.find((p) => p.value === value)?.label ?? value ?? '';
}

export function getPostFormatLabel(value: string | null | undefined) {
  return POST_FORMATS.find((f) => f.value === value)?.label ?? value ?? '';
}
