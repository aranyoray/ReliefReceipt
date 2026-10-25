"use client";

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { IconCheck, IconChevron, IconClose, IconMoon, IconSun } from "./icons";

export * from "./icons";
export * from "./charts";

/* ============================================================================
   Shared primitives for CareReceipt and ReliefReceipt.

   The set is built for a phone first: one column, cards on a tinted canvas,
   44px touch targets, input that arrives in a bottom sheet instead of pushing
   the page around, and a sticky primary action.  The same pieces widen into a
   two column layout in a desktop browser.
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
 * Inputs and results.  One column on a phone, with the controls first; two
 * columns from 860px up, where the controls stay put while results scroll.
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

/* --------------------------------------------------------------- navigation */

export interface Option {
  id: string;
  label: string;
}

export function Segmented({
  options,
  value,
  onChange,
  onBrand,
}: {
  options: Option[];
  value: string;
  onChange: (id: string) => void;
  onBrand?: boolean;
}) {
  return (
    <div className={onBrand ? "seg on-brand" : "seg"} role="tablist">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={o.id === value}
          className="seg-btn"
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Where a piece of work has got to: done, in progress, still ahead. */
export function Stepper({ steps, at }: { steps: string[]; at: number }) {
  return (
    <div className="stepper">
      {steps.map((s, i) => (
        <div key={s} className={`step${i < at ? " done" : i === at ? " now" : ""}`}>
          <span className="step-bar" />
          <span className="step-k">{s}</span>
        </div>
      ))}
    </div>
  );
}

export function Chips({
  options,
  value,
  onChange,
  scroll,
}: {
  options: Option[];
  value: string;
  onChange: (id: string) => void;
  scroll?: boolean;
}) {
  return (
    <div className={scroll ? "chips scroll" : "chips"}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className="chip"
          aria-pressed={o.id === value}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- controls */

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

/** The primary action. Sticky above the tab bar on a phone, inline on a desktop. */
export function ActionBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="actionbar">
      <div className="actionbar-in">{children}</div>
    </div>
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

/* ------------------------------------------------------------- bottom sheet */

/**
 * A sheet that rises from the bottom of a phone and lands as a centred dialog
 * on a wide screen.  Input lives here rather than inline so the page never
 * reflows around a system keyboard.
 */
export function Sheet({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    panel.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : undefined}>
        <span className="sheet-grab" aria-hidden="true" />
        <div className="sheet-head">
          <span className="sheet-title">{title}</span>
          <button type="button" className="iconbtn spacer" style={{ background: "var(--surface-2)", color: "var(--ink-soft)" }} onClick={onClose} aria-label="Close">
            <IconClose />
          </button>
        </div>
        <div className="sheet-body" ref={panel} tabIndex={-1}>
          {children}
        </div>
        {footer && <div style={{ padding: "0 16px 16px" }}>{footer}</div>}
      </div>
    </>
  );
}

/* ------------------------------------------------------- pickers, one sheet */

/**
 * One choice from a list.  A dropdown rather than a row of chips: eight age
 * bands and six race groups as chips fill half a phone screen before the
 * reader has entered anything.
 */
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
  const [open, setOpen] = useState(false);
  const id = useId();
  const current = options.find((o) => o.id === value);
  return (
    <div>
      <label className="label" id={`${id}-l`}>
        {label}
      </label>
      {/* The field is a button, so it needs the label and the current value
          named explicitly: a bare <label> does not attach to one. */}
      <button
        type="button"
        className="tapfield"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-labelledby={`${id}-l ${id}-v`}
      >
        <span id={`${id}-v`} className={current ? undefined : "ph"} style={{ fontSize: 15 }}>
          {current ? current.label : placeholder}
        </span>
        <span className="spacer" style={{ color: "var(--ink-faint)", display: "inline-flex" }}>
          <IconChevron />
        </span>
      </button>
      {hint && (
        <p className="fine" style={{ marginTop: 5 }}>
          {hint}
        </p>
      )}
      <Sheet open={open} title={label} onClose={() => setOpen(false)}>
        <div style={{ margin: "0 -16px" }}>
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              className="ri tap"
              onClick={() => {
                onChange(o.id);
                setOpen(false);
              }}
            >
              <span className="ri-main" style={{ gridColumn: "1 / 3" }}>
                <span className="ri-title">{o.label}</span>
              </span>
              <span className="ri-amt" style={{ color: "var(--s1)" }}>
                {o.id === value ? <IconCheck /> : null}
              </span>
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}

/**
 * Several choices from a list, summarised as a count rather than as a wall of
 * selected chips.  Used for conditions already diagnosed.
 */
export function MultiPicker({
  label,
  options,
  value,
  onChange,
  hint,
  placeholder = "None selected",
}: {
  label: string;
  options: Option[];
  value: string[];
  onChange: (ids: string[]) => void;
  hint?: React.ReactNode;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const chosen = options.filter((o) => value.includes(o.id));
  const summary =
    chosen.length === 0
      ? placeholder
      : chosen.length <= 2
        ? chosen.map((c) => c.label).join(", ")
        : `${chosen[0].label} and ${chosen.length - 1} more`;

  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  return (
    <div>
      <label className="label" id={`${id}-l`}>
        {label}
      </label>
      <button
        type="button"
        className="tapfield"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-labelledby={`${id}-l ${id}-v`}
      >
        <span
          id={`${id}-v`}
          className={chosen.length ? undefined : "ph"}
          style={{ fontSize: 15, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          {summary}
        </span>
        <span className="spacer" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--ink-faint)" }}>
          {chosen.length > 0 && <span className="badge">{chosen.length}</span>}
          <IconChevron />
        </span>
      </button>
      {hint && (
        <p className="fine" style={{ marginTop: 5 }}>
          {hint}
        </p>
      )}
      <Sheet
        open={open}
        title={label}
        onClose={() => setOpen(false)}
        footer={
          <div className="row">
            <Button quiet onClick={() => onChange([])}>
              Clear
            </Button>
            <span className="spacer">
              <Button primary onClick={() => setOpen(false)}>
                Done
              </Button>
            </span>
          </div>
        }
      >
        <div style={{ margin: "0 -16px" }}>
          {options.map((o) => {
            const on = value.includes(o.id);
            return (
              <button
                key={o.id}
                type="button"
                className="ri tap"
                aria-pressed={on}
                onClick={() => toggle(o.id)}
              >
                <span
                  className="ri-ico"
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 7,
                    background: on ? "var(--rc-teal)" : "var(--surface-2)",
                    color: "#fff",
                  }}
                >
                  {on ? <IconCheck size={16} /> : null}
                </span>
                <span className="ri-main">
                  <span className="ri-title">{o.label}</span>
                </span>
                <span className="ri-amt" />
              </button>
            );
          })}
        </div>
      </Sheet>
    </div>
  );
}

/* ----------------------------------------------------------------- keypad */

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * A number field that opens a keypad sheet on a touch screen and stays an
 * ordinary input on a desktop.  The sheet keeps the figure being edited in
 * view, which a system keyboard sliding over the page does not.
 */
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
  const [open, setOpen] = useState(false);
  const [touch, setTouch] = useState(false);
  const id = useId();

  useEffect(() => {
    try {
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      setTouch(coarse || navigator.maxTouchPoints > 0);
    } catch {
      setTouch(false);
    }
  }, []);

  const press = (k: string) => {
    if (k === "del") onChange(value.slice(0, -1));
    else if (value.length < maxLength) onChange((value + k).replace(/^0+(?=\d)/, ""));
  };

  if (!touch) {
    return (
      <Field label={label} hint={hint}>
        <input
          className="input num"
          inputMode="numeric"
          maxLength={maxLength}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        />
      </Field>
    );
  }

  return (
    <div>
      <label className="label" id={`${id}-l`}>
        {label}
      </label>
      <button
        type="button"
        className="tapfield"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-labelledby={`${id}-l ${id}-v`}
      >
        <span id={`${id}-v`} className={value ? "val" : "ph"}>
          {value ? `${prefix ?? ""}${value}` : placeholder || "Tap to enter"}
        </span>
      </button>
      {hint && (
        <p className="fine" style={{ marginTop: 5 }}>
          {hint}
        </p>
      )}
      <Sheet
        open={open}
        title={label}
        onClose={() => setOpen(false)}
        footer={
          <Button primary wide onClick={() => setOpen(false)}>
            Done
          </Button>
        }
      >
        <div className="keypad-v" aria-live="polite">
          {value ? `${prefix ?? ""}${value}` : <span className="ph">{placeholder || "0"}</span>}
        </div>
        <div className="keypad">
          {KEYS.map((k) => (
            <button key={k} type="button" className="key" onClick={() => press(k)}>
              {k}
            </button>
          ))}
          <button type="button" className="key fn" onClick={() => onChange("")}>
            Clear
          </button>
          <button type="button" className="key" onClick={() => press("0")}>
            0
          </button>
          <button type="button" className="key fn" onClick={() => press("del")} aria-label="Delete">
            Delete
          </button>
        </div>
      </Sheet>
    </div>
  );
}

/* --------------------------------------------------------------------- theme */

/**
 * Light and dark follow the system by default. The toggle pins the other one
 * for people whose phone is in dark mode but who are reading a bill in the
 * sun, and the choice is remembered on the device.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<"auto" | "light" | "dark">("auto");

  useEffect(() => {
    try {
      const s = window.localStorage.getItem("rc_theme");
      if (s === "light" || s === "dark") {
        setTheme(s);
        document.documentElement.dataset.theme = s;
      }
    } catch {}
  }, []);

  const flip = () => {
    const prefersDark =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const now = theme === "auto" ? (prefersDark ? "dark" : "light") : theme;
    const next = now === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem("rc_theme", next);
    } catch {}
  };

  return (
    <button type="button" className="iconbtn" onClick={flip} aria-label="Switch between light and dark">
      {theme === "dark" ? <IconSun /> : <IconMoon />}
    </button>
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
