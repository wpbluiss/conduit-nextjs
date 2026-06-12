"use client";

import { useState } from "react";
import { MeetTheTeamIntro } from "./MeetTheTeamIntro";
import type { EmployeeKey } from "@/lib/ai/provider";

export function IntroGate({
  showIntro,
  allowedEmployees,
}: {
  showIntro: boolean;
  allowedEmployees: EmployeeKey[];
}) {
  const [visible, setVisible] = useState(showIntro);
  if (!visible) return null;
  return (
    <MeetTheTeamIntro
      allowedEmployees={allowedEmployees}
      onDismiss={() => setVisible(false)}
    />
  );
}
