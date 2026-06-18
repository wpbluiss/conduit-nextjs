"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
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
