import { useSetBreadcrumbs } from "@/ds/BreadcrumbContext";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Renders nothing in-page — forwards items to the topbar via BreadcrumbContext.
 * Pages keep using <BreadcrumbNav items={...} /> as before; the topbar displays them.
 */
export function BreadcrumbNav({ items }: BreadcrumbNavProps) {
  useSetBreadcrumbs(items);
  return null;
}
