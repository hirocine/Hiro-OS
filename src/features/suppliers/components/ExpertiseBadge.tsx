import { EXPERTISE_LABELS, type ExpertiseLevel } from '../types';

interface ExpertiseBadgeProps {
  expertise: ExpertiseLevel;
}

type Tone = 'success' | 'warning' | 'danger' | 'info';

const TONE_BY_EXPERTISE: Record<ExpertiseLevel, Tone> = {
  altissima: 'success',
  alta: 'success',
  media: 'warning',
  baixa: 'warning',
  muito_baixa: 'danger',
};

export function ExpertiseBadge({ expertise }: ExpertiseBadgeProps) {
  const tone = TONE_BY_EXPERTISE[expertise] || 'info';
  return (
    <span
      className="pill"
      style={{
        color: `hsl(var(--ds-${tone}))`,
        borderColor: `hsl(var(--ds-${tone}) / 0.3)`,
        background: `hsl(var(--ds-${tone}) / 0.08)`,
      }}
    >
      {EXPERTISE_LABELS[expertise]}
    </span>
  );
}
