import { NavLink, useLocation } from "react-router-dom";
import { useNavigationBlocker } from "@/contexts/NavigationBlockerContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { canAccess } from "@/lib/permissions";
import type { NavItem, NavChild } from "../nav-data";

type Props = {
  parent: NavItem;
};

export function SubSidebar({ parent }: Props) {
  const location = useLocation();
  const { role } = useAuthContext();
  const { requestNavigation } = useNavigationBlocker();

  const isActivePath = (href: string) =>
    location.pathname === href || location.pathname.startsWith(href + "/");

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (location.pathname === href) return;
    if (!requestNavigation(href)) e.preventDefault();
  };

  /** Children visible to the current role. Sections are always kept. */
  const visibleChildren: NavChild[] = (parent.children ?? []).filter((c) => {
    if ("section" in c && c.section) return true;
    return c.permission ? canAccess(role, c.permission) : true;
  });

  // If a section divider becomes orphan (no visible children after it), drop it.
  // Walk through and only keep section dividers that precede at least one visible item.
  const cleaned: NavChild[] = [];
  for (let i = 0; i < visibleChildren.length; i++) {
    const c = visibleChildren[i];
    if ("section" in c && c.section) {
      const next = visibleChildren.slice(i + 1).find((n) => !("section" in n));
      if (next) cleaned.push(c);
    } else {
      cleaned.push(c);
    }
  }

  const hasSectionDividers = cleaned.some((c) => "section" in c && c.section);

  return (
    <aside className="sub-sidebar">
      <nav className="sub-sidebar-nav scroll-quiet">
        {!hasSectionDividers && (
          <div className="sub-section-label">{parent.name}</div>
        )}
        {cleaned.map((c, idx) => {
          if ("section" in c && c.section) {
            return (
              <div key={"s" + idx} className="sub-section-label">{c.section}</div>
            );
          }
          if (c.disabled) {
            return (
              <div
                key={c.href}
                className="sub-nav-row is-disabled"
                aria-disabled="true"
                title="Em breve"
              >
                <span className="sub-nav-label">{c.name}</span>
                {c.badge && <span className="sub-nav-badge">{c.badge}</span>}
              </div>
            );
          }
          return (
            <NavLink
              key={c.href}
              to={c.href!}
              onClick={(e) => handleNavClick(e, c.href!)}
              className={"sub-nav-row" + (isActivePath(c.href!) ? " active" : "")}
            >
              {isActivePath(c.href!) && <span className="nav-active-mark" />}
              <span className="sub-nav-label">{c.name}</span>
              {c.badge && <span className="sub-nav-badge">{c.badge}</span>}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
