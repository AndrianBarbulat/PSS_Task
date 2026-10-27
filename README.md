# Analyst PSS assessment

React + JavaScript presentation project, prepared for Netlify.

## Current scope

- Part 1: completed fixed-snapshot queue analysis, expandable evidence, capacity sensitivity, source references and print support.
- Part 2: operational dashboard prototype with a morning overview, transparent triage, concentration explorer, recovery scenarios, browser-local action tracking, JSON validation and snapshot comparison.
- Parts 3–5: clearly labelled placeholders only. Leadership brief, stakeholder responses and Wix technical work are not completed.
- The technical section separates the custom cart, investigation and customer response. Its functioning cart must be published on Wix; this website is the presentation hub.

The fictional assessment snapshot is **October 5, 2026, 09:00**, not the current date. Weekly backlog and case-export populations are deliberately kept separate.

## Run locally

Use Node.js 24 LTS. Open this project folder in VS Code, then run:

```sh
npm install
npm run dev
```

Open the local URL printed in the terminal. Opening `index.html` directly from the filesystem will not run a Vite/React source project.

The first install generates `package-lock.json`; commit that file and use `npm ci` for subsequent clean installs. Dependency installation in this session was blocked: the configured package proxy returned HTTP 502, and direct registry access was denied by the local environment. No lockfile or production build could be generated, and browser/layout verification remains outstanding. Do not treat the React presentation as fully verified until the commands below succeed.

## Verify and build

```sh
npm test
npm run build
npm run preview
```

Optional source-cell verification requires Python with openpyxl:

```sh
python scripts/verify-source.py
```

## Netlify

The included `netlify.toml` sets Node 24, build command `npm run build`, and publish directory `dist`. Connect this project through your Git provider, or upload the built `dist` folder using Netlify's manual deployment flow. Deployment has not been performed.

Publish **only `dist`**, never the entire working folder. The build includes only the app and fictional assessment data. Internal Slack research and real customer material must not be added. `noindex` discourages indexing but is not access control.

## Verification status

- Passed: all fourteen calculation and dashboard-logic tests, including changing inputs, exact SLA boundaries, triage, validation, snapshot comparison and scenarios.
- Passed: every imported cell compared against all five original workbook tabs.
- Pending: dependency installation, production build, browser interaction, responsive layout and print verification.
- Part 2 limitation: the import adapter currently accepts compatible JSON. Direct `.xlsx` parsing remains pending until the spreadsheet dependency can be installed. Snapshot and action history are browser-local, not shared.
- Not performed: deployment or any work on the actual Wix technical tasks.

## Where to edit

- `src/pages/Analysis.jsx`: the Part 1 narrative and evidence.
- `src/pages/Dashboard.jsx`: the Part 2 operating views and browser-local workflow.
- `src/App.jsx`: five-section navigation and remaining-part placeholders.
- `src/styles.css`: responsive and print layout.
- `src/lib/calculatePSG.js`: deterministic calculations, separate from the UI.
- `src/lib/dashboard.js`: validation, triage, snapshot comparison, scenarios and driver exploration.
- `src/data/assessment.json`: the provided workbook's five tabs as a fixed input, not a daily feed.
- `tests/analysis.test.js`: calculation, boundary, case-example and scenario checks.

The source workbook is unchanged. The earlier standalone report is retained locally in `archive/part1-original.html`, outside the deployed build and ignored by Git. Additional explanatory detail remains in that archive; the new report focuses on the assessed decisions.

The main brief calls the dashboard Part 2 and leadership summary Part 3; its submission list reverses them. Navigation follows the main body and uses descriptive titles.

## Analysis boundaries

SLA uses elapsed age and a strict `age > target` breach boundary, matching the source's exact-boundary case. Timestamps use a common arithmetic frame because the source does not provide a timezone. Source shares describe open cases, not incoming escalation rates. Bug and reviewable-reason labels are not confirmed root causes. The capacity control is an illustrative sensitivity, not a staffing forecast.

The calculation engine is tested against the assessment fixture. The prototype validates required JSON tabs and fields, duplicates and missing sources. A general-purpose daily spreadsheet importer still needs direct `.xlsx` parsing, import-date controls and broader malformed-field handling.
