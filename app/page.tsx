"use client";

import { Shell, type NavItem } from "@/ui/Shell";
import { Relief } from "@/components/Relief";

export default function Page() {
  const nav: NavItem[] = [
    { id: "assistance", label: "Assistance" },
    { id: "about", label: "About", href: "/about" },
  ];
  return (
    <Shell product="ReliefReceipt" mark="R" nav={nav} active="assistance">
      <Relief />
    </Shell>
  );
}
