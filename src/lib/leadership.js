const requireGroup = (groups, key, value) => {
  const row = groups.find(item => item[key] === value);
  if (!row) throw new Error(`Leadership brief is missing ${value}.`);
  return row;
};

const round = value => Math.round(Number(value) * 10) / 10;

export function buildLeadershipBrief(report) {
  const business = requireGroup(report.bundles, 'bundle', 'Business');
  const p1 = requireGroup(report.priorities, 'name', 'P1');
  const googleAds = requireGroup(report.topics, 'name', 'Google Ads w/ Wix');
  const domainDns = requireGroup(report.topics, 'name', 'Domain DNS');
  const bpo = requireGroup(report.sources, 'name', 'BPO');
  const remainingAfterCapacity = report.latest.net - report.fullRecoveryHandled;

  return {
    conclusion: 'Run two tracks now: protect urgent cases across the queue and stabilize the Business demand increase.',
    snapshot: report.notes['Snapshot time'],
    period: `${report.first.name} to ${report.latest.name}`,
    metrics: [
      { label: 'Backlog growth', value: report.totalGrowth, display: `+${report.totalGrowth}`, note: `${round(report.growthRate * 100)}% in three weeks`, tone: 'danger' },
      { label: 'Latest weekly addition', value: report.latest.net, display: `+${report.latest.net}`, note: `${report.latest.incoming.toLocaleString('en-GB')} in · ${report.latest.handled.toLocaleString('en-GB')} handled`, tone: 'danger' },
      { label: 'P1 exposure', value: p1.breached, display: `${p1.breached}/${p1.n}`, note: `${round(p1.breachRate * 100)}% breached; ${p1.due12} close to SLA`, tone: 'warning' },
      { label: 'Ownership risk', value: report.unassignedBreached, display: String(report.unassignedBreached), note: `${report.unassigned} unassigned in the export`, tone: 'warning' },
    ],
    drivers: {
      demand: {
        incomingGrowth: round(report.incomingGrowth * 100),
        handledGrowth: round(report.handledGrowth * 100),
        hoursGrowth: round(report.hoursGrowth * 100),
      },
      business: {
        periodGrowth: business.growth,
        periodShare: round(business.growth / report.totalGrowth * 100),
        latestNet: business.latestNet,
        latestShare: round(business.latestNet / report.latest.net * 100),
      },
      capacity: {
        missingHours: report.latest.gap,
        potentialHandled: round(report.fullRecoveryHandled),
        remainingNet: round(remainingAfterCapacity),
        closesGap: remainingAfterCapacity <= 0,
      },
      googleAds: {
        cases: googleAds.n,
        breached: googleAds.breached,
        medianAge: googleAds.medianAge,
      },
      bpo: { cases: bpo.n, reviewable: bpo.reviewable },
      domainDns: { cases: domainDns.n, breached: domainDns.breached, threePlus: domainDns.threePlus, meanHandovers: round(domainDns.meanHandovers) },
    },
    actions: [
      {
        timing: 'Now · 0–4h',
        action: 'Review every P1 and assign all unowned breached cases.',
        owner: 'PSG duty lead + bundle leads',
        measure: `${p1.n}/${p1.n} P1s reviewed; ${report.unassignedBreached} unowned breaches assigned; next action and update time recorded.`,
      },
      {
        timing: 'Today',
        action: 'Reconcile the open-case export with the weekly backlog.',
        owner: 'Analyst + reporting/CRM owner',
        measure: `Explain the ${report.latest.closing.toLocaleString('en-GB')} versus ${report.caseCount} population gap; document scope, filters, cut-off and “Handled”.`,
      },
      {
        timing: 'Today',
        action: 'Break down the Business increase by day, topic, source, incident and skills coverage.',
        owner: 'Business PSS lead + WFM + Product/QA',
        measure: `Tested cause for the +${business.latestNet} weekly net addition, with an owner and containment action for each confirmed driver.`,
      },
      {
        timing: '24–48h',
        action: 'Group Google Ads cases by symptom, blocker and incident reference.',
        owner: 'Google Ads PSS + Product/QA',
        measure: `${googleAds.n} cases classified; each has a next step, workaround, incident link or documented waiting reason.`,
      },
      {
        timing: 'This week',
        action: 'Audit troubleshooting, escalation evidence, knowledge and routing patterns.',
        owner: 'Delivery + QA + Education + P&P PSS',
        measure: `Review ${bpo.reviewable} BPO candidates and ${domainDns.n} DNS cases; sample note completeness and convert confirmed gaps into guidance, coaching, routing or product actions.`,
      },
    ],
    successMeasures: [
      { label: 'Urgent ownership', measure: 'No breached or near-due P1 lacks a named owner, next action and update time.' },
      { label: 'Backlog containment', measure: `First reach weekly net movement of zero or better from the observed +${report.latest.net}; then agree a sustainable burn-down target by bundle.` },
      { label: 'SLA protection', measure: 'New P1 breaches and unassigned breached cases trend down in aligned daily snapshots.' },
      { label: 'Cause closure', measure: 'Business and Google Ads explanations move from hypothesis to confirmed, rejected or still unassessable.' },
      { label: 'Reporting trust', measure: 'The weekly backlog and case export have documented populations, cut-offs and reconciliation.' },
    ],
    evidence: [
      { type: 'Confirmed fact', text: `Backlog grew by ${report.totalGrowth} (${round(report.growthRate * 100)}%); the latest week added ${report.latest.net}.` },
      { type: 'Supported interpretation', text: `Business is the first stabilization priority: ${business.periodShare}% of three-week growth and ${business.latestShare}% of the latest weekly addition.` },
      { type: 'Hypothesis', text: 'A product incident, escalation-policy change, case mix or skills coverage may explain the Business increase. The current data does not choose between them.' },
      { type: 'Not assessable', text: `Overall SLA attainment. The open-case export has ${report.caseCount} cases while the weekly closing backlog is ${report.latest.closing.toLocaleString('en-GB')}, and resolved cases are absent.` },
    ],
    leadershipAsks: [
      'Confirm one duty lead and authorize a 48-hour, skills-matched surge from available trained support, with QA sampling maintained.',
      'Assign a reporting owner to reconcile the two populations and provide aligned daily extracts.',
      'Protect same-day investigation time from Business, WFM and Product/QA, plus a 24–48 hour Google Ads review.',
    ],
  };
}
