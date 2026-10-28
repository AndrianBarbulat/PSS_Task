import React, { useMemo } from 'react';
import assessment from '../data/assessment.json';
import { calculatePSG } from '../lib/calculatePSG.js';
import { buildLeadershipBrief } from '../lib/leadership.js';
import './LeadershipBrief.css';

function BriefMetric({ metric }) {
  return <article className={`brief-metric ${metric.tone || ''}`}>
    <span>{metric.label}</span>
    <strong>{metric.display}</strong>
    <p>{metric.note}</p>
  </article>;
}

function Classification({ type }) {
  return <span className={`classification ${type.toLowerCase().replaceAll(' ', '-')}`}>{type}</span>;
}

function StoryStep({ number, label, title, children, className = '' }) {
  return <section className={`brief-story-step ${className}`}>
    <header className="brief-step-heading">
      <span>{number}</span>
      <div><p>{label}</p><h2>{title}</h2></div>
    </header>
    {children}
  </section>;
}

export default function LeadershipBrief() {
  const report = useMemo(() => calculatePSG(assessment), []);
  const brief = useMemo(() => buildLeadershipBrief(report), [report]);
  const { demand, business, capacity, googleAds, bpo, domainDns } = brief.drivers;

  return <article className="leadership-page">
    <header className="leadership-hero">
      <div className="leadership-hero-copy">
        <p className="eyebrow">Part 03 / Five-minute leadership readout</p>
        <h1>Backlog is accelerating. Protect customers today; stabilize Business this week.</h1>
        <p className="lead">{brief.conclusion} The immediate goal is control: named ownership for urgent cases, a tested explanation for the demand increase, and a daily view leadership can trust.</p>
        <p className="brief-meta">Assessment snapshot · {brief.snapshot} · Reporting period {brief.period}</p>
      </div>
      <aside className="hero-decision-card">
        <span>Decision needed today</span>
        <strong>Approve a two-track recovery response.</strong>
        <p>Protect urgent cases now while a cross-functional team isolates and contains the Business increase.</p>
        <div className="brief-tools">
          <button className="button primary" onClick={() => window.print()}>Print brief</button>
          <a className="button" href="#/dashboard">Open evidence</a>
        </div>
      </aside>
    </header>

    <nav className="brief-timing" aria-label="Five-minute presentation path">
      <span><b>0:00</b>Decision</span>
      <span><b>0:40</b>Situation</span>
      <span><b>1:40</b>Diagnosis</span>
      <span><b>2:40</b>Response</span>
      <span><b>4:10</b>Leadership asks</span>
    </nav>

    <StoryStep number="01" label="The situation" title="Demand is pulling away from delivery, while urgent exposure is already visible.">
      <p className="brief-explainer">In the latest week, PSG received <strong>{report.latest.incoming.toLocaleString('en-GB')}</strong> cases and handled <strong>{report.latest.handled.toLocaleString('en-GB')}</strong>. That added <strong>{report.latest.net}</strong> cases in one week. Across the full period, backlog increased by <strong>{report.totalGrowth}</strong>, or <strong>{Math.round(report.growthRate * 1000) / 10}%</strong>.</p>
      <div className="brief-metrics" aria-label="Leadership metrics">
        {brief.metrics.map(metric => <BriefMetric key={metric.label} metric={metric} />)}
      </div>
      <div className="situation-grid">
        <div className="weekly-progression" aria-label="Weekly net backlog additions">
          <div className="mini-heading"><span>Weekly net additions</span><small>Incoming minus handled</small></div>
          {report.weeks.map(week => <div className="week-row" key={week.name}>
            <span>{week.name}</span>
            <i><b style={{ width: `${week.net / report.latest.net * 100}%` }} /></i>
            <strong>+{week.net}</strong>
          </div>)}
        </div>
        <aside className="so-what-card">
          <span>Why this matters</span>
          <h3>This is both a flow problem and a customer-protection problem.</h3>
          <p>The queue is growing faster each week. Separately, the open-case export shows <strong>{report.breached} breached cases</strong>, <strong>{report.due12} due within 12 hours</strong>, and <strong>{report.unassignedBreached} breached cases without an owner</strong>.</p>
          <small>These are risks within the {report.caseCount}-case export, not the SLA rate for the full backlog.</small>
        </aside>
      </div>
    </StoryStep>

    <StoryStep number="02" label="The diagnosis" title="The strongest signal is Business demand; the underlying cause is still a hypothesis.">
      <div className="diagnosis-grid">
        <article>
          <Classification type="Confirmed fact" />
          <h3>Demand growth is outpacing delivery growth</h3>
          <p>Incoming volume increased <strong>{demand.incomingGrowth}%</strong>, compared with <strong>{demand.handledGrowth}%</strong> growth in handled volume. Actual hours moved <strong>{demand.hoursGrowth}%</strong>.</p>
          <p className="implication"><b>So what:</b> faster handling alone has not kept pace with the rate of new work.</p>
        </article>
        <article>
          <Classification type="Supported interpretation" />
          <h3>Business is the first stabilization priority</h3>
          <p>Business produced <strong>{business.periodGrowth} cases</strong>, or <strong>{business.periodShare}%</strong>, of three-week growth and <strong>{business.latestNet}</strong> of the latest week’s <strong>{report.latest.net}</strong> additions.</p>
          <p className="implication"><b>So what:</b> contain Business first, without losing queue-wide urgent-case triage.</p>
        </article>
        <article>
          <Classification type="Supported interpretation" />
          <h3>Recovering capacity helps, but does not solve the gap</h3>
          <p>Restoring <strong>{capacity.missingHours} missing hours</strong> at observed bundle rates could add about <strong>{capacity.potentialHandled} handled cases</strong>, but would still leave roughly <strong>+{capacity.remainingNet}</strong>.</p>
          <p className="implication"><b>So what:</b> leadership needs both capacity recovery and demand reduction.</p>
        </article>
        <article className="hypothesis-card">
          <Classification type="Hypothesis" />
          <h3>Why Business increased is not yet proven</h3>
          <p>The current data cannot distinguish a product incident, escalation-policy change, topic mix, source behaviour, or skills coverage.</p>
          <p className="implication"><b>Next test:</b> break arrivals down by day, topic, source, incident reference and available skills.</p>
        </article>
      </div>
    </StoryStep>

    <StoryStep number="03" label="Where to investigate" title="Use three focused workstreams instead of treating the backlog as one problem.">
      <div className="workstream-grid">
        <article>
          <span className="workstream-number">A</span>
          <div><h3>Business demand</h3><p><strong>{business.latestNet} latest-week additions.</strong> Identify whether the increase is concentrated by day, topic, source, incident, market or skill coverage.</p><small>Outcome: a confirmed driver and containment owner.</small></div>
        </article>
        <article>
          <span className="workstream-number">B</span>
          <div><h3>Google Ads ageing</h3><p><strong>{googleAds.breached}/{googleAds.cases} cases breached</strong>, with a median age of <strong>{googleAds.medianAge} hours</strong>. Group by symptom and blocker before claiming a shared defect.</p><small>Outcome: next step, workaround, incident or waiting reason for every case.</small></div>
        </article>
        <article>
          <span className="workstream-number">C</span>
          <div><h3>Escalation quality and ownership</h3><p><strong>{bpo.reviewable}/{bpo.cases} BPO cases</strong> have reviewable reasons; <strong>{domainDns.threePlus}/{domainDns.cases} DNS cases</strong> have 3+ handovers. Sample the notes for concrete metrics, dates and reproduction evidence.</p><small>Outcome: confirmed guidance, coaching, routing or product actions—not assumptions.</small></div>
        </article>
      </div>
    </StoryStep>

    <StoryStep number="04" label="The response" title="Move from triage to containment, then close the evidence gaps." className="response-step">
      <div className="action-timeline">
        {brief.actions.map((row, index) => <article key={`${row.timing}-${row.action}`}>
          <div className="action-marker"><span>{index + 1}</span><i /></div>
          <div className="action-time">{row.timing}</div>
          <div className="action-copy"><h3>{row.action}</h3><p><b>Owner:</b> {row.owner}</p><p><b>Done when:</b> {row.measure}</p></div>
        </article>)}
      </div>
    </StoryStep>

    <StoryStep number="05" label="Leadership asks" title="Three decisions will turn the analysis into an operating response." className="asks-step">
      <div className="leadership-asks">
        {brief.leadershipAsks.map((item, index) => <article key={item}><span>Ask {index + 1}</span><p>{item}</p></article>)}
      </div>
      <div className="success-panel">
        <div><p className="section-label">How I would report progress</p><h3>Control first; root cause second.</h3><p>Leadership should see a short daily update comparing incoming, handled and net movement; urgent ownership; Business containment progress; and any change in the evidence.</p></div>
        <ul>{brief.successMeasures.map(item => <li key={item.label}><strong>{item.label}</strong><span>{item.measure}</span></li>)}</ul>
      </div>
    </StoryStep>

    <details className="brief-appendix">
      <summary>Evidence boundary and analytical caveats</summary>
      <div className="brief-appendix-content">
        <div className="evidence-grid">{brief.evidence.map(item => <article key={item.type}><Classification type={item.type} /><p>{item.text}</p></article>)}</div>
        <div className="scope-warning"><strong>Do not combine the populations.</strong><span>The weekly report closes at {report.latest.closing.toLocaleString('en-GB')} cases; the open-case export contains {report.caseCount}. Use weekly data for queue movement and case data for identifiable risks until scope and cut-offs reconcile.</span></div>
      </div>
    </details>

    <footer className="brief-source">Prepared from the fictional assessment workbook. Calculations use the same tested engine as Parts 1 and 2. Internal research informed the communication structure only; no Slack content, real customer data or operational claim is published here.</footer>
  </article>;
}
