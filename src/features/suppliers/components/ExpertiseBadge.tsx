import { Badge } from '@/components/ui/badge';
import { EXPERTISE_LABELS, EXPERTISE_COLORS, type ExpertiseLevel } from '../types';

interface ExpertiseBadgeProps {
  expertise: ExpertiseLevel;
}

export function ExpertiseBadge({ expertise }: ExpertiseBadgeProps) {
  return (
    <Badge variant="outline" className={EXPERTISE_COLORS[expertise]}>
      {EXPERTISE_LABELS[expertise]}
    </Badge>
  );
}
