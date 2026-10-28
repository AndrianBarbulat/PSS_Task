import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculatePSG } from '../src/lib/calculatePSG.js';
import { buildStakeholderApproach } from '../src/lib/stakeholders.js';

const raw = JSON.parse(readFileSync(new URL('../src/data/assessment.json', import.meta.url), 'utf8'));
const approach = buildStakeholderApproach(calculatePSG(raw));

test('every stakeholder scenario answers the four required questions', () => {
  assert.equal(approach.scenarios.length, 3);
  for (const scenario of approach.scenarios) {
    assert.ok(scenario.firstContact.primary);
    assert.ok(scenario.why);
    assert.equal(scenario.findOwner.length, 3);
    assert.equal(scenario.evidence.length, 4);
    assert.equal(scenario.decisionPaths.length, 3);
  }
});

test('Delivery scenario treats reviewable reasons as candidates, not proven unnecessary escalations', () => {
  const scenario = approach.scenarios.find(item => item.id === 'delivery');
  assert.equal(scenario.signal, '64/116');
  assert.match(scenario.why, /not confirmed unnecessary escalations/);
  assert.match(scenario.boundary, /not report 64/);
});

test('Google Ads scenario brings concentration and reproduction evidence to product roles', () => {
  const scenario = approach.scenarios.find(item => item.id === 'product');
  assert.equal(scenario.signal, '20/21');
  assert.match(scenario.why, /12 cases carry a Bug label/);
  assert.match(scenario.boundary, /needs reproduction/);
  assert.match(scenario.firstContact.primary, /Google Ads/);
});

test('Domain DNS scenario preserves cross-location and handover evidence without claiming causation', () => {
  const scenario = approach.scenarios.find(item => item.id === 'routing');
  assert.equal(scenario.signal, '19/28');
  assert.match(scenario.evidence.find(item => item.label === 'Location spread').value, /6 locations/);
  assert.match(scenario.boundary, /warrants investigation, not causation/);
});
