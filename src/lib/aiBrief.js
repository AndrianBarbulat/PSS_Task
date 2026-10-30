import { buildTriage, groupForExplorer } from './dashboard.js';

const metric = (id, label, value, unit = 'count') => ({ id, label, value, unit });

export function buildAiFactPack(report, comparison, sourceName = '') {
  const queue = buildTriage(report.cases).slice(0, 20);
  const concentrations = ['bundle', 'topic', 'source', 'reason'].flatMap(dimension =>
    groupForExplorer(report, dimension).slice(0, 5).map(row => ({
      id: `concentration.${dimension}.${row.name}`,
      dimension,
      name: String(row.name).slice(0, 120),
      open: row.n,
      breached: row.breached,
      unassigned: row.unassigned,
      reviewable: row.reviewable,
    }))
  );
  return {
    metadata: {
      snapshot: new Date(report.snapshot).toISOString(),
      sourceType: sourceName.toLowerCase().endsWith('.xlsx') ? 'Excel workbook' : sourceName.toLowerCase().endsWith('.json') ? 'JSON snapshot' : 'Bundled assessment data',
      scope: 'Fictional PSG open-case assessment data',
    },
    metrics: [
      metric('queue.open', 'Open cases in export', report.caseCount),
      metric('sla.breached', 'Cases beyond SLA target', report.breached),
      metric('sla.due12', 'Cases due within 12 hours', report.due12),
      metric('sla.due4', 'Cases due now or within 4 hours', report.due4),
      metric('ownership.unassigned', 'Unassigned cases', report.unassigned),
      metric('ownership.unassignedBreached', 'Unassigned breached cases', report.unassignedBreached),
      metric('workflow.stalled24', 'Cases without a recorded action for at least 24 hours', report.stale24),
      metric('flow.latestIncoming', 'Latest weekly incoming', report.latest.incoming),
      metric('flow.latestHandled', 'Latest weekly handled', report.latest.handled),
      metric('flow.latestNet', 'Latest weekly incoming minus handled', report.latest.net),
      metric('flow.latestClosing', 'Latest weekly closing backlog', report.latest.closing),
    ],
    comparison: comparison ? {
      previousLabel: comparison.previousLabel,
      metrics: [
        metric('change.open', 'Change in open cases', comparison.caseDelta),
        metric('change.breached', 'Change in breached cases', comparison.breachDelta),
        metric('change.newlyPresent', 'Cases newly present', comparison.added.length),
        metric('change.noLongerPresent', 'Cases no longer present', comparison.noLongerOpen.length),
        metric('change.newlyBreached', 'Cases newly breached', comparison.newlyBreached.length),
        metric('change.ownerChanges', 'Cases with an owner change', comparison.ownerChanges.length),
      ],
    } : null,
    concentrations,
    priorityCases: queue.map(item => ({
      evidenceId: `case.${item.id}`,
      id: String(item.id).slice(0, 80),
      priority: item.priority,
      bundle: String(item.bundle).slice(0, 100),
      topic: String(item.topic).slice(0, 120),
      ownership: item.unassigned ? 'Unassigned' : 'Assigned',
      breach: item.breach,
      remainingHours: item.remaining,
      signal: item.triage.label,
      reason: item.triage.reason,
    })),
    dataQuality: {
      duplicateCaseIds: report.checks.duplicateIds,
      unavailableSlaValues: report.checks.invalidSLA,
      mappingMismatches: report.checks.mappingMismatches,
      timestampAnomalies: report.checks.timestampAnomalies.length,
      missingSources: report.checks.missingSource,
      weeklyFlowMismatches: report.checks.flowMismatches,
      continuityMismatches: report.checks.continuityMismatches,
      populationScopeGap: report.checks.scopeGap,
      cautions: [
        'The open-case export and weekly backlog report have unreconciled populations.',
        'A case absent from a later export is no longer present, not automatically resolved.',
        'The workbook does not provide business-hour calendars, SLA pause rules or full case histories.',
      ],
    },
  };
}

export function validateAiBrief(brief) {
  const sections = ['findings', 'risks', 'recommendations', 'hypotheses', 'limitations'];
  if (!brief || typeof brief !== 'object' || typeof brief.executiveSummary !== 'string') return false;
  return sections.every(section => Array.isArray(brief[section]));
}

export async function requestAiBrief(factPack) {
  const response = await fetch('/api/psg-ai-brief', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ factPack }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'The AI brief could not be generated.');
  if (!validateAiBrief(result.brief)) throw new Error('The AI service returned an unexpected response.');
  return { ...result.brief, generatedAt: result.generatedAt || new Date().toISOString() };
}
