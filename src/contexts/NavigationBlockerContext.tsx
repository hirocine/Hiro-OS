import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface NavigationBlockerContextType {
  isBlocking: boolean;
  pendingPath: string | null;
  setBlocker: (shouldBlock: boolean, onConfirm: () => void) => void;
  clearBlocker: () => void;
  requestNavigation: (path: string) => boolean; // Returns true if navigation should proceed
  confirmNavigation: () => void;
  cancelNavigation: () => void;
}

const NavigationBlockerContext = createContext<NavigationBlockerContextType | null>(null);

export function NavigationBlockerProvider({ children }: { children: ReactNode }) {
  const [isBlocking, setIsBlocking] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [onConfirmCallback, setOnConfirmCallback] = useState<(() => void) | null>(null);

  const setBlocker = useCallback((shouldBlock: boolean, onConfirm: () => void) => {
    setIsBlocking(shouldBlock);
    if (shouldBlock) {
      setOnConfirmCallback(() => onConfirm);
    } else {
      setOnConfirmCallback(null);
    }
  }, []);

  const clearBlocker = useCallback(() => {
    setIsBlocking(false);
    setPendingPath(null);
    setOnConfirmCallback(null);
  }, []);

  const requestNavigation = useCallback((path: string): boolean => {
    if (isBlocking) {
      setPendingPath(path);
      onConfirmCallback?.();
      return false; // Block navigation
    }
    return true; // Allow navigation
  }, [isBlocking, onConfirmCallback]);

  const confirmNavigation = useCallback(() => {
    setPendingPath(null);
  }, []);

  const cancelNavigation = useCallback(() => {
    setPendingPath(null);
  }, []);

  return (
    <NavigationBlockerContext.Provider 
      value={{ 
        isBlocking, 
        pendingPath, 
        setBlocker, 
        clearBlocker, 
        requestNavigation,
        confirmNavigation,
        cancelNavigation
      }}
    >
      {children}
    </NavigationBlockerContext.Provider>
  );
}

export function useNavigationBlocker() {
  const context = useContext(NavigationBlockerContext);
  if (!context) {
    throw new Error('useNavigationBlocker must be used within NavigationBlockerProvider');
  }
  return context;
}
