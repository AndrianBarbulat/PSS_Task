import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculatePSG } from '../src/lib/calculatePSG.js';
import { buildTriage, compareSnapshots, groupForExplorer, scenario, snapshotRecord, triageCase, validateSnapshot } from '../src/lib/dashboard.js';

const raw = JSON.parse(readFileSync(new URL('../src/data/assessment.json', import.meta.url), 'utf8'));
const report = calculatePSG(raw);

test('snapshot validator checks structure, required fields and warnings', () => {
  const result = validateSnapshot(raw);
  assert.equal(result.valid, true);
  assert.deepEqual(result.warnings, ['36 cases have no escalation source and will be shown as Unknown.']);
  const missing = structuredClone(raw); delete missing['SLA Targets'];
  assert.equal(validateSnapshot(missing).valid, false);
  const duplicate = structuredClone(raw); duplicate['Open Cases'][2][0] = duplicate['Open Cases'][1][0];
  assert.match(validateSnapshot(duplicate).errors.join(' '), /Duplicate Case IDs/);
});

test('triage is deterministic and explains why each urgent case appears', () => {
  const queue = buildTriage(report.cases);
  assert.equal(queue[0].triage.label, 'Critical');
  assert.equal(queue[0].priority, 'P1');
  const approaching = report.cases.find(c => c.id === 'CASE-920311');
  assert.deepEqual(triageCase(approaching), { level: 1, label: 'Critical', reason: 'P1 · 2h remaining' });
  const unassigned = report.cases.find(c => c.id === 'CASE-920098');
  assert.equal(triageCase(unassigned).label, 'Ownership risk');
  assert.match(triageCase(unassigned).reason, /Unassigned/);
});

test('snapshot comparison does not call absent cases resolved', () => {
  const earlier = snapshotRecord(report, 'Earlier');
  const later = structuredClone(earlier);
  later.label = 'Later';
  later.cases = later.cases.slice(1);
  later.cases[0].breach = true;
  later.cases[1].owner = 'Different owner';
  later.metrics.cases -= 1;
  later.metrics.breached += 1;
  const comparison = compareSnapshots(later, earlier);
  assert.equal(comparison.noLongerOpen.length, 1);
  assert.equal(comparison.newlyBreached.length, 1);
  assert.equal(comparison.ownerChanges.length, 1);
  assert.equal('resolved' in comparison, false);
});

test('recovery scenario uses the verified bundle-weighted capacity estimate', () => {
  const base = scenario(report);
  assert.equal(base.weeklyNet, 420);
  const recovered = scenario(report, { restorePercent: 100 });
  assert.ok(Math.abs(recovered.recoveredCases - 205.06585985574634) < 1e-8);
  assert.ok(Math.abs(recovered.weeklyNet - 214.93414014425366) < 1e-8);
  const improvement = scenario(report, { restorePercent: 100, handledPercent: 10, demandPercent: -10 });
  assert.ok(improvement.weeklyNet < recovered.weeklyNet);
});

test('driver explorer preserves denominators and ranks breach concentrations', () => {
  const topics = groupForExplorer(report, 'topic');
  const ads = topics.find(row => row.name === 'Google Ads w/ Wix');
  assert.deepEqual([ads.n, ads.breached], [21, 20]);
  const sources = groupForExplorer(report, 'source');
  const bpo = sources.find(row => row.name === 'BPO');
  assert.deepEqual([bpo.n, bpo.reviewable], [116, 64]);
  const bundles = groupForExplorer(report, 'bundle');
  assert.equal(bundles.reduce((sum, row) => sum + row.n, 0), report.caseCount);
});
