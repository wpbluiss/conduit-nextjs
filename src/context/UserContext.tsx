"use client";

import { createContext, useContext } from "react";

export interface UserContextValue {
  id: string;
  email: string;
  plan: string;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({
  initialUser,
  children,
}: {
  initialUser: UserContextValue;
  children: React.ReactNode;
}) {
  return (
    <UserContext.Provider value={initialUser}>{children}</UserContext.Provider>
  );
}

export function useUser(): UserContextValue | null {
  return useContext(UserContext);
}
