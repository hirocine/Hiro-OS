import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Command as CommandPrimitive } from "cmdk";
import {
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useAuthContext } from "@/contexts/AuthContext";
import { useNavigationBlocker } from "@/contexts/NavigationBlockerContext";
import { I } from "../icons";
import { NAV } from "../nav-data";

type Rect = { left: number; top: number; width: number };

export function TopbarSearch() {
  const navigate = useNavigate();
  const { requestNavigation } = useNavigationBlocker();
  const { isAdmin, canAccessSuppliers, canAccessMarketing } = useAuthContext();
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<Rect>({ left: 0, top: 0, width: 420 });

  const sections = useMemo(() => {
    return NAV.filter((sec) => {
      if (sec.title === "Produção") return canAccessSuppliers;
      if (sec.title === "Marketing") return canAccessMarketing;
      if (sec.title === "Administração") return isAdmin;
      return true;
    });
  }, [isAdmin, canAccessSuppliers, canAccessMarketing]);

  // ⌘K to focus input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (wrapRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Position the dropdown below the input
  const updateRect = () => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect({ left: r.left, top: r.bottom + 6, width: Math.max(420, r.width) });
  };
  useLayoutEffect(() => {
    if (!open) return;
    updateRect();
    const onScrollOrResize = () => updateRect();
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    setValue("");
    inputRef.current?.blur();
  };

  const go = (href: string) => {
    if (!requestNavigation(href)) return;
    close();
    navigate(href);
  };

  const showDropdown = open && value.trim().length > 0;

  return (
    <CommandPrimitive shouldFilter style={{ display: "contents" }}>
      <div className="tb-search" ref={wrapRef}>
        {I.search}
        <CommandPrimitive.Input
          ref={inputRef}
          placeholder="Buscar"
          value={value}
          onValueChange={(v) => {
            setValue(v);
            setOpen(true);
          }}
          onFocus={() => {
            if (value.trim()) setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              close();
            }
          }}
        />
        <span className="kbd">⌘K</span>
      </div>

      {createPortal(
        <div
          ref={dropdownRef}
          className="tb-search-dropdown"
          style={{
            position: "fixed",
            left: rect.left,
            top: rect.top,
            width: rect.width,
            display: showDropdown ? "block" : "none",
          }}
        >
          <CommandList className="max-h-[60vh]">
            <CommandEmpty>Nenhum resultado.</CommandEmpty>
            {sections.map((sec) => (
              <CommandGroup key={sec.title} heading={sec.title}>
                {sec.items.flatMap((it) => {
                  const rows = [
                    <CommandItem
                      key={it.href}
                      value={`${sec.title} ${it.name}`}
                      onSelect={() => go(it.href)}
                    >
                      <span className="mr-2 inline-flex shrink-0 opacity-70">{it.icon}</span>
                      <span>{it.name}</span>
                      {it.badge && (
                        <span className="ml-auto text-[10px] uppercase tracking-wider opacity-60">
                          {it.badge.label}
                        </span>
                      )}
                    </CommandItem>,
                  ];
                  if (it.children) {
                    for (const c of it.children) {
                      if ("href" in c && c.href && c.name) {
                        rows.push(
                          <CommandItem
                            key={`${it.name}-${c.href}`}
                            value={`${sec.title} ${it.name} ${c.name}`}
                            onSelect={() => go(c.href!)}
                          >
                            <span className="mr-2 inline-flex shrink-0 opacity-70">
                              {it.icon}
                            </span>
                            <span className="opacity-60 mr-1">{it.name} ›</span>
                            <span>{c.name}</span>
                          </CommandItem>,
                        );
                      }
                    }
                  }
                  return rows;
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </div>,
        document.body,
      )}
    </CommandPrimitive>
  );
}
