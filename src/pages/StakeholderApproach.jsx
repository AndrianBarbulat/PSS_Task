import React, { useMemo } from 'react';
import assessment from '../data/assessment.json';
import { calculatePSG } from '../lib/calculatePSG.js';
import { buildStakeholderApproach } from '../lib/stakeholders.js';
import './StakeholderApproach.css';

function ResponseBlock({ number, title, children }) {
  return <article className="response-block">
    <span aria-hidden="true">0{number}</span>
    <div>
      <p className="required-question-label">Required question {number}</p>
      <h3>{title}</h3>
      {children}
    </div>
  </article>;
}

function ScenarioDetail({ scenario }) {
  const commitment = scenario.commitment;

  return <section className="stakeholder-detail" id={scenario.id}>
    <header className="scenario-heading">
      <div>
        <p className="section-label">{scenario.subtitle}</p>
        <h2>{scenario.title}</h2>
        <p>{scenario.objective}</p>
      </div>
      <div className="scenario-signal"><strong>{scenario.signal}</strong><span>{scenario.signalLabel}</span></div>
    </header>

    <div className="required-answers-heading">
      <p className="section-label">Direct response to the assignment</p>
      <h3>The four required stakeholder questions</h3>
    </div>
    <div className="required-response-grid">
      <ResponseBlock number="1" title="Who I would involve first">
        <p className="primary-answer">{scenario.firstContact.primary}</p>
        <p className="muted-line"><b>I would add only when the evidence requires it:</b> {scenario.firstContact.partners.join(' · ')}</p>
      </ResponseBlock>
      <ResponseBlock number="2" title="Why I would involve them">
        <p>{scenario.why}</p>
      </ResponseBlock>
      <ResponseBlock number="3" title="How I would identify the appropriate person if I did not already know their name">
        <ol>{scenario.findOwner.map(item => <li key={item}>{item}</li>)}</ol>
      </ResponseBlock>
      <ResponseBlock number="4" title="What information/evidence I would bring when approaching them">
        <div className="stakeholder-evidence">{scenario.evidence.map(item => <div key={item.label}>
          <span>{item.label}</span><strong>{item.value}</strong><small>{item.detail}</small>
        </div>)}</div>
      </ResponseBlock>
    </div>

    <section className="scenario-working-grid" aria-label="How I would work the scenario">
      <article className="scenario-working-section tools-section">
        <p className="section-label">Checks and working records</p>
        <h3>Tools and records I would use</h3>
        <div className="stakeholder-tools-grid">{scenario.tools.map(tool => <article key={tool.name}>
          <h4>{tool.name}</h4><p>{tool.use}</p><small><b>Guardrail:</b> {tool.guardrail}</small>
        </article>)}</div>
      </article>

      <article className="scenario-working-section conversation-section">
        <p className="section-label">Efficient cross-team communication</p>
        <h3>How I would open the conversation</h3>
        <blockquote>{scenario.opening}</blockquote>
        <h3>Questions I would ask</h3>
        <ol>{scenario.questions.map(item => <li key={item}>{item}</li>)}</ol>
      </article>
    </section>

    <section className="ownership-decisions">
      <p className="section-label">Evidence changes ownership</p>
      <h3>How I would move the issue forward</h3>
      <div className="decision-paths">{scenario.decisionPaths.map(path => <article key={path.condition}>
        <h4>If {path.condition.toLowerCase()}</h4><p><strong>Next:</strong> {path.next}</p><p>{path.outcome}</p>
      </article>)}</div>
    </section>

    {scenario.incidentPlan && <section className="incident-plan" aria-label="ICU, war room and Known Issue decision">
      <header><p className="section-label">Incident path</p><h3>{scenario.incidentPlan.title}</h3><p>{scenario.incidentPlan.trigger}</p><small><b>Not enough on its own:</b> {scenario.incidentPlan.notEnough}</small></header>
      <div className="incident-steps">{scenario.incidentPlan.steps.map((step, index) => <article key={step.label}>
        <span>0{index + 1}</span><div><h4>{step.label}</h4><p>{step.text}</p></div>
      </article>)}</div>
      <div className="incident-roles">
        <h4>Who would own each part</h4>
        <ul>{scenario.incidentPlan.roles.map(role => <li key={role}>{role}</li>)}</ul>
      </div>
    </section>}

    <section className="meeting-output" aria-label="Expected working-session output">
      <header><p className="section-label">What I would leave the discussion with</p><h3>A clear owner and a checkable next step.</h3></header>
      <dl>
        <div><dt>Accountable owner</dt><dd>{commitment.owner}</dd></div>
        <div><dt>Next action</dt><dd>{commitment.next}</dd></div>
        <div><dt>Evidence still needed</dt><dd>{commitment.evidence}</dd></div>
        <div><dt>Review time</dt><dd>{commitment.review}</dd></div>
        <div><dt>Success looks like</dt><dd>{commitment.success}</dd></div>
      </dl>
    </section>

    <aside className="claim-boundary"><strong>What I would not claim</strong><span>{scenario.boundary}</span></aside>
    <p className="jira-principle"><strong>My rule for Jira:</strong> I would use it to connect validated evidence to the right owner and status. I would not use a Jira label as a substitute for investigation.</p>
  </section>;
}

export default function StakeholderApproach() {
  const report = useMemo(() => calculatePSG(assessment), []);
  const approach = useMemo(() => buildStakeholderApproach(report), [report]);

  return <article className="stakeholder-page">
    <header className="stakeholder-hero">
      <p className="eyebrow">Part 04 / Find the right stakeholder</p>
      <h1>I would turn operational data and technical evidence into the correct action.</h1>
      <p className="lead">The Analyst PSS role is broader than knowing Wix infrastructure. I bring strong analytical skills: I can manage imperfect data, identify meaningful patterns, distinguish facts from hypotheses, investigate root causes and translate the result into the correct workflow. My knowledge of Wix teams and tools—especially Slack, ownership maps, Jira, CSI and technical logs—then helps me reach the right person with a focused, evidence-based request.</p>
      <div className="stakeholder-tools"><a className="button" href="#/brief">Open leadership actions</a><a className="button" href="#/dashboard">Explore supporting cases</a></div>
    </header>

    <section className="stakeholder-principles" aria-label="How I would work with stakeholders">
      {approach.principles.map((item, index) => <article key={item}><span>0{index + 1}</span><p>{item}</p></article>)}
    </section>

    <section className="practice-validation" aria-labelledby="practice-validation-title">
      <header><p className="section-label">Validated against current internal practice</p><h2 id="practice-validation-title">The escalation path depends on what the evidence shows.</h2></header>
      <div>
        <article><strong>Known Issue match</strong><p>When the symptom and scope match an active KI, I would link the case, use the approved workaround or update path and avoid a duplicate escalation unless I have new evidence.</p></article>
        <article><strong>PSS → product/dev clarification</strong><p>After reproducing the issue, I can ask the established product/dev support channel whether the behaviour is expected. The answer determines whether I communicate a limitation or workaround, link an existing Jira, or use Product QA for a formal defect escalation. ICU is added when impact is widespread and active.</p></article>
        <article><strong>Repeated guidance gap</strong><p>If experts across locations stop at the same troubleshooting point, I would compare the current and historical CSI, align technical truth with the topic PSS, and work with Education to update and communicate the guidance.</p></article>
        <article><strong>AI-assisted discovery</strong><p>I would use AI to search similar Slack questions, KIs, CSI and Jiras more efficiently. I would still open the original source and validate the status, symptom, environment and scope before treating any result as evidence.</p></article>
      </div>
    </section>

    <section className="technical-method" aria-labelledby="technical-method-title">
      <header><p className="section-label">My Analyst PSS operating model</p><h2 id="technical-method-title">A spike is a signal to analyse—not a coaching conclusion.</h2></header>
      <div>
        <article><span>01</span><h3>Manage the data</h3><p>Validate populations and definitions, segment the cases, compare rates and trends, and expose missing or unreliable fields before drawing a conclusion.</p></article>
        <article><span>02</span><h3>Confirm the pattern</h3><p>Compare symptoms, flows, timing, locations and histories. Separate genuinely matching cases from unrelated escalations that share only a broad topic.</p></article>
        <article><span>03</span><h3>Run root-cause analysis</h3><p>Reproduce where possible, inspect errors, request IDs, timestamps, network responses and logs, and rule out configuration, permissions, custom implementation and known limitations.</p></article>
        <article><span>04</span><h3>Choose the workflow</h3><p>Use KI/ICU and the correct product or urgent dev channel for a widespread signal, Education for CSI, workflow owners for routing, and Delivery feedback only for a confirmed execution gap.</p></article>
        <article><span>05</span><h3>Measure the result</h3><p>Track recurrence, escalation rate, handovers, SLA impact, CSI use and a comparable follow-up sample to confirm that the action worked.</p></article>
      </div>
    </section>

    <section className="scenario-intro">
      <p className="section-label">All three required situations</p>
      <h2>Each scenario answers the four assignment questions directly.</h2>
      <p>Use these links to jump to a scenario. Every answer is displayed below without dropdowns.</p>
    </section>
    <nav className="scenario-index" aria-label="Stakeholder scenarios">
      {approach.scenarios.map(scenario => <a key={scenario.id} href={`#${scenario.id}`}>
        <span>{scenario.subtitle}</span><strong>{scenario.title}</strong><small>{scenario.signal} · {scenario.signalLabel}</small>
      </a>)}
    </nav>

    {approach.scenarios.map(scenario => <ScenarioDetail key={scenario.id} scenario={scenario} />)}

    <footer className="stakeholder-note">I used anonymized internal patterns to validate these ownership and escalation paths. No Slack message, individual name or real customer information is reproduced here.</footer>
  </article>;
}
