/**
 * Sistema de hierarquia de Z-Index global
 * Mantém consistência em toda a aplicação
 */
export const Z_INDEX = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  overlay: 30,
  modal: 40,
  sidebar: 50,
  header: 60,
  sheet_overlay: 68,
  sheet: 70,
  dropdown_menu: 75,
  toast: 80,
  offline_indicator: 85,
  tooltip: 90,
  max: 100,
} as const;

export type ZIndexKey = keyof typeof Z_INDEX;
