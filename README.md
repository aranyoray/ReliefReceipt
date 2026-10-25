<img src="public/logo-wordmark.svg" alt="ReliefReceipt" width="280">

**Can I get it waived?** Every non-profit hospital in the US has to run a
financial assistance programme, and most people who qualify never apply.
ReliefReceipt works out what a household is entitled to under its own state's
rules, shows where it sits against the two thresholds in that policy, and
writes the application letter.

Its sister product, [CareReceipt](https://github.com/aranyoray/CareReceipt),
answers the other half: *is this bill wrong?* The two were one monorepo until
they were split into a repository each; the engine under `lib/engine` and the
design system under `ui` are vendored into both, identical on each side.

```
app/          one route, the shell and the two tabs
components/   Relief: what you qualify for, and the letter
lib/engine/   charity-care rules, the FPL tables, geo, the bill audit
ui/           design system: tokens, primitives, charts, icons, app shell
public/       county geography and the ZIP crosswalk
```

## Running it

```bash
npm install
npm run dev        # localhost:3001
npm run build
npm run typecheck
```

Port 3001 is deliberate: CareReceipt runs on 3000 and the two link to each
other, resolving the neighbour from the page's own origin in development.

## The interface

Built for a phone browser first and widened for a desktop one.

**On a phone** it is an app: a teal bar at the top, cards on a tinted canvas,
a fixed tab bar at the bottom, and a segmented control over the two views.
Numeric fields — income, household size, balance owed — open a keypad in a
bottom sheet rather than letting the system keyboard shove the page around.

**From 860px** the tab bar becomes a pill row in the header and the page holds
to a readable width.

Both run light and dark from the same tokens, with a toggle for pinning one.

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

Everything runs in the browser. No income figure or ZIP code leaves the device;
state persists in `localStorage` only.

The FPL tables and the state charity rules are point-in-time data. Check
`lib/engine/relief.ts` before relying on a threshold: these change annually.

Apply even if the income looks too high. Eligibility is judged per date of
service, can be applied retroactively, and hardship provisions sit outside the
income test.
