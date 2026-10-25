"use client";

import { Shell, type NavItem } from "@/ui/Shell";
import {
  Card,
  Fine,
  H1,
  H2,
  IconDoc,
  IconReceipt,
  IconRelief,
  Lede,
  ListRow,
  Stack,
  ThemeToggle,
} from "@/ui";
import { useCareUrl } from "@/lib/links";

/**
 * Who made this.
 *
 * The tabs are links rather than view switches here, since the two views they
 * select live on the other route.
 */
export function About() {
  const careUrl = useCareUrl();

  const nav: NavItem[] = [
    { id: "position", label: "Assistance", icon: <IconRelief />, href: "/" },
    { id: "letter", label: "Letter", icon: <IconDoc />, href: "/?view=letter" },
    { id: "care", label: "Bill check", icon: <IconReceipt />, href: careUrl },
  ];

  return (
    <Shell
      product="ReliefReceipt"
      mark="R"
      nav={nav}
      active="about"
      onNavigate={() => {}}
      right={<ThemeToggle />}
      narrow
    >
      <Stack>
        <Card raised>
          <Stack>
            <div className="row" style={{ gap: 16, flexWrap: "nowrap" }}>
              <img
                src="/sanjay-adigopula.jpg"
                alt="Sanjay Adigopula"
                width={104}
                height={104}
                style={{
                  width: 104,
                  height: 104,
                  flex: "none",
                  borderRadius: 999,
                  objectFit: "cover",
                  // The source is a head-and-shoulders portrait, so the crop
                  // sits above centre to keep the face in the circle.
                  objectPosition: "50% 20%",
                  border: "1px solid var(--line)",
                }}
              />
              <div className="stack-s" style={{ minWidth: 0 }}>
                <H1>Sanjay Adigopula</H1>
                <Fine>Builder, Indianapolis</Fine>
              </div>
            </div>
            <Lede>
              Sanjay made ReliefReceipt. He is a high school builder from Indianapolis with a
              background in competitive robotics and AI.
            </Lede>
          </Stack>
        </Card>

        <Card>
          <Stack tight>
            <H2>What he is building</H2>
            <Lede>
              HbScan, a $49 e-ink wristband that keeps anemia risk, vitals and emergency details
              visible on a patient&apos;s wrist. The screen holds its image without power, so it
              runs for weeks on a charge and a parent, a teacher or a nurse can read it at a glance
              with no phone and no passcode.
            </Lede>
            <Lede>
              Anemia affects close to two billion people and is usually tracked with a blood draw at
              a clinic, which leaves no data at all between visits. Sanjay spent a summer shadowing
              a specialist at the University of Indiana and built the wristband around what he saw
              there.
            </Lede>
          </Stack>
        </Card>

        <Card flush>
          <ListRow
            icon={<IconRelief />}
            tone="ok"
            title="A working prototype"
            sub="Initial testing completed with more than 35 patients at a partner clinic"
          />
          <ListRow
            icon={<IconDoc />}
            title="A 200 patient study"
            sub="Being organised, with medical observers and safety documentation in place"
          />
          <ListRow
            icon={<IconReceipt />}
            title="Clinic and community pilots"
            sub="Built with input from clinical advisors and community health workers"
          />
        </Card>
      </Stack>
    </Shell>
  );
}
