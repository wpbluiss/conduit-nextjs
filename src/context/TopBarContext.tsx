"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

export interface TopBarBreadcrumb {
  specialist?: string;
  conversationTitle?: string;
}

interface TopBarContextValue {
  breadcrumb: TopBarBreadcrumb | null;
  setBreadcrumb: (data: TopBarBreadcrumb | null) => void;
}

const TopBarContext = createContext<TopBarContextValue>({
  breadcrumb: null,
  setBreadcrumb: () => {},
});

export function TopBarProvider({ children }: { children: ReactNode }) {
  const [breadcrumb, setBreadcrumbRaw] = useState<TopBarBreadcrumb | null>(
    null,
  );
  const setBreadcrumb = useCallback((data: TopBarBreadcrumb | null) => {
    setBreadcrumbRaw(data);
  }, []);
  return (
    <TopBarContext.Provider value={{ breadcrumb, setBreadcrumb }}>
      {children}
    </TopBarContext.Provider>
  );
}

export function useTopBar() {
  return useContext(TopBarContext);
}

/**
 * Convenience hook for pages/components that need to push breadcrumb data into
 * the top bar. Sets on mount/update and clears on unmount automatically.
 *
 * @param specialist - Display name of the active specialist (omit when not applicable)
 * @param conversationTitle - Title of the open conversation (omit when not applicable)
 */
export function useSetBreadcrumb(specialist?: string, conversationTitle?: string) {
  const { setBreadcrumb } = useTopBar();
  useEffect(() => {
    if (specialist || conversationTitle) {
      setBreadcrumb({ specialist, conversationTitle });
    } else {
      setBreadcrumb(null);
    }
    return () => setBreadcrumb(null);
  }, [specialist, conversationTitle, setBreadcrumb]);
}
