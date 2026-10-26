"use client";

import { Shell, type NavItem } from "@/ui/Shell";
import { Relief } from "@/components/Relief";
import { useCareUrl } from "@/lib/links";

export default function Page() {
  const careUrl = useCareUrl();
  const nav: NavItem[] = [
    { id: "assistance", label: "Assistance" },
    { id: "care", label: "Bill check", href: careUrl },
    { id: "about", label: "About", href: "/about" },
  ];
  return (
    <Shell product="ReliefReceipt" mark="R" nav={nav} active="assistance">
      <Relief />
    </Shell>
  );
}
