const requireGroup = (groups, key, value) => {
  const row = groups.find(item => item[key] === value);
  if (!row) throw new Error(`Stakeholder approach is missing ${value}.`);
  return row;
};

const countBy = (cases, key) => Object.entries(cases.reduce((counts, item) => {
  const value = item[key] || 'Unknown';
  counts[value] = (counts[value] || 0) + 1;
  return counts;
}, {})).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

const sampleIds = (cases, test, limit = 5) => cases.filter(test).slice(0, limit).map(item => item.id);
const percent = value => Math.round(Number(value) * 1000) / 10;

export function buildStakeholderApproach(report) {
  const bpo = requireGroup(report.sources, 'name', 'BPO');
  const internal = requireGroup(report.sources, 'name', 'Internal');
  const googleAds = requireGroup(report.topics, 'name', 'Google Ads w/ Wix');
  const domainDns = requireGroup(report.topics, 'name', 'Domain DNS');
  const bpoCases = report.cases.filter(item => item.source === 'BPO');
  const bpoReviewable = bpoCases.filter(item => item.reviewable);
  const adsCases = report.cases.filter(item => item.topic === 'Google Ads w/ Wix');
  const dnsCases = report.cases.filter(item => item.topic === 'Domain DNS');
  const adsBugLabels = adsCases.filter(item => item.reason === 'Bug').length;
  const adsMissingSources = adsCases.filter(item => item.source === 'Unknown').length;
  const dnsLocations = countBy(dnsCases, 'location');

  return {
    principles: [
      'My good knowledge of Wix teams and responsibilities gives me a strong starting point. Slack, ownership maps, channel topics and recent threads then give me a practical path to confirm the current channel and person.',
      'My value as an Analyst PSS is also analytical: I can structure imperfect data, identify concentrations and anomalies, separate facts from hypotheses, test the strongest explanation and translate the finding into the correct action, workflow and measurable follow-up.',
      'Using my technical knowledge of Wix infrastructure, I would run a root-cause investigation: reproduce the behaviour, read the exact error, trace request IDs and timestamps, compare environments and rule out configuration, access and known limitations.',
      'I would use AI-assisted search to surface similar Slack discussions, Known Issues, CSI and Jira references faster, then verify every proposed match against the original source, current status, symptom and scope before acting on it.',
      'I would keep one evidence-rich Slack thread and leave the discussion with an accountable owner, next action, missing evidence, update channel and review time.',
    ],
    scenarios: [
      {
        id: 'delivery',
        number: '01',
        title: 'Delivery group with potentially unnecessary escalations',
        subtitle: 'Scenario A',
        signal: `${bpo.reviewable}/${bpo.n}`,
        signalLabel: 'BPO cases have reasons worth reviewing',
        objective: 'I want to separate valid specialist work from gaps in troubleshooting, topic choice, escalation notes or guidance.',
        firstContact: {
          primary: 'The Delivery/BPO lead for the largest affected workflow or location',
          partners: ['Education PSS', 'Relevant bundle PSS lead', 'Workflow or tooling owner if the evidence points there'],
        },
        why: `I would analyse a representative sample and start with the Delivery owner because they own the frontline workflow and can provide its operational context. I would not begin by assuming this is a coaching problem. A spike can indicate unclear CSI, a routing or access gap, a product change, a Known Issue or several different causes. Coaching becomes appropriate only when the evidence shows that correct, available guidance was missed by an individual or a defined group. Product QA is not a quality-review function here; I would involve it only later if the PSS investigation identifies a reproducible product defect that cannot be resolved through the support path. These ${bpo.reviewable} cases are review candidates, not confirmed unnecessary escalations.`,
        findOwner: [
          'I would start with the Delivery and topic channels I already use and check the channel topic, pinned ownership information and most recent PSS threads.',
          'I would verify the current group lead, Education PSS and bundle PSS against the ownership directory or operational roster, because roles can change.',
          'If ownership were still unclear, I would ask a concise ownership question in the relevant channel with the workflow and location—not default the issue to my manager.',
        ],
        evidence: [
          { label: 'Population', value: `${bpo.n} BPO open cases`, detail: `${bpo.breached} breached and ${bpo.unassigned} unassigned.` },
          { label: 'Cases to review', value: `${bpo.reviewable}`, detail: 'Missing Troubleshooting, Wrong Topic or Knowledge Gap.' },
          { label: 'Useful comparison', value: `${percent(internal.reviewable / internal.n)}% Internal vs ${percent(bpo.reviewable / bpo.n)}% BPO`, detail: 'Open cases only; contact-volume denominators are missing.' },
          { label: 'Case sample', value: sampleIds(bpoReviewable, () => true).join(', '), detail: 'Bring the full notes, exact metrics, dates, steps and resources already used.' },
        ],
        tools: [
          { name: 'Dynamics case history', use: 'I would review the full escalation note, timestamps, owner changes, user replies and troubleshooting already completed.', guardrail: 'I would not judge quality from the reason label alone.' },
          { name: 'CSI, KB and training material', use: 'I would compare the case with the guidance that was available when it was escalated.', guardrail: 'I would check the historical version, not only today’s updated resource.' },
          { name: 'AI-assisted Slack, Jira and KI search', use: 'I would use AI-supported search to retrieve similar questions, possible Jiras, KIs, CSI and likely ownership paths quickly, then open and read the original sources.', guardrail: 'AI is a discovery accelerator, not evidence. I would not link a case unless the symptom, environment, timing and scope match and the source is current.' },
          { name: 'Analyst follow-up sample', use: 'I would recheck comparable escalations after the guidance, routing or coaching change.', guardrail: 'I would compare the same workflow and population using the same definitions.' },
        ],
        opening: `I found ${bpo.reviewable} BPO open cases marked Missing Troubleshooting, Wrong Topic or Knowledge Gap. I do not want to call them avoidable from the label alone. Can we review a sample together and separate valid specialist work from coaching, guidance, routing or access gaps?`,
        questions: [
          'What troubleshooting and topic-selection steps were expected when the case was escalated?',
          'Do the notes include the exact problem, metrics, dates, expected result, actual result and steps already tried?',
          'Were the right resources current and available to the expert?',
          'Did the expert miss a step, or did they genuinely need specialist access?',
        ],
        decisionPaths: [
          { condition: 'Current guidance was available and repeatedly not followed', next: 'Delivery lead', outcome: 'Use specific case feedback and targeted coaching, then I would run another comparable analyst sample.' },
          { condition: 'Guidance is missing or unclear', next: 'Education PSS and bundle PSS', outcome: 'Update the resource, communicate it and check whether it is used.' },
          { condition: 'Guidance was followed and the product still blocks progress', next: 'Product PSS and Product QA', outcome: 'Build a reproducible product investigation with complete evidence.' },
        ],
        commitment: {
          owner: 'Delivery/BPO lead until the sample is classified',
          next: 'Agree a sample across reason, location and case age, then review the full histories.',
          evidence: 'Escalation notes, exact dates and metrics, troubleshooting, resource usage and access limitations.',
          review: 'First readout within 48 hours',
          success: 'Every sampled case has a clear category and an action owner.',
        },
        boundary: 'I would not report 64 unnecessary escalations. The export contains labels on currently open cases; it does not prove avoidability or show the escalation rate per contact.',
      },
      {
        id: 'product',
        number: '02',
        title: 'Product flow driving SLA breaches with a possible defect',
        subtitle: 'Scenario B',
        signal: `${googleAds.breached}/${googleAds.n}`,
        signalLabel: 'Google Ads cases are breached',
        objective: 'I want to find out whether these cases share one reproducible problem or several unrelated blockers.',
        firstContact: {
          primary: 'The Google Ads PSS or topic lead',
          partners: ['Product Manager if a product decision is needed', 'Product QA only after PSS troubleshooting is exhausted', 'Engineering through Product QA if a defect is confirmed'],
        },
        why: `I would start with the topic PSS because the PSS should complete the investigation first: confirm expected behaviour, rule out configuration and known limitations, search existing incidents, reproduce the strongest cluster and assemble the technical evidence. Product QA is the last-resort escalation path when the issue remains unresolved and the evidence supports a suspected defect; it can then validate the bug and manage development coordination. ${adsBugLabels} cases have a Bug label, but that does not prove one common issue.`,
        findOwner: [
          'I would begin with the Google Ads and product-support Slack channels I already follow, then check the channel topic, pins and most recent incident or QA thread for the active PSS owner.',
          'Only after the PSS investigation supports a suspected defect would I use the Product QA ownership page, on-call path or Jira component to confirm the escalation owner.',
          'For an ordinary unresolved defect, Product QA should bring in the right development owner. For a widespread live incident, I would also follow the ICU and established urgent-channel workflow.',
        ],
        evidence: [
          { label: 'Concentration', value: `${googleAds.breached} of ${googleAds.n} breached`, detail: `Median age is ${googleAds.medianAge} hours.` },
          { label: 'Initial labels', value: `${adsBugLabels} marked Bug`, detail: 'The group also contains usability, discoverability and routing reasons.' },
          { label: 'Data gap', value: `${adsMissingSources} missing sources`, detail: 'Missing source data limits comparisons and ownership analysis.' },
          { label: 'Case sample', value: sampleIds(adsCases, item => item.breach).join(', '), detail: 'Bring symptoms, timestamps, configuration, expected/actual results and incident references.' },
        ],
        tools: [
          { name: 'Root-cause evidence pack', use: 'I would connect each case to reproduction steps, exact errors, request IDs, timestamps, MSID, configuration, environment, network responses and relevant logs so the failure can be traced through the Wix infrastructure.', guardrail: 'One error or request ID is a lead, not proof of a shared platform defect; I would compare several matching cases and rule out configuration or access first.' },
          { name: 'Defect escalation through Product QA', use: 'After exhausting PSS troubleshooting, I would search active Jiras and the correct component, then ask Product QA to validate a match or open the development path for the reproducible defect.', guardrail: 'I would not use Product QA as a routine reviewer, connect a doubtful Jira or hand over an issue before the PSS evidence is complete.' },
          { name: 'Known Issue, ICU and product/dev channels', use: 'I would reuse a matching KI. When several matching complaints or a credible live-impact signal emerge, I would report it to ICU and, where ownership is clear, bring the same evidence to the correct product or urgent development channel. ICU, CSQA or Product QA can coordinate the KI, on-call and war-room path.', guardrail: 'I would not merge different symptoms, duplicate a matching KI escalation or broadcast an unvalidated issue across several developer channels.' },
          { name: 'PREX or CCFR', use: 'If the behaviour is not a defect, I would test whether it is a product-experience gap (PREX) or a missing capability/feature request (CCFR).', guardrail: 'I would keep bug, usability and feature-request evidence separate.' },
        ],
        incidentPlan: {
          title: 'What I would report to ICU, and when',
          trigger: 'I would raise the incident path when several independent cases share the same current symptom, the PSS investigation has reproduced or strongly validated it, the impact is material and ongoing, and ordinary case-by-case handling is no longer enough.',
          notEnough: 'A high breach count, several Bug labels or one unreproduced case would not be enough on its own.',
          steps: [
            { label: 'Confirm the cluster', text: 'I would group the cases by symptom, start time, flow, environment and error, then separate anything that does not match.' },
            { label: 'PSS reports the signal', text: 'If several matching complaints or a credible live-impact signal emerge, I would report it to ICU with start time, scope, exact errors, request IDs, reproduction, affected examples, workarounds tested and current user impact. When the product owner is clear, I would also use the established product or urgent development channel so the technical team can act quickly.' },
            { label: 'Coordinate through the correct workflow', text: 'ICU, CSQA or Product QA should connect the relevant on-call or critical development channel and open or join a war room when the evidence shows broad or material active impact. A matching KI should carry the approved symptom, workaround, status and user-update path.' },
            { label: 'Verify before closing', text: 'Product QA should verify the fix or mitigation, PSS should retest representative cases, the KI should be updated, and affected users should receive the agreed resolution message.' },
          ],
          roles: [
            'ICU/incident coordinator — impact validation, relevant-team identification and the decision to expand incident handling.',
            'Product/on-call or war-room lead — technical coordination, mitigation and update cadence when material impact is confirmed.',
            'Product QA — reproduction, scope, regression checks and fix verification.',
            'PSS/Analyst — case clustering, customer impact, examples and support feedback.',
            'Education/Delivery — approved troubleshooting and consistent frontline handling.',
            'Known Issue owner — user-facing wording, workaround, status and resolution update.',
          ],
        },
        opening: `Google Ads has ${googleAds.breached} breached cases out of ${googleAds.n}, with a median age of ${googleAds.medianAge} hours. Before I call this one incident, can we group the cases by flow, error, configuration and blocker, then reproduce the strongest cluster?`,
        questions: [
          'Which cases share the same symptom, error and affected flow?',
          'Can I reproduce the strongest cluster in a controlled setup, and is the evidence complete enough for Product QA if the issue remains unresolved?',
          'Which cases are configuration, access, custom implementation or known limitations?',
          'Is there a safe workaround or incident update that can move the cases forward now?',
        ],
        decisionPaths: [
          { condition: 'A shared symptom reproduces', next: 'Product QA and Product Manager', outcome: 'Confirm scope, severity and workaround; QA brings in Engineering if needed.' },
          { condition: 'The cases split into several causes', next: 'Google Ads PSS and the relevant owners', outcome: 'Create separate case groups and actions instead of one misleading incident.' },
          { condition: 'The blocker is guidance or configuration', next: 'Education PSS or Delivery', outcome: 'Correct the instructions and progress the affected cases.' },
        ],
        commitment: {
          owner: 'Google Ads PSS until the cases are grouped; Product QA for a reproducible defect',
          next: `Classify all ${googleAds.n} cases by symptom, flow, configuration and blocker.`,
          evidence: 'Reproduction steps, expected and actual results, environment, timestamps, errors and related incidents.',
          review: 'Initial grouping within 24 hours',
          success: 'Every case has a cause group, next step and named owner.',
        },
        boundary: `I would not claim a Google Ads defect from breach concentration or ${adsBugLabels} Bug labels. A product claim needs shared symptoms and successful reproduction.`,
      },
      {
        id: 'routing',
        number: '03',
        title: 'Same issue escalated across locations with potentially incomplete guidance',
        subtitle: 'Scenario C',
        signal: `${domainDns.threePlus}/${domainDns.n}`,
        signalLabel: 'Domain DNS cases have 3+ handovers',
        objective: 'I want to confirm whether the cases share the same issue and whether the current troubleshooting guidance is missing, unclear, outdated or simply not being followed consistently.',
        firstContact: {
          primary: 'The Domain DNS topic PSS together with the Education PSS or CSI owner',
          partners: ['Delivery leads for the affected locations', 'Workflow or access owner if identified', 'Product QA or ICU only if the PSS investigation identifies a live product issue'],
        },
        why: `I would start with the topic PSS because they can confirm the correct technical behaviour and with Education because they own the quality and clarity of the CSI. The same pattern across ${dnsLocations.length} locations makes a shared guidance gap plausible, but it may also be a Known Issue, access limitation or inconsistent use of otherwise correct guidance.`,
        findOwner: [
          'I would use the Domain DNS and Education Slack channels I already work in, checking the topic, pins, recent CSI announcements and the latest related threads.',
          'I would confirm the current topic PSS and CSI owner in the ownership map, then identify a Delivery representative from each affected location.',
          'If no owner were obvious, I would post a concise ownership request in the bundle channel with the exact CSI and symptom, rather than routing the question to my manager by default.',
        ],
        evidence: [
          { label: 'Handovers', value: `${domainDns.threePlus} of ${domainDns.n} have 3+`, detail: `Average ${domainDns.meanHandovers.toFixed(2)} handovers.` },
          { label: 'SLA exposure', value: `${domainDns.breached} breached`, detail: 'This does not prove that handovers caused the breach.' },
          { label: 'Location spread', value: `${dnsLocations.length} locations`, detail: dnsLocations.map(([name, count]) => `${name} ${count}`).join(' · ') },
          { label: 'Case sample', value: sampleIds(dnsCases, item => item.handovers >= 3).join(', '), detail: 'Bring the shared symptom, troubleshooting performed, CSI version used, outcome and handover history.' },
        ],
        tools: [
          { name: 'Dynamics case and audit history', use: 'I would compare the symptom, troubleshooting, resource used, outcome and each handover across representative locations.', guardrail: 'I would not assume that repeated escalation proves the guidance is wrong.' },
          { name: 'Current and historical CSI', use: 'I would compare what experts saw at the time with the current guidance, looking for a missing prerequisite, decision point, workaround or ownership instruction.', guardrail: 'I would not judge an older case only against a CSI that was updated later.' },
          { name: 'Slack, Known Issue and ICU search', use: 'I would search active topic threads, KIs and ICU reports for the same symptom before proposing new guidance or another escalation.', guardrail: 'A near match is not enough; the symptom, flow and scope must align.' },
          { name: 'Cross-location analyst sample', use: 'I would ask selected locations to run the same approved troubleshooting path and record where the outcome differs.', guardrail: 'I would compare the same issue and CSI version, not unlike cases grouped only by topic.' },
        ],
        opening: `Domain DNS has ${domainDns.threePlus} cases with at least three handovers across ${dnsLocations.length} locations. Before I conclude that the CSI is incomplete, can we confirm the common symptom, compare the exact guidance version used in each case and identify the step where experts could no longer progress?`,
        questions: [
          'Do the cases share the same symptom and expected product behaviour, or are several issues being grouped together?',
          'Which CSI version did each expert use, and at what exact step did the available guidance stop being sufficient?',
          'Is a current Known Issue, incident update, access requirement or approved workaround already available?',
          `If the guidance is correct, why is execution or understanding different across the ${dnsLocations.length} represented locations?`,
        ],
        decisionPaths: [
          { condition: 'The same symptom already matches a KI or ICU report', next: 'Follow the KI/incident owner’s path', outcome: 'Link matching cases, use the approved position and avoid duplicate escalation unless there is new evidence.' },
          { condition: 'The CSI is missing, unclear or outdated', next: 'Topic PSS and Education PSS', outcome: 'Agree the technical truth, update the CSI, announce the change in the relevant channels and re-sample cases.' },
          { condition: 'The guidance is correct but use varies', next: 'Delivery leads', outcome: 'Target the confirmed location or workflow gap with coaching, then I would measure adherence and repeat escalations.' },
        ],
        commitment: {
          owner: 'Domain DNS PSS for technical truth; Education PSS for any CSI change',
          next: 'Compare representative cases and the exact CSI versions used, then classify the gap as incident, guidance, access or execution.',
          evidence: 'Shared symptom, expected and actual result, troubleshooting, CSI version, access, outcome, timestamps and handover reason.',
          review: 'First cross-location review within three business days',
          success: 'Every sampled case has a validated path, and any CSI change has an owner, publication date and follow-up measure.',
        },
        boundary: `I would not claim that the CSI caused the repeated escalations. Cases with 3+ handovers breach at ${percent(report.handovers.highRate)}% versus ${percent(report.handovers.lowRate)}% for other cases, and the pattern spans several locations. That is a strong reason to inspect the guidance, not proof of causation.`,
      },
    ],
  };
}
