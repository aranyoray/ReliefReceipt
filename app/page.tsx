"use client";

import { useState } from "react";
import { Shell, type NavItem } from "@/ui/Shell";
import { IconDoc, IconReceipt, IconRelief, Segmented, ThemeToggle } from "@/ui";
import { Relief } from "@/components/Relief";
import { useCareUrl } from "@/lib/links";

const VIEWS = [
  { id: "position", label: "What you qualify for" },
  { id: "letter", label: "The letter" },
];

export default function Page() {
  const [view, setView] = useState<"position" | "letter">("position");
  const careUrl = useCareUrl();

  const nav: NavItem[] = [
    { id: "position", label: "Assistance", icon: <IconRelief /> },
    { id: "letter", label: "Letter", icon: <IconDoc /> },
    { id: "care", label: "Bill check", icon: <IconReceipt />, href: careUrl },
  ];

  return (
    <Shell
      product="ReliefReceipt"
      mark="R"
      nav={nav}
      active={view}
      onNavigate={(id) => {
        setView(id as "position" | "letter");
        window.scrollTo({ top: 0 });
      }}
      right={<ThemeToggle />}
      narrow
      header={
        <Segmented
          onBrand
          options={VIEWS}
          value={view}
          onChange={(v) => setView(v as "position" | "letter")}
        />
      }
    >
      <Relief view={view} />
    </Shell>
  );
}
