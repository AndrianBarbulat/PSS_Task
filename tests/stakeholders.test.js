import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculatePSG } from '../src/lib/calculatePSG.js';
import { buildStakeholderApproach } from '../src/lib/stakeholders.js';

const raw = JSON.parse(readFileSync(new URL('../src/data/assessment.json', import.meta.url), 'utf8'));
const approach = buildStakeholderApproach(calculatePSG(raw));
const pageSource = readFileSync(new URL('../src/pages/StakeholderApproach.jsx', import.meta.url), 'utf8');

test('every stakeholder scenario answers the four required questions', () => {
  assert.equal(approach.scenarios.length, 3);
  for (const scenario of approach.scenarios) {
    assert.ok(scenario.firstContact.primary);
    assert.ok(scenario.why);
    assert.equal(scenario.findOwner.length, 3);
    assert.equal(scenario.evidence.length, 4);
    assert.equal(scenario.tools.length, 4);
    assert.equal(scenario.decisionPaths.length, 3);
    assert.ok(scenario.commitment.owner);
    assert.ok(scenario.commitment.next);
    assert.ok(scenario.commitment.evidence);
    assert.ok(scenario.commitment.review);
    assert.ok(scenario.commitment.success);
  }
});

test('stakeholder page displays the assignment questions and all scenarios without dropdowns', () => {
  assert.match(pageSource, /Who I would involve first/);
  assert.match(pageSource, /Why I would involve them/);
  assert.match(pageSource, /How I would identify the appropriate person/);
  assert.match(pageSource, /What information and evidence I would bring/);
  assert.doesNotMatch(pageSource, /<details|useState/);
  assert.match(pageSource, /approach\.scenarios\.map\(scenario => <ScenarioDetail/);
});

test('approach uses PSS channel knowledge but still verifies current ownership', () => {
  assert.match(approach.principles.join(' '), /good knowledge of Wix teams/);
  assert.match(approach.principles.join(' '), /confirm the current channel and person/);
  assert.match(approach.principles.join(' '), /Known Issues/);
  assert.match(approach.principles.join(' '), /AI-assisted search/);
  assert.match(approach.principles.join(' '), /request IDs and timestamps/);
  assert.match(approach.principles.join(' '), /structure imperfect data/);
  assert.match(approach.principles.join(' '), /correct action, workflow and measurable follow-up/);
  assert.match(pageSource, /A spike is a signal to analyse—not a coaching conclusion/);
  assert.match(pageSource, /Manage the data/);
});

test('Delivery scenario treats reviewable reasons as candidates, not proven unnecessary escalations', () => {
  const scenario = approach.scenarios.find(item => item.id === 'delivery');
  assert.equal(scenario.signal, '64/116');
  assert.match(scenario.why, /not confirmed unnecessary escalations/);
  assert.match(scenario.why, /not begin by assuming this is a coaching problem/);
  assert.match(scenario.tools.find(tool => tool.name === 'AI-assisted Slack, Jira and KI search').guardrail, /discovery accelerator, not evidence/);
  assert.match(scenario.boundary, /not report 64/);
});

test('Google Ads scenario brings concentration and reproduction evidence to product roles', () => {
  const scenario = approach.scenarios.find(item => item.id === 'product');
  assert.equal(scenario.signal, '20/21');
  assert.match(scenario.why, /12 cases have a Bug label/);
  assert.match(scenario.boundary, /needs shared symptoms and successful reproduction/);
  assert.match(scenario.firstContact.primary, /Google Ads/);
  assert.match(scenario.firstContact.partners.join(' '), /Engineering through Product QA/);
  assert.match(scenario.findOwner.at(-1), /not contact Engineering directly/);
  assert.match(scenario.tools.find(tool => tool.name === 'Jira through Product QA').guardrail, /doubtful or closed Jira/);
  assert.match(scenario.tools.find(tool => tool.name === 'PREX or CCFR').use, /product-experience gap/);
  assert.match(scenario.tools.find(tool => tool.name === 'Known Issue, ICU and product\/dev channels').guardrail, /not merge different symptoms/);
  assert.match(scenario.tools.find(tool => tool.name === 'Known Issue, ICU and product\/dev channels').guardrail, /broadcast an unvalidated issue/);
  assert.match(scenario.incidentPlan.trigger, /several independent cases/);
  assert.match(scenario.incidentPlan.notEnough, /high breach count/);
  assert.match(scenario.incidentPlan.title, /ICU/);
  assert.match(scenario.incidentPlan.steps[1].label, /PSS reports the signal/);
  assert.match(scenario.incidentPlan.steps[1].text, /request IDs/);
  assert.match(scenario.incidentPlan.steps[1].text, /urgent development channel/);
  assert.match(scenario.incidentPlan.steps[2].text, /war room/);
  assert.match(scenario.tools.find(tool => tool.name === 'Root-cause evidence pack').use, /network responses and relevant logs/);
  assert.equal(scenario.incidentPlan.steps.length, 4);
  assert.equal(scenario.incidentPlan.roles.length, 6);
});

test('Domain DNS scenario tests incomplete guidance across locations without claiming causation', () => {
  const scenario = approach.scenarios.find(item => item.id === 'routing');
  assert.equal(scenario.signal, '19/28');
  assert.match(scenario.title, /incomplete guidance/);
  assert.match(scenario.firstContact.primary, /Education PSS or CSI owner/);
  assert.match(scenario.evidence.find(item => item.label === 'Location spread').value, /6 locations/);
  assert.match(scenario.questions.at(-1), /6 represented locations/);
  assert.match(scenario.tools.find(tool => tool.name === 'Current and historical CSI').use, /missing prerequisite/);
  assert.match(scenario.tools.find(tool => tool.name === 'Slack, Known Issue and ICU search').guardrail, /symptom, flow and scope/);
  assert.match(scenario.decisionPaths[0].outcome, /avoid duplicate escalation/);
  assert.match(scenario.boundary, /not proof of causation/);
});
