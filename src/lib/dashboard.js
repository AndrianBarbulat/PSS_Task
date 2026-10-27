const REQUIRED_TABS = ['Open Cases', 'Traffic & Capacity', 'SLA Targets', 'Data Notes', 'Topic Mapping'];
const REQUIRED_CASE_FIELDS = ['Case ID', 'Created On', 'Bundle', 'Topic', 'Escalation Source', 'Escalation Reason', 'Priority', 'Current Owner', 'Last Action', 'Handovers'];

export function validateSnapshot(raw) {
  const errors = [], warnings = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { valid: false, errors: ['The file must contain a JSON object keyed by worksheet name.'], warnings };
  for (const tab of REQUIRED_TABS) {
    if (!Array.isArray(raw[tab]) || raw[tab].length < 2) errors.push(`Missing or empty worksheet: ${tab}`);
  }
  if (errors.length) return { valid: false, errors, warnings };
  const headers = raw['Open Cases'][0];
  for (const field of REQUIRED_CASE_FIELDS) if (!headers.includes(field)) errors.push(`Open Cases is missing column: ${field}`);
  if (!errors.length) {
    const idIndex = headers.indexOf('Case ID');
    const ids = raw['Open Cases'].slice(1).map(row => row[idIndex]);
    const duplicates = ids.filter((id, index) => id && ids.indexOf(id) !== index);
    if (duplicates.length) errors.push(`Duplicate Case IDs: ${[...new Set(duplicates)].slice(0, 5).join(', ')}`);
    if (ids.some(id => !id)) errors.push('At least one case is missing a Case ID.');
    const sourceIndex = headers.indexOf('Escalation Source');
    const missingSource = raw['Open Cases'].slice(1).filter(row => !row[sourceIndex]).length;
    if (missingSource) warnings.push(`${missingSource} cases have no escalation source and will be shown as Unknown.`);
  }
  return { valid: errors.length === 0, errors, warnings };
}

const priorityRank = { P1: 0, P2: 1, 'Non-P': 2 };
export function triageCase(c) {
  if (!c.valid) return { level: 7, label: 'Data check', reason: 'SLA cannot be calculated from the available fields' };
  if (c.priority === 'P1' && c.breach) return { level: 0, label: 'Critical', reason: `P1 · ${Math.abs(c.remaining)}h overdue` };
  if (c.priority === 'P1') return { level: 1, label: 'Critical', reason: `P1 · ${c.remaining}h remaining` };
  if (c.unassigned && c.breach) return { level: 2, label: 'Ownership risk', reason: `Unassigned · ${Math.abs(c.remaining)}h overdue` };
  if (c.due12) return { level: 3, label: 'SLA risk', reason: `${c.remaining}h remaining` };
  if (c.breach) return { level: 4, label: 'Breached', reason: `${Math.abs(c.remaining)}h overdue` };
  if (!c.anomaly && c.idle >= 24) return { level: 5, label: 'Stalled', reason: `No recorded action for ${Math.floor(c.idle)}h` };
  if (c.handovers >= 3 || c.reviewable) return { level: 6, label: 'Process review', reason: c.handovers >= 3 ? `${c.handovers} handovers` : c.reason };
  return { level: 8, label: 'Monitor', reason: 'Within SLA; no selected review signal' };
}

export function buildTriage(cases) {
  return cases.map(c => ({ ...c, triage: triageCase(c) })).sort((a, b) =>
    a.triage.level - b.triage.level ||
    (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9) ||
    (a.remaining ?? Infinity) - (b.remaining ?? Infinity) ||
    a.id.localeCompare(b.id)
  );
}

export function snapshotRecord(report, label = '') {
  return {
    key: new Date(report.snapshot).toISOString(),
    label: label || report.notes['Snapshot time'],
    capturedAt: new Date().toISOString(),
    metrics: { cases: report.caseCount, breached: report.breached, due12: report.due12, unassigned: report.unassigned, stale24: report.stale24 },
    cases: report.cases.map(c => ({ id: c.id, breach: c.breach, owner: c.owner || 'Unassigned', bundle: c.bundle, topic: c.topic, priority: c.priority }))
  };
}

export function compareSnapshots(current, previous) {
  if (!previous) return null;
  const oldCases = new Map(previous.cases.map(c => [c.id, c]));
  const newCases = new Map(current.cases.map(c => [c.id, c]));
  const added = current.cases.filter(c => !oldCases.has(c.id));
  const noLongerOpen = previous.cases.filter(c => !newCases.has(c.id));
  const newlyBreached = current.cases.filter(c => c.breach && oldCases.has(c.id) && !oldCases.get(c.id).breach);
  const ownerChanges = current.cases.filter(c => oldCases.has(c.id) && oldCases.get(c.id).owner !== c.owner);
  return {
    previousLabel: previous.label,
    caseDelta: current.metrics.cases - previous.metrics.cases,
    breachDelta: current.metrics.breached - previous.metrics.breached,
    added, noLongerOpen, newlyBreached, ownerChanges,
  };
}

export function scenario(report, { restorePercent = 0, demandPercent = 0, handledPercent = 0 } = {}) {
  const restore = Math.max(0, Math.min(100, Number(restorePercent))) / 100;
  const demand = Math.max(-50, Math.min(100, Number(demandPercent))) / 100;
  const handled = Math.max(-50, Math.min(100, Number(handledPercent))) / 100;
  // Use the engine's verified bundle-weighted full-recovery estimate when available.
  const recoveredCases = (report.fullRecoveryHandled ?? report.extraHandled ?? 0) * restore;
  const incoming = report.latest.incoming * (1 + demand);
  const handledCases = report.latest.handled * (1 + handled) + recoveredCases;
  const weeklyNet = incoming - handledCases;
  const weeksToClear = weeklyNet < 0 ? report.latest.closing / Math.abs(weeklyNet) : null;
  return { incoming, handled: handledCases, recoveredCases, weeklyNet, weeksToClear };
}

export function groupForExplorer(report, dimension) {
  const groups = dimension === 'bundle'
    ? report.cases.reduce((map, c) => {
        const group = map.get(c.bundle) || { name: c.bundle, n: 0, breached: 0, reviewable: 0, unassigned: 0, ages: [] };
        group.n += 1; group.breached += Number(c.breach); group.reviewable += Number(c.reviewable); group.unassigned += Number(c.unassigned); if (c.valid) group.ages.push(c.age); map.set(c.bundle, group); return map;
      }, new Map())
    : null;
  const rows = groups ? [...groups.values()].map(g => {
    const ages = g.ages.sort((a,b)=>a-b), middle = Math.floor(ages.length / 2);
    const medianAge = ages.length ? ages.length % 2 ? ages[middle] : (ages[middle - 1] + ages[middle]) / 2 : null;
    return { ...g, breachRate: g.n ? g.breached / g.n : 0, medianAge };
  })
    : dimension === 'source' ? report.sources : dimension === 'reason' ? report.reasons : report.topics;
  return [...rows].sort((a, b) => b.breached - a.breached || b.n - a.n || String(a.name).localeCompare(String(b.name)));
}
