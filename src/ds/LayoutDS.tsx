import { Suspense, useEffect, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { MobileSidebar } from "@/components/Layout/MobileSidebar";
import { TopBar as MobileTopBar } from "@/components/Layout/TopBar";
import { UpdateNotification } from "@/components/PWA/UpdateNotification";
import { OfflineIndicator } from "@/components/PWA/OfflineIndicator";
import { InstallPrompt } from "@/components/PWA/InstallPrompt";
import { HiroBubble } from "@/components/Layout/HiroBubble";
import { LoadingScreenSkeleton } from "@/components/ui/loading-screen";
import { useIsPWA } from "@/hooks/useIsPWA";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { SidebarReal } from "./components/SidebarReal";
import { SubSidebar } from "./components/SubSidebar";
import { TopbarReal } from "./components/TopbarReal";
import { BreadcrumbProvider } from "./BreadcrumbContext";
import { NAV, type NavItem } from "./nav-data";
import { useAuthContext } from "@/contexts/AuthContext";
import "./preview.css";

const COLLAPSE_KEY = "hiro-ds-sidebar-collapsed";

export function LayoutDS() {
  const isMobile = useIsMobile();
  const isPWA = useIsPWA();
  const location = useLocation();
  const { isAdmin, canAccessSuppliers, canAccessMarketing } = useAuthContext();

  // Active parent — drives the sub-sidebar visibility & content
  const activeParent: NavItem | null = useMemo(() => {
    const canSee = (req?: "admin" | "suppliers" | "marketing") => {
      if (!req) return true;
      if (req === "admin") return isAdmin;
      if (req === "suppliers") return canAccessSuppliers;
      if (req === "marketing") return canAccessMarketing;
      return true;
    };
    for (const sec of NAV) {
      for (const item of sec.items) {
        if (!canSee(item.requires)) continue;
        if (!item.children || item.children.length === 0) continue;
        const childActive = item.children.some(
          (c) =>
"href" in c &&
            c.href &&
            (location.pathname === c.href || location.pathname.startsWith(c.href + "/")),
        );
        const itemActive =
          location.pathname === item.href || location.pathname.startsWith(item.href + "/");
        if (childActive || itemActive) return item;
      }
    }
    return null;
  }, [location.pathname, isAdmin, canAccessSuppliers, canAccessMarketing]);

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch {
      /* noop */
    }
  }, [collapsed]);

  // ⌘\ toggle sidebar (desktop). ⌘K is owned by TopbarSearch (focuses input).
  useEffect(() => {
    if (isMobile) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "\\") {
        e.preventDefault();
        setCollapsed((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isMobile]);

  // Mobile: keep the existing experience untouched
  if (isMobile) {
    return (
      <BreadcrumbProvider>
        <div className="min-h-screen flex w-full">
          <MobileSidebar />
          <MobileTopBar />
          <OfflineIndicator />
          <UpdateNotification />
          <InstallPrompt />
          <HiroBubble />
          <main
            className={cn(
"flex-1 w-full min-h-screen bg-[hsl(var(--ds-surface))] [contain:layout]",
              isPWA
                ? "pt-[calc(4rem+env(safe-area-inset-top,0px))] pb-[env(safe-area-inset-bottom,1rem)]"
                : "pt-16 pb-4",
            )}
          >
            <Suspense fallback={<LoadingScreenSkeleton />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </BreadcrumbProvider>
    );
  }

  // Desktop: new DS chrome
  return (
    <BreadcrumbProvider>
      <div className={cn("ds-layout", collapsed && "is-collapsed")}>
        <div className="ds-shell">
          <SidebarReal collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
        </div>
        <div className="ds-layout-main">
          <div className="ds-shell">
            <TopbarReal />
          </div>
          <div className={cn("ds-layout-bottom", activeParent && "has-sub")}>
            {activeParent && (
              <div className="ds-shell">
                <SubSidebar parent={activeParent} />
              </div>
            )}
            <main className="ds-layout-content bg-[hsl(var(--ds-surface))]">
              <Suspense fallback={<LoadingScreenSkeleton />}>
                {/* `key` on route remounts the subtree on navigation, which
                    re-triggers the .ds-page-inner enter animation. */}
                <div key={location.pathname} style={{ height: '100%' }}>
                  <Outlet />
                </div>
              </Suspense>
            </main>
          </div>
        </div>
        <OfflineIndicator />
        <UpdateNotification />
        <InstallPrompt />
        <HiroBubble />
      </div>
    </BreadcrumbProvider>
  );
}
