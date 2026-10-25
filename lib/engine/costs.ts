// Lifetime cost model for the Risk Receipt.
//
// Each condition carries two cost components:
//   · onetime — the acute / first-year treatment episode (an MI revascularisation,
//     a stroke admission plus rehab, a first course of cancer therapy)
//   · annual  — the incremental yearly cost of living with the condition
//               (medication, specialist visits, monitoring, out-of-pocket)
//
// Lifetime cost = onetime + present value of the annual stream over the years a
// person is expected to live with the condition, discounted at 3%/yr — the
// convention in health-economic evaluation, so a dollar of dialysis in 2050 is
// not counted the same as a dollar today.
//
// Expected value = probability × lifetime cost. A condition already diagnosed
// carries probability 1.

export interface CostModel {
  onetime: number;
  annual: number;
  /** Multipliers producing the low and high ends of the cost band. */
  spreadLow: number;
  spreadHigh: number;
  note: string;
}

export const DISCOUNT_RATE = 0.03;
const HORIZON_AGE = 83;
const MIN_YEARS = 6;

export const COSTS: Record<string, CostModel> = {
  hypertension: {
    onetime: 0,
    annual: 2100,
    spreadLow: 0.55,
    spreadHigh: 1.9,
    note: "Antihypertensives, monitoring, added primary-care visits",
  },
  type2_diabetes: {
    onetime: 2400,
    annual: 9600,
    spreadLow: 0.6,
    spreadHigh: 1.8,
    note: "Glucose-lowering therapy, supplies, eye/foot/renal surveillance",
  },
  coronary_heart_disease: {
    onetime: 46000,
    annual: 6200,
    spreadLow: 0.55,
    spreadHigh: 2.1,
    note: "Revascularisation or infarct admission, then secondary prevention",
  },
  stroke_ever: {
    onetime: 54000,
    annual: 8300,
    spreadLow: 0.5,
    spreadHigh: 2.4,
    note: "Acute admission and rehabilitation, then ongoing assistance",
  },
  weak_failing_kidneys: {
    onetime: 0,
    annual: 17500,
    spreadLow: 0.35,
    spreadHigh: 3.2,
    note: "Staged CKD care; the high end reflects progression to dialysis",
  },
  depression: {
    onetime: 0,
    annual: 4400,
    spreadLow: 0.5,
    spreadHigh: 2.0,
    note: "Therapy, pharmacotherapy and associated care contacts",
  },
  cancer_ever: {
    onetime: 64000,
    annual: 3600,
    spreadLow: 0.45,
    spreadHigh: 2.6,
    note: "First course of treatment, then survivorship surveillance",
  },
  copd: {
    onetime: 0,
    annual: 6100,
    spreadLow: 0.5,
    spreadHigh: 2.2,
    note: "Inhaled therapy, oxygen and exacerbation admissions",
  },
  chronic_pain: {
    onetime: 0,
    annual: 5200,
    spreadLow: 0.45,
    spreadHigh: 2.1,
    note: "Pain management, physical therapy, imaging and procedures",
  },
};

const AGE_MIDPOINT: Record<string, number> = {
  "18_24": 21,
  "25_34": 30,
  "35_44": 40,
  "45_54": 50,
  "55_64": 60,
  "65_69": 67,
  "70_74": 72,
  "75_79": 77,
  "80_plus": 83,
};

export function ageMidpoint(ageId: string): number {
  return AGE_MIDPOINT[ageId] ?? 40;
}

/** Years a person in this age band is expected to live with a condition. */
export function yearsAtRisk(ageId: string): number {
  return Math.max(MIN_YEARS, HORIZON_AGE - ageMidpoint(ageId));
}

/** Present value of $1/yr for `years` years at the discount rate. */
export function annuityFactor(years: number): number {
  const r = DISCOUNT_RATE;
  return (1 - Math.pow(1 + r, -years)) / r;
}

/**
 * The level annual amount equivalent to a discounted present value.
 *
 * Burden is reported per year rather than as a lifetime total: a six figure
 * lifetime number is both easier to misread and harder to act on than "about
 * this much a year, every year, from here". Dividing by the same annuity
 * factor the present value was built with keeps the two consistent.
 */
export function annualEquivalent(presentValue: number, years: number): number {
  const f = annuityFactor(years);
  return f > 0 ? presentValue / f : 0;
}

export interface LifetimeCost {
  low: number;
  typical: number;
  high: number;
  years: number;
}

/** Discounted lifetime cost of carrying one condition from this age onward. */
export function lifetimeCost(conditionId: string, ageId: string): LifetimeCost | null {
  const model = COSTS[conditionId];
  if (!model) return null;

  const years = yearsAtRisk(ageId);
  const pv = model.onetime + model.annual * annuityFactor(years);

  return {
    low: pv * model.spreadLow,
    typical: pv,
    high: pv * model.spreadHigh,
    years,
  };
}

export interface ExpectedValue {
  /** Probability applied, 0–1. Exactly 1 for an already-diagnosed condition. */
  probability: number;
  certain: boolean;
  cost: LifetimeCost;
  low: number;
  typical: number;
  high: number;
}

/**
 * Expected dollar burden of one condition.
 *
 * The range widens on both axes at once: the low end pairs the bottom of the
 * prevalence confidence interval with the cheap end of the cost band, the high
 * end pairs the top of both. It is deliberately a wide interval.
 */
export function expectedValue(
  conditionId: string,
  ageId: string,
  pct: number | undefined,
  lo: number | undefined,
  hi: number | undefined,
  certain: boolean,
): ExpectedValue | null {
  const cost = lifetimeCost(conditionId, ageId);
  if (!cost) return null;

  if (certain) {
    return {
      probability: 1,
      certain: true,
      cost,
      low: cost.low,
      typical: cost.typical,
      high: cost.high,
    };
  }

  if (pct == null) return null;
  const p = pct / 100;
  const pLow = (lo ?? pct) / 100;
  const pHigh = (hi ?? pct) / 100;

  return {
    probability: p,
    certain: false,
    cost,
    low: pLow * cost.low,
    typical: p * cost.typical,
    high: pHigh * cost.high,
  };
}

export interface RiskTotals {
  low: number;
  typical: number;
  high: number;
  certainTypical: number;
  probabilisticTypical: number;
}

export function sumExpected(values: ExpectedValue[]): RiskTotals {
  const totals: RiskTotals = {
    low: 0,
    typical: 0,
    high: 0,
    certainTypical: 0,
    probabilisticTypical: 0,
  };
  for (const v of values) {
    totals.low += v.low;
    totals.typical += v.typical;
    totals.high += v.high;
    if (v.certain) totals.certainTypical += v.typical;
    else totals.probabilisticTypical += v.typical;
  }
  return totals;
}
