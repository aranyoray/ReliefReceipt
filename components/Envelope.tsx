"use client";

import React, { useLayoutEffect, useRef, useState } from "react";

type Phase = "closed" | "open" | "rise" | "leave" | null;

function reducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/**
 * The envelope.  Until a letter is prepared a closed envelope waits with a
 * one-line hint.  When one is prepared the flap opens back on its hinge, the
 * letter slides up out of the envelope, then the envelope drops away below
 * and the letter settles at full width.  Height returns to auto afterwards so
 * nothing inside is clipped.
 */
export function EnvelopeStage({
  shown,
  play,
  hint,
  children,
}: {
  /** Whether there is a letter to show. */
  shown: boolean;
  /** Bumped each time the letter is prepared; a change plays the animation. */
  play: number;
  hint: React.ReactNode;
  children: React.ReactNode;
}) {
  const stage = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const last = useRef(play);
  const [width, setWidth] = useState(0);
  const [full, setFull] = useState(0);
  const [phase, setPhase] = useState<Phase>(null);

  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (play === last.current) return;
    last.current = play;
    if (!shown || reducedMotion()) {
      setPhase(null);
      return;
    }
    if (window.matchMedia("(max-width: 859px)").matches) {
      stage.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setPhase("closed");
    const timers: number[] = [];
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      setFull(inner.current?.scrollHeight ?? 0);
      raf2 = requestAnimationFrame(() => {
        setPhase("open");
        timers.push(window.setTimeout(() => setPhase("rise"), 650));
        timers.push(window.setTimeout(() => setPhase("leave"), 1650));
        timers.push(window.setTimeout(() => setPhase(null), 2650));
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [play, shown]);

  const animating = shown && phase !== null;
  const W = width || 700;
  const w = Math.round(Math.min(560, W * 0.8));
  const h = Math.round(w * 0.6);
  const T = Math.round(h * 0.66);
  const s = (0.9 * w) / W;
  const vars = {
    "--w": `${w}px`,
    "--h": `${h}px`,
    "--T": `${T}px`,
    "--s": s,
    "--H": `${full}px`,
    "--y0": `${Math.round(T + h * 0.01)}px`,
    "--y1": `${Math.round(T - h * 0.44)}px`,
    "--crop": `${Math.round((0.98 * h) / s)}px`,
    "--stage-h": `${T + h + 32}px`,
  } as React.CSSProperties;

  const cls = ["env-stage", (!shown || animating) && "env-anim", animating && `p-${phase}`, !shown && "p-closed"]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={stage} className={cls} style={!shown || animating ? vars : undefined}>
      {(!shown || animating) && (
        <>
          <div className="env-part env-back" aria-hidden="true" />
          <div className="env-part env-pocket" aria-hidden="true">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0 0 L50 55 L100 0 L100 100 L0 100 Z" fill="#fff" stroke="#cfd7e3" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              <path d="M0 100 L46 58 M100 100 L54 58" fill="none" stroke="#dde3ea" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
          <div className="env-part env-flap" aria-hidden="true">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0 0 L100 0 L50 100 Z" fill="#16233f" />
            </svg>
            <svg className="inside" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0 0 L100 0 L50 100 Z" fill="#2b4a8a" />
            </svg>
            <span className="env-seal">R</span>
          </div>
        </>
      )}
      {!shown && <p className="env-hint">{hint}</p>}
      {shown && (
        <div className="env-letter">
          <div className="env-crop">
            <div ref={inner}>{children}</div>
          </div>
        </div>
      )}
    </div>
  );
}
