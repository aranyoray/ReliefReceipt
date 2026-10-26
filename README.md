<img src="public/logo-wordmark.svg" alt="ReliefReceipt" width="280">

**Can I get it waived?** Every non-profit hospital in the US has to run a
financial assistance programme, and most people who qualify never apply.
ReliefReceipt works out what a household is entitled to under its own state's
rules, shows where it sits against the two thresholds in that policy, and
writes the application letter.

## Features

- **Assistance**: charity-care eligibility under the state's rules, where the
  household sits on the FPL scale, and the application letter to copy.
- **Bill check**: paste an itemised bill, take a photo or upload one (read
  on-device with tesseract.js), or use the example. Every line is priced for
  the ZIP code where the care happened; lines that should not be there are
  struck. Findings to review, where the money is, by-category totals, a call
  script to copy, and **Use this balance for assistance** to carry what is left
  after the disputes into the Assistance letter.
- **Health risk**: for an age band, sex and race group, plus anything already
  diagnosed, the conditions most likely for that profile and the expected
  health spending a year per condition.
- **About**: who made it.

```
app/          the workspace route and /about
components/   Relief (assistance), BillCheck + Scan (bill audit), HealthRisk,
              Envelope (the reveal shared by all three), About
lib/ocr.ts    in-browser OCR for bill photos
lib/engine/   charity-care rules, the FPL tables, geo, the bill audit, risk and costs
ui/           design system: tokens, primitives, charts, icons, app shell
public/       county geography, the ZIP crosswalk, RiskReceiptUS.json (risk reference)
```

## Running it

```bash
npm install
npm run dev        # localhost:3000
npm run build
npm run typecheck
```

## The interface

A desktop workspace that fills the window. A navy bar runs the full width with
the product's sections as tabs: Assistance, Bill check, Health risk and About.
Each tab is the same workspace: inputs in a full-height panel on the left with
one primary button, and the result revealed from the envelope on the right.

Assistance is one screen. Down the left is a full-height panel that scrolls on
its own, with plain inputs for ZIP code, income, household size and balance
owed, and a **Prepare my letter** button. The right holds the result. Until a
letter is prepared it shows a closed navy-and-white envelope; on the button the
flap opens back on its hinge, the letter slides up out of the envelope, the
envelope drops away below and the letter settles at full width. What the
household qualifies for sits at the top of the letter and the letter text, with
its copy button, below. Reduced motion skips straight to the letter.

Narrow windows stack the panel above the result. There are no bottom sheets,
keypads, segmented controls or phone-style tab bars. Light only.

## What it computes

`assessEligibility` places the household on its state's scale: at or below the
free-care threshold the balance should be written off, between that and the
discount threshold it falls on the sliding scale, and above it the application
is made under the hardship provisions instead. The meter on the first screen is
that scale, with the two bands drawn and a marker where the household sits.

The letter names the programme, the household size, the income as a percentage
of the federal poverty level, the balance, and what is being asked for. It is
copied, not sent: it goes to the billing department in writing, with a request
to pause collection while the application is assessed.

## Notes

Everything runs in the browser. No income figure, ZIP code or bill leaves the
device (the OCR engine's files are fetched once from a CDN on the first scan);
state persists in `localStorage` only.

The FPL tables and the state charity rules are point-in-time data. Check
`lib/engine/relief.ts` before relying on a threshold: these change annually.

Apply even if the income looks too high. Eligibility is judged per date of
service, can be applied retroactively, and hardship provisions sit outside the
income test.
