"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { EmployeeKey } from "@/lib/ai/provider";
import { employeeLabel } from "@/components/conduit/EmployeeBadge";

type NicknameMap = Partial<Record<EmployeeKey, string>>;

interface NicknameCtx {
  nicknames: NicknameMap;
  setNicknames: (n: NicknameMap) => void;
  labelFor: (emp: EmployeeKey) => string;
}

const NicknameContext = createContext<NicknameCtx>({
  nicknames: {},
  setNicknames: () => {},
  labelFor: employeeLabel,
});

export function NicknameProvider({
  initialNicknames,
  children,
}: {
  initialNicknames: NicknameMap;
  children: React.ReactNode;
}) {
  const [nicknames, setNicknames] = useState<NicknameMap>(initialNicknames);

  const labelFor = useCallback(
    (emp: EmployeeKey): string => nicknames[emp] || employeeLabel(emp),
    [nicknames],
  );

  return (
    <NicknameContext.Provider value={{ nicknames, setNicknames, labelFor }}>
      {children}
    </NicknameContext.Provider>
  );
}

export function useNicknames(): NicknameCtx {
  return useContext(NicknameContext);
}
