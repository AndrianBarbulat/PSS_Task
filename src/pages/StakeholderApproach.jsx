import React, { useMemo, useState } from 'react';
import assessment from '../data/assessment.json';
import { calculatePSG } from '../lib/calculatePSG.js';
import { buildStakeholderApproach } from '../lib/stakeholders.js';
import './StakeholderApproach.css';

function ResponseBlock({ number, title, children }) {
  return <article className="response-block">
    <span>{number}</span>
    <div><h3>{title}</h3>{children}</div>
  </article>;
}

function ScenarioDetail({ scenario, visible }) {
  const commitment = scenario.commitment;
  return <section
    className="stakeholder-detail"
    hidden={!visible}
    id={`${scenario.id}-panel`}
    role="tabpanel"
    aria-labelledby={`${scenario.id}-tab`}
  >
    <header className="scenario-heading">
      <div>
        <p className="section-label">Scenario {scenario.number} / {scenario.subtitle}</p>
        <h2>{scenario.title}</h2>
        <p>{scenario.objective}</p>
      </div>
      <div className="scenario-signal"><strong>{scenario.signal}</strong><span>{scenario.signalLabel}</span></div>
    </header>

    <div className="required-response-grid">
      <ResponseBlock number="1" title="Who I would contact first">
        <p className="primary-answer">{scenario.firstContact.primary}</p>
        <p className="muted-line"><b>I would add only if needed:</b> {scenario.firstContact.partners.join(' · ')}</p>
      </ResponseBlock>
      <ResponseBlock number="2" title="Why I would start there">
        <p>{scenario.why}</p>
      </ResponseBlock>
      <ResponseBlock number="3" title="How I would find the right person">
        <ol>{scenario.findOwner.map(item => <li key={item}>{item}</li>)}</ol>
      </ResponseBlock>
      <ResponseBlock number="4" title="What evidence I would bring">
        <div className="stakeholder-evidence">{scenario.evidence.map(item => <div key={item.label}>
          <span>{item.label}</span><strong>{item.value}</strong><small>{item.detail}</small>
        </div>)}</div>
      </ResponseBlock>
    </div>

    <section className="meeting-output" aria-label="Expected working-session output">
      <header><p className="section-label">What I would leave the meeting with</p><h3>A clear owner and a checkable next step.</h3></header>
      <dl>
        <div><dt>Accountable owner</dt><dd>{commitment.owner}</dd></div>
        <div><dt>Next action</dt><dd>{commitment.next}</dd></div>
        <div><dt>Evidence still needed</dt><dd>{commitment.evidence}</dd></div>
        <div><dt>Review time</dt><dd>{commitment.review}</dd></div>
        <div><dt>Success looks like</dt><dd>{commitment.success}</dd></div>
      </dl>
    </section>

    {scenario.incidentPlan && <section className="incident-plan" aria-label="War room and Known Issue decision">
      <header><p className="section-label">Incident path</p><h3>{scenario.incidentPlan.title}</h3><p>{scenario.incidentPlan.trigger}</p><small><b>Not enough on its own:</b> {scenario.incidentPlan.notEnough}</small></header>
      <div className="incident-steps">{scenario.incidentPlan.steps.map((step, index) => <article key={step.label}>
        <span>0{index + 1}</span><div><h4>{step.label}</h4><p>{step.text}</p></div>
      </article>)}</div>
      <details>
        <summary>Who would own each part of the incident?</summary>
        <ul>{scenario.incidentPlan.roles.map(role => <li key={role}>{role}</li>)}</ul>
      </details>
    </section>}

    <div className="scenario-details">
      <details open>
        <summary>Tools and records I would use</summary>
        <div className="stakeholder-tools-grid">{scenario.tools.map(tool => <article key={tool.name}>
          <h3>{tool.name}</h3><p>{tool.use}</p><small><b>Guardrail:</b> {tool.guardrail}</small>
        </article>)}</div>
      </details>
      <details>
        <summary>How I would open the conversation</summary>
        <blockquote>{scenario.opening}</blockquote>
      </details>
      <details>
        <summary>Questions I would ask</summary>
        <ol>{scenario.questions.map(item => <li key={item}>{item}</li>)}</ol>
      </details>
      <details>
        <summary>How ownership would change with the evidence</summary>
        <div className="decision-paths">{scenario.decisionPaths.map(path => <article key={path.condition}>
          <h3>If {path.condition.toLowerCase()}</h3><p><strong>Next:</strong> {path.next}</p><p>{path.outcome}</p>
        </article>)}</div>
      </details>
    </div>

    <aside className="claim-boundary"><strong>What I would not claim</strong><span>{scenario.boundary}</span></aside>
    <p className="jira-principle"><strong>My rule for Jira:</strong> I would use it to connect validated evidence to the right owner and status. I would not use a Jira label as a substitute for investigation.</p>
  </section>;
}

export default function StakeholderApproach() {
  const report = useMemo(() => calculatePSG(assessment), []);
  const approach = useMemo(() => buildStakeholderApproach(report), [report]);
  const [selected, setSelected] = useState(approach.scenarios[0].id);

  return <article className="stakeholder-page">
    <header className="stakeholder-hero">
      <p className="eyebrow">Part 04 / Stakeholder approach</p>
      <h1>I would start with the owner closest to the problem.</h1>
      <p className="lead">My approach is simple: I would take one clear question to one accountable role, bring the cases behind the signal, and only add more people when the evidence points to them.</p>
      <div className="stakeholder-tools"><a className="button" href="#/brief">Open leadership actions</a><a className="button" href="#/dashboard">Explore supporting cases</a></div>
    </header>

    <section className="stakeholder-principles" aria-label="How I would work with stakeholders">
      {approach.principles.map((item, index) => <article key={item}><span>0{index + 1}</span><p>{item}</p></article>)}
    </section>

    <div className="scenario-intro"><p className="section-label">Three situations from the analysis</p><h2>Choose a scenario to see who I would involve and why.</h2></div>
    <nav className="scenario-tabs" role="tablist" aria-label="Stakeholder scenarios">
      {approach.scenarios.map(scenario => <button
        key={scenario.id}
        id={`${scenario.id}-tab`}
        role="tab"
        aria-selected={selected === scenario.id}
        aria-controls={`${scenario.id}-panel`}
        onClick={() => setSelected(scenario.id)}
      >
        <span>Scenario {scenario.number}</span><strong>{scenario.title}</strong><small>{scenario.signal} · {scenario.signalLabel}</small>
      </button>)}
    </nav>

    {approach.scenarios.map(scenario => <ScenarioDetail key={scenario.id} scenario={scenario} visible={selected === scenario.id} />)}

    <footer className="stakeholder-note">These are the contact paths I would propose from the fictional assessment data. Internal research helped me validate the role boundaries, but no Slack message, real customer information or individual name is published here.</footer>
  </article>;
}
