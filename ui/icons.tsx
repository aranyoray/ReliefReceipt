import React from "react";

/* Line icons, drawn on a 24 grid at 1.7 stroke so they sit at the same weight
   as the type around them. Every one is decorative: the label beside it is the
   accessible name, so they are hidden from assistive tech. */

export interface IconProps {
  size?: number;
}

function svg(path: React.ReactNode, size = 22) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {path}
    </svg>
  );
}

export const IconHome = ({ size }: IconProps) =>
  svg(
    <>
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6 10v9h12v-9" />
      <path d="M10 19v-5h4v5" />
    </>,
    size,
  );

export const IconReceipt = ({ size }: IconProps) =>
  svg(
    <>
      <path d="M6 3h12v18l-2.4-1.6L13.2 21 12 19.6 10.8 21l-2.4-1.6L6 21z" />
      <path d="M9.2 8h5.6M9.2 12h5.6" />
    </>,
    size,
  );

export const IconShield = ({ size }: IconProps) =>
  svg(
    <>
      <path d="M12 3.2 19 6v5.4c0 4.2-2.8 7.4-7 9.4-4.2-2-7-5.2-7-9.4V6z" />
      <path d="m9 12 2.1 2.2L15.2 10" />
    </>,
    size,
  );

export const IconRelief = ({ size }: IconProps) =>
  svg(
    <>
      <path d="M12 20s-6.6-3.9-8.1-8.2C2.8 8.9 4.5 6 7.4 6c1.9 0 3.3 1.1 4.6 3 1.3-1.9 2.7-3 4.6-3 2.9 0 4.6 2.9 3.5 5.8C18.6 16.1 12 20 12 20z" />
    </>,
    size,
  );

export const IconCamera = ({ size }: IconProps) =>
  svg(
    <>
      <path d="M3 8.5h3.2L8 6h8l1.8 2.5H21V19H3z" />
      <circle cx="12" cy="13.3" r="3.3" />
    </>,
    size,
  );

export const IconChart = ({ size }: IconProps) =>
  svg(
    <>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 16v-4M12.5 16V8M17 16v-6" />
    </>,
    size,
  );

export const IconFlag = ({ size }: IconProps) =>
  svg(
    <>
      <path d="M6 21V4" />
      <path d="M6 5h11l-2 3.5L17 12H6" />
    </>,
    size,
  );

export const IconChevron = ({ size }: IconProps) =>
  svg(<path d="m9.5 5.5 6.5 6.5-6.5 6.5" />, size ?? 18);

export const IconClose = ({ size }: IconProps) =>
  svg(
    <>
      <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />
    </>,
    size ?? 20,
  );

export const IconCheck = ({ size }: IconProps) =>
  svg(<path d="m5 12.6 4.6 4.6L19 7.6" />, size ?? 20);

export const IconPlus = ({ size }: IconProps) =>
  svg(
    <>
      <path d="M12 5v14M5 12h14" />
    </>,
    size ?? 20,
  );

export const IconDoc = ({ size }: IconProps) =>
  svg(
    <>
      <path d="M6 3h7l5 5v13H6z" />
      <path d="M13 3v5h5" />
      <path d="M9 13h6M9 17h4" />
    </>,
    size,
  );

export const IconPin = ({ size }: IconProps) =>
  svg(
    <>
      <path d="M12 21s6.5-6.1 6.5-10.4A6.5 6.5 0 0 0 5.5 10.6C5.5 14.9 12 21 12 21z" />
      <circle cx="12" cy="10.4" r="2.4" />
    </>,
    size,
  );

export const IconPhone = ({ size }: IconProps) =>
  svg(
    <>
      <path d="M7.5 3.8 9.8 4l1.1 3.4-1.9 1.4a11 11 0 0 0 5.2 5.2l1.4-1.9L19 13.2l.2 2.3a2 2 0 0 1-2.2 2.2C10.6 17 7 13.4 5.3 6A2 2 0 0 1 7.5 3.8z" />
    </>,
    size,
  );

export const IconSpark = ({ size }: IconProps) =>
  svg(
    <>
      <path d="M12 3.5 13.6 9l5.5 1.6-5.5 1.6L12 17.8l-1.6-5.6L4.9 10.6 10.4 9z" />
    </>,
    size,
  );

export const IconSun = ({ size }: IconProps) =>
  svg(
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.6v2.2M12 19.2v2.2M4.2 12H2M22 12h-2.2M6.3 6.3 4.8 4.8M19.2 19.2l-1.5-1.5M17.7 6.3l1.5-1.5M4.8 19.2l1.5-1.5" />
    </>,
    size ?? 20,
  );

export const IconMoon = ({ size }: IconProps) =>
  svg(<path d="M20 14.2A8.2 8.2 0 0 1 9.8 4 8.4 8.4 0 1 0 20 14.2z" />, size ?? 20);

export const IconList = ({ size }: IconProps) =>
  svg(
    <>
      <path d="M8.5 7h11M8.5 12h11M8.5 17h11" />
      <path d="M4.5 7h.01M4.5 12h.01M4.5 17h.01" />
    </>,
    size,
  );
