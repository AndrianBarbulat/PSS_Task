# Analyst PSS Assessment

A React and JavaScript assessment website that diagnoses a fictional PSG escalation backlog, turns the analysis into a repeatable dashboard, presents a five-minute leadership brief, and explains the stakeholder approach behind the recommended actions.

The project is designed for Netlify and uses only the fictional assessment workbook supplied with the exercise. Parts 1–4 are implemented. Part 5 now includes a versioned Wix/Velo coding baseline, the completed technical investigation, and the final customer response; publication retesting remains pending.

For a separate, anonymized study reference based on recurring internal working patterns, see [PSS_README.md](PSS_README.md). It is guidance for personal study, not a replacement for current CSI, Dynamics Knowledge, Product QA, or incident procedures.

## Current status

| Part | Deliverable | Status | Route |
| --- | --- | --- | --- |
| 1 | Queue analysis | Complete | `#/analysis` |
| 2 | Daily operational dashboard | Functionally complete; manual visual QA deferred | `#/dashboard` |
| 3 | Five-minute leadership brief | Complete | `#/brief` |
| 4 | Stakeholder approach | Complete | `#/stakeholders` |
| 5 | Wix technical work | Investigation and response complete; published retest pending | `#/technical` |

The assessment snapshot is fixed at **5 October 2026, 09:00**. It must not be confused with the current date or a live operational report.

## Review locally

Prerequisites:

- Node.js `22.12.0` or newer; Node.js 24 is used by the Netlify configuration.
- npm.
- Optional: Python and `openpyxl` for the independent workbook-to-JSON parity check.

Install and start the development server:

```sh
npm install
npm run dev
```

Open the URL printed by Vite, normally:

```text
http://127.0.0.1:5173/
```

Useful direct routes:

```text
http://127.0.0.1:5173/#/analysis
http://127.0.0.1:5173/#/dashboard
http://127.0.0.1:5173/#/brief
http://127.0.0.1:5173/#/stakeholders
http://127.0.0.1:5173/#/technical
```

Do not open `index.html` directly from the filesystem. This is a Vite application and must run through the development or preview server.

## Assessment coverage

### Part 1 — Queue analysis

The analysis explains:

- backlog growth and weekly flow;
- immediate SLA and ownership exposure;
- bundle, topic, source, reason, and handover concentrations;
- capacity sensitivity;
- facts versus hypotheses;
- prioritized actions and missing information;
- source ranges and calculation definitions.

The complete answer and supporting evidence are visible without closed dropdowns. The page follows the assignment questions in a direct sequence and includes print styling.

Primary files:

- `src/pages/Analysis.jsx`
- `src/data/report.js`
- `src/lib/calculatePSG.js`
- `tests/analysis.test.js`

### Part 2 — Daily dashboard

The dashboard contains six operational views:

1. Morning overview
2. Explainable triage queue
3. Driver and concentration explorer
4. Recovery scenarios and action register
5. Independent snapshot library
6. Data quality and metric definitions

Every successful import is stored as an independent browser snapshot using IndexedDB. Imports are not appended or silently merged. An Analyst can reopen any stored snapshot, select an explicit comparison baseline, or allow the dashboard to choose the nearest earlier snapshot. The current prototype accepts multiple complete five-sheet `.xlsx` workbooks, compatible Open Cases `.csv` exports, or compatible JSON snapshots in one import action.

The Morning overview also contains an optional evidence-backed AI brief. Deterministic code remains responsible for all counts, SLA calculations, comparisons and concentrations. DeepSeek receives only a compact operational fact pack after the user explicitly confirms generation; the original workbook is not sent. Briefs are cached against their snapshot so reopening a dataset does not spend another API request.

Two fictional daily workbooks are published with the prototype for a complete comparison test. The October 6 snapshot contains 350 open cases; the October 7 snapshot contains 335 and includes additions, removals, owner changes, and new SLA transitions. Download links are available directly in the Snapshot Library.

The importer accepts:

- the supplied five-sheet `.xlsx` workbook; or
- a compatible Open Cases `.csv` export; or
- a compatible JSON snapshot.

An Open Cases CSV inherits SLA targets, topic mappings, traffic/capacity data, and definitions from the active reference snapshot. Its reporting time is inferred deterministically from `Created On + Age (hrs)`, and the import is blocked if those values imply inconsistent snapshot times. The inherited supporting data is recorded as a visible warning so it cannot be mistaken for data supplied by the CSV.

Files are parsed locally in the browser and are not uploaded. The import gate checks required sheets and columns, malformed rows, duplicate IDs, duplicate mappings, numeric traffic values, SLA targets, missing sources, and timestamps before adding a dataset to the snapshot library.

When AI analysis is requested, the sanitized fact pack is sent through the Netlify function at `netlify/functions/psg-ai-brief.mjs`. Configure `DEEPSEEK_API_KEY` in Netlify's environment settings. For local development, copy `.env.example` to `.env`, add the key locally, and run `npm run dev`. This starts Vite at `http://127.0.0.1:5173` together with a dedicated local functions server. Never use a `VITE_` prefix for the secret because Vite-prefixed values are exposed to the browser.

Complete dashboard snapshots and generated briefs use browser IndexedDB; action statuses use `localStorage`. They are local to one browser and are not shared between users or devices.

Primary files:

- `src/pages/Dashboard.jsx`
- `src/lib/dashboard.js`
- `src/lib/spreadsheet.js`
- `src/lib/snapshotLibrary.js`
- `src/lib/aiBrief.js`
- `netlify/functions/psg-ai-brief.mjs`
- `tests/dashboard.test.js`

### Part 3 — Leadership brief

The leadership view is structured as a five-minute readout covering:

- the decision statement;
- what is happening;
- the strongest measured drivers;
- immediate risks;
- five ordered actions;
- proposed owners;
- success measures;
- leadership decisions required today;
- confirmed facts, supported interpretations, hypotheses, and unavailable conclusions.

The page has a dedicated print layout and links back to the supporting dashboard.

Primary files:

- `src/pages/LeadershipBrief.jsx`
- `src/pages/LeadershipBrief.css`
- `src/lib/leadership.js`
- `tests/leadership.test.js`

### Part 4 — Stakeholder approach

The stakeholder view contains three scenarios:

1. BPO troubleshooting and knowledge review
2. Google Ads product investigation
3. Domain DNS routing and handover review

Every scenario answers the same four required questions:

- Who would I contact first?
- Why is that role appropriate?
- How would I identify the current owner?
- What evidence would I bring?

Each scenario also includes an opening message, working-session questions, conditional handoffs, and an explicit statement of what the available data does not justify claiming. Roles are used instead of invented names, and no conversation is presented as having occurred.

Primary files:

- `src/pages/StakeholderApproach.jsx`
- `src/pages/StakeholderApproach.css`
- `src/lib/stakeholders.js`
- `tests/stakeholders.test.js`

### Part 5 — Technical work

Part 5 includes the published custom cart summary, the custom order-request demo, the technical investigation, and the final customer response. The Task 2 coding baseline and completed written deliverables are preserved in [`docs/wix-task-2`](docs/wix-task-2/README.md).

Completed written deliverables:

- [Task 1 — Published custom cart summary](https://andrianb.wixstudio.com/cart-summary/cart-summary)
- [Cloned Wix test site](https://andrianb.wixsite.com/psstechtask2/category/all-products)
- [Task 2 — Technical investigation and proposed solutions](docs/wix-task-2/INVESTIGATION_AND_SOLUTIONS.md)
- [Final user-facing response](docs/wix-task-2/USER_FACING_RESPONSE.md)

For Task 1, I used the Wix eCommerce Current Cart and frontend APIs to display the cart products, options, quantities, prices and subtotal. Quantity changes and removals refresh the Wix cart state, while the cart-change event reloads the summary so it remains synchronized. Visitors without an active cart see the required empty-cart message.

The current implementation records only the custom fields represented in the latest `OrderRequests` CSV schema. The supplied export contains no data rows, so it confirms the collection headings but does not establish a successful final retest.

#### Coding changes preserved

- A cart is empty only when it has zero product lines. One product line is valid regardless of quantity.
- The frontend calls `createOrderRequest()` without sending a browser-controlled cart object.
- The backend authenticates the site member and loads the authoritative Wix current cart.
- The backend uses the `OrderRequests` collection consistently.
- Product names, quantities, unit prices, and size/color description lines are formatted into the existing `products` Tags field.
- CMS access uses backend `suppressAuth` only after authentication; the success lookup also checks that the record belongs to the current member.
- The submitted current cart is deleted only after the CMS request succeeds, and Wix cart UI state is refreshed.
- The success page retrieves its payment link through the ownership-checked backend method instead of querying the collection directly.

Primary files:

- `docs/wix-task-2/CartPage.js`
- `docs/wix-task-2/orderRequests.web.js`
- `docs/wix-task-2/SuccessPage.js`
- `docs/wix-task-2/README.md`

#### Current evidence and remaining work

- Published test page: [Wix cart page](https://andrianb.wixsite.com/copy-of-my-si/cart-page?appSectionParams=%7B%22origin%22%3A%22wixcode%22%7D)
- The original one-line-cart defect, collection mismatch, direct CMS read, unsupported line-item property, missing CMS values, and same-cart cleanup behavior were investigated through live errors, code review, and earlier exports.
- The latest CSV supplied for this baseline is empty. A new published test must create a fresh row before the final behavior can be claimed as verified.
- The final test must include two variants of the same product and confirm readable values such as `Size: XL, Color: Green` and `Size: XL, Color: Blue`.
- The `https://testpayment.link/pay` value remains a placeholder, not a working payment integration.
- The investigation and customer-facing response conclude that the available evidence does not justify a Wix development escalation. A platform escalation should be reconsidered only if a remaining failure can be reproduced after the corrected implementation is published and fully retested.

The investigation currently points to custom-code and CMS-access issues, not a demonstrated Wix platform defect.

## Headline findings to verify

These are the main figures used across Parts 1–4:

| Finding | Result | Calculation or population |
| --- | ---: | --- |
| Three-week backlog growth | `+610` / `+50.6%` | Weekly backlog: `1,205 → 1,815` |
| Latest weekly net addition | `+420` | `2,860 incoming − 2,440 handled` |
| Business share of three-week growth | `55.7%` | `340 ÷ 610` |
| Business share of latest weekly addition | `63.1%` | `265 ÷ 420` |
| Exported open cases | `340` | Open Cases sheet only |
| Exported cases beyond SLA target | `109` / `32.1%` | `109 ÷ 340`; not overall SLA attainment |
| P1 exposure | `12 of 15 breached` | The other three have 2–4 hours remaining |
| Unassigned exposure | `19`, including `6 breached` | Open-case export |
| Google Ads concentration | `20 of 21 breached` | Median age: `100 hours` |
| BPO review candidates | `64 of 116` | Missing Troubleshooting, Wrong Topic, or Knowledge Gap |
| Domain DNS handovers | `19 of 28` with 3+ | `13` are breached |
| Full missing-hours sensitivity | About `205` additional handled | Leaves about `+215` weekly net additions |

The tests assert these values and their important boundaries.

## Architecture

```text
Assessment workbook or compatible JSON
                 │
                 ▼
        Local spreadsheet adapter
        src/lib/spreadsheet.js
                 │
                 ▼
       Validation and normalization
        src/lib/dashboard.js
                 │
                 ▼
      Deterministic calculation engine
       src/lib/calculatePSG.js
          │          │          │
          ▼          ▼          ▼
     Dashboard   Leadership  Stakeholders
       model       model        model
          │          │          │
          └──────────┴──────────┘
                     ▼
                  React UI
```

The calculation and decision logic is kept outside the React components. This allows tests to verify operational conclusions without relying on rendered text.

### Important state behavior

- Part 1, Part 3, and Part 4 use the bundled fixed assessment snapshot in `src/data/assessment.json`.
- Part 2 can store and reopen multiple compatible workbooks or JSON snapshots as independent datasets.
- A Part 2 import does **not** automatically update Parts 1, 3, or 4.
- Dashboard snapshots, cached AI briefs, and action statuses are stored only in the current browser.
- A daily Open Cases CSV must contain the canonical case columns. Arbitrary header normalization remains a future mapping workflow; the application does not ask AI to guess operational fields silently.

## Data and analytical boundaries

The workbook contains five sheets:

- `Open Cases`
- `Traffic & Capacity`
- `SLA Targets`
- `Data Notes`
- `Topic Mapping`

Important interpretation rules:

| Boundary | Treatment |
| --- | --- |
| `340` exported cases versus `1,815` closing backlog | Keep the populations separate until scope, filters, and cut-offs reconcile. |
| SLA breach boundary | A case is breached only when `age > target`; exact target is due now. |
| Timezone | The source provides no timezone. UTC is used only as a common arithmetic frame. |
| Open-case breach share | Do not describe it as overall SLA attainment because resolved cases are absent. |
| Escalation source | Describes currently open cases, not the source of recent incoming-volume growth. |
| `Bug` reason | A label requiring reproduction, not proof of a platform defect. |
| Reviewable reasons | Audit candidates, not confirmed unnecessary escalations. |
| Handovers | Association requiring history review, not proven causation. |
| Capacity recovery | Sensitivity using observed handled-per-hour rates, not a forecast or staffing commitment. |
| Missing case from a later snapshot | “No longer present in the open export,” not automatically resolved. |

## Tests and verification

Run the automated suite:

```sh
npm test
```

Current result:

```text
27 tests passed
0 failed
```

The suite covers:

- all five source tabs and the fixed snapshot time;
- weekly backlog reconciliation and growth;
- SLA boundaries and case examples;
- source, reason, topic, and capacity calculations;
- workbook import parity;
- malformed imports and validation errors;
- triage ordering and explanations;
- snapshot comparison language;
- recovery scenarios;
- leadership metrics, actions, and evidence classifications;
- stakeholder scenario structure and claim boundaries.
- full Part 5 investigation and customer-response rendering from the versioned Markdown sources.

Build and audit:

```sh
npm run build
npm audit --audit-level=high
```

Current verified result:

- production build succeeds;
- dependency audit reports zero vulnerabilities;
- local HTTP route checks return `200`;
- every supplied workbook cell matches `src/data/assessment.json` in the automated Excel import test.

Optional independent source parity check:

```sh
python -m pip install openpyxl
python scripts/verify-source.py
```

This script reads the source workbook with `openpyxl` and compares every cell with the bundled JSON fixture. It does not modify the workbook. The Python check is optional because the Node test suite already verifies workbook import parity through the application's production spreadsheet adapter.

## Manual review still required

Automated logic and production builds pass, but final visual QA was deferred. Before submission, manually check:

- every route at desktop and mobile widths;
- the Part 2 `.xlsx` import flow;
- filtering, recovery controls, snapshot saving, and comparison behavior;
- print preview for Parts 1, 3, and 4;
- table overflow, page breaks, clipping, and contrast;
- Netlify refresh behavior on hash routes;
- that Part 5 remains clearly labelled in progress until the published retest and CMS evidence are complete.

## Suggested independent AI review

Ask the reviewing model to inspect the repository rather than only this README. A useful review checklist is:

1. Recalculate every headline finding from `src/data/assessment.json`.
2. Confirm the `340` and `1,815` populations are never incorrectly combined.
3. Check that facts, interpretations, hypotheses, and unassessable claims remain distinct.
4. Review whether each proposed owner has a defensible reason and conditional handoff.
5. Check for any wording that implies a stakeholder was contacted or an action already happened.
6. Confirm that Bug labels and reviewable escalation reasons are not presented as proven causes.
7. Inspect import validation for malformed data and silent coercion.
8. Run `npm test`, `npm run build`, and the optional Python parity check.
9. Manually inspect responsive and print layouts.
10. Verify that no real customer data, internal Slack research, or credentials are included in the deployable build.

## npm scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server on `127.0.0.1`. |
| `npm test` | Run all Node test files in `tests/`. |
| `npm run build` | Create the production bundle in `dist/`. |
| `npm run preview` | Serve the production bundle locally. |

## Project structure

```text
PSS_Task/
├── Analyst_PSS_Assessment_Data_v2.xlsx
├── PSS_README.md
├── docs/
│   └── wix-task-2/
│       ├── CartPage.js
│       ├── orderRequests.web.js
│       ├── SuccessPage.js
│       └── README.md
├── index.html
├── netlify.toml
├── package.json
├── package-lock.json
├── scripts/
│   └── verify-source.py
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── styles.css
│   ├── data/
│   │   ├── assessment.json
│   │   └── report.js
│   ├── lib/
│   │   ├── calculatePSG.js
│   │   ├── dashboard.js
│   │   ├── leadership.js
│   │   ├── spreadsheet.js
│   │   └── stakeholders.js
│   └── pages/
│       ├── Analysis.jsx
│       ├── Dashboard.jsx
│       ├── LeadershipBrief.jsx
│       ├── LeadershipBrief.css
│       ├── StakeholderApproach.jsx
│       └── StakeholderApproach.css
└── tests/
    ├── analysis.test.js
    ├── dashboard.test.js
    ├── leadership.test.js
    └── stakeholders.test.js
```

## Deployment

`netlify.toml` configures:

- Node.js 24;
- build command: `npm run build`;
- publish directory: `dist`;
- single-page fallback to `index.html`;
- `X-Content-Type-Options: nosniff`;
- `Referrer-Policy: strict-origin-when-cross-origin`.

Deploy only the generated `dist` directory or connect the repository through Netlify. Deployment has not been performed.

The HTML includes `noindex, nofollow`, but this is not access control. Use appropriate Netlify access controls if the final assessment should not be publicly available.

## Privacy and content scope

- All assessment data in the application is fictional.
- Spreadsheet processing happens locally in the browser.
- The application does not send imported files to an API or backend.
- `PSS_README.md` contains only anonymized operational principles summarized for personal study; Vite does not include it in the deployable application bundle.
- Do not copy raw internal Slack conversations, private links, real customer information, credentials, or restricted source material into the deployable build or public documentation.
- Treat the study guide as internal unless its publication has been explicitly approved.
- Recommendations describe proposed actions, not actions already completed.

## Known limitations

- Part 5 has a preserved corrected coding baseline, completed investigation, and final customer response, but the latest CSV contains no records; published CMS verification and the full retest matrix remain incomplete.
- Final responsive and print visual QA is pending.
- The project is not deployed.
- Imported Part 2 data is not shared with Parts 1, 3, or 4.
- Snapshot and action history are browser-local.
- The prototype has no shared database, authentication, or multi-user state.
- The importer supports `.xlsx` and compatible JSON, not legacy `.xls`.
- Three weeks of traffic data are insufficient for a reliable demand forecast.
- The source does not provide business-hour calendars, SLA pause rules, full case histories, contact-volume denominators, or reconciled report populations.

## Remaining roadmap

1. Complete manual visual and print QA for Parts 1–4.
2. Copy the preserved Wix/Velo baseline into the matching Wix page and backend locations and publish it.
3. Complete the Part 5 retest matrix, including variant, CMS, and cart-deletion evidence.
4. Reconsider Wix escalation only if the corrected published implementation still reproduces a platform-level failure.
5. Run a final submission audit.
6. Deploy the presentation to Netlify.

## License

This repository does not currently include a license file. Treat it as a private assessment project; do not assume permission to redistribute or reuse it.
