import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import readExcelFile from 'read-excel-file/node';
import { calculatePSG } from '../src/lib/calculatePSG.js';
import { buildTriage, compareSnapshots, groupForExplorer, scenario, snapshotRecord, triageCase, validateSnapshot } from '../src/lib/dashboard.js';
import { csvRowsToSnapshot, parseCsv, parseSnapshotFile, sheetsToSnapshot } from '../src/lib/spreadsheet.js';
import { buildAiFactPack, validateAiBrief } from '../src/lib/aiBrief.js';
import { createSnapshotEntry, selectPreviousSnapshot, sortSnapshots } from '../src/lib/snapshotLibrary.js';

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
  const missingTrafficField = structuredClone(raw); missingTrafficField['Traffic & Capacity'][0][2] = 'Arrivals';
  assert.match(validateSnapshot(missingTrafficField).errors.join(' '), /Traffic & Capacity is missing column: Incoming/);
  const malformed = structuredClone(raw); malformed['Open Cases'][1] = null;
  assert.match(validateSnapshot(malformed).errors.join(' '), /Open Cases contains 1 malformed row/);
  const badTimestamp = structuredClone(raw); badTimestamp['Open Cases'][1][1] = 'not-a-date';
  assert.match(validateSnapshot(badTimestamp).warnings.join(' '), /1 cases have an unreadable timestamp/);
});

test('actual Excel workbook imports to the same normalized snapshot as the checked fixture', async () => {
  const workbookPath = new URL('../Analyst_PSS_Assessment_Data_v2.xlsx', import.meta.url);
  const sheets = await readExcelFile(workbookPath);
  const imported = sheetsToSnapshot(sheets);
  assert.deepEqual(imported, raw);
  assert.equal(validateSnapshot(imported).valid, true);
  assert.equal(calculatePSG(imported).caseCount, 340);
});

test('the two downloadable test workbooks import independently and produce a real comparison', async () => {
  const first = sheetsToSnapshot(await readExcelFile(new URL('../public/test-data/PSG_Daily_Snapshot_2026-10-06.xlsx', import.meta.url)));
  const second = sheetsToSnapshot(await readExcelFile(new URL('../public/test-data/PSG_Daily_Snapshot_2026-10-07.xlsx', import.meta.url)));
  assert.equal(validateSnapshot(first).valid, true);
  assert.equal(validateSnapshot(second).valid, true);
  const firstReport = calculatePSG(first);
  const secondReport = calculatePSG(second);
  assert.deepEqual([firstReport.caseCount, secondReport.caseCount], [350, 335]);
  const comparison = compareSnapshots(snapshotRecord(secondReport), snapshotRecord(firstReport));
  assert.equal(comparison.caseDelta, -15);
  assert.equal(comparison.added.length, 12);
  assert.equal(comparison.noLongerOpen.length, 27);
  assert.ok(comparison.newlyBreached.length > 0);
  assert.ok(comparison.ownerChanges.length > 0);
});

test('file parser accepts xlsx through an injected reader and rejects unsupported formats', async () => {
  const workbookPath = new URL('../Analyst_PSS_Assessment_Data_v2.xlsx', import.meta.url);
  const sheets = await readExcelFile(workbookPath);
  const file = { name: 'daily-snapshot.xlsx' };
  assert.deepEqual(await parseSnapshotFile(file, async () => sheets), raw);
  const jsonFile = { name: 'daily-snapshot.JSON', text: async () => JSON.stringify(raw) };
  assert.deepEqual(await parseSnapshotFile(jsonFile), raw);
  await assert.rejects(() => parseSnapshotFile({ name: 'legacy.xls' }), /Choose an \.xlsx workbook/);
});

test('Open Cases CSV imports as an independent compatible snapshot using explicit reference definitions', async () => {
  const fromRows = csvRowsToSnapshot(raw['Open Cases'], raw);
  assert.equal(validateSnapshot(fromRows).valid, true);
  assert.equal(calculatePSG(fromRows).caseCount, 340);
  assert.equal(fromRows['Data Notes'].find(row => row[0] === 'Snapshot time')[1], 'October 5, 2026, 09:00');
  assert.deepEqual(parseCsv('Case ID,Topic\r\n"CASE-1","Ads, Search"'), [['Case ID', 'Topic'], ['CASE-1', 'Ads, Search']]);
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

test('snapshot library keeps imports independent and selects only an earlier automatic baseline', () => {
  const currentRecord = snapshotRecord(report, 'Current');
  const current = createSnapshotEntry({ raw, report, record: currentRecord, sourceName: 'current.xlsx', id: 'current' });
  const earlier = structuredClone(current);
  earlier.id = 'earlier'; earlier.snapshotKey = '2026-09-28T08:00:00.000Z'; earlier.record.key = earlier.snapshotKey; earlier.record.label = 'Earlier';
  const later = structuredClone(current);
  later.id = 'later'; later.snapshotKey = '2026-10-12T08:00:00.000Z'; later.record.key = later.snapshotKey; later.record.label = 'Later';
  const ordered = sortSnapshots([earlier, current, later]);
  assert.deepEqual(ordered.map(item => item.id), ['later', 'current', 'earlier']);
  assert.equal(selectPreviousSnapshot(ordered, current)?.id, 'earlier');
  assert.equal(selectPreviousSnapshot(ordered, current, 'later')?.id, 'later');
  assert.notEqual(current.raw, earlier.raw);
});

test('AI fact pack contains verified aggregates without raw member details', () => {
  const factPack = buildAiFactPack(report, null, 'assessment.xlsx');
  assert.equal(factPack.metrics.find(item => item.id === 'queue.open').value, 340);
  assert.equal(factPack.comparison, null);
  assert.ok(factPack.priorityCases.length <= 20);
  assert.ok(factPack.priorityCases.every(item => item.evidenceId === `case.${item.id}`));
  assert.equal('raw' in factPack, false);
  assert.equal(validateAiBrief({ executiveSummary: 'Summary', findings: [], risks: [], recommendations: [], hypotheses: [], limitations: [] }), true);
});
