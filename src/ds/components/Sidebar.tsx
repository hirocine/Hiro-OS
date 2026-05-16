import { useState } from "react";
import { I } from "../icons";
import { NAV } from "../nav-data";

type Props = {
  collapsed: boolean;
  onToggle: () => void;
};

export function Sidebar({ collapsed, onToggle }: Props) {
  const [activePath, setActivePath] = useState<string>("/financeiro/dashboard");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    Financeiro: true,
  });
  const toggleExpanded = (name: string) =>
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));

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
          <div className="search-input">
            {I.search}
            <input placeholder="Buscar" />
            <span className="kbd">⌘K</span>
          </div>
        </div>
      )}

      <nav className="nav scroll-quiet">
        {NAV.map((sec) => (
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
              const hasChildren = !!it.children;
              const childActive =
                hasChildren &&
                it.children!.some((c) => "href" in c && c.href === activePath);
              const isActive = it.href === activePath || childActive;
              const isExpanded = expanded[it.name] || childActive;

              const handleRowClick = () => {
                if (hasChildren) {
                  toggleExpanded(it.name);
                } else {
                  setActivePath(it.href);
                }
              };

              return (
                <div key={it.name}>
                  <div
                    className={
"nav-row" +
                      (isActive ? " active" : "") +
                      (isExpanded ? " expanded" : "") +
                      (it.admin ? " admin" : "")
                    }
                    onClick={handleRowClick}
                  >
                    {isActive && (
                      <span
                        className={"nav-active-mark" + (it.admin ? " admin" : "")}
                      />
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
                    {!collapsed && hasChildren && (
                      <span className="nav-chev">{I.chev}</span>
                    )}
                  </div>
                  {!collapsed && hasChildren && isExpanded && (
                    <div className="nav-children">
                      {it.children!.map((c, idx) =>
"section" in c && c.section ? (
                          <div key={"s" + idx} className="nav-child-section">
                            {c.section}
                          </div>
                        ) : (
                          <div
                            key={c.href}
                            className={
"nav-child" + (c.href === activePath ? " active" : "")
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePath(c.href);
                            }}
                          >
                            {c.name}
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
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
