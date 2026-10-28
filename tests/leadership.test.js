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
});

test('leadership evidence explicitly separates facts, interpretation and uncertainty', () => {
  assert.deepEqual(brief.evidence.map(item => item.type), ['Confirmed fact', 'Supported interpretation', 'Hypothesis', 'Not assessable']);
  assert.match(brief.evidence.at(-1).text, /resolved cases are absent/);
  assert.equal(brief.leadershipAsks.length, 3);
});
