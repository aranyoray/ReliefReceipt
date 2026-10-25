"use client";

import { useEffect, useState } from "react";
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

  // Linked to as /?view=letter from the About page. Read from the location
  // rather than useSearchParams, which would make this route dynamic.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("view") === "letter") {
      setView("letter");
    }
  }, []);

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
      {/* Sits outside Relief so it shows under both views, and outside the
          shared ui/ directory so it stays this product's own line. */}
      <p className="fine" style={{ textAlign: "center", marginTop: 26 }}>
        Made with &lt;3 by{" "}
        <a href="/about" style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: 3 }}>
          Sanjay Adigopula
        </a>
      </p>
    </Shell>
  );
}
