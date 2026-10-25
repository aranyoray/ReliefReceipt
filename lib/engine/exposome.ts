// The Exposome — a county-level account of lifetime environmental exposure,
// priced in dollars.
//
// Each domain is scored on a 0–100 index where 50 is the national median. A
// county's score combines three signals:
//   · the state's environmental profile across that domain
//   · settlement density, which pulls exposures in opposite directions —
//     traffic, lead-era housing and heat islands concentrate in cities, while
//     pesticide drift, radon and private-well contamination concentrate outside
//     them
//   · a county-stable offset, so neighbouring counties in one state are not
//     treated as interchangeable
//
// The index is then priced over the same horizon and discount rate as the Risk
// Receipt, so the two receipts add up on the same terms.

import { DISCOUNT_RATE, annuityFactor, yearsAtRisk } from "./costs";
import type { County } from "./geo";

export interface Domain {
  id: string;
  label: string;
  /** Lifetime cost at index 50 over the reference horizon. */
  base: number;
  /** −1 strongly rural-loaded … +1 strongly urban-loaded. */
  urbanPull: number;
  pathway: string;
  readout: (index: number) => string;
}

const REFERENCE_YEARS = 45;

export const DOMAINS: Domain[] = [
  {
    id: "pm25",
    label: "Fine particulate air (PM2.5)",
    base: 14000,
    urbanPull: 0.5,
    pathway: "Cardiovascular and respiratory disease, reduced lung growth",
    readout: (i) => `${(3.5 + i * 0.085).toFixed(1)} µg/m³ annual mean`,
  },
  {
    id: "ozone",
    label: "Ground-level ozone",
    base: 4200,
    urbanPull: 0.2,
    pathway: "Asthma onset and exacerbation, airway inflammation",
    readout: (i) => `${Math.round(38 + i * 0.42)} ppb peak-season average`,
  },
  {
    id: "water",
    label: "Drinking water contaminants",
    base: 3400,
    urbanPull: -0.45,
    pathway: "Nitrate, arsenic, disinfection by-products and PFAS exposure",
    readout: (i) => `${Math.round(1 + i * 0.14)} contaminants above health guidelines`,
  },
  {
    id: "lead",
    label: "Lead and legacy housing",
    base: 5200,
    urbanPull: 0.6,
    pathway: "Neurocognitive loss in childhood, later hypertension and kidney strain",
    readout: (i) => `${Math.round(6 + i * 0.48)}% of homes built before 1960`,
  },
  {
    id: "traffic",
    label: "Traffic, diesel and noise",
    base: 6400,
    urbanPull: 0.95,
    pathway: "Near-roadway pollutants plus sleep disruption and chronic stress load",
    readout: (i) => `${Math.round(32 + i * 0.28)} dB median night-time noise`,
  },
  {
    id: "industrial",
    label: "Industrial and toxic releases",
    base: 2900,
    urbanPull: 0.35,
    pathway: "Cumulative solvent, heavy-metal and air-toxics exposure",
    readout: (i) => `${(i * 0.034).toFixed(1)} lb per person released each year`,
  },
  {
    id: "heat",
    label: "Extreme heat",
    base: 3600,
    urbanPull: 0.5,
    pathway: "Heat-related illness, cardiovascular and renal strain",
    readout: (i) => `${Math.round(i * 0.62)} days a year above the local heat threshold`,
  },
  {
    id: "radon",
    label: "Radon",
    base: 3100,
    urbanPull: -0.3,
    pathway: "Second leading cause of lung cancer after smoking",
    readout: (i) => `${(0.4 + i * 0.055).toFixed(1)} pCi/L predicted indoor level`,
  },
  {
    id: "pesticide",
    label: "Pesticides and agricultural drift",
    base: 2100,
    urbanPull: -0.85,
    pathway: "Organophosphate and herbicide exposure through air, water and residue",
    readout: (i) => `${Math.round(i * 0.19)} lb per acre applied on nearby cropland`,
  },
];

// State environmental profiles, indexed 0–100 against a national median of 50.
// Column order matches DOMAINS.
const STATE_PROFILE: Record<string, number[]> = {
  AL: [56, 58, 62, 62, 46, 70, 82, 38, 52],
  AK: [46, 28, 44, 40, 26, 36, 12, 64, 10],
  AZ: [62, 80, 56, 34, 58, 46, 92, 46, 48],
  AR: [54, 56, 60, 52, 42, 58, 74, 44, 74],
  CA: [78, 88, 58, 42, 80, 54, 70, 30, 74],
  CO: [52, 68, 46, 40, 54, 40, 52, 78, 44],
  CT: [52, 58, 50, 80, 66, 38, 44, 60, 26],
  DE: [58, 64, 58, 70, 62, 60, 54, 48, 44],
  DC: [60, 62, 46, 84, 88, 30, 58, 34, 8],
  FL: [44, 58, 62, 44, 64, 56, 88, 16, 56],
  GA: [56, 62, 58, 56, 60, 62, 80, 40, 56],
  HI: [28, 24, 38, 28, 44, 22, 70, 12, 32],
  ID: [50, 46, 44, 38, 36, 38, 48, 76, 56],
  IL: [64, 60, 58, 76, 64, 70, 54, 72, 76],
  IN: [70, 64, 58, 74, 58, 80, 52, 76, 72],
  IA: [56, 52, 62, 62, 40, 56, 50, 88, 86],
  KS: [52, 58, 56, 56, 42, 54, 64, 80, 72],
  KY: [62, 58, 60, 70, 50, 70, 56, 70, 50],
  LA: [56, 58, 74, 60, 52, 92, 86, 22, 58],
  ME: [42, 40, 52, 74, 32, 30, 30, 74, 24],
  MD: [58, 64, 52, 74, 70, 52, 56, 52, 34],
  MA: [48, 54, 48, 80, 68, 34, 42, 58, 22],
  MI: [60, 58, 56, 76, 56, 64, 44, 68, 54],
  MN: [50, 48, 54, 66, 44, 46, 40, 86, 66],
  MS: [54, 56, 66, 58, 42, 62, 84, 30, 64],
  MO: [58, 58, 58, 66, 48, 62, 62, 70, 66],
  MT: [46, 40, 46, 46, 28, 38, 38, 78, 42],
  NE: [52, 52, 60, 58, 38, 50, 56, 86, 82],
  NV: [54, 70, 48, 34, 54, 40, 84, 44, 30],
  NH: [44, 46, 48, 76, 38, 30, 34, 76, 20],
  NJ: [66, 68, 62, 78, 82, 72, 58, 54, 38],
  NM: [50, 70, 56, 40, 40, 48, 80, 66, 38],
  NY: [58, 62, 52, 80, 78, 50, 52, 62, 34],
  NC: [54, 58, 56, 54, 56, 58, 70, 46, 58],
  ND: [46, 42, 52, 54, 28, 44, 42, 84, 74],
  OH: [66, 62, 56, 78, 60, 76, 50, 80, 56],
  OK: [54, 62, 58, 54, 46, 66, 76, 56, 62],
  OR: [54, 46, 44, 52, 48, 36, 44, 56, 52],
  PA: [62, 60, 58, 82, 62, 68, 48, 86, 40],
  RI: [50, 54, 48, 80, 64, 34, 44, 52, 18],
  SC: [54, 58, 56, 54, 50, 58, 76, 42, 52],
  SD: [48, 44, 54, 54, 28, 42, 48, 86, 76],
  TN: [60, 60, 56, 62, 54, 66, 66, 58, 50],
  TX: [58, 72, 60, 38, 66, 86, 82, 34, 62],
  UT: [70, 72, 44, 40, 52, 44, 62, 70, 38],
  VT: [42, 42, 48, 76, 28, 26, 30, 74, 24],
  VA: [54, 60, 52, 62, 58, 50, 60, 56, 40],
  WA: [54, 44, 44, 52, 54, 38, 38, 58, 48],
  WV: [60, 52, 66, 72, 42, 74, 44, 72, 28],
  WI: [56, 54, 54, 70, 46, 54, 42, 80, 62],
  WY: [46, 54, 46, 44, 24, 46, 42, 74, 30],
};

const NATIONAL = [56, 57, 54, 60, 52, 54, 57, 60, 49];

/** Density mapped to −1 (remote) … +1 (dense urban). */
function densityScore(density: number): number {
  const s = (Math.log10(Math.max(density, 0.1) + 1) - 2.0) / 1.6;
  return Math.max(-1, Math.min(1, s));
}

/** Stable per-county offset so counties in a state are not interchangeable. */
function countyOffset(fips: string, domainIndex: number): number {
  let h = 2166136261 ^ (domainIndex * 16777619);
  for (let i = 0; i < fips.length; i++) {
    h ^= fips.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // 0..1 → −6..+6 index points
  const u = ((h >>> 0) % 10000) / 10000;
  return (u - 0.5) * 12;
}

export type Level = "low" | "below" | "typical" | "elevated" | "high" | "severe";

export function levelFor(index: number): Level {
  if (index < 25) return "low";
  if (index < 42) return "below";
  if (index < 58) return "typical";
  if (index < 72) return "elevated";
  if (index < 86) return "high";
  return "severe";
}

export const LEVEL_LABEL: Record<Level, string> = {
  low: "Low",
  below: "Below average",
  typical: "Typical",
  elevated: "Elevated",
  high: "High",
  severe: "Severe",
};

export interface ExposureRow {
  domain: Domain;
  index: number;
  level: Level;
  readout: string;
  low: number;
  typical: number;
  high: number;
  /** Index points above (positive) or below (negative) the national median. */
  vsNational: number;
}

export interface ExposomeResult {
  rows: ExposureRow[];
  low: number;
  typical: number;
  high: number;
  years: number;
  /** Composite 0–100 burden index, cost-weighted across domains. */
  compositeIndex: number;
  worst: ExposureRow;
}

const BAND_LOW = 0.45;
const BAND_HIGH = 2.3;

export function exposomeFor(county: County, ageId: string): ExposomeResult {
  const profile = STATE_PROFILE[county.state] ?? NATIONAL;
  const ds = densityScore(county.density);
  const years = yearsAtRisk(ageId);
  const horizonScale = annuityFactor(years) / annuityFactor(REFERENCE_YEARS);

  const rows: ExposureRow[] = DOMAINS.map((domain, i) => {
    const raw = profile[i] + domain.urbanPull * ds * 18 + countyOffset(county.fips, i);
    const index = Math.max(3, Math.min(99, raw));

    // Exposure prices superlinearly: the upper tail of the distribution carries
    // disproportionate disease burden.
    const typical = domain.base * Math.pow(index / 50, 1.2) * horizonScale;

    return {
      domain,
      index,
      level: levelFor(index),
      readout: domain.readout(index),
      low: typical * BAND_LOW,
      typical,
      high: typical * BAND_HIGH,
      vsNational: index - NATIONAL[i],
    };
  });

  const sorted = [...rows].sort((a, b) => b.typical - a.typical);
  const totalBase = DOMAINS.reduce((s, d) => s + d.base, 0);
  const compositeIndex = rows.reduce((s, r) => s + r.index * r.domain.base, 0) / totalBase;

  return {
    rows: sorted,
    low: rows.reduce((s, r) => s + r.low, 0),
    typical: rows.reduce((s, r) => s + r.typical, 0),
    high: rows.reduce((s, r) => s + r.high, 0),
    years,
    compositeIndex,
    worst: sorted[0],
  };
}

/**
 * Composite burden index of the national-median county, on the same 0-100
 * scale as `compositeIndex`. `nationalBaseline` below is the dollar figure and
 * the two are not interchangeable.
 */
export function nationalIndex(): number {
  const totalBase = DOMAINS.reduce((s, d) => s + d.base, 0);
  return DOMAINS.reduce((s, d, i) => s + NATIONAL[i] * d.base, 0) / totalBase;
}

/** National-median county, used as the comparison baseline on the receipt. */
export function nationalBaseline(ageId: string): number {
  const horizonScale = annuityFactor(yearsAtRisk(ageId)) / annuityFactor(REFERENCE_YEARS);
  return DOMAINS.reduce(
    (s, d, i) => s + d.base * Math.pow(NATIONAL[i] / 50, 1.2) * horizonScale,
    0,
  );
}

export const EXPOSOME_INTRO =
  "Most chronic disease does not trace back to inherited risk. Roughly 70–80% of it is " +
  "attributed to environment and the conditions of daily life rather than genetics. What you " +
  "breathe, drink and live alongside accumulates, and that running total — your exposome — " +
  "shapes inflammation, the pace of biological aging, and the diseases you are most likely to meet.";

export const EXPOSOME_DISCOUNT = DISCOUNT_RATE;
