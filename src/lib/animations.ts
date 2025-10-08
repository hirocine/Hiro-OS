/**
 * Constantes de animação padronizadas para o sistema
 * 
 * Uso:
 * import { ANIMATION_DURATIONS, HOVER_EFFECTS } from '@/lib/animations';
 * 
 * <div className={HOVER_EFFECTS.card}>...</div>
 */

export const ANIMATION_DURATIONS = {
  /** Interações rápidas (hover, clicks) - 200ms */
  fast: 'duration-200',
  
  /** Transições médias (fade-in, slide) - 300ms */
  medium: 'duration-300',
  
  /** Transições complexas - 400ms */
  slow: 'duration-400'
} as const;

export const HOVER_EFFECTS = {
  /** Cards padrão: sombra elegante + escala sutil */
  card: 'hover:shadow-elegant transition-all duration-200 hover:scale-[1.02]',
  
  /** Botões: sombra + escala maior */
  button: 'hover:shadow-elegant transition-all duration-200 hover:scale-105',
  
  /** Ícones: escala no hover */
  icon: 'transition-transform duration-200 hover:scale-110',
  
  /** Links: sem escala, apenas cor */
  link: 'transition-colors duration-200 hover:text-primary',
  
  /** Badges: background opacity */
  badge: 'transition-colors duration-200'
} as const;

export const ENTRY_ANIMATIONS = {
  /** Fade in com slide sutil */
  fadeIn: 'animate-fade-in',
  
  /** Scale in (para modais) */
  scaleIn: 'animate-scale-in',
  
  /** Slide da direita */
  slideRight: 'animate-slide-in-right'
} as const;

/**
 * Classe para respeitar preferências de acessibilidade
 * Aplicar em elementos com animação:
 * className={cn('animate-fade-in', ACCESSIBILITY.reduceMotion)}
 */
export const ACCESSIBILITY = {
  reduceMotion: 'motion-reduce:transition-none motion-reduce:animate-none'
} as const;
