import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculatePSG } from '../src/lib/calculatePSG.js';

const raw = JSON.parse(readFileSync(new URL('../src/data/assessment.json', import.meta.url), 'utf8'));
const analysisPage = readFileSync(new URL('../src/pages/Analysis.jsx', import.meta.url), 'utf8');
const d = calculatePSG(raw);
test('all five tabs and fixed assessment time are used', () => {
  assert.deepEqual(d.tabCounts.map(t => [t.name, t.rows]), [['Open Cases',340], ['Traffic & Capacity',18], ['SLA Targets',3], ['Data Notes',10], ['Topic Mapping',99]]);
  assert.equal(d.baseline, Date.UTC(2026, 9, 5, 9));
});
test('weekly flows and growth agree with independent expected totals', () => {
  assert.deepEqual(d.weeks.map(w => [w.opening,w.incoming,w.handled,w.closing,w.actual]), [[1205,2350,2300,1255,3660],[1255,2500,2360,1395,3605],[1395,2860,2440,1815,3525]]);
  assert.equal(d.totalGrowth,610);
  assert.deepEqual(d.bundles.map(b => b.growth),[340,135,45,40,35,15]);
  assert.equal(d.checks.flowMismatches,0); assert.equal(d.checks.continuityMismatches,0);
});
test('case exposure uses the 340-case denominator, not the weekly backlog', () => {
  assert.equal(d.caseCount,340); assert.equal(d.breached,109);
  assert.equal(d.due12,36); assert.equal(d.due4,9);
  assert.equal(d.unassigned,19); assert.equal(d.unassignedBreached,6);
  assert.equal(d.stale24,114);
  assert.deepEqual(d.priorities.map(p => [p.name,p.n,p.breached]),[['P1',15,12],['P2',92,39],['Non-P',233,58]]);
});
test('exact SLA boundary is due now, not breached', () => {
  const c = d.cases.find(c => c.id === 'CASE-920211');
  assert.equal(c.remaining,0); assert.equal(c.breach,false); assert.equal(c.due12,true);
  const later = calculatePSG(raw,{advanceHours:1}).cases.find(c => c.id === 'CASE-920211');
  assert.equal(later.breach,true); assert.equal(later.due12,false);
});
test('all six displayed case examples retain their source row and deadline', () => {
  for (const [id,row,remaining] of [['CASE-920311',312,2],['CASE-920052',53,4],['CASE-920330',331,4],['CASE-920023',24,-125],['CASE-920044',45,-82],['CASE-920098',99,-77]]) {
    const c = d.cases.find(c => c.id === id); assert.equal(c.row,row); assert.equal(c.remaining,remaining);
  }
});
test('sources, labels and topic concentrations match', () => {
  assert.deepEqual(d.sources.map(s => [s.name,s.n]),[['BPO',116],['Internal',105],['Priority',52],['Unknown',36],['QA',31]]);
  assert.equal(d.reviewable,134);
  assert.equal(d.sources.find(s => s.name === 'BPO').reviewable,64);
  assert.equal(d.sources.find(s => s.name === 'Internal').reviewable,31);
  const ads=d.topics.find(t => t.name === 'Google Ads w/ Wix');
  assert.equal(ads.n,21); assert.equal(ads.breached,20); assert.equal(ads.medianAge,100);
  const dns=d.topics.find(t => t.name === 'Domain DNS');
  assert.equal(dns.n,28); assert.equal(dns.breached,13); assert.equal(dns.threePlus,19);
});
test('data-quality exceptions stay visible', () => {
  assert.deepEqual(d.checks.timestampAnomalies,['CASE-920080']);
  assert.equal(d.checks.missingSource,36); assert.equal(d.checks.scopeGap,1475);
  for (const key of ['duplicateIds','invalidSLA','ageMismatches','targetMismatches','flagMismatches','mappingMismatches']) assert.equal(d.checks[key],0,key);
});
test('capacity sensitivity is bundle-weighted and does not promise clearance', () => {
  for (const share of [0,0.25,0.5,0.75,1]) {
    const scenario=calculatePSG(raw,{restoreShare:share});
    assert.ok(Math.abs(scenario.extraHandled-205.06585985574634*share)<1e-8);
    assert.ok(Math.abs(scenario.scenarioNet-(420-scenario.extraHandled))<1e-8);
  }
});
test('changing input updates calculated growth rather than a hardcoded display', () => {
  const changed=structuredClone(raw), headers=changed['Traffic & Capacity'][0];
  const row=changed['Traffic & Capacity'].at(-1);
  row[headers.indexOf('Incoming')]+=10; row[headers.indexOf('Closing Backlog')]+=10;
  const result=calculatePSG(changed);
  assert.equal(result.totalGrowth,620); assert.equal(result.latest.net,430);
  assert.equal(result.checks.flowMismatches,0);
});

test('Part 1 keeps the complete answer visible without closed evidence dropdowns', () => {
  assert.doesNotMatch(analysisPage, /<details|<summary/);
  for (const heading of [
    'Demand growth is the clearest measured driver.',
    'Protect the urgent cases before starting broader recovery work.',
    'The file points to four investigation tracks, not four proven causes.',
    'Use a daily control loop while the root-cause work continues.',
    'The operational pressure is proven. The root causes are still hypotheses.',
  ]) assert.ok(analysisPage.includes(heading), `Missing ${heading}`);
});
