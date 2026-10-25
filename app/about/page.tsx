import type { Metadata } from "next";
import { About } from "@/components/About";

export const metadata: Metadata = {
  title: "About · ReliefReceipt",
  description:
    "ReliefReceipt is made by Sanjay Adigopula, a high school builder from Indianapolis who is also building HbScan, an e-ink wristband for anemia awareness.",
};

export default function Page() {
  return <About />;
}
