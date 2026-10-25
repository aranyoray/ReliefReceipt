"use client";

import { useEffect, useState } from "react";

/**
 * Where the sister product lives.
 *
 * In development the two apps run on neighbouring ports, in production on
 * sibling hosts. The port is only knowable in the browser, so the published
 * address is what renders on the server and the local one is swapped in after
 * mount: deriving it during render would make the server and client markup
 * disagree.
 */
export const CARE_URL = process.env.NEXT_PUBLIC_CARE_URL ?? "https://carereceipt.app";

export function useCareUrl(): string {
  const [url, setUrl] = useState(CARE_URL);
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_CARE_URL) return;
    if (window.location.port === "3001") {
      setUrl(`${window.location.protocol}//${window.location.hostname}:3000`);
    }
  }, []);
  return url;
}
