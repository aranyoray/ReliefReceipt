// FairCareAI — read a medical bill, price every line against a fair benchmark,
// flag the coding patterns that inflate it, test charity-care eligibility, and
// produce a script the patient can actually read down the phone.
//
// Everything here is deterministic. The same bill text always yields the same
// findings, the same numbers and the same script.

import type { County } from "./geo";

/** Shared money formatter. Lives here because the audit needs it first. */
export function fmtUsd(v: number): string {
  return `$${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(v))}`;
}


// ---------------------------------------------------------------- procedures

export interface Procedure {
  code: string;
  name: string;
  category: string;
  fairLow: number;
  fairTypical: number;
  fairHigh: number;
  /** Units above this on a single date are implausible for this service. */
  maxUnits: number;
  /** Panel this code is a component of — used to detect unbundling. */
  partOf?: string;
}

export const PROCEDURES: Procedure[] = [
  // Labs
  { code: "36415", name: "Blood draw (venipuncture)", category: "Lab", fairLow: 5, fairTypical: 12, fairHigh: 30, maxUnits: 2 },
  { code: "81003", name: "Urinalysis, automated", category: "Lab", fairLow: 5, fairTypical: 10, fairHigh: 25, maxUnits: 2 },
  { code: "83036", name: "Hemoglobin A1c", category: "Lab", fairLow: 10, fairTypical: 20, fairHigh: 38, maxUnits: 1 },
  { code: "85025", name: "Complete blood count with differential", category: "Lab", fairLow: 10, fairTypical: 20, fairHigh: 40, maxUnits: 2 },
  { code: "85027", name: "Complete blood count, automated", category: "Lab", fairLow: 8, fairTypical: 16, fairHigh: 34, maxUnits: 2, partOf: "85025" },
  { code: "80053", name: "Comprehensive metabolic panel", category: "Lab", fairLow: 10, fairTypical: 22, fairHigh: 45, maxUnits: 1 },
  { code: "80048", name: "Basic metabolic panel", category: "Lab", fairLow: 8, fairTypical: 18, fairHigh: 38, maxUnits: 1, partOf: "80053" },
  { code: "82565", name: "Creatinine, blood", category: "Lab", fairLow: 5, fairTypical: 9, fairHigh: 20, maxUnits: 1, partOf: "80053" },
  { code: "84520", name: "Urea nitrogen (BUN)", category: "Lab", fairLow: 5, fairTypical: 8, fairHigh: 18, maxUnits: 1, partOf: "80053" },
  { code: "82947", name: "Glucose, quantitative", category: "Lab", fairLow: 4, fairTypical: 8, fairHigh: 18, maxUnits: 1, partOf: "80053" },
  { code: "84443", name: "Thyroid stimulating hormone (TSH)", category: "Lab", fairLow: 12, fairTypical: 24, fairHigh: 48, maxUnits: 1 },
  { code: "80061", name: "Lipid panel", category: "Lab", fairLow: 15, fairTypical: 28, fairHigh: 55, maxUnits: 1 },
  { code: "82465", name: "Cholesterol, total", category: "Lab", fairLow: 5, fairTypical: 9, fairHigh: 20, maxUnits: 1, partOf: "80061" },
  { code: "84478", name: "Triglycerides", category: "Lab", fairLow: 5, fairTypical: 10, fairHigh: 22, maxUnits: 1, partOf: "80061" },
  { code: "83718", name: "HDL cholesterol", category: "Lab", fairLow: 5, fairTypical: 10, fairHigh: 22, maxUnits: 1, partOf: "80061" },
  { code: "87804", name: "Influenza rapid test", category: "Lab", fairLow: 12, fairTypical: 25, fairHigh: 55, maxUnits: 2 },
  { code: "87635", name: "SARS-CoV-2 amplified probe", category: "Lab", fairLow: 20, fairTypical: 45, fairHigh: 95, maxUnits: 1 },
  { code: "88305", name: "Tissue pathology exam", category: "Lab", fairLow: 60, fairTypical: 110, fairHigh: 230, maxUnits: 6 },

  // Diagnostics
  { code: "93000", name: "Electrocardiogram, complete", category: "Diagnostic", fairLow: 30, fairTypical: 55, fairHigh: 120, maxUnits: 1 },
  { code: "93005", name: "Electrocardiogram, tracing only", category: "Diagnostic", fairLow: 15, fairTypical: 30, fairHigh: 70, maxUnits: 1, partOf: "93000" },
  { code: "93010", name: "Electrocardiogram, interpretation only", category: "Diagnostic", fairLow: 12, fairTypical: 25, fairHigh: 55, maxUnits: 1, partOf: "93000" },
  { code: "93306", name: "Echocardiogram, complete with Doppler", category: "Diagnostic", fairLow: 200, fairTypical: 400, fairHigh: 800, maxUnits: 1 },
  { code: "94010", name: "Spirometry", category: "Diagnostic", fairLow: 25, fairTypical: 50, fairHigh: 110, maxUnits: 1 },
  { code: "95810", name: "Sleep study, attended", category: "Diagnostic", fairLow: 600, fairTypical: 1100, fairHigh: 2200, maxUnits: 1 },

  // Imaging
  { code: "71046", name: "Chest X-ray, 2 views", category: "Imaging", fairLow: 45, fairTypical: 95, fairHigh: 210, maxUnits: 1 },
  { code: "73030", name: "Shoulder X-ray", category: "Imaging", fairLow: 40, fairTypical: 85, fairHigh: 180, maxUnits: 2 },
  { code: "73630", name: "Foot X-ray, complete", category: "Imaging", fairLow: 40, fairTypical: 80, fairHigh: 175, maxUnits: 2 },
  { code: "77067", name: "Screening mammogram, bilateral", category: "Imaging", fairLow: 100, fairTypical: 170, fairHigh: 290, maxUnits: 1 },
  { code: "76700", name: "Abdominal ultrasound, complete", category: "Imaging", fairLow: 120, fairTypical: 240, fairHigh: 480, maxUnits: 1 },
  { code: "76805", name: "Obstetric ultrasound", category: "Imaging", fairLow: 130, fairTypical: 250, fairHigh: 500, maxUnits: 1 },
  { code: "70450", name: "CT head, no contrast", category: "Imaging", fairLow: 300, fairTypical: 550, fairHigh: 1100, maxUnits: 1 },
  { code: "74177", name: "CT abdomen and pelvis with contrast", category: "Imaging", fairLow: 450, fairTypical: 850, fairHigh: 1700, maxUnits: 1 },
  { code: "71250", name: "CT chest, no contrast", category: "Imaging", fairLow: 330, fairTypical: 600, fairHigh: 1200, maxUnits: 1 },
  { code: "72148", name: "MRI lumbar spine, no contrast", category: "Imaging", fairLow: 350, fairTypical: 600, fairHigh: 1100, maxUnits: 1 },
  { code: "70553", name: "MRI brain, with and without contrast", category: "Imaging", fairLow: 500, fairTypical: 900, fairHigh: 1800, maxUnits: 1 },
  { code: "73721", name: "MRI lower extremity joint", category: "Imaging", fairLow: 380, fairTypical: 680, fairHigh: 1300, maxUnits: 1 },

  // Office visits
  { code: "99202", name: "Office visit, new patient (straightforward)", category: "Visit", fairLow: 70, fairTypical: 110, fairHigh: 175, maxUnits: 1 },
  { code: "99203", name: "Office visit, new patient (low)", category: "Visit", fairLow: 110, fairTypical: 170, fairHigh: 260, maxUnits: 1 },
  { code: "99204", name: "Office visit, new patient (moderate)", category: "Visit", fairLow: 160, fairTypical: 250, fairHigh: 380, maxUnits: 1 },
  { code: "99205", name: "Office visit, new patient (high)", category: "Visit", fairLow: 210, fairTypical: 330, fairHigh: 500, maxUnits: 1 },
  { code: "99212", name: "Office visit, established (straightforward)", category: "Visit", fairLow: 50, fairTypical: 80, fairHigh: 125, maxUnits: 1 },
  { code: "99213", name: "Office visit, established (low)", category: "Visit", fairLow: 75, fairTypical: 120, fairHigh: 180, maxUnits: 1 },
  { code: "99214", name: "Office visit, established (moderate)", category: "Visit", fairLow: 110, fairTypical: 165, fairHigh: 250, maxUnits: 1 },
  { code: "99215", name: "Office visit, established (high)", category: "Visit", fairLow: 150, fairTypical: 230, fairHigh: 350, maxUnits: 1 },
  { code: "99395", name: "Preventive visit, established 18–39", category: "Visit", fairLow: 130, fairTypical: 200, fairHigh: 310, maxUnits: 1 },
  { code: "99396", name: "Preventive visit, established 40–64", category: "Visit", fairLow: 140, fairTypical: 215, fairHigh: 330, maxUnits: 1 },

  // Emergency and urgent
  { code: "99281", name: "Emergency visit, minor", category: "Emergency", fairLow: 90, fairTypical: 170, fairHigh: 340, maxUnits: 1 },
  { code: "99282", name: "Emergency visit, low", category: "Emergency", fairLow: 180, fairTypical: 330, fairHigh: 680, maxUnits: 1 },
  { code: "99283", name: "Emergency visit, moderate", category: "Emergency", fairLow: 350, fairTypical: 650, fairHigh: 1300, maxUnits: 1 },
  { code: "99284", name: "Emergency visit, high", category: "Emergency", fairLow: 600, fairTypical: 1100, fairHigh: 2200, maxUnits: 1 },
  { code: "99285", name: "Emergency visit, highest severity", category: "Emergency", fairLow: 900, fairTypical: 1700, fairHigh: 3400, maxUnits: 1 },
  { code: "99051", name: "After-hours service", category: "Emergency", fairLow: 15, fairTypical: 35, fairHigh: 80, maxUnits: 1 },

  // Procedures
  { code: "45378", name: "Colonoscopy, diagnostic", category: "Procedure", fairLow: 900, fairTypical: 1500, fairHigh: 2800, maxUnits: 1 },
  { code: "45380", name: "Colonoscopy with biopsy", category: "Procedure", fairLow: 1000, fairTypical: 1750, fairHigh: 3200, maxUnits: 1 },
  { code: "43239", name: "Upper GI endoscopy with biopsy", category: "Procedure", fairLow: 850, fairTypical: 1500, fairHigh: 2800, maxUnits: 1 },
  { code: "12001", name: "Simple wound repair", category: "Procedure", fairLow: 120, fairTypical: 250, fairHigh: 520, maxUnits: 2 },
  { code: "20610", name: "Large joint injection", category: "Procedure", fairLow: 70, fairTypical: 150, fairHigh: 320, maxUnits: 2 },
  { code: "29881", name: "Knee arthroscopy with meniscectomy", category: "Procedure", fairLow: 2600, fairTypical: 4500, fairHigh: 8500, maxUnits: 1 },
  { code: "66984", name: "Cataract surgery with lens insert", category: "Procedure", fairLow: 1800, fairTypical: 3000, fairHigh: 5600, maxUnits: 1 },
  { code: "59400", name: "Obstetric care, vaginal delivery (global)", category: "Procedure", fairLow: 3000, fairTypical: 5200, fairHigh: 9500, maxUnits: 1 },
  { code: "59510", name: "Obstetric care, caesarean (global)", category: "Procedure", fairLow: 4200, fairTypical: 7200, fairHigh: 13000, maxUnits: 1 },

  // Anesthesia and facility
  { code: "00810", name: "Anesthesia for lower GI endoscopy", category: "Anesthesia", fairLow: 200, fairTypical: 420, fairHigh: 900, maxUnits: 1 },
  { code: "01967", name: "Anesthesia for labour (epidural)", category: "Anesthesia", fairLow: 400, fairTypical: 800, fairHigh: 1700, maxUnits: 1 },
  { code: "99070", name: "Supplies and materials", category: "Facility", fairLow: 5, fairTypical: 25, fairHigh: 90, maxUnits: 4 },
  { code: "G0463", name: "Hospital outpatient clinic visit (facility fee)", category: "Facility", fairLow: 50, fairTypical: 120, fairHigh: 260, maxUnits: 1 },
  { code: "J1885", name: "Ketorolac injection, 15 mg", category: "Drug", fairLow: 2, fairTypical: 6, fairHigh: 18, maxUnits: 4 },
  { code: "J3301", name: "Triamcinolone injection, 10 mg", category: "Drug", fairLow: 3, fairTypical: 9, fairHigh: 25, maxUnits: 8 },
  { code: "96372", name: "Therapeutic injection, subcutaneous/IM", category: "Procedure", fairLow: 15, fairTypical: 35, fairHigh: 80, maxUnits: 3 },
];

const BY_CODE: Record<string, Procedure> = Object.fromEntries(
  PROCEDURES.map((p) => [p.code, p]),
);

export function procedureByCode(code: string): Procedure | undefined {
  return BY_CODE[code.toUpperCase()];
}

/** Codes whose panel parent, if also billed the same day, means unbundling. */
const EM_LADDER: Record<string, string> = {
  "99215": "99214",
  "99214": "99213",
  "99205": "99204",
  "99204": "99203",
};

// ------------------------------------------------------------------- parsing

export interface BillLine {
  id: string;
  code: string;
  description: string;
  units: number;
  charge: number;
  modifier: string;
  date: string;
  /** True when the code is not in the fair-price reference. */
  unknown: boolean;
}

const CODE_RE = /\b(\d{5}|[A-Z]\d{4})\b/;
const MONEY_RE = /\$?\s*(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{2}))?\b/g;
const DATE_RE = /\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/;
const MOD_RE = /\b(?:-|MOD\s*)(\d{2}|[A-Z]{2})\b/i;

function parseMoney(raw: string, cents?: string): number {
  const n = Number(raw.replace(/,/g, ""));
  return cents ? n + Number(cents) / 100 : n;
}

/**
 * Pull billable lines out of pasted bill text.
 *
 * A line qualifies when it contains a CPT/HCPCS-shaped code and at least one
 * money amount. The charge is taken as the largest money value on the line,
 * which survives the common layouts where a bill prints
 * `units · unit price · line total` or `charge · insurance paid · you owe`.
 */
export function parseBill(text: string): BillLine[] {
  const out: BillLine[] = [];

  text.split(/\r?\n/).forEach((rawLine, i) => {
    const line = rawLine.trim();
    if (!line) return;

    const dateHit = line.match(DATE_RE);
    const date = dateHit ? dateHit[1] : "";

    // Strip the date so its digits cannot be mistaken for a code or amount.
    const work = date ? line.replace(date, " ") : line;

    const codeHit = work.match(CODE_RE);
    if (!codeHit) return;
    const code = codeHit[1].toUpperCase();

    const afterCode = work.slice((codeHit.index ?? 0) + code.length);

    const nums: { value: number; start: number; end: number }[] = [];
    MONEY_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = MONEY_RE.exec(afterCode)) !== null) {
      nums.push({
        value: parseMoney(m[1], m[2]),
        start: m.index,
        end: m.index + m[0].length,
      });
    }
    if (nums.length === 0) return;

    const chargeTok = nums.reduce((a, b) => (b.value >= a.value ? b : a));
    const charge = chargeTok.value;

    // Units: an explicit "x2" / "QTY 2" marker wins. Otherwise take the integer
    // sitting in the column immediately left of the charge — separated from it
    // by whitespace only, so a "2" inside "CHEST XRAY 2 VIEWS" is not mistaken
    // for a unit count.
    let units = 1;
    const explicit = afterCode.match(/\b(?:x|qty|units?)\s*[:.]?\s*(\d{1,3})\b/i);
    if (explicit) {
      units = Number(explicit[1]);
    } else {
      const left = nums
        .filter((n) => n.end <= chargeTok.start)
        .sort((a, b) => b.end - a.end)[0];
      if (
        left &&
        Number.isInteger(left.value) &&
        left.value >= 1 &&
        left.value <= 99 &&
        /^\s*$/.test(afterCode.slice(left.end, chargeTok.start))
      ) {
        units = left.value;
      }
    }

    const modHit = afterCode.match(MOD_RE) ?? work.match(MOD_RE);
    const modifier = modHit ? modHit[1].toUpperCase() : "";

    const known = procedureByCode(code);
    const description =
      afterCode
        .replace(MONEY_RE, " ")
        .replace(/\b\d{1,3}\b/g, " ")
        .replace(/[|*·\-–—]+/g, " ")
        .replace(/\s+/g, " ")
        .trim() || known?.name || "Unlabelled line";

    out.push({
      id: `L${i}-${code}`,
      code,
      description: description.slice(0, 60),
      units: Math.max(1, Math.min(units, 999)),
      charge,
      modifier,
      date,
      unknown: !known,
    });
  });

  return out;
}

// ------------------------------------------------------------------- OCR

/**
 * Tidy text that came out of a photo before it is parsed.
 *
 * Optical recognition of a printed bill fails in a small, repeatable set of
 * ways: zero read as the letter O inside a CPT code, one read as l or I, a
 * dollar sign read as S, and a line wrapped so the code sits on one row and
 * the charge on the next. Each is corrected only inside a token that is
 * already mostly digits, so wording in the description is left alone.
 *
 * Nothing here guesses at a value: a token that is not digit-shaped is passed
 * through untouched, and a line the parser cannot read stays unread rather
 * than being invented.
 */
export function cleanOcrText(raw: string): string {
  const fixDigits = (tok: string): string =>
    tok
      .replace(/[OoQ]/g, "0")
      .replace(/[lI|]/g, "1")
      .replace(/[Ss]/g, "5")
      .replace(/B/g, "8")
      .replace(/Z/g, "2");

  const lines = raw
    .split(/\r?\n/)
    .map((line) =>
      line
        // A dollar sign leading a figure is frequently read as the letter S.
        // Only the letter is corrected: a bare 5 in that position is far more
        // often a unit count than a mangled dollar sign.
        .replace(/(^|\s)S\s?(?=\d)/g, "$1$")
        .split(/\s+/)
        .map((tok) => {
          const core = tok.replace(/^[^\w]+|[^\w]+$/g, "");
          if (core.length < 2) return tok;
          // Mostly-digits tokens are codes, units, dates or money.
          const digits = (core.match(/\d/g) ?? []).length;
          const letters = (core.match(/[A-Za-z]/g) ?? []).length;
          if (digits >= 2 && digits >= letters) {
            return tok.replace(core, fixDigits(core));
          }
          return tok;
        })
        .join(" ")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter((line) => line.length > 0);

  // Rejoin a line whose charge wrapped onto the row below it.
  const out: string[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const next = lines[i + 1];
    const hasCode = CODE_RE.test(line);
    MONEY_RE.lastIndex = 0;
    const hasMoney = MONEY_RE.test(line);
    if (hasCode && !hasMoney && next) {
      MONEY_RE.lastIndex = 0;
      const nextMoney = MONEY_RE.test(next);
      if (nextMoney && !CODE_RE.test(next)) {
        out.push(`${line} ${next}`);
        i += 1;
        continue;
      }
    }
    out.push(line);
  }

  return out.join("\n");
}

// ------------------------------------------------------------- geo adjustment

/**
 * Local cost index. Fair prices move with the cost of delivering care in a
 * place — wages, rent and the local provider mix — so the benchmark is scaled
 * rather than applied flat nationwide.
 */
export function localIndex(county: County | null): number {
  if (!county) return 1;
  const stateAdj = STATE_COST_INDEX[county.state] ?? 1;
  // Dense metros run above their state average, rural counties below.
  const d = Math.log10(Math.max(county.density, 0.1) + 1);
  const densityAdj = 1 + Math.max(-0.08, Math.min(0.14, (d - 2.0) * 0.07));
  return Number((stateAdj * densityAdj).toFixed(3));
}

const STATE_COST_INDEX: Record<string, number> = {
  AL: 0.9, AK: 1.26, AZ: 0.98, AR: 0.88, CA: 1.21, CO: 1.06, CT: 1.13, DE: 1.04,
  DC: 1.22, FL: 1.0, GA: 0.94, HI: 1.18, ID: 0.93, IL: 1.03, IN: 0.94, IA: 0.92,
  KS: 0.91, KY: 0.9, LA: 0.93, ME: 1.02, MD: 1.1, MA: 1.17, MI: 0.96, MN: 1.05,
  MS: 0.86, MO: 0.92, MT: 0.96, NE: 0.93, NV: 1.02, NH: 1.08, NJ: 1.14, NM: 0.93,
  NY: 1.19, NC: 0.95, ND: 0.97, OH: 0.94, OK: 0.89, OR: 1.08, PA: 1.02, RI: 1.09,
  SC: 0.93, SD: 0.93, TN: 0.91, TX: 0.97, UT: 0.97, VT: 1.07, VA: 1.01, WA: 1.12,
  WV: 0.9, WI: 1.0, WY: 0.99,
};

// ----------------------------------------------------------------- the audit

export type FlagKind =
  | "overcharge"
  | "unbundling"
  | "duplicate"
  | "units"
  | "upcoding"
  | "facility"
  | "modifier"
  | "unknown_code"
  | "surprise";

export type Severity = "high" | "medium" | "info";

export interface Flag {
  kind: FlagKind;
  severity: Severity;
  title: string;
  detail: string;
  /** Dollars plausibly recoverable if the challenge succeeds. */
  recoverable: number;
  lineIds: string[];
}

export interface AuditedLine {
  line: BillLine;
  proc: Procedure | null;
  /** Units the service plausibly supports, capped at the code's maximum. */
  allowedUnits: number;
  fairLow: number;
  fairTypical: number;
  fairHigh: number;
  overcharge: number;
  ratio: number; // billed ÷ fair typical
  /** The line should not appear at all — a duplicate or an unbundled component. */
  removed: boolean;
  flags: Flag[];
}

export interface Audit {
  lines: AuditedLine[];
  flags: Flag[];
  totalBilled: number;
  totalFair: number;
  totalRecoverable: number;
  pricedLines: number;
  unknownLines: number;
  index: number;
}

export function auditBill(lines: BillLine[], county: County | null): Audit {
  const index = localIndex(county);
  const flags: Flag[] = [];

  const audited: AuditedLine[] = lines.map((line) => {
    const proc = procedureByCode(line.code) ?? null;
    if (!proc) {
      return {
        line,
        proc: null,
        allowedUnits: line.units,
        fairLow: 0,
        fairTypical: 0,
        fairHigh: 0,
        overcharge: 0,
        ratio: 0,
        removed: false,
        flags: [],
      };
    }
    // Benchmarks price the units the service can actually support, so an
    // inflated unit count cannot inflate the fair price alongside it.
    const allowedUnits = Math.min(line.units, proc.maxUnits);
    return {
      line,
      proc,
      allowedUnits,
      fairLow: proc.fairLow * index * allowedUnits,
      fairTypical: proc.fairTypical * index * allowedUnits,
      fairHigh: proc.fairHigh * index * allowedUnits,
      overcharge: 0,
      ratio: 0,
      removed: false,
      flags: [],
    };
  });

  const push = (target: AuditedLine | null, flag: Flag) => {
    flags.push(flag);
    if (target) target.flags.push(flag);
  };

  // --- per-line checks
  for (const a of audited) {
    const { line, proc } = a;

    if (!proc) {
      push(a, {
        kind: "unknown_code",
        severity: "info",
        title: `Code ${line.code} not in the reference set`,
        detail:
          "No fair-price benchmark is available for this code, so it is excluded from the totals. Ask the provider for the code description and the cash price before paying it.",
        recoverable: 0,
        lineIds: [line.id],
      });
      continue;
    }

    a.overcharge = Math.max(0, line.charge - a.fairTypical);
    a.ratio = a.fairTypical > 0 ? line.charge / a.fairTypical : 0;

    if (line.charge > a.fairHigh) {
      const far = line.charge > a.fairHigh * 1.8;
      push(a, {
        kind: "overcharge",
        severity: far ? "high" : "medium",
        title: `${proc.name} billed at ${fmtUsd(line.charge)}`,
        detail: `The fair range here is ${fmtUsd(a.fairLow)}–${fmtUsd(a.fairHigh)}${
          line.units > 1 ? ` for ${line.units} units` : ""
        }, typically ${fmtUsd(a.fairTypical)}. This line is ${a.ratio.toFixed(
          1,
        )}× the typical price.`,
        recoverable: line.charge - a.fairTypical,
        lineIds: [line.id],
      });
    }

    if (line.units > proc.maxUnits) {
      const excess = line.units - proc.maxUnits;
      push(a, {
        kind: "units",
        severity: "high",
        title: `${line.units} units of ${proc.name}`,
        detail: `More than ${proc.maxUnits} unit${
          proc.maxUnits > 1 ? "s" : ""
        } of this service on one date is unusual. Ask for the documentation supporting every unit.`,
        recoverable: (line.charge / line.units) * excess,
        lineIds: [line.id],
      });
    }

    if (proc.category === "Visit" && EM_LADDER[proc.code]) {
      push(a, {
        kind: "upcoding",
        severity: "medium",
        title: `${proc.name} is a high-level visit code`,
        detail: `Level selection drives this charge. Ask what documented time or medical decision-making justified ${proc.code} rather than ${EM_LADDER[proc.code]}. If the visit was brief and routine, request a re-review.`,
        recoverable: Math.max(
          0,
          line.charge - (BY_CODE[EM_LADDER[proc.code]]?.fairTypical ?? proc.fairTypical) * index,
        ),
        lineIds: [line.id],
      });
    }

    if (line.modifier === "25") {
      push(a, {
        kind: "modifier",
        severity: "medium",
        title: `Modifier 25 on ${proc.name}`,
        detail:
          "Modifier 25 claims a separately identifiable visit on the same day as another service. It is a common audit target. Ask for the note showing the visit was distinct from the procedure.",
        recoverable: line.charge * 0.5,
        lineIds: [line.id],
      });
    }

    if (line.modifier === "59") {
      push(a, {
        kind: "modifier",
        severity: "medium",
        title: `Modifier 59 on ${proc.name}`,
        detail:
          "Modifier 59 unbundles services that are normally paid together. Ask which distinct site, session or encounter justifies it.",
        recoverable: line.charge * 0.5,
        lineIds: [line.id],
      });
    }

    if (proc.category === "Emergency" || proc.category === "Anesthesia") {
      push(a, {
        kind: "surprise",
        severity: "info",
        title: `${proc.name} may be protected from balance billing`,
        detail:
          "Under the No Surprises Act, emergency care and most out-of-network care delivered at an in-network facility — including anesthesia — cannot be balance billed beyond in-network cost sharing. If this is a balance bill, say so explicitly.",
        recoverable: 0,
        lineIds: [line.id],
      });
    }
  }

  // --- cross-line checks
  const priced = audited.filter((a) => a.proc);

  // Duplicates: same code and same date billed more than once.
  const dupKey = new Map<string, AuditedLine[]>();
  for (const a of priced) {
    const key = `${a.line.code}|${a.line.date}`;
    dupKey.set(key, [...(dupKey.get(key) ?? []), a]);
  }
  for (const [, group] of dupKey) {
    if (group.length < 2) continue;
    const extra = group.slice(1).reduce((s, a) => s + a.line.charge, 0);
    for (const dup of group.slice(1)) dup.removed = true;
    push(group[0], {
      kind: "duplicate",
      severity: "high",
      title: `${group[0].proc!.name} billed ${group.length} times${
        group[0].line.date ? ` on ${group[0].line.date}` : ""
      }`,
      detail:
        "Identical code and date repeated across lines. Unless the service was genuinely repeated, the extra lines should be removed.",
      recoverable: extra,
      lineIds: group.map((a) => a.line.id),
    });
  }

  // Unbundling: a panel and its components both billed.
  const codesPresent = new Set(priced.map((a) => a.line.code));
  for (const a of priced) {
    const parent = a.proc!.partOf;
    if (!parent || !codesPresent.has(parent)) continue;
    a.removed = true;
    push(a, {
      kind: "unbundling",
      severity: "high",
      title: `${a.proc!.name} billed alongside ${BY_CODE[parent]?.name ?? parent}`,
      detail: `${a.line.code} is already included in ${parent}. Billing both splits one service into two charges. Ask for the component line to be removed.`,
      recoverable: a.line.charge,
      lineIds: [a.line.id],
    });
  }

  // Facility fee stacked on an office visit.
  const facility = priced.find((a) => a.proc!.category === "Facility" && a.proc!.code === "G0463");
  const officeVisit = priced.find((a) => a.proc!.category === "Visit");
  if (facility && officeVisit) {
    push(facility, {
      kind: "facility",
      severity: "medium",
      title: "Facility fee charged on top of an office visit",
      detail:
        "A hospital-owned clinic can bill a facility fee in addition to the professional charge, which is why the same visit costs more here than at an independent office. Ask whether the service could have been provided at a non-facility rate, and whether the fee was disclosed in advance.",
      recoverable: facility.line.charge * 0.6,
      lineIds: [facility.line.id, officeVisit.line.id],
    });
  }

  const totalBilled = audited.reduce((s, a) => s + a.line.charge, 0);

  // Totals are derived from the lines themselves rather than by summing the
  // findings, because several findings can land on one line and must not each
  // claim the same dollars. A line that should not exist is recoverable in
  // full; any other line is recoverable down to its fair price and no further.
  const totalFair = priced
    .filter((a) => !a.removed)
    .reduce((s, a) => s + a.fairTypical, 0);

  const totalRecoverable = priced.reduce(
    (s, a) => s + (a.removed ? a.line.charge : Math.max(0, a.line.charge - a.fairTypical)),
    0,
  );

  return {
    lines: audited,
    flags: flags.sort((a, b) => sevRank(a.severity) - sevRank(b.severity) || b.recoverable - a.recoverable),
    totalBilled,
    totalFair,
    totalRecoverable,
    pricedLines: priced.length,
    unknownLines: audited.length - priced.length,
    index,
  };
}

function sevRank(s: Severity): number {
  return s === "high" ? 0 : s === "medium" ? 1 : 2;
}

// ------------------------------------------------------------- charity care

// 2026 federal poverty guidelines.


export const SAMPLE_BILL = `DATE       CODE    DESCRIPTION                      UNITS   CHARGE
03/14/2026 99214   OFFICE VISIT EST PATIENT            1    412.00
03/14/2026 G0463   HOSPITAL CLINIC VISIT               1    295.00
03/14/2026 85025   CBC WITH DIFFERENTIAL               2    180.00
03/14/2026 80053   COMPREHENSIVE METABOLIC PANEL       1    196.00
03/14/2026 82565   CREATININE BLOOD                    1     64.00
03/14/2026 36415   VENIPUNCTURE                        1     95.00
03/14/2026 36415   VENIPUNCTURE                        1     95.00
03/14/2026 71046   CHEST XRAY 2 VIEWS                  1    498.00
03/14/2026 93000   EKG COMPLETE                        1    289.00`;

