"use client";

import { createContext, useContext } from "react";

export interface UserContextValue {
  id: string;
  email: string;
  plan: string;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({
  user,
  children,
}: {
  user: UserContextValue;
  children: React.ReactNode;
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextValue | null {
  return useContext(UserContext);
}
