import React, { useMemo, useState } from 'react';
import assessment from '../data/assessment.json';
import { calculatePSG } from '../lib/calculatePSG.js';
import { buildStakeholderApproach } from '../lib/stakeholders.js';
import './StakeholderApproach.css';

function ResponseBlock({ number, title, children }) {
  return <article className="response-block"><span>{number}</span><div><h3>{title}</h3>{children}</div></article>;
}

function ScenarioDetail({ scenario, visible }) {
  return <section className="stakeholder-detail" hidden={!visible} aria-labelledby={`${scenario.id}-title`}>
    <header className="scenario-heading">
      <div><p className="section-label">Scenario {scenario.number} / {scenario.subtitle}</p><h2 id={`${scenario.id}-title`}>{scenario.title}</h2><p>{scenario.objective}</p></div>
      <div className="scenario-signal"><strong>{scenario.signal}</strong><span>{scenario.signalLabel}</span></div>
    </header>

    <div className="required-response-grid">
      <ResponseBlock number="1" title="Who I would contact first">
        <p><strong>{scenario.firstContact.primary}</strong></p>
        <p className="muted-line">Then involve: {scenario.firstContact.partners.join(' · ')}</p>
      </ResponseBlock>
      <ResponseBlock number="2" title="Why this role">
        <p>{scenario.why}</p>
      </ResponseBlock>
      <ResponseBlock number="3" title="How I would find the right person">
        <ol>{scenario.findOwner.map(item => <li key={item}>{item}</li>)}</ol>
      </ResponseBlock>
      <ResponseBlock number="4" title="What evidence I would bring">
        <div className="stakeholder-evidence">{scenario.evidence.map(item => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong><small>{item.detail}</small></div>)}</div>
      </ResponseBlock>
    </div>

    <div className="contact-plan">
      <article className="opening-message"><p className="section-label">How I would open the conversation</p><blockquote>{scenario.opening}</blockquote></article>
      <article><p className="section-label">Questions for the working session</p><ol>{scenario.questions.map(item => <li key={item}>{item}</li>)}</ol></article>
    </div>

    <div className="decision-paths">
      <p className="section-label">How ownership changes with the evidence</p>
      <div>{scenario.decisionPaths.map(path => <article key={path.condition}><h3>If {path.condition.toLowerCase()}</h3><p><strong>Next:</strong> {path.next}</p><p>{path.outcome}</p></article>)}</div>
    </div>

    <aside className="claim-boundary"><strong>What I would not claim</strong><span>{scenario.boundary}</span></aside>
  </section>;
}

export default function StakeholderApproach() {
  const report = useMemo(() => calculatePSG(assessment), []);
  const approach = useMemo(() => buildStakeholderApproach(report), [report]);
  const [selected, setSelected] = useState(approach.scenarios[0].id);

  return <article className="stakeholder-page">
    <header className="stakeholder-hero">
      <p className="eyebrow">Part 04 / Stakeholder approach</p>
      <h1>Find the owner. Bring the evidence.</h1>
      <p className="lead">I would start with the role closest to the decision, bring a bounded question and case-level evidence, then expand the group only when the investigation shows why.</p>
      <div className="stakeholder-tools"><a className="button" href="#/brief">Open leadership actions</a><a className="button" href="#/dashboard">Explore supporting cases</a></div>
    </header>

    <section className="stakeholder-principles" aria-label="Stakeholder principles">
      {approach.principles.map((item, index) => <article key={item}><span>0{index + 1}</span><p>{item}</p></article>)}
    </section>

    <nav className="scenario-tabs" aria-label="Stakeholder scenarios">
      {approach.scenarios.map(scenario => <button key={scenario.id} aria-pressed={selected === scenario.id} onClick={() => setSelected(scenario.id)}>
        <span>Scenario {scenario.number}</span><strong>{scenario.title}</strong><small>{scenario.signal} · {scenario.signalLabel}</small>
      </button>)}
    </nav>

    {approach.scenarios.map(scenario => <ScenarioDetail key={scenario.id} scenario={scenario} visible={selected === scenario.id} />)}

    <footer className="stakeholder-note">These are proposed contact paths based on roles and the fictional assessment data. No individual is named, no current ownership is assumed, and no conversation is presented as having occurred.</footer>
  </article>;
}
