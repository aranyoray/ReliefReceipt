"use client";

import { useEffect, useState } from "react";
import { Shell, type NavItem } from "@/ui/Shell";
import { Relief } from "@/components/Relief";
import { BillCheck } from "@/components/BillCheck";
import { HealthRisk } from "@/components/HealthRisk";

type Tab = "assistance" | "bill" | "risk";
const TABS: Tab[] = ["assistance", "bill", "risk"];

export default function Page() {
  const [tab, setTab] = useState<Tab>("assistance");

  // /about links back here as /?tab=bill and /?tab=risk.
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab") as Tab | null;
    if (t && TABS.includes(t)) setTab(t);
  }, []);

  const go = (t: Tab) => {
    setTab(t);
    const url = t === "assistance" ? "/" : `/?tab=${t}`;
    window.history.replaceState(null, "", url);
    window.scrollTo({ top: 0 });
  };

  const nav: NavItem[] = [
    { id: "assistance", label: "Assistance" },
    { id: "bill", label: "Bill check" },
    { id: "risk", label: "Health risk" },
    { id: "about", label: "About", href: "/about" },
  ];

  return (
    <Shell product="ReliefReceipt" mark="R" nav={nav} active={tab} onNavigate={(id) => go(id as Tab)}>
      {tab === "assistance" ? (
        <Relief key="assistance" />
      ) : tab === "bill" ? (
        <BillCheck onUseBalance={() => go("assistance")} />
      ) : (
        <HealthRisk />
      )}
    </Shell>
  );
}
