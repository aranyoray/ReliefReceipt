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
  Fine,
  H1,
  H2,
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
  Split,
  Stack,
  Stat,
  StatRow,
  usd,
  useStored,
} from "@/ui";
import { EnvelopeStage } from "./Envelope";

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

interface Inputs {
  zip: string;
  income: string;
  household: string;
  owed: string;
}

interface Assessed {
  county: County;
  elig: Eligibility;
  fpl: number;
  nIncome: number;
  nHousehold: number;
  nOwed: number;
  letter: string;
}

function assess(geo: Geo | null, zipMap: Record<string, string> | null, i: Inputs): Assessed | null {
  if (!geo || !zipMap || i.zip.length < 5) return null;
  const county = countyForZip(geo, zipMap, i.zip);
  const state = county?.state ?? "";
  if (!county || !state) return null;
  const nIncome = Number(i.income) || 0;
  const nHousehold = Math.max(1, Number(i.household) || 1);
  const nOwed = Number(i.owed) || 0;
  const elig = assessEligibility(nIncome, nHousehold, state, nOwed);
  const fpl = federalPovertyLevel(nHousehold, state);
  const letter = [
    `To the billing department,`,
    ``,
    `I am requesting financial assistance under ${elig.rule.programName} for my account.`,
    ``,
    `Household size: ${nHousehold}`,
    `Annual household income: ${usd(nIncome)}`,
    `That is ${elig.fplPct.toFixed(0)}% of the ${new Date().getFullYear()} federal poverty level of ${usd(fpl)} for a household of this size in ${county.stateName}.`,
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
  ].join("\n");
  return { county, elig, fpl, nIncome, nHousehold, nOwed, letter };
}

/**
 * The assistance workspace.  The household's details go in the panel on the
 * left; Prepare my letter opens the envelope on the right, and the letter
 * comes out with what the household qualifies for at the top.
 */
export function Relief() {
  const [geo, setGeo] = useState<Geo | null>(null);
  const [zipMap, setZipMap] = useState<Record<string, string> | null>(null);
  const [zip, setZip] = useStored("zip", "");
  const [income, setIncome] = useStored("rr_income", "48000");
  const [household, setHousehold] = useStored("rr_household", "3");
  const [owed, setOwed] = useStored("rr_owed", "8400");
  const [prepared, setPrepared] = useStored("rr_prepared", "");
  const [play, setPlay] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([loadGeo(), loadZipMap()]).then(([g, z]) => {
      setGeo(g);
      setZipMap(z);
    });
  }, []);

  const current: Inputs = { zip, income, household, owed };
  const now = useMemo(() => assess(geo, zipMap, { zip, income, household, owed }), [geo, zipMap, zip, income, household, owed]);

  const snap: Inputs | null = useMemo(() => {
    try {
      return prepared ? (JSON.parse(prepared) as Inputs) : null;
    } catch {
      return null;
    }
  }, [prepared]);
  const done = useMemo(() => (snap ? assess(geo, zipMap, snap) : null), [geo, zipMap, snap]);
  const stale = snap !== null && JSON.stringify(snap) !== JSON.stringify(current);

  // Linked to as /?view=letter from older pages: bring the letter into view.
  useEffect(() => {
    if (!done) return;
    if (new URLSearchParams(window.location.search).get("view") === "letter") {
      document.getElementById("letter-text")?.scrollIntoView({ block: "start" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!done]);

  const prepare = () => {
    if (!now) return;
    setPrepared(JSON.stringify(current));
    setPlay((p) => p + 1);
  };

  const copy = async () => {
    if (!done) return;
    try {
      await navigator.clipboard.writeText(done.letter);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const zipUnknown = geo !== null && zipMap !== null && zip.length === 5 && !now;

  const controls = (
    <>
      <div className="stack-s">
        <H1>Get a hospital bill reduced or written off</H1>
        <Lede>
          Every non-profit hospital in the US has to run a financial assistance programme, and most
          people who qualify never apply. Work out what you are entitled to under your state&apos;s
          rules, then send the letter.
        </Lede>
      </div>
      <NumberField
        label="ZIP code"
        value={zip}
        onChange={setZip}
        maxLength={5}
        placeholder="e.g. 10001"
        hint={now ? `${now.county.name}, ${now.county.stateName}` : "Sets which state's rules apply"}
      />
      {zipUnknown && <Note tone="warn">That ZIP code is not one we can place in a county.</Note>}
      <NumberField label="Annual household income" value={income} onChange={setIncome} prefix="$" placeholder="0" />
      <NumberField label="People in household" value={household} onChange={setHousehold} maxLength={2} placeholder="1" />
      <NumberField
        label="Balance owed"
        value={owed}
        onChange={setOwed}
        prefix="$"
        placeholder="0"
        hint="After any bill corrections you have already won."
      />
      <Button primary wide disabled={!now} onClick={prepare}>
        {snap && stale ? "Prepare it again" : "Prepare my letter"}
      </Button>
      {snap && stale && <Fine>Your details have changed since this letter was prepared.</Fine>}
      <p className="panel-foot">
        Made with &lt;3 by <a href="/about">Sanjay Adigopula</a>
      </p>
    </>
  );

  const results = (
    <div>
      <EnvelopeStage
        shown={!!done}
        play={play}
        hint={<span>Fill in your details, then press <b>Prepare my letter</b>.</span>}
      >
        {done && <Letter a={done} copied={copied} onCopy={copy} />}
      </EnvelopeStage>
      {done && play === 0 ? <After /> : done && <AfterWhenSettled play={play} />}
    </div>
  );

  return <Split controls={controls} results={results} />;
}

function Letter({ a, copied, onCopy }: { a: Assessed; copied: boolean; onCopy: () => void }) {
  const { elig, fpl, county, nHousehold, nIncome, nOwed } = a;
  return (
    <article className="letter-sheet">
      <header className="ls-head">
        <div>
          <h2 className="ls-title">What you qualify for</h2>
          <p className="ls-sub">
            {county.name}, {county.stateName}
          </p>
        </div>
        <Badge tone={TIER_TONE[elig.tier]}>{TIER_LABEL[elig.tier]}</Badge>
      </header>
      <Hero
        value={usd(elig.estimatedOwed)}
        label={`estimated balance after assistance, from ${usd(nOwed)} billed`}
        tone={elig.estimatedOwed < nOwed ? "ok" : undefined}
      />
      <FplBands freePct={elig.rule.freePct} discountPct={elig.rule.discountPct} fplPct={elig.fplPct} />
      <Rail tone={TIER_TONE[elig.tier]}>
        <strong>{elig.headline}</strong>
      </Rail>
      <StatRow>
        <Stat value={`${elig.fplPct.toFixed(0)}%`} label="of the poverty level" />
        <Stat value={usd(fpl)} label={`FPL, household of ${nHousehold}`} />
        <Stat value={`${Math.round(elig.patientShare * 100)}%`} label="share you would pay" />
      </StatRow>
      <div className="ls-rules">
        <div className="cat-head">
          <span className="t">{county.stateName} rules</span>
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
      </div>
      {elig.rule.assetNote && <Note tone="warn">{elig.rule.assetNote}</Note>}
      <hr className="ls-fold" />
      <div className="row" id="letter-text">
        <H2>Your application letter</H2>
        <span className="spacer">
          <Button primary small onClick={onCopy}>
            {copied ? "Letter copied" : "Copy the letter"}
          </Button>
        </span>
      </div>
      <p className="ls-body">{a.letter}</p>
    </article>
  );
}

function AfterWhenSettled({ play }: { play: number }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    const t = window.setTimeout(() => setReady(true), 2700);
    return () => window.clearTimeout(t);
  }, [play]);
  return ready ? <After /> : null;
}

function After() {
  return (
    <div className="after">
      <Card flush>
        <div style={{ padding: "16px 16px 6px" }}>
          <H2>After you send it</H2>
        </div>
        <ListRow icon={<IconDoc />} title="Send it in writing" sub="Email or post to the billing department, and keep a copy" />
        <ListRow icon={<IconPhone />} title="Ask for collection to pause" sub="Most policies require it while an application is open" />
        <ListRow
          icon={<IconPin />}
          title="Ask for the dates of service it covers"
          sub="Assistance is usually assessed per date, and can be applied retroactively"
        />
      </Card>
    </div>
  );
}
