export interface PillarColor {
  key: string;
  label: string;
  bg: string;
  text: string;
  hex: string;
}

export const PILLAR_COLORS: PillarColor[] = [
  { key: 'blue',   label: 'Azul',     bg: 'bg-blue-500/15',     text: 'text-blue-500',     hex: '#3b82f6' },
  { key: 'green',  label: 'Verde',    bg: 'bg-emerald-500/15',  text: 'text-emerald-500',  hex: '#10b981' },
  { key: 'purple', label: 'Roxo',     bg: 'bg-purple-500/15',   text: 'text-purple-500',   hex: '#a855f7' },
  { key: 'pink',   label: 'Rosa',     bg: 'bg-pink-500/15',     text: 'text-pink-500',     hex: '#ec4899' },
  { key: 'orange', label: 'Laranja',  bg: 'bg-orange-500/15',   text: 'text-orange-500',   hex: '#f97316' },
  { key: 'yellow', label: 'Amarelo',  bg: 'bg-yellow-500/15',   text: 'text-yellow-600',   hex: '#eab308' },
  { key: 'red',    label: 'Vermelho', bg: 'bg-red-500/15',      text: 'text-red-500',      hex: '#ef4444' },
  { key: 'gray',   label: 'Cinza',    bg: 'bg-gray-500/15',     text: 'text-gray-500',     hex: '#6b7280' },
];

export function getPillarColor(key: string | null | undefined): PillarColor {
  return PILLAR_COLORS.find((c) => c.key === key) ?? PILLAR_COLORS[0];
}
