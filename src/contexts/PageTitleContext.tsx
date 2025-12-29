import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface PageTitleContextType {
  pageTitle: string;
  pageSubtitle?: string;
  setPageTitle: (title: string, subtitle?: string) => void;
}

const PageTitleContext = createContext<PageTitleContextType | undefined>(undefined);

interface PageTitleProviderProps {
  children: ReactNode;
}

export function PageTitleProvider({ children }: PageTitleProviderProps) {
  const [pageTitle, setTitle] = useState('');
  const [pageSubtitle, setSubtitle] = useState<string | undefined>();

  const setPageTitle = useCallback((title: string, subtitle?: string) => {
    setTitle(title);
    setSubtitle(subtitle);
  }, []);

  return (
    <PageTitleContext.Provider value={{ pageTitle, pageSubtitle, setPageTitle }}>
      {children}
    </PageTitleContext.Provider>
  );
}

export function usePageTitle() {
  const context = useContext(PageTitleContext);
  if (context === undefined) {
    throw new Error('usePageTitle must be used within a PageTitleProvider');
  }
  return context;
}
