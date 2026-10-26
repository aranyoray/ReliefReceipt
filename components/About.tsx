"use client";

import { Shell, type NavItem } from "@/ui/Shell";
import {
  Card,
  H2,
  IconDoc,
  IconReceipt,
  IconRelief,
  Lede,
  ListRow,
  Stack,
} from "@/ui";

/**
 * Who made this.
 *
 * The tabs are links here: the assistance workspace lives on the other route.
 * The profile sits on the left and the work on the right, filling the window.
 */
export function About() {

  const nav: NavItem[] = [
    { id: "assistance", label: "Assistance", href: "/" },
    { id: "bill", label: "Bill check", href: "/?tab=bill" },
    { id: "risk", label: "Health risk", href: "/?tab=risk" },
    { id: "about", label: "About", href: "/about" },
  ];

  return (
    <Shell
      product="ReliefReceipt"
      mark="R"
      nav={nav}
      active="about"
    >
      <div className="about">
        <Stack>
          <div className="portrait">
            <img src="/sanjay-adigopula.jpg" alt="Sanjay Adigopula" width={441} height={441} />
            <p className="portrait-name">Sanjay Adigopula</p>
            <p className="portrait-sub">Builder, Indianapolis</p>
          </div>
          <Card>
            <Lede>
              Sanjay made ReliefReceipt. He is a high school builder from Indianapolis with a
              background in competitive robotics and AI.
            </Lede>
          </Card>
        </Stack>

        <Stack>
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
      </div>
    </Shell>
  );
}
