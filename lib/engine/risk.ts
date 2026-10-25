// Population risk database (CDC NHIS Sample Adult microdata), bundled as JSON
// in /public/RiskReceiptUS.json. Types mirror the trimmed on-disk shape.

export interface RiskCell {
  pct?: number;
  lo?: number;
  hi?: number;
  scope?: string;
  fb?: boolean;
  yr?: number;
  n?: number;
  base?: number; // conditional cells: same-scope baseline prevalence
  chg?: number; // conditional cells: change vs that baseline, in pp
  kp?: boolean; // known present
}

export interface RiskProfile {
  baseline: Record<string, RiskCell>;
  given: Record<string, Record<string, RiskCell>>;
}

export interface RiskOption {
  id: string;
  label: string;
}

export interface RiskDB {
  version: string;
  generated_on: string;
  population: string;
  interpretation: string[];
  sources: string[];
  age_groups: RiskOption[];
  race_groups: RiskOption[];
  sex_groups: RiskOption[];
  conditions: Record<string, { label: string; definition: string }>;
  receipt_conditions: string[];
  preexisting: string[];
  profiles: Record<string, RiskProfile>;
}

export function profileKey(age: string, race: string, sex: string): string {
  return `${age}__${race}__${sex}`;
}

export function knownPresent(c: RiskCell): boolean {
  return c.kp === true;
}

export function needsDisclosure(c: RiskCell): boolean {
  return c.fb === true;
}

let cache: RiskDB | null = null;

export async function loadRiskDB(): Promise<RiskDB | null> {
  if (cache) return cache;
  try {
    const res = await fetch("/RiskReceiptUS.json", { cache: "force-cache" });
    if (!res.ok) return null;
    cache = (await res.json()) as RiskDB;
    return cache;
  } catch {
    return null;
  }
}

const SHORT: Record<string, string> = {
  obesity: "Obesity",
  hypertension: "Hypertension",
  high_cholesterol: "High cholesterol",
  arthritis_group: "Arthritis",
  depression: "Depression",
  anxiety_disorder: "Anxiety disorder",
  asthma_ever: "Asthma (ever)",
  cancer_ever: "Cancer (ever)",
  type2_diabetes: "Type 2 diabetes",
  coronary_heart_disease: "Coronary heart disease",
  stroke_ever: "Stroke (ever)",
  weak_failing_kidneys: "Weak/failing kidneys",
  copd: "COPD",
  chronic_pain: "Chronic pain",
};

export function shortName(id: string): string {
  return SHORT[id] ?? id.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

const SCOPE: Record<string, string> = {
  exact_age_race_sex: "your exact age, race & sex group",
  broader_age_same_race_sex: "broader age range, same race & sex",
  all_ages_same_race_sex: "all adult ages, same race & sex",
  same_age_sex_all_races: "same age & sex, all race groups",
  broader_age_same_sex_all_races: "broader age range, same sex, all race groups",
  all_ages_same_sex_all_races: "all adults of the same sex",
};

export function scopeText(code: string): string {
  return SCOPE[code] ?? code.replace(/_/g, " ");
}

const SHORT_RACE: Record<string, string> = {
  hispanic_any_race: "Hispanic",
  nh_white: "White (NH)",
  nh_black: "Black (NH)",
  nh_asian: "Asian (NH)",
  nh_aian: "AI/AN (NH)",
  nh_other_multiracial: "Other/multi (NH)",
};

export function shortRace(id: string): string | undefined {
  return SHORT_RACE[id];
}

/** Render a prevalence value: integer when whole, else one decimal. */
export function per100(v: number): string {
  return v === Math.round(v) ? String(Math.round(v)) : v.toFixed(1);
}
