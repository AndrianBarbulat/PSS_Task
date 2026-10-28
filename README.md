# Analyst PSS Assessment

A React and JavaScript assessment website that diagnoses a fictional PSG escalation backlog, turns the analysis into a repeatable dashboard, presents a five-minute leadership brief, and explains the stakeholder approach behind the recommended actions.

The project is designed for Netlify and uses only the fictional assessment workbook supplied with the exercise. Parts 1–4 are implemented. Part 5, the Wix technical work, is now in investigation: the first live defect has been reproduced and documented, but the implementation, full retest, and customer response remain pending.

For a separate, anonymized study reference based on recurring internal working patterns, see [PSS_README.md](PSS_README.md). It is guidance for personal study, not a replacement for current CSI, Dynamics Knowledge, Product QA, or incident procedures.

## Current status

| Part | Deliverable | Status | Route |
| --- | --- | --- | --- |
| 1 | Queue analysis | Complete | `#/analysis` |
| 2 | Daily operational dashboard | Functionally complete; manual visual QA deferred | `#/dashboard` |
| 3 | Five-minute leadership brief | Complete | `#/brief` |
| 4 | Stakeholder approach | Complete | `#/stakeholders` |
| 5 | Wix technical work | In progress; first defect reproduced, fixes and full evidence pending | `#/technical` |

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

Supporting evidence is expandable, and the page includes print styling.

Primary files:

- `src/pages/Analysis.jsx`
- `src/data/report.js`
- `src/lib/calculatePSG.js`
- `tests/analysis.test.js`

### Part 2 — Daily dashboard

The dashboard contains five operational views:

1. Morning overview
2. Explainable triage queue
3. Driver and concentration explorer
4. Recovery scenarios and action register
5. Data quality and snapshot workflow

The importer accepts:

- the supplied five-sheet `.xlsx` workbook; or
- a compatible JSON snapshot.

Files are parsed locally in the browser and are not uploaded. The import gate checks required sheets and columns, malformed rows, duplicate IDs, duplicate mappings, numeric traffic values, SLA targets, missing sources, and timestamps before replacing the dashboard state.

Snapshot and action history use browser `localStorage`. They are local to one browser and are not shared between users or devices.

Primary files:

- `src/pages/Dashboard.jsx`
- `src/lib/dashboard.js`
- `src/lib/spreadsheet.js`
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

Part 5 has three separate deliverables. The Netlify presentation will show the evidence, but it will not replace the required working Wix implementation.

| Deliverable | What must be shown | Current state |
| --- | --- | --- |
| A. Custom cart/order-request demo | A published Wix flow that displays the real cart, submits an order request, handles errors, and keeps the Wix cart synchronized | Published test page exists; current submission logic contains confirmed and suspected defects |
| B. Technical investigation | Reported behavior, reproduction, evidence, root cause, fix, retest, and escalation decision | First defect reproduced on 28 October 2026; fix and retest pending |
| C. Customer-facing response | A clear explanation of what happened, what was fixed, what the user should do, and any remaining limitations | Must be written after the fixes are verified |

#### Current Wix test environment

- Published test page: [Wix cart page](https://andrianb.wixsite.com/copy-of-my-si/cart-page?appSectionParams=%7B%22origin%22%3A%22wixcode%22%7D)
- Current implementation: Wix cart page code plus a backend `.web.js` web method.
- Current data target: a CMS order-request collection.
- Test session: logged-in site member.
- Evidence date: **28 October 2026**.

Do not present the test payment URL as a working payment integration. The current `testpayment.link` value is only a placeholder.

#### Confirmed live reproduction

I tested the published page with one cart line:

- product: `Ceramic Flower Vase`;
- quantity: `6`;
- subtotal and total: `€1,620.00`;
- cart badge: `6` items.

After I selected **Make order and get payment link**, the page displayed **Your cart is empty.** The page did not navigate, and the cart still contained six units. There were no relevant application errors in the browser console.

This behavior is reproduced and explained by the frontend condition:

```js
if (!cart.lineItems || cart.lineItems.length === 1) {
```

`lineItems.length` counts product lines, not the total quantity. A cart containing one product line is therefore incorrectly treated as empty even when that line has a quantity greater than one. The required check is:

```js
if (!cart.lineItems || cart.lineItems.length === 0) {
```

Because the code returned at this point, the backend web method was not called in this test. No CMS record should have been created by this specific attempt; the CMS was not independently inspected, so that conclusion is based on the confirmed early-return path.

#### Additional code findings to resolve

Only the first item below is currently proven by a live reproduction. The others are code-review findings that must be fixed and then verified in the published site.

| Finding | Risk | Required correction | Verification state |
| --- | --- | --- | --- |
| Empty-cart check uses `lineItems.length === 1` | A valid cart with one product line cannot submit | Use `=== 0` | **Confirmed live defect** |
| Cart clearing uses `lineItemIds.length > 1` | A successful order containing one product line would not clear the cart | Use `> 0` | Code finding; retest required |
| Insert uses `TestOrderRequest`, while update uses `OrderRequests` | The second write can fail or update a different collection | Choose one collection ID and use it consistently | Code finding; CMS IDs must be checked |
| The complete cart object is accepted from frontend code | Browser-supplied prices, products, or member data must not be trusted | Call the web method without a cart payload and load the current cart in backend code | Security/design finding |
| `item.productName` may be a localized object | CMS may receive `[object Object]` or an unsupported value instead of a product name | Normalize `original`, `translated`, and fallback values to a string | Data-shape finding |
| Only product names are saved | The request cannot reliably reconstruct quantities, variation choices, line IDs, or prices | Save a normalized item array with the fields actually required for follow-up | Requirements decision pending |
| Payment link has no `https://` protocol and is a test domain | The returned value may not be clickable and is not a real payment flow | Use a valid HTTPS URL or label the value clearly as a non-functional test placeholder | Integration pending |
| Record creation and cart clearing share one generic error path | A record can be created, cart clearing can fail, and a retry can create a duplicate | Separate creation and cleanup states and add idempotency protection | Reliability finding |
| Success redirect has not been verified | The result page may be missing or may not show the correct request safely | Implement and test the success route with a non-sensitive reference | Pending |
| `Permissions.SiteMember` excludes guests | Guest checkout will fail by design | Confirm that member-only ordering is intended; otherwise design a safe guest flow | Product decision pending |

#### Recommended implementation path

For the assessment, the fastest and clearest route is to finish the current implementation in **Wix Studio or the regular Wix Editor with Velo**. It already has the published store, member session, cart, and page controls needed to demonstrate the workflow.

| Option | When to use it | Trade-off |
| --- | --- | --- |
| Regular Wix Editor + Velo | Continue an existing Editor site | Fastest if the current site is already built there |
| Wix Studio + Velo | Build the same Wix-hosted flow with more responsive layout control | Good presentation option, but moving editors is unnecessary if the current site works |
| Wix Headless on a separate site | The final requirement is a separate frontend that uses Wix business services | More control, but also more authentication, session, API, CORS, deployment, and cart-synchronization work |

Headless remains a valid later option, but it should not be introduced only to repair the current conditional bug. First complete the Wix-hosted version and its evidence. A headless version can then reuse the same normalized order-request contract if there is a clear requirement for a separate website.

The target flow should be:

```text
Member selects Submit
        ↓
Frontend disables repeat submission
        ↓
Backend authenticates the member and loads the current Wix cart
        ↓
Backend validates a non-empty cart and normalizes item data
        ↓
Backend creates one durable OrderRequests record
        ↓
Frontend receives orderId/paymentLink
        ↓
Frontend clears every submitted line and refreshes the Wix cart
        ↓
Frontend opens the verified success state
```

The backend should be the source of truth for the member, products, quantities, and prices. The frontend may display data, but it must not be trusted to define the order. The CMS collection should not allow direct public writes; insertion should occur only through the controlled backend method.

#### Implementation checklist for the next session

1. **Confirm the exact requirement**
   - Decide whether the deliverable is a custom cart, an order-request flow, or a real checkout/payment flow.
   - Confirm whether ordering is intentionally limited to logged-in members.
   - Decide which fields the operational team actually needs in the CMS record.

2. **Confirm Wix setup**
   - Record whether the live site is using the regular Editor or Wix Studio.
   - Confirm the real CMS collection ID and field keys.
   - Review collection permissions and ensure frontend visitors cannot write arbitrary order records.
   - Confirm that the success page and its route exist.

3. **Repair the frontend**
   - Change the empty-cart condition to `lineItems.length === 0`.
   - Change the clearing condition to `lineItemIds.length > 0`.
   - Prevent double submission while a request is running.
   - Show separate, useful messages for validation, record creation, cart cleanup, and navigation failures.
   - Keep the cart unchanged when order creation fails.

4. **Repair the backend**
   - Stop accepting the complete cart as a trusted browser argument.
   - Authenticate the current member and load the current cart in backend code.
   - Normalize product names and the required line-item fields.
   - Use one confirmed CMS collection consistently.
   - Create the final record in one write where possible instead of inserting and then updating it.
   - Return only the minimum safe response, such as `orderId` and a verified link.
   - Add an idempotency value or another duplicate-submission safeguard.
   - Log enough diagnostic context to investigate a failure without storing unnecessary personal data.

5. **Complete the payment/success design**
   - Replace the placeholder with a valid HTTPS test or production link, or explicitly scope payment out of the demo.
   - Do not place secrets or privileged tokens in page code, URLs, or CMS fields.
   - Make the success page safe to refresh and avoid exposing customer data through `orderId`.
   - Define what happens if the order record succeeds but cart cleanup fails.

6. **Publish and retest**
   - Publish after each meaningful code change; Preview mode alone is not final evidence.
   - Run the matrix below on desktop and mobile.
   - Inspect the resulting CMS record for each successful case.
   - Capture screenshots or a short recording of the working flow and the relevant CMS result.
   - Record the published URL, test date, expected result, actual result, and any limitation.

7. **Finish the investigation write-up**
   - For every significant problem, document: reported behavior → reproduction → evidence → root cause → fix → retest → escalation decision.
   - Separate custom-code defects from Wix configuration issues and potential Wix product defects.
   - Escalate to Wix only if the behavior remains reproducible after the custom-code and configuration causes are excluded.

8. **Write the customer-facing response**
   - Explain the symptom in plain language.
   - State what was fixed and what was successfully retested.
   - Give the user only the actions they still need to take.
   - Be explicit about any remaining limitation or workaround.
   - Do not claim that payment, CMS creation, or cart cleanup works until each has been verified.

9. **Add evidence to the assessment site**
   - Replace the `#/technical` placeholder with the published Wix link.
   - Add a short architecture explanation and the investigation record.
   - Include the test matrix results and customer response.
   - Keep secrets, private member data, raw internal conversations, and restricted links out of the repository and Netlify deployment.

#### Required retest matrix

| Scenario | Expected result | Current result |
| --- | --- | --- |
| Empty cart | Clear empty-cart message; no CMS record; no redirect | Not tested |
| One product line, quantity 1 | One request created; cart cleared; success shown | Blocked by confirmed empty-cart defect |
| One product line, quantity greater than 1 | Quantity saved correctly; cart cleared; success shown | **Failed:** quantity 6 was reported as an empty cart |
| Multiple product lines | Every line and quantity saved once; all submitted lines cleared | Not tested |
| Logged-out visitor | Intentional sign-in prompt or approved guest flow | Not tested |
| Member with missing optional profile fields | Request still succeeds or gives an actionable validation message | Not tested |
| CMS write failure | Cart remains intact; useful error shown; retry is safe | Not tested |
| Cart cleanup failure after record creation | Existing request is preserved; user is not encouraged to create a duplicate | Not tested |
| Double click, refresh, or retry | No duplicate order request | Not tested |
| Success link and page | Valid HTTPS destination; safe order reference; refresh works | Not tested |
| Mobile layout and keyboard use | Controls and status messages remain usable and visible | Not tested |

Part 5 is complete only when the published Wix flow works, the CMS result and cart synchronization are verified, the investigation clearly separates evidence from assumptions, the customer response reflects the verified outcome, and the evidence is linked from `#/technical`.

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
- Part 2 can load a different compatible workbook or JSON snapshot into its own React state.
- A Part 2 import does **not** automatically update Parts 1, 3, or 4.
- Dashboard snapshots and action statuses are stored only in the current browser.
- The current importer expects all five assessment sheets. It is not yet a general-purpose adapter for a daily open-cases-only export.

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
24 tests passed
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
- that Part 5 remains clearly labelled in progress until the fixes, retest matrix, CMS evidence, and customer response are complete.

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

- Part 5 has one confirmed live reproduction, but its fixes, CMS verification, full retest matrix, customer response, and presentation route remain incomplete.
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
2. Apply the documented Wix/Velo frontend and backend corrections.
3. Publish and complete the Part 5 retest matrix, including CMS and cart-synchronization evidence.
4. Complete the technical investigation record and decide whether any remaining behavior requires Wix escalation.
5. Write the customer response from verified findings and replace the `#/technical` placeholder with the evidence.
6. Run a final submission audit.
7. Deploy the presentation to Netlify.

## License

This repository does not currently include a license file. Treat it as a private assessment project; do not assume permission to redistribute or reuse it.
