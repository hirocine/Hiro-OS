import { EXPERTISE_LABELS, type ExpertiseLevel } from '../types';
import { StatusPill } from '@/ds/components/StatusPill';

const TONE_BY_EXPERTISE = {
  altissima: 'success',
  alta: 'success',
  media: 'warning',
  baixa: 'warning',
  muito_baixa: 'danger',
} as const;

interface ExpertiseBadgeProps {
  expertise: ExpertiseLevel;
}

export function ExpertiseBadge({ expertise }: ExpertiseBadgeProps) {
  return <StatusPill label={EXPERTISE_LABELS[expertise]} tone={TONE_BY_EXPERTISE[expertise]} />;
}
