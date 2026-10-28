# Analyst PSS Workflow and Study Guide

This is my practical guide for working as an Analyst Product Support Specialist (PSS) in the Product Support Group (PSG). It turns the recurring working patterns I found in internal Slack discussions into one study document.

It is not a replacement for a current CSI article, an approved product procedure, a manager's direction, or an incident commander's decision. Product flows change. Before acting on a live case, I must verify the current source of truth.

## How to use this guide

I will use this document to:

- understand the purpose of the PSS role;
- follow a consistent case-investigation workflow;
- decide whether an issue belongs in support, education, routing, Product QA, Jira, a Known Issue, or an incident;
- prepare clear evidence for stakeholders;
- study the tools and records that support each decision;
- avoid treating assumptions, labels, or repeated complaints as proven root causes.

The operational principles below are anonymized summaries. I have intentionally excluded customer details, employee names, case IDs, internal channel links, and copied Slack conversations.

## 1. My purpose as an Analyst PSS

My job is not only to solve the individual escalated case. My broader purpose is to connect support evidence with product and operational improvement.

I should be able to move through this chain:

```text
User problem
    -> verified case facts
    -> reproducible symptom or clearly bounded unknown
    -> correct product/process owner
    -> decision and action
    -> user/support communication
    -> reusable learning
```

In practical terms, I am expected to:

- own escalations in my product area and move them toward a defensible outcome;
- investigate beyond the initial description rather than forwarding an unverified claim;
- recognize patterns across cases, not only handle cases one by one;
- separate product defects from configuration, expected behavior, unsupported limitations, knowledge gaps, routing errors, and process failures;
- translate user impact into evidence Product and QA can act on;
- represent the user's experience without overstating what the evidence proves;
- improve CSI, knowledge, training, troubleshooting, routing, or product feedback when the investigation exposes a repeatable gap;
- track whether the chosen action actually reduced impact.

The role is a bridge:

| Side | What I bring |
| --- | --- |
| Customer Care and Delivery | Product knowledge, troubleshooting direction, escalation decisions, approved updates, and learning feedback |
| Product and QA | Reproduction evidence, affected flows, case patterns, user impact, environment details, and support observations |
| Leadership and operations | Trends, risks, ownership gaps, capacity implications, and measurable recommendations |
| Education and knowledge owners | Repeated confusion, missing steps, outdated guidance, unclear scope, and verified resolutions |

## 2. The standard I should apply

A strong PSS outcome is:

- **evidence-based**: it distinguishes facts, interpretations, and hypotheses;
- **actionable**: it ends with an owner, next action, required evidence, and review time;
- **traceable**: the case record explains what was checked and why the decision was made;
- **proportionate**: the response matches the severity and scale;
- **reusable**: the learning can improve later cases, guidance, routing, or the product;
- **safe to communicate**: only approved workarounds and confirmed status are shared externally.

The quality test I can apply to every investigation is:

> Could another PSS read my record tomorrow and continue the work without repeating my investigation or guessing why I made the decision?

## 3. End-to-end PSS workflow

### Step 1 — Accept ownership and protect urgency

I first confirm:

- the case is in the correct PSS queue and product scope;
- priority and SLA exposure;
- current owner and case status;
- whether the user is actively blocked;
- whether there is financial, security, compliance, data-loss, or high-reputation risk;
- whether an active incident or Known Issue already explains the symptom.

If the scope is wrong, I should not silently forward the case. I should document why it is out of scope, identify the correct destination, preserve the investigation already completed, and make the handoff explicit.

### Step 2 — Reconstruct the user journey

I convert the report into an exact sequence:

1. What was the user trying to achieve?
2. Where did they start?
3. What actions did they take?
4. What did they expect?
5. What happened instead?
6. When did it begin?
7. Is it consistent or intermittent?
8. What changed before it began?

I avoid vague summaries such as “feature does not work.” I name the affected flow, entry point, action, visible result, and point of failure.

### Step 3 — Check the current sources of truth

Before escalating further, I check the sources relevant to the product:

- CSI/internal support guidance;
- Dynamics Knowledge articles;
- public Help Center content where relevant;
- current product announcements and rollout notes;
- product scope/crossover guidance;
- active Known Issues and incident notices;
- existing Jira items, but only when I can validate that they match;
- previous case history and earlier troubleshooting;
- approved back-office tools, logs, system reports, telemetry, or product-specific diagnostics;
- recent Slack updates for context that may not yet be reflected in a formal article.

Slack is evidence of current working context, not automatically the final source of truth. If Slack and published guidance conflict, I confirm the current owner and request a documented decision.

### Step 4 — Validate the minimum case evidence

The evidence depends on the product, but I normally need:

- case link and relevant account/site identifiers;
- timestamp with timezone;
- affected product, surface, and exact flow;
- browser, device, app, editor, or environment version where relevant;
- exact error text or code;
- screenshot, video, system report, request ID, logs, or trace where available;
- clear reproduction steps;
- expected versus actual behavior;
- frequency and reproducibility;
- troubleshooting already attempted and its result;
- comparison with a working control, test site, account, or environment when safe;
- user impact and available workaround;
- links to a possible Jira, KI, incident, or guidance article, clearly marked as confirmed or unconfirmed.

I do not ask the user to repeat destructive, risky, or already completed troubleshooting without a reason.

### Step 5 — Reproduce or bound the uncertainty

There are three acceptable investigation states:

1. **Reproduced** — I can repeat the behavior under defined conditions.
2. **Not reproduced, but evidence is sufficient** — logs or multiple consistent cases strongly establish the symptom.
3. **Not yet established** — evidence is incomplete, inconsistent, stale, or no longer reproducible.

The third state is not a failure. It means I must state what is unknown and request the smallest useful next evidence. I should never convert “not reproduced” into “user error” without evidence.

### Step 6 — Classify the most likely path

I choose the path supported by the evidence:

| Path | Typical signal | Likely next owner/action |
| --- | --- | --- |
| Resolved through guidance | Current instructions solve the case | PSS documents outcome; Delivery communicates |
| Expected behavior | Product works as designed | Explain clearly; consider knowledge improvement |
| Configuration or account state | Specific setting, eligibility, permission, or setup explains behavior | Correct configuration or route to the owning operational team |
| Unsupported limitation | Capability is not currently supported | Explain limitation; connect qualified demand to feedback process |
| Knowledge gap | Valid answer exists but guidance is missing, unclear, or outdated | Knowledge/Education owner updates guidance |
| Troubleshooting gap | Delivery skipped or cannot perform required checks | Coaching, checklist, or training intervention |
| Routing/scope problem | Case repeatedly reaches the wrong queue | Operations/routing owner corrects mapping or flow |
| Product defect candidate | Expected behavior fails with reproducible evidence | Product QA validates and controls defect path |
| Existing active defect | Symptom and conditions match an active Jira | Link according to current process and track impact |
| Known Issue candidate | Confirmed shared problem needs consistent support communication | QA/Product confirms; KI owner publishes approved guidance |
| Live incident candidate | Material, ongoing, shared impact needs coordinated mitigation | Product/on-call incident process; war room if declared |
| Separate look-alike issue | Similar wording but evidence or conditions differ | Keep as a separate cluster until validated |

Labels such as `Bug`, a large backlog, or several old cases do not by themselves prove a product defect.

### Step 7 — Decide the escalation level

I should escalate with a question and an evidence package, not with “please investigate.”

A useful escalation states:

- the user goal and exact symptom;
- business/user impact;
- what I reproduced or verified;
- what I ruled out;
- the smallest remaining unknown;
- the decision I need from the recipient;
- case links and diagnostics;
- urgency and next review time.

### Step 8 — Maintain the case while another team investigates

Transferring technical work does not remove support ownership of the user experience. While Product or QA investigates, I should ensure:

- the case status accurately reflects the current state;
- the user is not promised an unapproved ETA;
- Delivery has a safe, approved message;
- new evidence is added to the shared record;
- duplicate effort is avoided;
- the case returns to PSS when the user supplies requested information;
- long-running investigations have a review date and named owner.

### Step 9 — Verify the outcome

Before calling the issue resolved, I check the applicable evidence:

- QA or Product confirms the change or intended behavior;
- relevant telemetry or logs have recovered;
- the original reproduction no longer fails;
- representative affected cases are retested;
- the workaround is no longer required, or is still correctly documented;
- there is no separate unresolved symptom hidden inside the original cluster.

“Fixed in Jira” is useful status, but it is not always sufficient proof that the user journey is restored.

### Step 10 — Communicate and close the loop

The final communication should explain:

- what was found;
- what changed or what the user should do;
- whether a workaround remains necessary;
- any limitation or uncertainty that remains;
- what happens next, if anything.

I close or reroute the case only after the record is understandable and the required user/support update has an owner.

### Step 11 — Convert the case into reusable learning

I ask:

- Did CSI or Dynamics Knowledge contain the right flow?
- Was the product scope obvious?
- Did Delivery have the correct troubleshooting steps?
- Did routing send the case to the correct team?
- Were identifiers, logs, or system reports available early enough?
- Did multiple cases expose a product or process pattern?
- Should a knowledge article, training item, troubleshooting template, form, dashboard, or routing rule change?

The learning is complete only when it has an owner and can be found by the next person.

### Step 12 — Measure whether the intervention worked

Depending on the problem, I monitor:

- new case volume for the same symptom;
- repeat contacts or reopened cases;
- breach and aging profile;
- handover count;
- percentage of escalations missing required evidence;
- time from escalation to reproduction;
- time from QA confirmation to approved guidance;
- number of affected cases tied to the issue;
- use and success of the workaround;
- knowledge article usage or recurring questions after publication.

## 4. CSI and knowledge workflow

### What CSI is for

CSI is the first operational reference for current support scope, required checks, approved handling, and escalation criteria. Strong articles commonly make these elements easy to find:

- scope and audience;
- before-you-start checks;
- diagnostic or troubleshooting sequence;
- decision branches;
- resolution confirmation;
- escalation requirements;
- approved user-facing language or workaround where applicable.

CSI is not infallible. Slack research showed real cases where guidance was updated after flow changes, split into more specific articles, mirrored in Dynamics, or found to be incomplete. If the observed product behavior contradicts CSI, I document the mismatch and ask the current product or knowledge owner to confirm the intended flow.

### My CSI access checklist

1. While signed into my work account, open the internal CSI/Answers knowledge site.
2. Search for an article in my trained product scope.
3. Confirm whether I can view the article, not only the landing page.
4. Open the corresponding Dynamics Knowledge location if the flow has migrated or is mirrored there.
5. Test whether I need read access or editing access; these are different permissions.
6. If access is missing, use the internal Dynamics support/access route for Knowledge Articles and inform my TL or knowledge owner.
7. Do not ask a colleague to copy restricted content into an unapproved location as a long-term workaround.

I cannot infer from Slack that my account currently has access. I must test it directly.

### When I should request a knowledge change

I request an update when:

- the documented steps no longer match the live product;
- a required decision branch is missing;
- scope or ownership is unclear;
- an approved workaround is absent or outdated;
- repeated escalations show the same misunderstanding;
- the resolution cannot be confirmed using the article;
- the same answer is repeatedly supplied through Slack because it cannot be found in CSI/Knowledge.

My request should include the affected article, evidence, proposed correction, owner to validate it, and urgency.

## 5. Product QA, Engineering, and Jira

### Product QA is the quality gate

For a suspected product defect, I normally treat Product QA as the first product-side partner. QA helps validate reproduction, affected scope, regression risk, and the correct defect path. Engineering involvement should follow the current team process rather than an unsupported direct escalation.

I bring QA:

- a reproducible or well-supported symptom;
- minimal reproduction steps;
- environment and identifiers;
- logs/system reports where relevant;
- working and failing comparisons;
- impact count and severity;
- troubleshooting already completed;
- a possible Jira match labelled as tentative until confirmed.

### Jira is a product work record, not proof

I use Jira to connect validated support evidence to product ownership and status. I do not use a Jira merely because its title sounds similar.

Before linking a case, I verify:

- the affected flow and symptom match;
- the conditions or environment match;
- the Jira is current and its status is understood;
- the issue is not a different regression or look-alike symptom;
- the team process permits the case-to-Jira connection;
- QA agrees when the match is uncertain.

Possible outcomes are:

- connect to an active matching Jira;
- ask QA to create or reopen a defect;
- keep the case separate because evidence does not match;
- use a Known Issue, PREX, CCFR, feedback, knowledge, routing, or coaching path instead;
- document that the behavior is expected or unsupported.

I should not attach doubtful cases to inflate impact. I also should not ignore a repeated pattern simply because no Jira exists yet.

## 6. Known Issues

A Known Issue (KI) gives support and users one approved description of a confirmed shared problem. It is a communication and handling mechanism, not a substitute for technical investigation.

### A useful KI should answer

- What product and flow are affected?
- What symptom will the user see?
- Who is affected, and are there important exclusions?
- What is the current status?
- Is there an approved workaround?
- What should Delivery do with an affected case?
- How will affected users receive updates?
- Who owns updates to the KI?

### My PSS responsibilities around a KI

- confirm the case really matches the KI conditions;
- avoid merging different symptoms merely because the wording is similar;
- record affected cases using the agreed tracking method;
- avoid individually re-escalating every duplicate to QA when the KI already defines the flow;
- continue escalating new evidence when it changes severity, scope, or the technical understanding;
- share only approved workarounds;
- make sure the KI and support guidance are updated when the status changes;
- retest representative cases before closing the support loop.

Following or voting on a Jira/KI may not be a complete impact record. I should maintain the affected-case record required by the current process.

## 7. War rooms and incident response

A war room is for coordinated response to a material, ongoing, shared incident. It is not a stronger word for an old backlog or a difficult individual case.

### Signals that may justify incident review

- several independent reports share the same current symptom and time window;
- Product QA, telemetry, monitoring, or on-call evidence validates the pattern;
- impact is material and still occurring;
- normal case-by-case handling cannot contain the impact;
- coordinated mitigation, status, and communication are required.

### What is not enough by itself

- a high number of breached cases;
- several cases labelled `Bug`;
- one unreproduced report;
- a Jira with a similar title;
- a historical incident without evidence that the current timing and symptom match.

### Ownership during an incident

| Role | Primary responsibility |
| --- | --- |
| Product/on-call/incident lead | Declares and coordinates the incident, mitigation, technical owners, and operational status |
| Product QA | Reproduction, affected scope, regression checks, and verification |
| PSS/Analyst | Case clustering, user-impact evidence, examples, support pattern changes, and feedback from Delivery |
| Delivery/Education | Consistent approved handling and user communication |
| KI/communications owner | Maintains the approved issue description, workaround, status, and update mechanism |

Unless the current process explicitly authorizes me, I do not unilaterally declare a war room. I assemble the evidence and ask the product/on-call owner for an incident decision.

### Incident lifecycle from my perspective

1. **Detect** — identify a credible shared pattern.
2. **Validate** — confirm symptom, timing, scope, and materiality.
3. **Coordinate** — establish technical lead, QA, PSS, communication, and review cadence.
4. **Contain** — publish approved handling and workaround; tag or track affected cases.
5. **Mitigate** — Product/on-call reduces active impact.
6. **Verify** — telemetry, QA, and representative user journeys recover.
7. **Communicate** — update the KI/guidance and affected users.
8. **Learn** — record root cause, detection gaps, support impact, and prevention actions.

## 8. Working with Delivery, Education, and Operations

### Delivery

Delivery is closest to the live user interaction. I need its evidence and feedback, but I should make the request precise.

I ask Delivery for:

- missing reproduction details;
- exact error and timestamps;
- consented diagnostics or system report;
- confirmation of the user's current state;
- results of approved troubleshooting;
- whether an approved workaround succeeded.

I give Delivery:

- the current handling decision;
- safe user-facing language;
- approved workaround and limitations;
- what not to promise;
- whether to escalate, tag, track, wait, or retest;
- the next expected update point.

### Education and knowledge

I involve Education or the knowledge owner when evidence points to repeated misunderstanding, missing guidance, weak troubleshooting, product-scope confusion, or an upcoming flow change that Delivery must understand.

### Operations and routing

I involve the operational owner when the failure is in queue mapping, topic selection, permissions, escalation forms, ownership transitions, or case status behavior. Not every support failure is a product defect.

## 9. Records and tools

| Tool or record | My use | Guardrail |
| --- | --- | --- |
| Dynamics case | Primary case history, ownership, status, communication, and evidence | Keep the timeline understandable; do not hide key reasoning only in Slack |
| CSI/internal Knowledge | Current support flow, scope, troubleshooting, and escalation requirements | Verify freshness and access; read and edit permissions differ |
| Slack | Current context, owner discovery, emerging patterns, and coordination | Convert durable decisions into the formal record; do not treat chat as permanent policy |
| Jira | Validated product work, owner, priority, and lifecycle | Similar title is not proof; involve QA when uncertain |
| Known Issue | Approved shared description and support handling | Confirm the case matches; do not share internal-only workarounds |
| Logs/system reports/telemetry | Technical evidence and timing | Follow access, privacy, and retention rules |
| User Voice/feedback path | Qualified demand and repeated limitation evidence | Keep feature demand separate from defects |
| Dashboard/report | Trend, volume, aging, concentration, and follow-up | Reconcile populations and definitions before drawing conclusions |

## 10. Evidence model

I label conclusions using four levels:

### Confirmed fact

Directly supported by the case record, source data, approved system, reproduction, or owner confirmation.

Example: “Twenty cases in the current export use the same topic and visible error.”

### Supported interpretation

A reasonable conclusion from multiple facts, but not yet a proven cause.

Example: “The concentration suggests a shared flow should be reviewed.”

### Hypothesis

A testable explanation that still requires evidence.

Example: “A recent rollout may have changed eligibility checks.”

### Not assessable from current evidence

The available data does not answer the question.

Example: “The export does not contain resolved cases, so it cannot establish overall SLA attainment.”

This discipline protects credibility and makes stakeholder decisions faster.

## 11. Templates

### PSS investigation note

```text
User goal:
Affected product/flow:
Exact symptom:
Started / last observed:
Impact and priority:

Evidence checked:
- CSI / Dynamics Knowledge:
- Case history:
- Reproduction:
- Logs / system report / identifiers:
- KI / incident:
- Possible Jira:

Expected behavior:
Actual behavior:
What I ruled out:
What remains unknown:

Current classification:
Decision needed:
Owner:
Next action:
Review time:
Approved user message/workaround:
```

### Product QA escalation

```text
I am asking for: [reproduction validation / Jira match / defect decision / scope confirmation]

Flow and symptom:
User impact:
First/last observed:
Reproduction rate and steps:
Environment:
Evidence and identifiers:
Working comparison:
Troubleshooting completed:
Possible existing Jira/KI and why it may match:
What I need confirmed:
Next user update due:
```

### Knowledge-change request

```text
Current article/flow:
Observed gap or contradiction:
Cases or pattern supporting the change:
Confirmed owner/source:
Proposed wording or decision branch:
Risk if unchanged:
Validator:
Target date:
```

### Stakeholder update

```text
Status: [confirmed / investigating / mitigated / resolved]
What changed since the last update:
Current impact:
Confirmed facts:
Open questions:
Owner and next action:
Approved handling/workaround:
Next review time:
```

## 12. Common failure modes

I should avoid:

- forwarding a case without a clear question;
- treating the initial case description as a verified diagnosis;
- linking a Jira based only on similar wording;
- treating a `Bug` label as proof;
- merging related-looking symptoms before validating conditions;
- escalating every KI duplicate individually when the approved flow says to track it;
- sharing an internal-only workaround with users or Delivery;
- promising an ETA that Product has not approved;
- leaving the important decision only in Slack;
- changing a case to solved while waiting for required evidence or another owner's response;
- repeating risky troubleshooting without justification;
- using one case as proof of systemic impact;
- using aggregate backlog data as proof of a live incident;
- closing immediately after a technical status changes without retesting the user journey;
- creating guidance that lacks an owner or update mechanism.

## 13. My daily operating checklist

### Start of shift

- Review P1/P2, SLA exposure, unassigned cases, and aging investigations.
- Check active incidents, KIs, product updates, and handoffs.
- Identify cases awaiting user evidence versus internal action.
- Confirm the owner and next review time for each material blocker.

### For each case

- Confirm scope and urgency.
- Read the full timeline before acting.
- Check current guidance and active issue records.
- Reconstruct the exact user journey.
- Validate evidence and reproduction.
- Choose and document the correct path.
- Give the next owner a specific question.
- Set a follow-up point.

### End of shift or handoff

- Update case status and notes.
- Record open questions and current owner.
- State the next action and review time.
- Surface any new cluster, KI candidate, incident signal, or knowledge gap.
- Ensure Delivery has current approved handling.

## 14. Study plan

### Phase 1 — Understand the role

- Learn the distinction between individual case resolution and system improvement.
- Practice the evidence model: fact, interpretation, hypothesis, unknown.
- Learn scope and ownership for the assigned product area.

### Phase 2 — Learn the sources and tools

- Verify CSI and Dynamics Knowledge access.
- Learn the required case fields and escalation note structure.
- Learn product-specific back offices, logs, system reports, and identifiers.
- Learn how Product QA wants reproduction evidence presented.
- Learn the current Jira, KI, PREX, CCFR, feedback, and incident paths.

### Phase 3 — Practice decisions

For historical anonymized cases, decide whether each is:

- resolvable through guidance;
- expected behavior;
- configuration;
- limitation or feature demand;
- knowledge/troubleshooting gap;
- routing problem;
- defect candidate;
- existing Jira/KI;
- incident candidate;
- still unassessable.

Then compare the reasoning with an experienced PSS or QA partner.

### Phase 4 — Practice communication

- Write a one-paragraph QA escalation.
- Write a Delivery update without unsupported promises.
- Write a KI summary with an approved workaround.
- Present a five-minute trend brief with explicit facts and hypotheses.

### Phase 5 — Improve the system

- Select one repeated escalation pattern.
- Quantify it.
- Identify the true owner.
- Propose one measurable intervention.
- Review the result after an agreed period.

## 15. Questions I should confirm with my manager or product lead

The Slack research shows common working patterns, but local product rules can differ. I should explicitly confirm:

- Which CSI and Dynamics Knowledge spaces should I access?
- Do I need read-only or editing permission?
- What is the current Product QA escalation route for my product?
- Who may create, link, reopen, or change Jira items?
- How are affected cases tracked for a KI?
- Who owns KI creation and user notifications?
- Who may declare an incident or open a war room?
- Which internal workarounds are approved for Delivery or users?
- Which statuses should I use while waiting for users, QA, or Product?
- What are the handoff and out-of-hours expectations?
- Which metrics define good performance for my PSS role?

## 16. Source and maintenance note

This guide was prepared on **28 October 2026** from patterns found across internal Slack messages and shared-resource titles relating to PSS work, CSI/Knowledge, Dynamics escalations, Product QA, Jira, Known Issues, incidents, war rooms, Delivery, and education.

It deliberately records durable principles rather than copying private conversations or naming individuals. Because internal processes evolve, I should review this guide whenever the owning team changes a flow, tool, permission model, or escalation route.

Suggested review cadence: once per quarter, and immediately after a major support-tool or workflow migration.
