import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

export type BreadcrumbItem = {
  label: string;
  href?: string;
  onClick?: () => void;
};

type Ctx = {
  items: BreadcrumbItem[];
  setItems: (items: BreadcrumbItem[]) => void;
};

const BreadcrumbContext = createContext<Ctx | null>(null);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [items, setItemsState] = useState<BreadcrumbItem[]>([]);
  const location = useLocation();
  const lastPathRef = useRef(location.pathname);

  // Reset on route change — do it during render synchronously (no extra render)
  if (lastPathRef.current !== location.pathname) {
    lastPathRef.current = location.pathname;
    if (items.length > 0) {
      // Schedule a state update; React batches with current render
      queueMicrotask(() => setItemsState([]));
    }
  }

  const setItems = useCallback((next: BreadcrumbItem[]) => {
    setItemsState(next);
  }, []);

  return (
    <BreadcrumbContext.Provider value={{ items, setItems }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbContext() {
  return useContext(BreadcrumbContext);
}

/**
 * Page-side hook: declares the breadcrumb path for the current page.
 * Renders nothing — the topbar consumes from context.
 */
export function useSetBreadcrumbs(items: BreadcrumbItem[]) {
  const ctx = useContext(BreadcrumbContext);
  const key = JSON.stringify(items);
  useEffect(() => {
    if (!ctx) return;
    // Defer to next microtask so the Provider's setState doesn't cascade
    // synchronously back into the page that just rendered us.
    const id = setTimeout(() => ctx.setItems(items), 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
