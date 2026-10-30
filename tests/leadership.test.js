import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculatePSG } from '../src/lib/calculatePSG.js';
import { buildLeadershipBrief } from '../src/lib/leadership.js';

const raw = JSON.parse(readFileSync(new URL('../src/data/assessment.json', import.meta.url), 'utf8'));
const brief = buildLeadershipBrief(calculatePSG(raw));

test('leadership headline uses the verified queue and urgent-case measures', () => {
  assert.deepEqual(brief.metrics.map(metric => metric.display), ['+610', '+420', '12/15', '6']);
  assert.match(brief.conclusion, /Business demand increase/);
});

test('leadership drivers distinguish growth, concentration and capacity sensitivity', () => {
  assert.deepEqual(brief.drivers.business, { periodGrowth: 340, periodShare: 55.7, latestNet: 265, latestShare: 63.1 });
  assert.deepEqual(brief.drivers.googleAds, { cases: 21, breached: 20, medianAge: 100 });
  assert.equal(brief.drivers.capacity.closesGap, false);
  assert.equal(brief.drivers.capacity.remainingNet, 214.9);
});

test('leadership action plan assigns timing, roles and measurable outcomes', () => {
  assert.equal(brief.actions.length, 5);
  assert.ok(brief.actions.every(action => action.timing && action.owner && action.measure));
  assert.match(brief.actions[0].measure, /15\/15 P1s reviewed/);
  assert.match(brief.actions[1].measure, /1,815 versus 340/);
  assert.match(brief.actions[4].action, /escalation evidence/);
  assert.match(brief.actions[4].measure, /64 BPO candidates and 28 DNS cases/);
  assert.match(brief.successMeasures[1].measure, /zero or better/);
});

test('leadership page expands the issue without overstating the available evidence', () => {
  const source = readFileSync(new URL('../src/pages/LeadershipBrief.jsx', import.meta.url), 'utf8');
  assert.match(source, /Operational imbalance/);
  assert.match(source, /Customer and SLA exposure/);
  assert.match(source, /Priority signal, not root cause/);
  assert.match(source, /actual customer harm is not measured/);
  assert.match(source, /cannot establish overall SLA attainment/);
});

test('leadership evidence explicitly separates facts, interpretation and uncertainty', () => {
  assert.deepEqual(brief.evidence.map(item => item.type), ['Confirmed fact', 'Supported interpretation', 'Hypothesis', 'Not assessable']);
  assert.match(brief.evidence.at(-1).text, /resolved cases are absent/);
  assert.equal(brief.leadershipAsks.length, 3);
  assert.match(brief.leadershipAsks[0], /skills-matched surge/);
});
