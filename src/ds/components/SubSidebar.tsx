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

  const matchesPath = (href: string) =>
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

  /**
   * Of all the children whose href is a prefix of the current pathname,
   * pick the longest one. That's the genuinely-active row; the shorter
   * prefix matches (e.g. parent path /projetos-av while we're on
   * /projetos-av/todos) get downgraded so they don't light up too.
   */
  const activeHref: string | null = (() => {
    let best: { href: string; len: number } | null = null;
    for (const c of visibleChildren) {
      if ("section" in c && c.section) continue;
      if (!c.href) continue;
      if (matchesPath(c.href) && (!best || c.href.length > best.len)) {
        best = { href: c.href, len: c.href.length };
      }
    }
    return best?.href ?? null;
  })();
  const isActivePath = (href: string) => href === activeHref;

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
          // NavLink defaults to auto-adding its own "active" class on any
          // prefix match — that's what was lighting up two siblings at once.
          // Passing className as a function disables that default and lets
          // our longest-match logic above own the active state.
          return (
            <NavLink
              key={c.href}
              to={c.href!}
              onClick={(e) => handleNavClick(e, c.href!)}
              className={() =>
"sub-nav-row" + (isActivePath(c.href!) ? " active" : "")
              }
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
