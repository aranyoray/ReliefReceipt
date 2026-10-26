"use client";

import React from "react";

export interface NavItem {
  id: string;
  label: string;
  /** A dot on the tab, for a count of things waiting to be looked at. */
  alert?: boolean;
  /** Set for a link (another route, or the other product) instead of an in-page tab. */
  href?: string;
}

/**
 * The workspace: a full-width navy bar with the product's sections as tabs,
 * and under it a screen that fills the window, inputs down the left and the
 * result on the right.  Narrow windows stack the two; there is no phone-style
 * tab bar.
 */
export function Shell({
  product,
  mark,
  nav,
  active,
  onNavigate,
  right,
  children,
}: {
  product: string;
  mark: React.ReactNode;
  nav: NavItem[];
  active: string;
  onNavigate?: (id: string) => void;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="ws">
      <header className="ws-bar">
        <a className="ws-brand" href="/">
          <span className="brand-mark" aria-hidden="true">
            {mark}
          </span>
          {product}
        </a>
        <nav className="ws-tabs" aria-label="Sections">
          {nav.map((n) =>
            n.href ? (
              <a
                key={n.id}
                className="ws-tab"
                href={n.href}
                aria-current={n.id === active ? "page" : undefined}
              >
                {n.label}
                {n.alert && <span className="ws-dot" aria-label="Needs attention" />}
              </a>
            ) : (
              <button
                key={n.id}
                type="button"
                aria-current={n.id === active ? "page" : undefined}
                className="ws-tab"
                onClick={() => onNavigate?.(n.id)}
              >
                {n.label}
                {n.alert && <span className="ws-dot" aria-label="Needs attention" />}
              </button>
            ),
          )}
        </nav>
        {right && <span className="ws-right">{right}</span>}
      </header>
      <main className="ws-main">{children}</main>
    </div>
  );
}
