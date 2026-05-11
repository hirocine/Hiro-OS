import { useCountUp } from '@/ds/hooks/useCountUp';

interface CountUpProps {
  value: number;
  duration?: number;
  /** Locale for number formatting. Default 'pt-BR'. */
  locale?: string;
  /** Show as integer (default) or with N decimals. */
  decimals?: number;
  /** Prefix (e.g. "R$ "). */
  prefix?: string;
  /** Suffix (e.g. "%"). */
  suffix?: string;
  /** Skip the animation. */
  disabled?: boolean;
}

/**
 * Animated counter — gracefully animates from 0 (or last value) to the
 * target. Used on `<div class="stat-num">` etc. Respects reduced motion.
 *
 *   <span className="stat-num"><CountUp value={stats.active} /></span>
 */
export function CountUp({
  value,
  duration,
  locale = 'pt-BR',
  decimals = 0,
  prefix,
  suffix,
  disabled,
}: CountUpProps) {
  const animated = useCountUp({ to: value, duration, decimals, disabled });
  const formatted = animated.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return (
    <>
      {prefix}
      {formatted}
      {suffix}
    </>
  );
}
