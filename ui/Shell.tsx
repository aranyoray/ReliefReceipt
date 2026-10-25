"use client";

import React from "react";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  /** Renders a New badge beside the label in the desktop nav. */
  isNew?: boolean;
  /** A dot on the tab, for a count of things waiting to be looked at. */
  alert?: boolean;
  /** Set for a link to the other product instead of an in-app tab. */
  href?: string;
}

/**
 * App chrome shared by both products.
 *
 * On a phone this is a coloured bar at the top, content on a tinted canvas,
 * and a fixed tab bar at the bottom with the thumb-reachable sections.  From
 * 860px the tab bar is replaced by a pill row in the header and the page
 * becomes two columns.
 */
export function Shell({
  product,
  mark,
  nav,
  active,
  onNavigate,
  greeting,
  right,
  header,
  lifted,
  narrow,
  action,
  children,
}: {
  product: string;
  mark: string;
  nav: NavItem[];
  active: string;
  onNavigate: (id: string) => void;
  /** Replaces the product name on a phone, as on a home screen. */
  greeting?: { kicker: string; name: string };
  right?: React.ReactNode;
  /** Sits under the title inside the coloured bar: a segmented control, say. */
  header?: React.ReactNode;
  /** Lets the first card ride up into the coloured bar. */
  lifted?: boolean;
  /** Holds a one column screen to a readable width on a wide display. */
  narrow?: boolean;
  /** Sticky primary action, above the tab bar. */
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pageCls = ["page", lifted && "lifted", narrow && "narrow", action && "has-action"]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="shell">
      <header className="appbar">
        <div className="appbar-in">
          <div className="appbar-stack" style={{ width: "100%" }}>
            <div className="row" style={{ flexWrap: "nowrap" }}>
              <span className="brand-mark" aria-hidden="true">
                {mark}
              </span>
              {greeting ? (
                <span className="greet">
                  <span className="greet-k">{greeting.kicker}</span>
                  <span className="greet-v">{greeting.name}</span>
                </span>
              ) : (
                <span className="brand">{product}</span>
              )}

              <nav className="nav" role="tablist" aria-label="Sections">
                {nav.map((n) =>
                  n.href ? (
                    <a key={n.id} className="nav-item" href={n.href}>
                      {n.label}
                    </a>
                  ) : (
                    <button
                      key={n.id}
                      role="tab"
                      type="button"
                      aria-selected={n.id === active}
                      className="nav-item"
                      onClick={() => onNavigate(n.id)}
                    >
                      {n.label}
                      {n.isNew && <span className="badge new">New</span>}
                    </button>
                  ),
                )}
              </nav>
              {right && <span className="pushed">{right}</span>}
            </div>
            {header}
          </div>
        </div>
      </header>

      <main className={pageCls}>{children}</main>

      {action}

      <nav className="tabbar" role="tablist" aria-label="Sections">
        {nav.map((n) =>
          n.href ? (
            <a key={n.id} className="tab" href={n.href}>
              {n.icon}
              {n.label}
            </a>
          ) : (
            <button
              key={n.id}
              type="button"
              role="tab"
              aria-selected={n.id === active}
              className="tab"
              onClick={() => onNavigate(n.id)}
            >
              {n.icon}
              {n.label}
              {n.alert && <span className="tab-dot" aria-hidden="true" />}
            </button>
          ),
        )}
      </nav>
    </div>
  );
}
