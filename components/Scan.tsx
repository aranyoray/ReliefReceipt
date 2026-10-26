"use client";

import React, { useRef } from "react";
import { Fine, IconCamera, IconDoc, Meter, Note, Stack } from "@/ui";

/**
 * Scan a bill with the camera, or pick a photo already taken.
 *
 * Two separate inputs rather than one: `capture` opens the camera straight
 * away on a phone, which is what someone standing over the paper wants, while
 * the second lets them pick the photo or screenshot they already have.
 */
export interface ScanState {
  busy: boolean;
  pct: number;
  label: string;
  error: string;
  /** Lines the last scan added to the bill. */
  added: number;
}

export function Scan({
  scan,
  scanFile,
  compact,
}: {
  scan: ScanState;
  scanFile: (file: File) => Promise<void>;
  compact?: boolean;
}) {
  const camera = useRef<HTMLInputElement>(null);
  const library = useRef<HTMLInputElement>(null);

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset the input so photographing the same page twice still fires.
    e.target.value = "";
    if (file) void scanFile(file);
  };

  return (
    <Stack tight>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <button
          type="button"
          className="card pad-s"
          style={tile}
          onClick={() => camera.current?.click()}
          disabled={scan.busy}
        >
          <span style={badge}>
            <IconCamera />
          </span>
          <span style={tileLabel}>Take a photo</span>
        </button>

        <button
          type="button"
          className="card pad-s"
          style={tile}
          onClick={() => library.current?.click()}
          disabled={scan.busy}
        >
          <span style={badge}>
            <IconDoc />
          </span>
          <span style={tileLabel}>Upload a photo</span>
        </button>
      </div>

      <input
        ref={camera}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={pick}
        style={{ display: "none" }}
        aria-hidden="true"
        tabIndex={-1}
      />
      <input
        ref={library}
        type="file"
        accept="image/*"
        onChange={pick}
        style={{ display: "none" }}
        aria-hidden="true"
        tabIndex={-1}
      />

      {scan.busy && (
        <div className="stack-s" aria-live="polite">
          <Meter pct={scan.pct * 100} />
          <Fine>
            {scan.label}, {Math.round(scan.pct * 100)}%
          </Fine>
        </div>
      )}

      {!scan.busy && scan.error && <Note tone="warn">{scan.error}</Note>}

      {!scan.busy && scan.added > 0 && (
        <Note tone="ok">
          {scan.added} {scan.added === 1 ? "line" : "lines"} read from the photo and added below. Check
          them against the paper before you rely on them.
        </Note>
      )}

      {!compact && (
        <Fine>
          The photo is read on this device. The reader itself is downloaded once, about 15 MB, and
          cached by the browser after that.
        </Fine>
      )}
    </Stack>
  );
}

const tile: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 2,
  textAlign: "left",
  padding: 14,
};

const badge: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 10,
  display: "grid",
  placeItems: "center",
  background: "var(--surface-2)",
  color: "var(--rc-navy-soft)",
  marginBottom: 6,
};

const tileLabel: React.CSSProperties = { fontWeight: 620, fontSize: 14.5 };
