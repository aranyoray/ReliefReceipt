"use client";

import React, { useId, useState } from "react";

/* ============================================================================
   Charts.

   Two series at most and they always mean the same thing: `s1` is the
   benchmark (what care of this kind costs), `s2` is what was actually billed.
   Status colours — danger, warn, ok — are kept for state and never used as a
   series.  Marks are thin, the baseline is a hairline, and only the mark being
   read carries a value label.
   ========================================================================= */

export interface Column {
  key: string;
  label: string;
  /** Benchmark portion of the column. */
  fair: number;
  /** Amount billed above the benchmark. Zero when the line is priced fairly. */
  over: number;
}

/**
 * Columns of billed-against-fair, one per category.  Tap or hover a column to
 * read its value: labelling every column at once is unreadable on a phone.
 */
export function Columns({
  data,
  format,
  height = "tall",
}: {
  data: Column[];
  format: (v: number) => string;
  height?: "short" | "tall";
}) {
  const [open, setOpen] = useState<number>(() =>
    data.reduce((best, d, i) => (d.fair + d.over > data[best].fair + data[best].over ? i : best), 0),
  );
  if (data.length === 0) return null;

  // The selection is held across renders, so it has to survive the data
  // shrinking under it when a different bill is loaded.
  const sel = Math.min(open, data.length - 1);
  const max = Math.max(...data.map((d) => d.fair + d.over), 1);

  return (
    <div>
      <div className={height === "tall" ? "cols tall" : "cols"}>
        {data.map((d, i) => {
          const total = d.fair + d.over;
          const fairPct = (d.fair / max) * 100;
          const overPct = (d.over / max) * 100;
          return (
            <button
              key={d.key}
              type="button"
              className="col-slot"
              aria-label={`${d.label}, ${format(total)} billed, ${format(d.over)} of it above the fair range`}
              onClick={() => setOpen(i)}
              onMouseEnter={() => setOpen(i)}
            >
              {i === sel && <span className="col-cap">{format(total)}</span>}
              <span className="col-stack">
                {overPct > 0 && (
                  <>
                    <span className="col-seg s2 top" style={{ height: `${overPct}%` }} />
                    <span className="col-seg gap" />
                  </>
                )}
                <span
                  className={overPct > 0 ? "col-seg" : "col-seg top"}
                  style={{ height: `${Math.max(fairPct, total > 0 ? 1.5 : 0)}%` }}
                />
              </span>
            </button>
          );
        })}
      </div>
      <div className="col-base" />
      <div className="col-keys">
        {data.map((d, i) => (
          <span key={d.key} className="col-key" style={i === sel ? { color: "var(--ink)" } : undefined}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Legend({ items }: { items: { label: string; swatch: "s1" | "s2" | "track" }[] }) {
  return (
    <div className="legend">
      {items.map((it) => (
        <span key={it.label} className="legend-i">
          <span className={it.swatch === "s1" ? "legend-sw" : `legend-sw ${it.swatch}`} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

/** One bar: the fair share of a total, then the part charged above it. */
export function SplitBar({ fair, over }: { fair: number; over: number }) {
  const total = Math.max(fair + over, 1);
  const f = (fair / total) * 100;
  const o = (over / total) * 100;
  return (
    <div className="splitbar">
      <span className="fair" style={{ width: `${f}%` }} />
      {o > 0 && f > 0 && <span className="gap" />}
      {o > 0 && <span className="over" style={{ width: `${o}%` }} />}
    </div>
  );
}

/** A straight meter with an optional marker where the reading sits. */
export function Meter({
  pct,
  tone = "s1",
  marker,
}: {
  pct: number;
  tone?: "s1" | "ok" | "warn" | "danger";
  marker?: number;
}) {
  const w = Math.max(0, Math.min(100, pct));
  return (
    <div className="meter" style={{ position: "relative" }}>
      <span className={tone === "s1" ? "meter-fill" : `meter-fill ${tone}`} style={{ width: `${w}%` }} />
      {marker !== undefined && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            left: `calc(${Math.max(0, Math.min(100, marker))}% - 1.5px)`,
            top: -3,
            width: 3,
            height: 16,
            borderRadius: 2,
            background: "var(--ink)",
            boxShadow: "0 0 0 2px var(--surface)",
          }}
        />
      )}
    </div>
  );
}

/**
 * Radial meter: one value against its own track.  Not a pie — nothing here is
 * divided into parts, and a ring of close-valued slices is unreadable anyway.
 */
export function Ring({
  pct,
  tone = "s1",
  center,
  label,
  size = 56,
}: {
  pct: number;
  tone?: "s1" | "s2" | "ok" | "warn" | "danger";
  center: React.ReactNode;
  label?: React.ReactNode;
  size?: number;
}) {
  const r = (size - 7) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, pct));
  const colour =
    tone === "s1" ? "var(--s1)" : tone === "s2" ? "var(--s2)" : `var(--${tone})`;
  return (
    <div className="dial-item" style={{ width: size + 22 }}>
      <div className="dial" style={{ width: size, height: size }}>
        <svg width={size} height={size} aria-hidden="true">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth={6} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={colour}
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={`${(v / 100) * c} ${c}`}
          />
        </svg>
        <span className="dial-mid">{center}</span>
      </div>
      {label && <span className="dial-k">{label}</span>}
    </div>
  );
}

export interface SparkSeries {
  label: string;
  points: number[];
  slot: "s1" | "s2";
}

/**
 * Running totals down a bill: what the benchmark says the care costs, against
 * what the bill asks for.  Both series share one axis — a second scale would
 * invent a relationship that is not in the data.
 */
export function Spark({
  series,
  height = 96,
  callout,
}: {
  series: SparkSeries[];
  height?: number;
  callout?: string;
}) {
  const id = useId();
  const W = 300;
  const H = height;
  const pad = 6;
  const all = series.flatMap((s) => s.points);
  if (all.length === 0) return null;
  const max = Math.max(...all, 1);
  const n = Math.max(...series.map((s) => s.points.length), 2);

  const xy = (i: number, v: number) => [
    pad + (i / (n - 1)) * (W - pad * 2),
    H - pad - (v / max) * (H - pad * 2),
  ];
  const path = (pts: number[]) =>
    pts.map((v, i) => `${i === 0 ? "M" : "L"}${xy(i, v).map((q) => q.toFixed(1)).join(" ")}`).join(" ");

  const lead = series[series.length - 1];
  const [lx, ly] = xy(lead.points.length - 1, lead.points[lead.points.length - 1]);

  return (
    <div className="spark-wrap" style={{ height: H }}>
      <svg
        className="spark"
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={series
          .map((s) => `${s.label} rising to ${Math.round(s.points[s.points.length - 1])}`)
          .join("; ")}
      >
        <defs>
          <linearGradient id={`${id}-wash`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--s2)" stopOpacity="0.16" />
            <stop offset="100%" stopColor="var(--s2)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line
          x1={pad}
          y1={H - pad}
          x2={W - pad}
          y2={H - pad}
          stroke="var(--grid)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        {series
          .filter((s) => s.slot === "s2")
          .map((s) => (
            <path
              key={`${s.label}-wash`}
              d={`${path(s.points)} L${(W - pad).toFixed(1)} ${H - pad} L${pad} ${H - pad} Z`}
              fill={`url(#${id}-wash)`}
              stroke="none"
            />
          ))}
        {series.map((s) => (
          <path
            key={`${s.label}-line`}
            d={path(s.points)}
            fill="none"
            stroke={s.slot === "s1" ? "var(--s1)" : "var(--s2)"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <span className="spark-dot" style={{ left: `${(lx / W) * 100}%`, top: ly }} aria-hidden="true" />
      {callout && (
        <span className="spark-cal" style={{ right: 2, top: Math.max(14, ly - 10) }}>
          {callout}
        </span>
      )}
    </div>
  );
}
