"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type County,
  type Eligibility,
  type Geo,
  assessEligibility,
  countyForZip,
  federalPovertyLevel,
  loadGeo,
  loadZipMap,
} from "@/lib/engine";
import {
  Badge,
  Button,
  Card,
  Divider,
  Eyebrow,
  Fine,
  H1,
  Hero,
  IconDoc,
  IconPhone,
  IconPin,
  Lede,
  ListRow,
  Metric3,
  Note,
  NumberField,
  Rail,
  SectionHead,
  Stack,
  Stat,
  StatRow,
  usd,
  useStored,
} from "@/ui";

const TIER_TONE = { free: "ok", sliding: "warn", unlikely: "danger" } as const;
const TIER_LABEL = {
  free: "Written off in full",
  sliding: "Sliding-scale discount",
  unlikely: "Unlikely on income alone",
} as const;

/**
 * Where this household sits against the two thresholds in its state's policy:
 * everything below the free line is written off, everything up to the discount
 * line is reduced, and the marker is the reading.
 */
function FplBands({ freePct, discountPct, fplPct }: { freePct: number; discountPct: number; fplPct: number }) {
  const max = Math.max(discountPct * 1.25, fplPct * 1.1, 100);
  const w = (v: number) => `${Math.max(0, Math.min(100, (v / max) * 100))}%`;
  return (
    <div>
      <div className="meter" style={{ position: "relative", height: 14 }}>
        <span style={{ width: w(freePct), background: "var(--ok)", height: "100%" }} />
        <span className="meter-gap" />
        <span
          style={{
            width: `calc(${w(discountPct - freePct)} - 2px)`,
            background: "var(--warn)",
            height: "100%",
          }}
        />
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            left: `calc(${w(fplPct)} - 1.5px)`,
            top: -3,
            width: 3,
            height: 20,
            borderRadius: 2,
            background: "var(--ink)",
            boxShadow: "0 0 0 2px var(--surface)",
          }}
        />
      </div>
      <div className="legend" style={{ marginTop: 8 }}>
        <span className="legend-i">
          <span className="legend-sw" style={{ background: "var(--ok)" }} /> Free to {freePct}% FPL
        </span>
        <span className="legend-i">
          <span className="legend-sw" style={{ background: "var(--warn)" }} /> Discounted to {discountPct}%
        </span>
        <span className="legend-i">
          <span className="legend-sw" style={{ background: "var(--ink)" }} /> You, {Math.round(fplPct)}%
        </span>
      </div>
    </div>
  );
}

export function Relief({ view }: { view: "position" | "letter" }) {
  const [geo, setGeo] = useState<Geo | null>(null);
  const [zipMap, setZipMap] = useState<Record<string, string> | null>(null);
  const [zip, setZip] = useStored("zip", "");
  const [income, setIncome] = useStored("rr_income", "48000");
  const [household, setHousehold] = useStored("rr_household", "3");
  const [owed, setOwed] = useStored("rr_owed", "8400");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([loadGeo(), loadZipMap()]).then(([g, z]) => {
      setGeo(g);
      setZipMap(z);
    });
  }, []);

  const county: County | null = useMemo(() => {
    if (!geo || !zipMap || zip.length < 5) return null;
    return countyForZip(geo, zipMap, zip);
  }, [geo, zipMap, zip]);

  const state = county?.state ?? "";
  const nIncome = Number(income) || 0;
  const nHousehold = Math.max(1, Number(household) || 1);
  const nOwed = Number(owed) || 0;

  const elig: Eligibility | null = useMemo(() => {
    if (!state) return null;
    return assessEligibility(nIncome, nHousehold, state, nOwed);
  }, [nIncome, nHousehold, state, nOwed]);

  const fpl = state ? federalPovertyLevel(nHousehold, state) : 0;

  const letter = elig
    ? [
        `To the billing department,`,
        ``,
        `I am requesting financial assistance under ${elig.rule.programName} for my account.`,
        ``,
        `Household size: ${nHousehold}`,
        `Annual household income: ${usd(nIncome)}`,
        `That is ${elig.fplPct.toFixed(0)}% of the ${new Date().getFullYear()} federal poverty level of ${usd(fpl)} for a household of this size${
          state ? ` in ${county?.stateName}` : ""
        }.`,
        `Balance currently billed: ${usd(nOwed)}`,
        ``,
        elig.tier === "free"
          ? `Your policy provides for full write-off at or below ${elig.rule.freePct}% of the federal poverty level. I am requesting that the balance be written off in full.`
          : elig.tier === "sliding"
            ? `Your policy provides a sliding-scale discount between ${elig.rule.freePct}% and ${elig.rule.discountPct}% of the federal poverty level. I am requesting the discount I qualify for, which I calculate leaves approximately ${usd(elig.estimatedOwed)}.`
            : `I am requesting consideration under the hardship provisions of your policy. Eligibility is assessed per date of service and hardship is judged separately from the income thresholds.`,
        ``,
        `Please confirm in writing what documentation you need and pause collection activity while this application is assessed.`,
        ``,
        `Thank you.`,
      ].join("\n")
    : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(letter);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const controls = (
    <Card>
      <Stack tight>
        <NumberField
          label="ZIP code"
          value={zip}
          onChange={setZip}
          maxLength={5}
          placeholder="e.g. 10001"
          hint={county ? `${county.name}, ${county.stateName}` : "Sets which state's rules apply"}
        />
        <NumberField
          label="Annual household income"
          value={income}
          onChange={setIncome}
          prefix="$"
          placeholder="0"
        />
        <NumberField
          label="People in household"
          value={household}
          onChange={setHousehold}
          maxLength={2}
          placeholder="1"
        />
        <NumberField
          label="Balance owed"
          value={owed}
          onChange={setOwed}
          prefix="$"
          placeholder="0"
          hint="After any bill corrections you have already won."
        />
        <Fine>
          Everything stays in this browser. Apply even if you think you earn too much: eligibility
          is judged per date of service, can be applied retroactively, and hardship provisions sit
          outside the income test.
        </Fine>
      </Stack>
    </Card>
  );

  if (view === "letter") {
    return (
      <Stack>
        {!elig ? (
          <Card>
            <Note tone="info">Enter a ZIP code on the previous tab to load your state&apos;s rules.</Note>
          </Card>
        ) : (
          <>
            <Card raised>
              <Stack tight>
                <SectionHead
                  title="Your application letter"
                  right={<Badge tone={TIER_TONE[elig.tier]}>{TIER_LABEL[elig.tier]}</Badge>}
                />
                <textarea className="textarea" readOnly value={letter} style={{ minHeight: 300 }} />
                <Button primary wide onClick={copy}>
                  {copied ? "Letter copied" : "Copy the letter"}
                </Button>
              </Stack>
            </Card>
            <Card flush>
              <div style={{ padding: "14px 16px 4px" }}>
                <Eyebrow>Then</Eyebrow>
              </div>
              <ListRow
                icon={<IconDoc />}
                title="Send it in writing"
                sub="Email or post to the billing department, and keep a copy"
              />
              <ListRow
                icon={<IconPhone />}
                title="Ask for collection to pause"
                sub="Most policies require it while an application is open"
              />
              <ListRow
                icon={<IconPin />}
                title="Ask for the dates of service it covers"
                sub="Assistance is usually assessed per date, and can be applied retroactively"
              />
            </Card>
          </>
        )}
      </Stack>
    );
  }

  return (
    <Stack>
      <div>
        <H1>Get a hospital bill reduced or written off</H1>
        <Lede>
          Every non-profit hospital in the US has to run a financial assistance programme, and most
          people who qualify never apply. Work out what you are entitled to under your state&apos;s
          rules, then send the letter.
        </Lede>
      </div>

      {!elig ? (
        <>
          {controls}
          <Card>
            <Note tone="info">Enter a ZIP code to load your state&apos;s assistance rules.</Note>
          </Card>
        </>
      ) : (
        <>
          <Card raised>
            <Stack>
              <Hero
                value={usd(elig.estimatedOwed)}
                label={`estimated balance after assistance, from ${usd(nOwed)} billed`}
                tone={elig.estimatedOwed < nOwed ? "ok" : undefined}
              />
              <FplBands
                freePct={elig.rule.freePct}
                discountPct={elig.rule.discountPct}
                fplPct={elig.fplPct}
              />
              <Rail tone={TIER_TONE[elig.tier]}>
                <strong>{elig.headline}</strong>
              </Rail>
            </Stack>
          </Card>

          <Card>
            <StatRow>
              <Stat value={`${elig.fplPct.toFixed(0)}%`} label="of the poverty level" />
              <Stat value={usd(fpl)} label={`FPL, household of ${nHousehold}`} />
              <Stat value={`${Math.round(elig.patientShare * 100)}%`} label="share you would pay" />
            </StatRow>
          </Card>

          {controls}

          <Card flush>
            <div className="cat-head">
              <span className="t">{county?.stateName} rules</span>
            </div>
            <Metric3
              items={[
                { k: "Free at", v: `${elig.rule.freePct}% FPL` },
                { k: "Discount to", v: `${elig.rule.discountPct}% FPL` },
                { k: "Programme", v: elig.rule.programName, text: true },
              ]}
            />
            <Metric3
              items={[
                { k: "Free below", v: usd((fpl * elig.rule.freePct) / 100) },
                { k: "Discount below", v: usd((fpl * elig.rule.discountPct) / 100) },
                { k: "Your income", v: usd(nIncome) },
              ]}
            />
            <div style={{ padding: "12px 16px 16px" }}>
              <Stack tight>
                <Note tone="info">{elig.rule.note}</Note>
                {elig.rule.assetNote && <Note tone="warn">{elig.rule.assetNote}</Note>}
              </Stack>
            </div>
          </Card>

          <Divider />
        </>
      )}
    </Stack>
  );
}
