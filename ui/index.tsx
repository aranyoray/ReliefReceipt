"use client";

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { IconChevron } from "./icons";

export * from "./icons";
export * from "./charts";

/* ============================================================================
   Shared UI primitives.

   Built for a desktop workspace: inputs are ordinary native controls (plain
   inputs, dropdowns, checkboxes) in a panel down the left, and results sit on
   paper to the right.  Narrow windows stack the two.
   ========================================================================= */

export type Tone = "danger" | "warn" | "ok" | "info" | "neutral";

/* ------------------------------------------------------------------ layout */

export function Card({
  children,
  flush,
  raised,
  padS,
  className = "",
}: {
  children: React.ReactNode;
  flush?: boolean;
  raised?: boolean;
  padS?: boolean;
  className?: string;
}) {
  const cls = ["card", flush && "flush", raised && "raised", padS && "pad-s", className]
    .filter(Boolean)
    .join(" ");
  return <div className={cls}>{children}</div>;
}

export function Stack({ children, tight }: { children: React.ReactNode; tight?: boolean }) {
  return <div className={tight ? "stack-s" : "stack"}>{children}</div>;
}

export function Row({ children }: { children: React.ReactNode }) {
  return <div className="row">{children}</div>;
}

/** Pushes whatever follows it to the end of a `Row`. */
export function Spacer() {
  return <span className="spacer" />;
}

/**
 * Inputs and results.  A full-height panel of inputs down the left that
 * scrolls on its own, and the results filling the rest of the window.
 * Narrow windows stack the panel above the results.
 */
export function Split({ controls, results }: { controls: React.ReactNode; results: React.ReactNode }) {
  return (
    <div className="split">
      <div className="col sticky">{controls}</div>
      <div className="col">{results}</div>
    </div>
  );
}

export function Divider() {
  return <hr className="divider" />;
}

/* -------------------------------------------------------------------- text */

export function H1({ children }: { children: React.ReactNode }) {
  return <h1 className="h1">{children}</h1>;
}

export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="h2">{children}</h2>;
}

export function Lede({ children }: { children: React.ReactNode }) {
  return <p className="lede">{children}</p>;
}

export function Fine({ children }: { children: React.ReactNode }) {
  return <p className="fine">{children}</p>;
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

/** Section heading with an optional control on the right. */
export function SectionHead({ title, right }: { title: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="row">
      <H2>{title}</H2>
      {right && <span className="spacer">{right}</span>}
    </div>
  );
}

/* ------------------------------------------------------------------ status */

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: Tone | "new" }) {
  return <span className={tone === "neutral" ? "badge" : `badge ${tone}`}>{children}</span>;
}

/** Severity rail down the side of a finding. */
export function Rail({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return <div className={tone === "neutral" ? "rail" : `rail ${tone}`}>{children}</div>;
}

export function Note({ tone = "info", children }: { tone?: Tone; children: React.ReactNode }) {
  return <div className={`note ${tone === "neutral" ? "info" : tone}`}>{children}</div>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="empty">{children}</div>;
}

export function Skeleton({ h = 14, w = "100%" }: { h?: number; w?: number | string }) {
  return <span className="sk" style={{ display: "block", height: h, width: w }} />;
}

/* ----------------------------------------------------------------- figures */

export function Stat({ value, label }: { value: React.ReactNode; label: React.ReactNode }) {
  return (
    <div className="stat">
      <span className="stat-v">{value}</span>
      <span className="stat-k">{label}</span>
    </div>
  );
}

export function StatRow({ children, two }: { children: React.ReactNode; two?: boolean }) {
  return <div className={two ? "stat-row two" : "stat-row"}>{children}</div>;
}

/**
 * The one number a screen leads with.  Proportional digits on purpose: tabular
 * figures give every digit the width of a zero, which looks loose this large.
 */
export function Hero({
  value,
  label,
  tone,
}: {
  value: React.ReactNode;
  label: React.ReactNode;
  tone?: "danger" | "ok";
}) {
  return (
    <div className="hero">
      <span className={tone ? `hero-v ${tone}` : "hero-v"}>{value}</span>
      <span className="hero-k">{label}</span>
    </div>
  );
}

export function Num({ children }: { children: React.ReactNode }) {
  return <span className="num">{children}</span>;
}

/* a row in a list ---------------------------------------------------------- */

export function ListRow({
  icon,
  tone = "neutral",
  title,
  sub,
  amount,
  amountSub,
  onClick,
  chevron,
  flagged,
  footer,
  clip,
}: {
  icon?: React.ReactNode;
  tone?: Tone;
  title: React.ReactNode;
  sub?: React.ReactNode;
  amount?: React.ReactNode;
  amountSub?: React.ReactNode;
  onClick?: () => void;
  chevron?: boolean;
  flagged?: boolean;
  footer?: React.ReactNode;
  /** Holds the row to one line each for the title and its sub-line. */
  clip?: boolean;
}) {
  const body = (
    <>
      {icon !== undefined && (
        <span className={tone === "neutral" ? "ri-ico" : `ri-ico ${tone}`}>{icon}</span>
      )}
      <span className="ri-main">
        <span className="ri-title">{title}</span>
        {sub && <span className="ri-sub">{sub}</span>}
      </span>
      <span className="ri-amt">
        {amount}
        {amountSub && <span className="sub">{amountSub}</span>}
        {chevron && !amount && <IconChevron />}
      </span>
      {footer && <span className="ri-wrap">{footer}</span>}
    </>
  );
  const style = flagged ? { background: "var(--danger-bg)" } : undefined;
  const cls = ["ri", clip && "clip"].filter(Boolean).join(" ");
  return onClick ? (
    <button type="button" className={`${cls} tap`} style={style} onClick={onClick}>
      {body}
    </button>
  ) : (
    <div className={cls} style={style}>
      {body}
    </div>
  );
}

/** Kept for simple two column rows: a label on the left, a figure on the right. */
export function LineItem({
  label,
  amount,
  sub,
  flagged,
}: {
  label: React.ReactNode;
  amount?: React.ReactNode;
  sub?: React.ReactNode;
  flagged?: boolean;
}) {
  return (
    <div className="ri" style={flagged ? { background: "var(--danger-bg)" } : undefined}>
      <span className="ri-main" style={{ gridColumn: "1 / 3" }}>
        <span className="ri-title">{label}</span>
        {sub && <span className="ri-sub">{sub}</span>}
      </span>
      {amount !== undefined && <span className="ri-amt">{amount}</span>}
    </div>
  );
}

/** Three figures under one heading, the way a receipt prints a category. */
export function Metric3({
  items,
}: {
  items: { k: string; v: React.ReactNode; tone?: "danger" | "ok"; text?: boolean }[];
}) {
  return (
    <div className="metric3">
      {items.map((m) => (
        <div key={m.k}>
          <div className="m-k">{m.k}</div>
          <div
            className={m.tone ? `m-v ${m.tone}` : "m-v"}
            // A name is not a figure: monospaced digits are there to line up
            // columns of money, and they make wrapped words hard to read.
            style={m.text ? { fontFamily: "var(--font-ui)", fontSize: 14, fontWeight: 600 } : undefined}
          >
            {m.v}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CategoryHead({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="cat-head">
      {icon}
      <span className="t">{children}</span>
    </div>
  );
}

/* ---------------------------------------------------------------- controls */

export interface Option {
  id: string;
  label: string;
}

export function Button({
  children,
  onClick,
  primary,
  quiet,
  wide,
  small,
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  primary?: boolean;
  quiet?: boolean;
  wide?: boolean;
  small?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const cls = ["btn", primary && "primary", quiet && "quiet", wide && "wide", small && "small"]
    .filter(Boolean)
    .join(" ");
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && (
        <p className="fine" style={{ marginTop: 5 }}>
          {hint}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ pickers */

/** One choice from a list, as an ordinary dropdown. */
export function Picker({
  label,
  options,
  value,
  onChange,
  hint,
  placeholder = "Choose",
}: {
  label: string;
  options: Option[];
  value: string;
  onChange: (id: string) => void;
  hint?: React.ReactNode;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <select id={id} className="select" value={value} onChange={(e) => onChange(e.target.value)}>
        {!options.some((o) => o.id === value) && (
          <option value={value} disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && (
        <p className="fine" style={{ marginTop: 5 }}>
          {hint}
        </p>
      )}
    </div>
  );
}

/**
 * Several choices from a list: a field that summarises the selection and
 * opens a checklist underneath it.
 */
export function MultiPicker({
  label,
  options,
  value,
  onChange,
  hint,
  placeholder = "Nothing selected",
}: {
  label: string;
  options: Option[];
  value: string[];
  onChange: (ids: string[]) => void;
  hint?: React.ReactNode;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const id = useId();
  const chosen = options.filter((o) => value.includes(o.id));
  const summary =
    chosen.length === 0
      ? placeholder
      : chosen.length <= 2
        ? chosen.map((c) => c.label).join(", ")
        : `${chosen[0].label} and ${chosen.length - 1} more`;

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const toggle = (oid: string) =>
    onChange(value.includes(oid) ? value.filter((v) => v !== oid) : [...value, oid]);

  return (
    <div className="multi" ref={box}>
      <label className="label" id={`${id}-l`}>
        {label}
      </label>
      <button
        type="button"
        className="select multi-field"
        aria-expanded={open}
        aria-labelledby={`${id}-l ${id}-v`}
        onClick={() => setOpen((o) => !o)}
      >
        <span id={`${id}-v`} className={chosen.length ? "multi-v" : "multi-v ph"}>
          {summary}
        </span>
        {chosen.length > 0 && <span className="badge">{chosen.length}</span>}
      </button>
      {open && (
        <div className="multi-list" role="group" aria-label={label}>
          {options.map((o) => (
            <label key={o.id} className="multi-opt">
              <input type="checkbox" checked={value.includes(o.id)} onChange={() => toggle(o.id)} />
              <span>{o.label}</span>
            </label>
          ))}
          {chosen.length > 0 && (
            <button type="button" className="multi-clear" onClick={() => onChange([])}>
              Clear all
            </button>
          )}
        </div>
      )}
      {hint && (
        <p className="fine" style={{ marginTop: 5 }}>
          {hint}
        </p>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- numbers */

/** A plain numeric input, with an optional prefix such as a dollar sign. */
export function NumberField({
  label,
  value,
  onChange,
  hint,
  placeholder = "",
  maxLength = 9,
  prefix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: React.ReactNode;
  placeholder?: string;
  maxLength?: number;
  prefix?: string;
}) {
  const id = useId();
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <div className={prefix ? "input-wrap has-prefix" : "input-wrap"}>
        {prefix && <span className="input-prefix">{prefix}</span>}
        <input
          id={id}
          className="input num"
          inputMode="numeric"
          maxLength={maxLength}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        />
      </div>
      {hint && (
        <p className="fine" style={{ marginTop: 5 }}>
          {hint}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------- format */

export function usd(v: number): string {
  return v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function usdShort(v: number): string {
  if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`;
  return `$${Math.round(v)}`;
}

/* -------------------------------------------------------------------- hooks */

/** localStorage-backed state that degrades to plain state when storage throws. */
export function useStored(key: string, initial: string): [string, (v: string) => void] {
  const [v, setV] = useState(initial);
  useEffect(() => {
    try {
      const s = window.localStorage.getItem(key);
      if (s !== null) setV(s);
    } catch {}
  }, [key]);
  const set = useCallback(
    (next: string) => {
      setV(next);
      try {
        window.localStorage.setItem(key, next);
      } catch {}
    },
    [key],
  );
  return [v, set];
}

/** The same, for a list of ids. */
export function useStoredList(key: string): [string[], (v: string[]) => void] {
  const [raw, setRaw] = useStored(key, "");
  const list = useMemo(() => (raw ? raw.split(",").filter(Boolean) : []), [raw]);
  const set = useCallback((next: string[]) => setRaw(next.join(",")), [setRaw]);
  return [list, set];
}

/** Debounces a value so expensive parses do not run on every keystroke. */
export function useDebounced<T>(value: T, ms: number): T {
  const [out, setOut] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setOut(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return out;
}
