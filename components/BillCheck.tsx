"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type Audit,
  type Flag,
  type Geo,
  SAMPLE_BILL,
  assessEligibility,
  auditBill,
  buildScript,
  countyForZip,
  loadGeo,
  loadZipMap,
  parseBill,
} from "@/lib/engine";
import { readBillImage } from "@/lib/ocr";
import {
  Button,
  Card,
  type Column,
  Columns,
  Divider,
  Field,
  Fine,
  H1,
  H2,
  Hero,
  IconCheck,
  IconFlag,
  Lede,
  Legend,
  ListRow,
  Note,
  NumberField,
  Ring,
  SectionHead,
  Spark,
  Split,
  Stack,
  Stat,
  StatRow,
  useDebounced,
  usd,
  usdShort,
  useStored,
  useStoredList,
} from "@/ui";
import { EnvelopeStage } from "./Envelope";
import { Scan, type ScanState } from "./Scan";

const toneFor = (s: Flag["severity"]) => (s === "high" ? "danger" : s === "medium" ? "warn" : "info");

const KIND_LABEL: Record<string, string> = {
  overcharge: "Priced over",
  unbundling: "Unbundled",
  duplicate: "Duplicate",
  units: "Unit count",
  upcoding: "Upcoded",
  facility: "Facility fee",
  modifier: "Modifier",
  unknown_code: "Unpriced",
  surprise: "Out of network",
};

const auditKey = (a: Audit | null) =>
  a ? `${a.lines.length}:${Math.round(a.totalBilled)}:${a.index.toFixed(2)}` : null;

/** Held outside React so leaving the tab and coming back keeps the result out. */
let lastPrinted: string | null = null;

/**
 * The bill check.  The bill goes in on the left, by camera, photo or paste;
 * Check my bill opens the envelope on the right and the checked bill comes
 * out, priced line by line, with the findings and call script under it.
 */
export function BillCheck({ onUseBalance }: { onUseBalance: () => void }) {
  const [text, setText] = useStored("bill_text", "");
  const [zip, setZip] = useStored("zip", "");
  const [income] = useStored("rr_income", "");
  const [household] = useStored("rr_household", "1");
  const [reviewed, setReviewed] = useStoredList("bill_reviewed");
  const [geo, setGeo] = useState<Geo | null>(null);
  const [zipMap, setZipMap] = useState<Record<string, string> | null>(null);
  const [scan, setScan] = useState<ScanState>({ busy: false, pct: 0, label: "", error: "", added: 0 });
  const [printedKey, setPrintedKey] = useState<string | null>(lastPrinted);
  const [play, setPlay] = useState(0);

  useEffect(() => {
    Promise.all([loadGeo(), loadZipMap()]).then(([g, z]) => {
      setGeo(g);
      setZipMap(z);
    });
  }, []);

  const county = useMemo(() => {
    if (!geo || !zipMap || zip.length < 5) return null;
    return countyForZip(geo, zipMap, zip);
  }, [geo, zipMap, zip]);

  const debounced = useDebounced(text, 250);
  const audit = useMemo(() => {
    const lines = parseBill(debounced);
    if (lines.length === 0) return null;
    return auditBill(lines, county);
  }, [debounced, county]);

  const owed = audit ? Math.max(0, audit.totalBilled - audit.totalRecoverable) : 0;
  const eligibility = useMemo(() => {
    const amount = Number(income.replace(/\D/g, ""));
    if (!audit || !county || amount <= 0) return null;
    return assessEligibility(amount, Number(household) || 1, county.state, owed);
  }, [income, household, county, audit, owed]);

  const scanFile = useCallback(
    async (file: File) => {
      setScan({ busy: true, pct: 0.02, label: "Preparing the photo", error: "", added: 0 });
      try {
        const found = await readBillImage(file, (p) => setScan((s) => ({ ...s, pct: p.pct, label: p.label })));
        const lines = parseBill(found);
        if (found.trim().length === 0) {
          setScan({
            busy: false,
            pct: 1,
            label: "",
            added: 0,
            error:
              "Nothing readable came out of that photo. A flat, well-lit shot of the itemised page, with the code and charge columns both in frame, reads best.",
          });
          return;
        }
        // Appended, because an itemised bill usually runs to several pages.
        setText(text.trim() ? `${text.trim()}\n${found}` : found);
        setReviewed([]);
        setScan({
          busy: false,
          pct: 1,
          label: "",
          added: lines.length,
          error:
            lines.length === 0
              ? "The text came through but no line carried both a code and a charge. It is in the box below to correct."
              : "",
        });
      } catch {
        setScan({
          busy: false,
          pct: 0,
          label: "",
          added: 0,
          error: "The reader could not start. It needs a one-off download on the first scan, so check the connection and try again.",
        });
      }
    },
    [text, setText, setReviewed],
  );

  const key = auditKey(audit);
  const shown = printedKey !== null && audit !== null;
  const stale = printedKey !== null && key !== printedKey;

  const print = () => {
    if (!key) return;
    lastPrinted = key;
    setPrintedKey(key);
    setPlay((p) => p + 1);
  };

  const useBalance = () => {
    try {
      window.localStorage.setItem("rr_owed", String(Math.round(owed)));
    } catch {}
    onUseBalance();
  };

  const controls = (
    <>
      <div className="stack-s">
        <H1>Check an itemised hospital bill</H1>
        <Lede>
          Photograph, upload or paste the bill. Every line is priced against what the procedure
          typically costs where the care happened, and anything that should not be there is struck.
        </Lede>
      </div>
      <Scan scan={scan} scanFile={scanFile} />
      <Field label="Itemised bill" hint="One line per charge, each with its code and amount. Edit anything the scan read wrongly.">
        <textarea
          className="textarea"
          value={text}
          spellCheck={false}
          placeholder="Paste the itemised bill here"
          onChange={(e) => setText(e.target.value)}
        />
      </Field>
      <div className="row">
        <Button
          small
          onClick={() => {
            setText(SAMPLE_BILL);
            setReviewed([]);
          }}
        >
          Use the example bill
        </Button>
        {text && (
          <Button small quiet onClick={() => setText("")}>
            Clear
          </Button>
        )}
      </div>
      <NumberField
        label="ZIP code where the care happened"
        value={zip}
        onChange={setZip}
        maxLength={5}
        placeholder="e.g. 10001"
        hint={
          county
            ? `${county.name}, ${county.stateName}. Local price index ${audit ? audit.index.toFixed(2) : "—"}.`
            : zip.length >= 5
              ? "Not recognised, national prices used."
              : "Sets the local price benchmark. Without it prices are national."
        }
      />
      <Button primary wide disabled={!key} onClick={print}>
        {printedKey !== null && stale ? "Check it again" : "Check my bill"}
      </Button>
      {!key && <Fine>Add a bill with at least one coded charge to check it.</Fine>}
      {printedKey !== null && stale && <Fine>The bill has changed since it was checked.</Fine>}
    </>
  );

  const results = (
    <div>
      <EnvelopeStage
        shown={shown}
        play={play}
        hint={
          <>
            <span>Add a bill on the left, or use the example, then press <b>Check my bill</b>.</span>
          </>
        }
      >
        {shown && audit && <BillSheet audit={audit} countyLabel={county ? `${county.name}, ${county.stateName}` : null} />}
      </EnvelopeStage>
      {shown && audit && (
        <Settled play={play}>
          <Findings
            audit={audit}
            reviewed={reviewed}
            setReviewed={setReviewed}
            script={() => buildScript(audit, eligibility, county)}
            countyName={county?.name ?? null}
            owed={owed}
            estimated={eligibility?.estimatedOwed ?? null}
            onUseBalance={useBalance}
          />
        </Settled>
      )}
    </div>
  );

  return <Split controls={controls} results={results} />;
}

/** What follows the sheet waits until the envelope has gone. */
export function Settled({ play, children }: { play: number; children: React.ReactNode }) {
  const [ready, setReady] = useState(play === 0);
  useEffect(() => {
    if (play === 0) return;
    setReady(false);
    const t = window.setTimeout(() => setReady(true), 2700);
    return () => window.clearTimeout(t);
  }, [play]);
  return ready ? <div className="after">{children}</div> : null;
}

/* ---------------------------------------------------------------- the sheet */

function BillSheet({ audit, countyLabel }: { audit: Audit; countyLabel: string | null }) {
  const over = Math.max(0, audit.totalBilled - audit.totalFair);
  const date = audit.lines.find((l) => l.line.date)?.line.date;

  return (
    <article className="letter-sheet">
      <header className="ls-head">
        <div>
          <h2 className="ls-title">Your bill, checked</h2>
          <p className="ls-sub">
            {audit.lines.length} {audit.lines.length === 1 ? "line" : "lines"}
            {date ? `, care on ${date}` : ""}. {audit.pricedLines} matched the price reference.{" "}
            {countyLabel
              ? `Priced for ${countyLabel}, local index ${audit.index.toFixed(2)}.`
              : "Priced at national rates."}
          </p>
        </div>
      </header>

      <div>
        <div className="sl-row sl-th" aria-hidden>
          <span className="u">Units</span>
          <span>Charge</span>
          <span className="n">Billed</span>
          <span className="n">Fair</span>
        </div>
        {audit.lines.map((l) => (
          <div key={l.line.id} className={l.removed ? "sl-row struck" : "sl-row"}>
            <span className="u num">{l.line.units}</span>
            <span className="item">
              <span className="item-t">{l.proc?.name ?? l.line.description}</span>
              <span className={l.removed ? "item-s danger" : l.overcharge > 0 ? "item-s warn" : "item-s"}>
                {l.line.code}
                {l.line.date ? ` · ${l.line.date}` : ""}
                {l.removed
                  ? " · should not be on the bill"
                  : l.line.unknown
                    ? " · not in the price reference"
                    : l.overcharge > 0
                      ? ` · ${usd(l.overcharge)} over${l.ratio > 1 ? `, ${l.ratio.toFixed(1)}× fair` : ""}`
                      : " · within the fair range"}
              </span>
            </span>
            <span className="n num">{usd(l.line.charge)}</span>
            <span className="n num">{l.line.unknown ? "—" : usd(l.removed ? 0 : l.fairTypical)}</span>
          </div>
        ))}
      </div>

      <div>
        <div className="sl-total">
          <span>Billed</span>
          <span className="num">{usd(audit.totalBilled)}</span>
        </div>
        <div className="sl-total">
          <span>Fair, typical for this care</span>
          <span className="num">{usd(audit.totalFair)}</span>
        </div>
        <div className="sl-total">
          <span>Charged above the fair range</span>
          <span className="num">{usd(over)}</span>
        </div>
        <div className="sl-total big">
          <span>Plausibly recoverable</span>
          <span className={audit.totalRecoverable > 0 ? "num danger" : "num ok"}>{usd(audit.totalRecoverable)}</span>
        </div>
      </div>
    </article>
  );
}

/* ---------------------------------------------------------------- findings */

interface CatRow {
  key: string;
  billed: number;
  fair: number;
  over: number;
}

function Findings({
  audit,
  reviewed,
  setReviewed,
  script,
  countyName,
  owed,
  estimated,
  onUseBalance,
}: {
  audit: Audit;
  reviewed: string[];
  setReviewed: (v: string[]) => void;
  script: () => string;
  countyName: string | null;
  owed: number;
  estimated: number | null;
  onUseBalance: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const flagKey = (f: Flag) => `${f.kind}:${f.lineIds.join("+")}`;
  const serious = audit.flags.filter((f) => f.severity !== "info");
  const toggle = (k: string) => setReviewed(reviewed.includes(k) ? reviewed.filter((x) => x !== k) : [...reviewed, k]);

  const cats: CatRow[] = useMemo(() => {
    const by = new Map<string, CatRow>();
    for (const l of audit.lines) {
      const key = l.proc?.category ?? "Other";
      const row = by.get(key) ?? { key, billed: 0, fair: 0, over: 0 };
      row.billed += l.line.charge;
      row.over += l.removed ? l.line.charge : Math.max(0, l.line.charge - l.fairTypical);
      row.fair += l.removed ? 0 : l.fairTypical;
      by.set(key, row);
    }
    return [...by.values()].sort((a, b) => b.billed - a.billed);
  }, [audit]);

  const columns: Column[] = cats.map((c) => ({
    key: c.key,
    label: c.key,
    fair: Math.max(0, c.billed - c.over),
    over: c.over,
  }));

  const running = useMemo(() => {
    const billed: number[] = [];
    const fair: number[] = [];
    let b = 0;
    let f = 0;
    for (const l of audit.lines) {
      b += l.line.charge;
      f += l.removed ? 0 : l.fairTypical;
      billed.push(b);
      fair.push(f);
    }
    return { billed, fair };
  }, [audit]);

  const byKind = useMemo(() => {
    const by = new Map<string, number>();
    for (const f of serious) by.set(f.kind, (by.get(f.kind) ?? 0) + f.recoverable);
    return [...by.entries()]
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audit]);

  const open = serious.filter((f) => !reviewed.includes(flagKey(f)));
  const done = serious.filter((f) => reviewed.includes(flagKey(f)));
  const over = Math.max(0, audit.totalBilled - audit.totalFair);

  const copyScript = async () => {
    try {
      await navigator.clipboard.writeText(script());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Stack>
      <Card raised>
        <Stack>
          <Hero
            value={usd(audit.totalRecoverable)}
            label={`plausibly recoverable from ${usd(audit.totalBilled)} billed`}
            tone={audit.totalRecoverable > 0 ? "danger" : "ok"}
          />
          <div>
            <Spark
              series={[
                { label: "Fair", points: running.fair, slot: "s1" },
                { label: "Billed", points: running.billed, slot: "s2" },
              ]}
              callout={over > 0 ? `${usdShort(over)} over` : "within range"}
            />
            <div style={{ marginTop: 10 }}>
              <Legend
                items={[
                  { label: "Fair range", swatch: "s1" },
                  { label: "Billed", swatch: "s2" },
                ]}
              />
            </div>
          </div>
        </Stack>
      </Card>

      <Card>
        <Stack tight>
          <H2>{open.length ? `${open.length} ${open.length === 1 ? "finding" : "findings"} to review` : "Findings"}</H2>
          {open.length === 0 ? (
            <Note tone="ok">
              {serious.length === 0
                ? "No lines priced far enough outside the fair range to be worth a call."
                : "Every finding has been through. The call script below still lists them all."}
            </Note>
          ) : (
            <div className="bleed">
              {open.map((f) => {
                const key = flagKey(f);
                return (
                  <ListRow
                    key={key}
                    icon={<IconFlag />}
                    tone={toneFor(f.severity)}
                    title={f.title}
                    sub={f.detail}
                    amount={f.recoverable > 0 ? usd(f.recoverable) : undefined}
                    footer={
                      <span className="row" style={{ gap: 8, marginTop: 8 }}>
                        <span className={`kind ${toneFor(f.severity)}`}>{KIND_LABEL[f.kind] ?? f.kind}</span>
                        <span className="spacer">
                          <Button small onClick={() => toggle(key)}>
                            <IconCheck size={16} /> Mark reviewed
                          </Button>
                        </span>
                      </span>
                    }
                  />
                );
              })}
            </div>
          )}
        </Stack>
      </Card>

      {done.length > 0 && (
        <Card>
          <Stack tight>
            <SectionHead
              title="Reviewed"
              right={
                <Button small quiet onClick={() => setReviewed([])}>
                  Undo all
                </Button>
              }
            />
            <div className="bleed">
              {done.map((f) => {
                const key = flagKey(f);
                return (
                  <ListRow
                    key={key}
                    icon={<IconCheck />}
                    tone="ok"
                    title={f.title}
                    amount={f.recoverable > 0 ? usd(f.recoverable) : undefined}
                    onClick={() => toggle(key)}
                  />
                );
              })}
            </div>
          </Stack>
        </Card>
      )}

      {byKind.length > 0 && (
        <Card>
          <Stack tight>
            <H2>Where the money is</H2>
            <div className="dials">
              {byKind.map(([kind, amount]) => (
                <Ring
                  key={kind}
                  pct={(amount / Math.max(audit.totalRecoverable, 1)) * 100}
                  tone="s2"
                  center={usdShort(amount)}
                  label={KIND_LABEL[kind] ?? kind}
                />
              ))}
            </div>
          </Stack>
        </Card>
      )}

      {columns.length > 1 && (
        <Card>
          <Stack tight>
            <H2>By category</H2>
            <Columns data={columns} format={usd} />
            <Legend
              items={[
                { label: "Fair range", swatch: "s1" },
                { label: "Above it", swatch: "s2" },
              ]}
            />
          </Stack>
        </Card>
      )}

      <Card>
        <Stack tight>
          <StatRow>
            <Stat value={usd(audit.totalBilled)} label="Billed" />
            <Stat value={usd(audit.totalFair)} label="Fair, typical" />
            <Stat value={audit.index.toFixed(2)} label={countyName ? `Index, ${countyName}` : "Index, national"} />
          </StatRow>
          <Divider />
        </Stack>
      </Card>

      <Card>
        <Stack tight>
          <H2>Then ask for assistance</H2>
          <StatRow two>
            <Stat value={usd(owed)} label="Left after the disputes" />
            <Stat
              value={estimated !== null ? usd(estimated) : "—"}
              label={estimated !== null ? "Estimated with assistance" : "Add your income under Assistance"}
            />
          </StatRow>
          <Button wide onClick={onUseBalance}>
            Use this balance for assistance
          </Button>
        </Stack>
      </Card>

      <Card>
        <Stack tight>
          <H2>The call script</H2>
          <Button primary wide onClick={copyScript}>
            {copied ? "Script copied" : "Copy the call script"}
          </Button>
        </Stack>
      </Card>
    </Stack>
  );
}
