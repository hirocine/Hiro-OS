import { useEffect, useRef, useState } from 'react';

interface UseCountUpOptions {
  /** Final value. */
  to: number;
  /** Animation duration in ms. Default 600. */
  duration?: number;
  /** Start value. Default 0. */
  from?: number;
  /** Decimal places. Default 0. */
  decimals?: number;
  /** Set to `true` to skip the animation (e.g. when reduced motion). */
  disabled?: boolean;
}

/**
 * Animate a numeric value from `from` to `to` over `duration`.
 * Uses requestAnimationFrame, ease-out curve, and respects
 * `prefers-reduced-motion` automatically (jumps to final value).
 */
export function useCountUp({
  to,
  duration = 600,
  from = 0,
  decimals = 0,
  disabled = false,
}: UseCountUpOptions): number {
  const [value, setValue] = useState<number>(disabled ? to : from);
  const rafRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const startValueRef = useRef<number>(from);

  useEffect(() => {
    // Respect prefers-reduced-motion
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (disabled || prefersReduced || !Number.isFinite(to)) {
      setValue(to);
      return;
    }

    // Reset animation when target changes
    startedAtRef.current = null;
    startValueRef.current = value;

    const tick = (now: number) => {
      if (startedAtRef.current === null) startedAtRef.current = now;
      const elapsed = now - startedAtRef.current;
      const progress = Math.min(1, elapsed / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = startValueRef.current + (to - startValueRef.current) * eased;
      setValue(next);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to, duration, disabled]);

  return decimals === 0 ? Math.round(value) : Number(value.toFixed(decimals));
}
