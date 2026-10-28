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
      'Start with the role that owns the process or product area, then confirm the individual owner through current internal directories.',
      'Bring case-level evidence and a testable question. Do not turn an escalation label into a conclusion.',
      'End every contact with an owner, next action, evidence still needed and a review time.',
    ],
    scenarios: [
      {
        id: 'delivery',
        number: '01',
        title: 'Are these escalations avoidable?',
        subtitle: 'Delivery and knowledge review',
        signal: `${bpo.reviewable}/${bpo.n}`,
        signalLabel: 'BPO cases have reviewable reasons',
        objective: 'Separate valid specialist escalations from gaps in troubleshooting, topic selection or guidance.',
        firstContact: {
          primary: 'The Delivery/BPO lead responsible for the largest affected workflow or location',
          partners: ['QA lead', 'Education PSS', 'Relevant bundle PSS leads'],
        },
        why: `The source owns the frontline workflow and coaching context. QA and Education can then distinguish execution gaps from unclear or outdated resources. The ${bpo.reviewable} cases are review candidates—not confirmed unnecessary escalations.`,
        findOwner: [
          'Use the current Delivery ownership directory or org chart to identify the lead for the affected group and location.',
          'Check the relevant operational channel, escalation workflow page or recent announcement for the current QA and Education owners.',
          'Confirm ownership with the PSG duty lead before scheduling the review; do not rely on an old thread or remembered name.',
        ],
        evidence: [
          { label: 'Population', value: `${bpo.n} BPO open cases`, detail: `${bpo.breached} breached; ${bpo.unassigned} unassigned.` },
          { label: 'Review candidates', value: `${bpo.reviewable} cases`, detail: 'Missing Troubleshooting, Wrong Topic or Knowledge Gap.' },
          { label: 'Comparison', value: `${percent(internal.reviewable / internal.n)}% Internal vs ${percent(bpo.reviewable / bpo.n)}% BPO`, detail: 'Open-case shares only; source contact-volume denominators are missing.' },
          { label: 'Case sample', value: sampleIds(bpoReviewable, () => true).join(', '), detail: 'Use full histories and resource usage, not labels alone.' },
        ],
        opening: `I found ${bpo.reviewable} BPO open cases marked Missing Troubleshooting, Wrong Topic or Knowledge Gap. I do not yet know how many were avoidable. Can we review a stratified sample together and separate process, resource, permissions and legitimate specialist cases?`,
        questions: [
          'What troubleshooting and topic-selection steps were expected at the time of escalation?',
          'Were the correct resources available, current and accessible to the expert?',
          'Does the case history show a skipped step, or was specialist access genuinely required?',
          'Which confirmed gap belongs to coaching, documentation, routing, tooling or Product?',
        ],
        decisionPaths: [
          { condition: 'Execution differs from current guidance', next: 'Delivery lead + QA', outcome: 'Targeted coaching and a follow-up quality sample.' },
          { condition: 'Guidance is missing, unclear or outdated', next: 'Education PSS + bundle PSS', outcome: 'Resource update, announcement and adoption check.' },
          { condition: 'Guidance was followed and the product still blocks progress', next: 'Product/QA through the bundle PSS', outcome: 'Reproduction evidence and a properly scoped product investigation.' },
        ],
        boundary: 'I would not report 64 “unnecessary escalations.” The export shows reasons attached to currently open cases, not validated avoidability or the escalation rate per contact.',
      },
      {
        id: 'product',
        number: '02',
        title: 'Is this a shared product issue?',
        subtitle: 'Google Ads investigation',
        signal: `${googleAds.breached}/${googleAds.n}`,
        signalLabel: 'Google Ads cases are breached',
        objective: 'Determine whether the concentration reflects one reproducible defect, several blockers, or ageing cases with different causes.',
        firstContact: {
          primary: 'The Google Ads Product Support Specialist or topic lead',
          partners: ['Product Manager', 'Product QA', 'Engineering owner if reproduction supports escalation'],
        },
        why: `The topic specialist can validate expected behavior, known limitations, incidents and correct reproduction steps before Product or Engineering time is requested. ${adsBugLabels} cases carry a Bug label, but that label is not a confirmed common defect.`,
        findOwner: [
          'Start with the topic ownership map, PSG bundle page or current product-area support channel.',
          'Use the Product/QA ownership page or the relevant Jira component to identify the current product and QA roles.',
          'Confirm the engineering owner only after symptoms are grouped and at least one path is reproducible.',
        ],
        evidence: [
          { label: 'Concentration', value: `${googleAds.breached} of ${googleAds.n} breached`, detail: `Median age ${googleAds.medianAge} hours.` },
          { label: 'Initial labels', value: `${adsBugLabels} marked Bug`, detail: 'Also includes usability, discoverability and routing reasons.' },
          { label: 'Source quality', value: `${adsMissingSources} missing sources`, detail: 'Source gaps limit comparisons and ownership analysis.' },
          { label: 'Case sample', value: sampleIds(adsCases, item => item.breach).join(', '), detail: 'Bring timestamps, symptoms, configurations and incident references.' },
        ],
        opening: `Google Ads has ${googleAds.breached} breached cases out of ${googleAds.n}, with a ${googleAds.medianAge}-hour median age. I want to test whether they share a symptom before treating this as one incident. Can we group them by flow, error, timing, configuration and blocker?`,
        questions: [
          'Which cases reproduce in a controlled setup, and what is expected versus actual behavior?',
          'Do the cases share an error, release window, account state, geography or third-party dependency?',
          'Which cases are configuration, access, custom implementation or known limitation rather than a defect?',
          'Is there a safe workaround, incident link or communication that can progress cases now?',
        ],
        decisionPaths: [
          { condition: 'A shared symptom reproduces', next: 'Product QA + Product Manager', outcome: 'Confirm scope, severity, workaround and engineering escalation.' },
          { condition: 'Cases split into several causes', next: 'Topic PSS + relevant owners', outcome: 'Separate queues and actions instead of one misleading incident.' },
          { condition: 'The blocker is configuration or guidance', next: 'Education/Delivery or customer-facing owner', outcome: 'Correct instructions and progress affected cases.' },
        ],
        boundary: `I would not claim a Google Ads defect from breach concentration or ${adsBugLabels} Bug labels alone. Product causation needs reproduction and shared technical evidence.`,
      },
      {
        id: 'routing',
        number: '03',
        title: 'Why is work moving between teams?',
        subtitle: 'Domain DNS routing and guidance review',
        signal: `${domainDns.threePlus}/${domainDns.n}`,
        signalLabel: 'Domain DNS cases have 3+ handovers',
        objective: 'Identify where ownership, access or guidance breaks down across locations without assuming handovers caused every breach.',
        firstContact: {
          primary: 'The P&P Domain DNS PSS or bundle lead',
          partners: ['Delivery leads for represented locations', 'QA', 'Education PSS', 'Workflow/tooling owner if routing rules are involved'],
        },
        why: `The topic owner can reconstruct the intended path and technical access requirements. Delivery, QA and Education are then brought in because the pattern spans ${dnsLocations.length} locations and several escalation reasons.`,
        findOwner: [
          'Use the P&P topic ownership map and current bundle channel to confirm the Domain DNS specialist.',
          'Identify the Delivery/QA owner for each represented location from the current org directory or operational roster.',
          'Trace the routing rule or queue configuration owner from the escalation workflow documentation; confirm before assigning work.',
        ],
        evidence: [
          { label: 'Handovers', value: `${domainDns.threePlus} of ${domainDns.n} have 3+`, detail: `Average ${domainDns.meanHandovers.toFixed(2)} handovers.` },
          { label: 'SLA exposure', value: `${domainDns.breached} breached`, detail: 'Association does not establish that handovers caused delay.' },
          { label: 'Location spread', value: `${dnsLocations.length} locations`, detail: dnsLocations.map(([name, count]) => `${name} ${count}`).join(' · ') },
          { label: 'Case sample', value: sampleIds(dnsCases, item => item.handovers >= 3).join(', '), detail: 'Bring the complete ownership and queue-event history.' },
        ],
        opening: `Domain DNS has ${domainDns.threePlus} cases with at least three handovers across ${dnsLocations.length} locations. Current topic mapping is correct, so I want to inspect the historical route: where did ownership change, why, and what information or access was missing?`,
        questions: [
          'At each handover, what reason, queue, owner and required capability was recorded?',
          'Did the receiving team have the product access and information required to act?',
          'Are ownership rules understood consistently across all six represented locations?',
          'Would clearer routing, permissions, templates or product guidance have prevented the next transfer?',
        ],
        decisionPaths: [
          { condition: 'Routing rule or queue ownership is wrong', next: 'Workflow/tooling owner + bundle lead', outcome: 'Correct the rule and monitor subsequent transfers.' },
          { condition: 'The rule is right but execution varies', next: 'Delivery leads + QA', outcome: 'Location-specific coaching and sampled follow-up.' },
          { condition: 'Specialist access or guidance is missing', next: 'P&P PSS + Education/Product', outcome: 'Close the capability gap and publish the supported path.' },
        ],
        boundary: `I would not claim handovers explain the whole queue. Across the export, 3+ handover cases breach at ${percent(report.handovers.highRate)}% versus ${percent(report.handovers.lowRate)}% for other cases; that difference warrants investigation, not causation.`,
      },
    ],
  };
}
