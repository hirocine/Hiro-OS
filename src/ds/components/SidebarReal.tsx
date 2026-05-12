import { useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useNavigationBlocker } from "@/contexts/NavigationBlockerContext";
import { canAccess, type PermissionKey } from "@/lib/permissions";
import { I } from "../icons";
import { NAV, type NavChild, type NavItem, type NavSection } from "../nav-data";
import { TopbarSearch } from "./TopbarSearch";
import { useInboxUnreadCount } from "@/features/inbox/useInbox";

type Props = {
  collapsed: boolean;
  onToggle: () => void;
};

export function SidebarReal({ collapsed, onToggle }: Props) {
  const location = useLocation();
  const { role, isAdmin, canAccessSuppliers, canAccessMarketing } = useAuthContext();
  const { requestNavigation } = useNavigationBlocker();
  const inboxUnread = useInboxUnreadCount();

  /** Legacy gate — `requires` field. Drops once nav-data finishes migrating to `permission`. */
  const canSeeLegacy = (req?: "admin" | "suppliers" | "marketing") => {
    if (!req) return true;
    if (req === "admin") return isAdmin;
    if (req === "suppliers") return canAccessSuppliers;
    if (req === "marketing") return canAccessMarketing;
    return true;
  };

  /** New gate — `permission` field. Returns true if granted (admin short-circuits). */
  const hasPermission = (key?: PermissionKey) => (key ? canAccess(role, key) : true);

  /** A child link is visible iff it passes its permission gate (sections are always visible). */
  const childVisible = (c: NavChild): boolean => {
    if ("section" in c && c.section) return true;
    return hasPermission(c.permission);
  };

  /**
   * An item is visible if:
   * - Its legacy `requires` gate passes (kept for back-compat), AND
   * - If it declares `permission`: that permission is granted, OR
   * - If it has children: at least one non-section child is visible.
   */
  const itemVisible = (it: NavItem): boolean => {
    if (!canSeeLegacy(it.requires)) return false;
    if (it.children && it.children.length > 0) {
      return it.children.some((c) => !("section" in c) && childVisible(c));
    }
    return hasPermission(it.permission);
  };

  const visibleSections: NavSection[] = useMemo(() => {
    return NAV
      .map((sec) => ({ ...sec, items: sec.items.filter(itemVisible) }))
      .filter((sec) => sec.items.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, isAdmin, canAccessSuppliers, canAccessMarketing]);

  const isActivePath = (href: string) =>
    location.pathname === href || location.pathname.startsWith(href + "/");

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (location.pathname === href) return;
    if (!requestNavigation(href)) e.preventDefault();
  };

  return (
    <aside className={"sidebar" + (collapsed ? " is-rail" : "")}>
      <div className="sidebar-head">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <img src="/pwa-512x512.png" alt="Hiro" />
          </div>
          {!collapsed && (
            <span className="brand-name">
              Hiro OS<sup>®</sup>
            </span>
          )}
        </div>
      </div>

      {!collapsed && (
        <div className="search-wrap">
          <TopbarSearch />
        </div>
      )}

      <nav className="nav scroll-quiet">
        {visibleSections.map((sec) => (
          <div key={sec.title} className="nav-section">
            {!collapsed && (
              <div className="nav-section-title">
                {sec.locked && (
                  <svg
                    className="lock"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <rect x="4" y="7" width="8" height="6" />
                    <path d="M5.5 7V5.5a2.5 2.5 0 0 1 5 0V7" />
                  </svg>
                )}
                {sec.title}
              </div>
            )}
            {sec.items.map((it) => {
              const hasChildren = !!it.children && it.children.length > 0;
              const childActive =
                hasChildren &&
                it.children!.some((c) => "href" in c && c.href && isActivePath(c.href));
              const isActive = isActivePath(it.href) || childActive;

              return (
                <NavLink
                  key={it.name}
                  to={it.href}
                  onClick={(e) => handleNavClick(e, it.href)}
                  className={
                    "nav-row" +
                    (isActive ? " active" : "") +
                    (it.admin ? " admin" : "")
                  }
                >
                  {isActive && (
                    <span className={"nav-active-mark" + (it.admin ? " admin" : "")} />
                  )}
                  <span className="nav-icon">{it.icon}</span>
                  {!collapsed && <span className="nav-label">{it.name}</span>}
                  {!collapsed && it.badge && (
                    <span
                      className={"badge b-" + it.badge.tone}
                      style={{ fontSize: "9px", letterSpacing: "0.12em" }}
                    >
                      <span className="badge-dot" />
                      {it.badge.label}
                    </span>
                  )}
                  {/* Dynamic unread badge for the inbox entry. Static
                      `it.badge` above wins if both are set. */}
                  {!collapsed && !it.badge && it.href === "/caixa-de-entrada" && inboxUnread > 0 && (
                    <span
                      className="badge b-active"
                      style={{ fontSize: "10px", fontVariantNumeric: "tabular-nums" }}
                      aria-label={`${inboxUnread} não lidas`}
                    >
                      {inboxUnread > 99 ? "99+" : inboxUnread}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <button
        className="sidebar-foot"
        onClick={onToggle}
        title={collapsed ? "Expandir (⌘\\)" : "Colapsar (⌘\\)"}
      >
        <span className="sidebar-foot-icon">{collapsed ? I.expand : I.collapse}</span>
        {!collapsed && (
          <>
            <span className="sidebar-foot-label">Recolher</span>
            <span className="kbd">⌘\</span>
          </>
        )}
      </button>
    </aside>
  );
}
