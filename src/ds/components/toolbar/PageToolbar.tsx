import type { ReactNode } from 'react';

interface PageToolbarProps {
  /**
   * Slot 03 left — search field (canonically `<SearchField>`).
   * Renders with flex: 1 inside the row.
   */
  search?: ReactNode;
  /**
   * Slot 03 left-center — array of `<FilterDropdown>` rendered after the search.
   */
  filters?: ReactNode[];
  /**
   * Slot 03 right — `<ViewToggle>`. Sits at the right end of the row.
   */
  viewToggle?: ReactNode;
  /**
   * Slot 03 right — `<PeriodPicker>`. Sits immediately after `viewToggle`.
   * If both are absent the slot collapses cleanly.
   */
  periodPicker?: ReactNode;
}

/**
 * Canonical toolbar row.
 *
 * Layout grammar (enforced):
 *   [ search (flex-1) ] [ filters ... ]   ────────   [ viewToggle ] [ periodPicker ]
 *   ←──────── DATA ────────→                        ←──── VIEW MODIFIERS ────→
 *
 * - Left side ("data"):   what data appears (search + dropdowns).
 * - Right side ("view"):  how data appears (type of view + scope).
 *
 * Every slot is optional. Missing slots collapse, the others stay in place.
 *
 * The toolbar wraps if the row is too narrow — items wrap top-to-bottom,
 * always preserving the left/right grouping.
 */
export function PageToolbar({ search, filters, viewToggle, periodPicker }: PageToolbarProps) {
  // If everything is empty render nothing.
  const empty = !search && (!filters || filters.length === 0) && !viewToggle && !periodPicker;
  if (empty) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 8,
        marginTop: 20,
      }}
    >
      {/* Left group — data manipulation */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 8,
          flex: 1,
          minWidth: 240,
        }}
      >
        {search}
        {filters?.map((f, i) => (
          <span key={i} style={{ display: 'inline-flex' }}>
            {f}
          </span>
        ))}
      </div>

      {/* Right group — view modifiers */}
      {(viewToggle || periodPicker) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginLeft: 'auto',
          }}
        >
          {viewToggle}
          {periodPicker}
        </div>
      )}
    </div>
  );
}
