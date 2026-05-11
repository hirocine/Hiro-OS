/**
 * Hiro DS — Page toolbar primitives.
 *
 * Composition order (top to bottom):
 *   1. <PageHeader>          — title + subtitle + action(s)
 *   2. <StatsRow>            — (use plain `.summary` markup, no wrapper yet)
 *   3. <PageToolbar>         — search + filters + viewToggle + periodPicker
 *   4. <FilterChipRow>       — chips below the toolbar
 *   5. <FilterIndicator>     — "X de Y" + single clear-all
 *   6. <TabBar>              — primary navigation tabs
 *   7. content
 */
export { PageHeader } from './PageHeader';
export { PageToolbar } from './PageToolbar';
export { SearchField } from './SearchField';
export { FilterDropdown } from './FilterDropdown';
export { ViewToggle } from './ViewToggle';
export type { ViewToggleItem } from './ViewToggle';
export { PeriodPicker } from './PeriodPicker';
export { FilterChip, FilterChipRow } from './FilterChip';
export { FilterIndicator } from './FilterIndicator';
export { TabBar } from './TabBar';
export type { TabBarItem } from './TabBar';
