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
      'I would start with one clear owner, not invite every possible team at once.',
      'I would bring examples, numbers and the exact question I need answered.',
      'I would leave with an owner, a next action, missing evidence and a review time.',
    ],
    scenarios: [
      {
        id: 'delivery',
        number: '01',
        title: 'Are some escalations avoidable?',
        subtitle: 'Delivery and knowledge review',
        signal: `${bpo.reviewable}/${bpo.n}`,
        signalLabel: 'BPO cases have reasons worth reviewing',
        objective: 'I want to separate valid specialist work from gaps in troubleshooting, topic choice, escalation notes or guidance.',
        firstContact: {
          primary: 'The Delivery/BPO lead for the largest affected workflow or location',
          partners: ['QA lead', 'Education PSS', 'Relevant bundle PSS lead'],
        },
        why: `I would start with Delivery because they own the frontline workflow and coaching context. I would then bring in QA and Education to tell the difference between an execution gap and unclear guidance. These ${bpo.reviewable} cases are review candidates, not confirmed unnecessary escalations.`,
        findOwner: [
          'I would check the current Delivery ownership directory for the affected group and location.',
          'I would check the latest operational channel or workflow page for the current QA and Education owners.',
          'I would confirm the names with the PSG duty lead instead of relying on an old thread.',
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
          { name: 'Jira and Known Issue search', use: 'I would check whether the reported behaviour already has an active, matching investigation or workaround.', guardrail: 'I would not link a case to Jira unless the evidence fully matches; if unsure, I would ask QA to validate it.' },
          { name: 'QA follow-up sample', use: 'I would recheck comparable escalations after the guidance or coaching change.', guardrail: 'I would compare the same workflow and population.' },
        ],
        opening: `I found ${bpo.reviewable} BPO open cases marked Missing Troubleshooting, Wrong Topic or Knowledge Gap. I do not want to call them avoidable from the label alone. Can we review a sample together and separate valid specialist work from coaching, guidance, routing or access gaps?`,
        questions: [
          'What troubleshooting and topic-selection steps were expected when the case was escalated?',
          'Do the notes include the exact problem, metrics, dates, expected result, actual result and steps already tried?',
          'Were the right resources current and available to the expert?',
          'Did the expert miss a step, or did they genuinely need specialist access?',
        ],
        decisionPaths: [
          { condition: 'Current guidance was not followed', next: 'Delivery lead and QA', outcome: 'Targeted coaching followed by another quality sample.' },
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
        title: 'Is this one product problem?',
        subtitle: 'Google Ads investigation',
        signal: `${googleAds.breached}/${googleAds.n}`,
        signalLabel: 'Google Ads cases are breached',
        objective: 'I want to find out whether these cases share one reproducible problem or several unrelated blockers.',
        firstContact: {
          primary: 'The Google Ads PSS or topic lead',
          partners: ['Product QA', 'Product Manager', 'Engineering through Product QA if a defect is confirmed'],
        },
        why: `I would start with the topic specialist because they can check expected behaviour, known limitations, open incidents and the right reproduction path. Product QA should then validate a shared defect and manage any contact with Engineering. ${adsBugLabels} cases have a Bug label, but that does not prove one common issue.`,
        findOwner: [
          'I would check the current PSG topic map or product-support channel for the Google Ads PSS.',
          'I would use the Product/QA ownership page or Jira component to confirm the current QA and Product roles.',
          'I would not contact Engineering directly; Product QA should bring in the right owner after reproduction.',
        ],
        evidence: [
          { label: 'Concentration', value: `${googleAds.breached} of ${googleAds.n} breached`, detail: `Median age is ${googleAds.medianAge} hours.` },
          { label: 'Initial labels', value: `${adsBugLabels} marked Bug`, detail: 'The group also contains usability, discoverability and routing reasons.' },
          { label: 'Data gap', value: `${adsMissingSources} missing sources`, detail: 'Missing source data limits comparisons and ownership analysis.' },
          { label: 'Case sample', value: sampleIds(adsCases, item => item.breach).join(', '), detail: 'Bring symptoms, timestamps, configuration, expected/actual results and incident references.' },
        ],
        tools: [
          { name: 'Dynamics linked cases', use: 'I would keep each customer case connected to its evidence, current status and communication history.', guardrail: 'One customer case is not proof of a wider product issue.' },
          { name: 'Jira through Product QA', use: 'I would search active issues and the correct component, then ask Product QA to validate a match or create the defect path.', guardrail: 'I would not connect a doubtful or closed Jira, and I would not contact Engineering directly.' },
          { name: 'Known Issue, incident or war room', use: 'If Product QA confirms an active shared problem with material impact, I would ask the Product/on-call owner to coordinate the incident and publish approved handling guidance.', guardrail: 'I would not merge different symptoms, escalate every duplicate case to QA or share an internal-only workaround.' },
          { name: 'PREX or CCFR', use: 'If the behaviour is not a defect, I would test whether it is a product-experience gap (PREX) or a missing capability/feature request (CCFR).', guardrail: 'I would keep bug, usability and feature-request evidence separate.' },
        ],
        incidentPlan: {
          title: 'When I would ask for a war room and a Known Issue',
          trigger: 'I would raise the incident path when several independent cases share the same current symptom, Product QA can reproduce or strongly validate it, the impact is material and ongoing, and ordinary case-by-case handling is no longer enough.',
          notEnough: 'A high breach count, several Bug labels or one unreproduced case would not be enough on its own.',
          steps: [
            { label: 'Confirm the cluster', text: 'I would group the cases by symptom, start time, flow, environment and error, then separate anything that does not match.' },
            { label: 'Start coordinated ownership', text: 'I would ask Product QA or the Product/on-call owner to open or join the incident process. I would bring impact and case evidence, not declare the incident by myself.' },
            { label: 'Publish one support position', text: 'The Known Issue should state the affected flow, visible symptom, approved workaround, current status and how users receive updates. I would keep a separate affected-case list for follow-up.' },
            { label: 'Verify before closing', text: 'Product QA should verify the fix or mitigation, PSS should retest representative cases, the KI should be updated, and affected users should receive the agreed resolution message.' },
          ],
          roles: [
            'Product/on-call or incident lead — technical coordination, mitigation and update cadence.',
            'Product QA — reproduction, scope, regression checks and fix verification.',
            'PSS/Analyst — case clustering, customer impact, examples and support feedback.',
            'Education/Delivery — approved troubleshooting and consistent frontline handling.',
            'Known Issue owner — user-facing wording, workaround, status and resolution update.',
          ],
        },
        opening: `Google Ads has ${googleAds.breached} breached cases out of ${googleAds.n}, with a median age of ${googleAds.medianAge} hours. Before I call this one incident, can we group the cases by flow, error, configuration and blocker, then reproduce the strongest cluster?`,
        questions: [
          'Which cases share the same symptom, error and affected flow?',
          'Can Product QA reproduce the strongest cluster in a controlled setup?',
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
        title: 'Why is work moving between teams?',
        subtitle: 'Domain DNS routing review',
        signal: `${domainDns.threePlus}/${domainDns.n}`,
        signalLabel: 'Domain DNS cases have 3+ handovers',
        objective: 'I want to find the exact point where ownership, routing, skills, access or guidance breaks down.',
        firstContact: {
          primary: 'The P&P Domain DNS PSS or bundle lead',
          partners: ['Delivery leads for the affected locations', 'QA', 'Education PSS', 'Workflow/tooling owner if the rule is wrong'],
        },
        why: `I would start with the topic owner because they know the intended route and required specialist access. I would add Delivery, QA, Education or tooling only after the history shows whether the failure is the rule, the queue, skill matching or execution. The cases span ${dnsLocations.length} locations.`,
        findOwner: [
          'I would check the current P&P topic map and bundle channel for the Domain DNS specialist.',
          'I would identify the Delivery and QA owner for each affected location from the current roster.',
          'If the route itself looks wrong, I would trace the workflow or queue owner from the current routing documentation.',
        ],
        evidence: [
          { label: 'Handovers', value: `${domainDns.threePlus} of ${domainDns.n} have 3+`, detail: `Average ${domainDns.meanHandovers.toFixed(2)} handovers.` },
          { label: 'SLA exposure', value: `${domainDns.breached} breached`, detail: 'This does not prove that handovers caused the breach.' },
          { label: 'Location spread', value: `${dnsLocations.length} locations`, detail: dnsLocations.map(([name, count]) => `${name} ${count}`).join(' · ') },
          { label: 'Case sample', value: sampleIds(dnsCases, item => item.handovers >= 3).join(', '), detail: 'Bring every topic, tier, status, queue, skill, owner and timestamp change.' },
        ],
        tools: [
          { name: 'Dynamics audit history', use: 'I would reconstruct every topic, tier, status, queue, owner and timestamp change.', guardrail: 'I would separate user replies from new assignments when counting traffic.' },
          { name: 'Routing and ownership documentation', use: 'I would compare the observed path with the intended queue-selection and ownership rules.', guardrail: 'Classification, queue assignment and skill matching are different steps.' },
          { name: 'Queue and traffic reports', use: 'I would check whether the same failure appears across cases, locations and reporting views.', guardrail: 'I would document each report’s population and counting rules before comparing totals.' },
          { name: 'Workflow/tooling Jira', use: 'If the same routing failure is reproducible, I would take it to the workflow owner with examples and expected versus actual routing.', guardrail: 'I would not create a tooling issue for every handover or assume the system caused it.' },
        ],
        opening: `Domain DNS has ${domainDns.threePlus} cases with at least three handovers across ${dnsLocations.length} locations. I want to reconstruct the route before blaming a team. Can we trace where each case changed topic, tier, status, queue or owner and record why?`,
        questions: [
          'At every handover, what changed and what reason was recorded?',
          'Was the case sent to the wrong queue, or did agent skill matching fail inside the right queue?',
          'Did the receiving team have the information, permission and product access needed to act?',
          `Are the same ownership rules understood across all ${dnsLocations.length} represented locations?`,
        ],
        decisionPaths: [
          { condition: 'The routing rule or queue ownership is wrong', next: 'Workflow/tooling owner and bundle lead', outcome: 'Correct the rule and monitor the next comparable cases.' },
          { condition: 'The rule is right but execution varies', next: 'Delivery leads and QA', outcome: 'Give location-specific coaching and run a follow-up sample.' },
          { condition: 'Specialist access or guidance is missing', next: 'P&P PSS and Education or Product', outcome: 'Close the capability gap and publish the correct path.' },
        ],
        commitment: {
          owner: 'Domain DNS PSS until the failure point is identified',
          next: 'Reconstruct the full route for the highest-handover cases and group the failure points.',
          evidence: 'Topic, tier, language, priority, status, queue, skill, owner, timestamp and handover reason.',
          review: 'First route review within three business days',
          success: 'Each sampled handover has a reason, failure category and corrective owner.',
        },
        boundary: `I would not claim handovers explain the whole queue. Cases with 3+ handovers breach at ${percent(report.handovers.highRate)}% versus ${percent(report.handovers.lowRate)}% for other cases. That is enough to investigate, not enough to claim causation.`,
      },
    ],
  };
}
