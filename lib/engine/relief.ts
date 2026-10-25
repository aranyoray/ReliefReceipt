import type { Audit } from "./bill";
import { fmtUsd } from "./bill";
import type { County } from "./geo";

const FPL_BASE = 16100;
const FPL_STEP = 5650;
const FPL_BASE_AK = 20100;
const FPL_STEP_AK = 7070;
const FPL_BASE_HI = 18510;
const FPL_STEP_HI = 6500;


export function federalPovertyLevel(householdSize: number, state: string): number {
  const n = Math.max(1, Math.min(householdSize, 12));
  if (state === "AK") return FPL_BASE_AK + FPL_STEP_AK * (n - 1);
  if (state === "HI") return FPL_BASE_HI + FPL_STEP_HI * (n - 1);
  return FPL_BASE + FPL_STEP * (n - 1);
}

export interface CharityRule {
  /** At or below this % of FPL, care is written off entirely. */
  freePct: number;
  /** Between freePct and this, a sliding-scale discount applies. */
  discountPct: number;
  programName: string;
  note: string;
  /** Asset limits, where the state sets them. */
  assetNote?: string;
}

const DEFAULT_RULE: CharityRule = {
  freePct: 200,
  discountPct: 400,
  programName: "hospital financial assistance policy",
  note:
    "Nonprofit hospitals must publish a financial assistance policy and cannot charge an eligible patient more than the amount generally billed to insured patients. Ask for the policy and the application form by name.",
};

const STATE_RULES: Record<string, CharityRule> = {
  NJ: {
    freePct: 200,
    discountPct: 300,
    programName: "NJ Hospital Care Payment Assistance (Charity Care)",
    note:
      "Every acute-care hospital in New Jersey must participate. At or below 200% of the poverty level, eligible care is free. Between 200% and 300%, you pay a sliding share of the Medicaid rate rather than the charged amount. Eligibility is judged per date of service and you can apply after the fact.",
    assetNote:
      "New Jersey also applies an asset test — roughly $7,500 for an individual and $15,000 for a family, excluding a primary home and one vehicle.",
  },
  CA: {
    freePct: 400,
    discountPct: 400,
    programName: "California Hospital Fair Pricing Act",
    note:
      "Hospitals must offer free or discounted care to uninsured and high-medical-cost patients at or below 400% of the poverty level, and may not charge them more than the Medicare rate.",
  },
  WA: {
    freePct: 300,
    discountPct: 400,
    programName: "Washington Charity Care Act",
    note:
      "Care is free at or below 300% of the poverty level and discounted on a sliding scale up to 400%. Hospitals must screen you for eligibility before attempting collection.",
  },
  NY: {
    freePct: 200,
    discountPct: 400,
    programName: "New York Hospital Financial Assistance Law",
    note:
      "Hospitals receiving indigent-care funding must cap charges for patients up to 400% of the poverty level and offer instalment plans with limited monthly payments.",
  },
  IL: {
    freePct: 200,
    discountPct: 600,
    programName: "Illinois Hospital Uninsured Patient Discount Act",
    note:
      "Uninsured patients up to 600% of the poverty level are protected by a cap on what a hospital may collect in a twelve-month period.",
  },
  MD: {
    freePct: 200,
    discountPct: 500,
    programName: "Maryland Medical Debt Protection Act",
    note:
      "Free care is required at or below 200% of the poverty level with reduced-cost care above it, and hospitals must refund patients later found to have been eligible.",
  },
  CO: {
    freePct: 250,
    discountPct: 400,
    programName: "Colorado Hospital Discounted Care",
    note:
      "Hospitals must screen patients for eligibility and cap payments for those at or below 250% of the poverty level, with collections limited while an application is pending.",
  },
  OR: {
    freePct: 200,
    discountPct: 400,
    programName: "Oregon hospital financial assistance standard",
    note:
      "Large hospitals must provide free care at or below 200% of the poverty level and discounted care to 400%.",
  },
  RI: {
    freePct: 200,
    discountPct: 400,
    programName: "Rhode Island hospital financial assistance",
    note: "Hospitals must offer free care at or below 200% of the poverty level and sliding-scale discounts above it.",
  },
  ME: {
    freePct: 150,
    discountPct: 300,
    programName: "Maine Free Care Program",
    note: "Hospitals must provide free care at or below 150% of the poverty level, with discounts above that threshold.",
  },
  NV: {
    freePct: 200,
    discountPct: 400,
    programName: "Nevada hospital discounted care",
    note: "Larger hospitals must discount charges for uninsured patients below the stated income thresholds.",
  },
  CT: {
    freePct: 250,
    discountPct: 400,
    programName: "Connecticut hospital bed-funds and financial assistance",
    note:
      "Hospitals must offer financial assistance and may not report medical debt to credit agencies; many also hold restricted bed-funds that cover remaining balances.",
  },
};

export function charityRule(state: string): CharityRule {
  return STATE_RULES[state] ?? DEFAULT_RULE;
}

export type EligibilityTier = "free" | "sliding" | "unlikely";

export interface Eligibility {
  tier: EligibilityTier;
  fplPct: number;
  fpl: number;
  rule: CharityRule;
  /** Share of the bill the patient would be asked to pay under the sliding scale. */
  patientShare: number;
  estimatedOwed: number;
  headline: string;
}

export function assessEligibility(
  income: number,
  householdSize: number,
  state: string,
  owedAfterAudit: number,
): Eligibility {
  const rule = charityRule(state);
  const fpl = federalPovertyLevel(householdSize, state);
  const fplPct = fpl > 0 ? (income / fpl) * 100 : 0;

  let tier: EligibilityTier;
  let patientShare: number;

  if (fplPct <= rule.freePct) {
    tier = "free";
    patientShare = 0;
  } else if (fplPct <= rule.discountPct) {
    tier = "sliding";
    // Share rises linearly across the discount band, capped at 80%.
    const span = Math.max(1, rule.discountPct - rule.freePct);
    patientShare = Math.min(0.8, ((fplPct - rule.freePct) / span) * 0.8);
  } else {
    tier = "unlikely";
    patientShare = 1;
  }

  const estimatedOwed = owedAfterAudit * patientShare;

  const headline =
    tier === "free"
      ? `At ${Math.round(fplPct)}% of the poverty level, this bill should be written off in full.`
      : tier === "sliding"
        ? `At ${Math.round(fplPct)}% of the poverty level, you fall in the sliding-scale band — expect to pay roughly ${Math.round(
            patientShare * 100,
          )}% rather than the full amount.`
        : `At ${Math.round(fplPct)}% of the poverty level, you are above the published thresholds — ask anyway, since hardship and catastrophic-cost provisions sit outside the income test.`;

  return { tier, fplPct, fpl, rule, patientShare, estimatedOwed, headline };
}

// ------------------------------------------------------------------- script


/** A call script that names the specific findings on this bill. */
export function buildScript(
  audit: Audit,
  eligibility: Eligibility | null,
  county: County | null,
): string {
  const parts: string[] = [];

  parts.push(
    `Hello, I'm calling about my account. I've reviewed the itemised bill and I have ${
      audit.flags.filter((f) => f.severity !== "info").length || "some"
    } specific questions before I pay anything.`,
  );

  parts.push(
    `First, please confirm this is a fully itemised bill with every CPT code, modifier, unit count and date of service listed. I'm working from a total of ${fmtUsd(
      audit.totalBilled,
    )}.`,
  );

  const high = audit.flags.filter((f) => f.severity === "high").slice(0, 4);
  const medium = audit.flags.filter((f) => f.severity === "medium").slice(0, 3);

  high.forEach((f, i) => {
    if (f.kind === "duplicate") {
      parts.push(`${ordinal(i + 2)}, ${f.title.toLowerCase()}. Unless that service was genuinely repeated, please remove the duplicate lines.`);
    } else if (f.kind === "unbundling") {
      parts.push(`${ordinal(i + 2)}, ${f.title.toLowerCase()}. That component is already included in the panel, so please remove the separate line.`);
    } else if (f.kind === "units") {
      parts.push(`${ordinal(i + 2)}, ${f.title.toLowerCase()}. Please send me the documentation supporting each unit.`);
    } else {
      parts.push(
        `${ordinal(i + 2)}, ${f.title.toLowerCase()}. That is about ${fmtUsd(
          f.recoverable,
        )} above the typical cash price for this service. Please review that line.`,
      );
    }
  });

  medium.forEach((f) => {
    if (f.kind === "upcoding") {
      parts.push(`I'd also like to know what documented time or medical decision-making supported the visit level billed. If the visit was brief and routine, please re-review the level.`);
    } else if (f.kind === "modifier") {
      parts.push(`I see modifier ${f.title.includes("25") ? "25" : "59"} on this claim. Please tell me what separate, distinct service justifies it.`);
    } else if (f.kind === "facility") {
      parts.push(`There's a facility fee on top of the professional charge. Was that fee disclosed to me in advance, and could this visit have been billed at the non-facility rate?`);
    }
  });

  if (audit.flags.some((f) => f.kind === "surprise")) {
    parts.push(
      `Some of these services are emergency or anesthesia charges. Under the No Surprises Act I cannot be balance billed beyond in-network cost sharing for those, so please confirm this is not a balance bill.`,
    );
  }

  if (audit.totalFair > 0) {
    parts.push(
      `Benchmarked against cash prices${
        county ? ` for ${county.name}, ${county.state}` : ""
      }, a fair total for these services is around ${fmtUsd(
        audit.totalFair,
      )}. I'd like to settle close to that figure.`,
    );
  }

  if (eligibility) {
    if (eligibility.tier === "free") {
      parts.push(
        `I also want to apply for ${eligibility.rule.programName}. My household income is about ${Math.round(
          eligibility.fplPct,
        )}% of the federal poverty level, which should qualify me for a full write-off. Please send the application and pause collections while it is pending.`,
      );
    } else if (eligibility.tier === "sliding") {
      parts.push(
        `I also want to apply for ${eligibility.rule.programName}. My household income is about ${Math.round(
          eligibility.fplPct,
        )}% of the federal poverty level, which should place me in the discount band. Please send the application and pause collections while it is pending.`,
      );
    } else {
      parts.push(
        `I'd also like the financial assistance application regardless of income, along with your hardship and catastrophic-cost provisions and your interest-free payment plan terms.`,
      );
    }
  }

  parts.push(
    `Finally, please confirm you will not send this to collections or report it while the account is under review. May I have your name, a reference number for this call, and the date I should expect a written response?`,
  );

  return parts.join("\n\n");
}

function ordinal(n: number): string {
  const words = ["First", "Second", "Third", "Fourth", "Fifth", "Sixth", "Seventh"];
  return words[n - 1] ?? `Point ${n}`;
}

