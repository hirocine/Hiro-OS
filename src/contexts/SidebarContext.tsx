import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

const STORAGE_KEY = 'sidebar-expanded';

interface SidebarContextType {
  isExpanded: boolean;
  toggleSidebar: () => void;
  setExpanded: (value: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

interface SidebarStateProviderProps {
  children: ReactNode;
}

export function SidebarStateProvider({ children }: SidebarStateProviderProps) {
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === 'true';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isExpanded));
  }, [isExpanded]);

  const toggleSidebar = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const setExpanded = useCallback((value: boolean) => {
    setIsExpanded(value);
  }, []);

  return (
    <SidebarContext.Provider value={{ isExpanded, toggleSidebar, setExpanded }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebarState() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebarState must be used within a SidebarStateProvider');
  }
  return context;
}
