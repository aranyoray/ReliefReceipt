// County geography: 3,144 county-equivalents across the 50 states and DC, with
// 2024 population and land area (US Census), plus a ZCTA-to-county crosswalk
// assigning each ZIP to the county holding most of its land area.

export interface County {
  fips: string;
  name: string;
  state: string;
  stateName: string;
  population: number;
  density: number; // people per square mile
}

interface GeoFile {
  states: [string, string][];
  counties: Record<string, [string, string, number, number][]>;
}

export interface Geo {
  states: { id: string; label: string }[];
  stateName: Record<string, string>;
  counties: Record<string, County[]>;
  byFips: Record<string, County>;
}

let geoCache: Geo | null = null;
let zipCache: Record<string, string> | null = null;

export async function loadGeo(): Promise<Geo | null> {
  if (geoCache) return geoCache;
  try {
    const res = await fetch("/counties.json", { cache: "force-cache" });
    if (!res.ok) return null;
    const raw = (await res.json()) as GeoFile;

    const stateName: Record<string, string> = {};
    for (const [id, label] of raw.states) stateName[id] = label;

    const counties: Record<string, County[]> = {};
    const byFips: Record<string, County> = {};
    for (const [st, rows] of Object.entries(raw.counties)) {
      counties[st] = rows.map(([fips, name, population, density]) => {
        const c: County = {
          fips,
          name,
          state: st,
          stateName: stateName[st] ?? st,
          population,
          density,
        };
        byFips[fips] = c;
        return c;
      });
    }

    geoCache = {
      states: raw.states.map(([id, label]) => ({ id, label })),
      stateName,
      counties,
      byFips,
    };
    return geoCache;
  } catch {
    return null;
  }
}

export async function loadZipMap(): Promise<Record<string, string> | null> {
  if (zipCache) return zipCache;
  try {
    const res = await fetch("/zipcounty.json", { cache: "force-cache" });
    if (!res.ok) return null;
    zipCache = (await res.json()) as Record<string, string>;
    return zipCache;
  } catch {
    return null;
  }
}

/** County containing a 5-digit ZIP, or null when it is not a 50-state ZIP. */
export function countyForZip(geo: Geo, zipMap: Record<string, string>, zip: string): County | null {
  const z = zip.trim();
  if (!/^\d{5}$/.test(z)) return null;
  const fips = zipMap[z];
  return fips ? geo.byFips[fips] ?? null : null;
}

/** Plain-language settlement type, used to explain exposure differences. */
export function densityBand(density: number): string {
  if (density >= 5000) return "dense urban";
  if (density >= 1000) return "urban";
  if (density >= 250) return "suburban";
  if (density >= 50) return "small town / exurban";
  return "rural";
}

const NUM = new Intl.NumberFormat("en-US");
export function fmtCount(n: number): string {
  return NUM.format(n);
}
