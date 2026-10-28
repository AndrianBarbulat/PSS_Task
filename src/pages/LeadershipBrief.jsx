import React, { useMemo } from 'react';
import assessment from '../data/assessment.json';
import { calculatePSG } from '../lib/calculatePSG.js';
import { buildLeadershipBrief } from '../lib/leadership.js';
import './LeadershipBrief.css';

function BriefMetric({ metric }) {
  return <div className={`brief-metric ${metric.tone || ''}`}><span>{metric.label}</span><strong>{metric.display}</strong><small>{metric.note}</small></div>;
}

function Classification({ type }) {
  return <span className={`classification ${type.toLowerCase().replaceAll(' ', '-')}`}>{type}</span>;
}

export default function LeadershipBrief() {
  const report = useMemo(() => calculatePSG(assessment), []);
  const brief = useMemo(() => buildLeadershipBrief(report), [report]);
  const { demand, business, capacity, googleAds, bpo, domainDns } = brief.drivers;

  return <article className="leadership-page">
    <header className="leadership-hero">
      <div>
        <p className="eyebrow">Part 03 / Turn findings into action</p>
        <h1>Stabilize growth. Protect urgent cases.</h1>
        <p className="lead">{brief.conclusion}</p>
        <p className="brief-meta">Leadership readout · {brief.snapshot} · Operating period {brief.period}</p>
      </div>
      <div className="brief-tools">
        <button className="button primary" onClick={() => window.print()}>Print leadership brief</button>
        <a className="button" href="#/dashboard">Open supporting dashboard</a>
      </div>
    </header>

    <nav className="brief-timing" aria-label="Five-minute presentation path">
      <span><b>0:00</b> Decision</span><span><b>0:45</b> Scale</span><span><b>1:30</b> Drivers</span><span><b>2:30</b> Risks</span><span><b>3:15</b> Actions</span><span><b>4:30</b> Asks</span>
    </nav>

    <section className="leadership-decision">
      <div>
        <p className="section-label">Decision statement</p>
        <h2>Treat this as two connected problems.</h2>
        <p><strong>Queue stabilization:</strong> incoming work is growing faster than handled volume, led by Business. <strong>Customer protection:</strong> urgent SLA exposure is concentrated across the queue and cannot wait for the growth diagnosis.</p>
      </div>
      <aside>
        <p className="section-label">What I need from leadership today</p>
        <ol>{brief.leadershipAsks.map(item => <li key={item}>{item}</li>)}</ol>
      </aside>
    </section>

    <section className="brief-metrics" aria-label="Leadership metrics">
      {brief.metrics.map(metric => <BriefMetric key={metric.label} metric={metric} />)}
    </section>

    <section className="leadership-section">
      <header><p className="section-label">What is happening</p><h2>Backlog growth accelerated in each reported week.</h2></header>
      <div className="leadership-two-col">
        <div className="brief-narrative">
          <p>Weekly net additions increased from <strong>+{report.first.net}</strong> to <strong>+{report.weeks[1].net}</strong> and then <strong>+{report.latest.net}</strong>. The backlog closed at <strong>{report.latest.closing.toLocaleString('en-GB')}</strong>, up <strong>{report.totalGrowth}</strong> from the opening balance.</p>
          <p>Within the separate {report.caseCount}-case export, <strong>{report.breached} are breached</strong>, <strong>{report.due12} more are due within 12 hours</strong>, and <strong>{report.unassignedBreached} breached cases are unassigned</strong>. This is immediate triage evidence, not the SLA rate for the full backlog.</p>
        </div>
        <div className="weekly-progression" aria-label="Weekly net backlog additions">
          {report.weeks.map(week => <div key={week.name}><span>{week.name}</span><i><b style={{ width: `${week.net / report.latest.net * 100}%` }} /></i><strong>+{week.net}</strong></div>)}
        </div>
      </div>
    </section>

    <section className="leadership-section">
      <header><p className="section-label">What is driving it</p><h2>Demand growth explains the movement; root causes still need testing.</h2></header>
      <div className="driver-evidence-grid">
        <article><Classification type="Confirmed fact" /><h3>Demand outpaced delivery</h3><p>Incoming volume increased <strong>{demand.incomingGrowth}%</strong>; handled volume increased <strong>{demand.handledGrowth}%</strong>; actual hours decreased <strong>{Math.abs(demand.hoursGrowth)}%</strong>.</p></article>
        <article><Classification type="Supported interpretation" /><h3>Business is the first stabilization priority</h3><p>Business produced <strong>{business.periodGrowth} of {report.totalGrowth}</strong> three-week growth and <strong>{business.latestNet} of {report.latest.net}</strong> latest-week additions.</p></article>
        <article><Classification type="Confirmed fact" /><h3>Capacity recovery helps, but does not close the gap</h3><p>Restoring {capacity.missingHours} missing hours at observed bundle rates adds about <strong>{capacity.potentialHandled}</strong> handled cases, leaving roughly <strong>+{capacity.remainingNet}</strong>.</p></article>
        <article><Classification type="Hypothesis" /><h3>The underlying Business cause is unknown</h3><p>Test incidents, topic mix, source behavior, escalation policy and skills coverage before prescribing a permanent response.</p></article>
      </div>
    </section>

    <section className="leadership-section">
      <header><p className="section-label">Where risk concentrates</p><h2>Use targeted investigations, not broad assumptions.</h2></header>
      <div className="risk-strips">
        <article><strong>{googleAds.breached}/{googleAds.cases}</strong><div><h3>Google Ads cases breached</h3><p>Median age is {googleAds.medianAge} hours. Group by symptom and blocker before claiming a single product defect.</p></div></article>
        <article><strong>{bpo.reviewable}/{bpo.cases}</strong><div><h3>BPO cases have reviewable reasons</h3><p>Missing Troubleshooting, Wrong Topic or Knowledge Gap are audit candidates, not proof of unnecessary escalation.</p></div></article>
        <article><strong>{domainDns.threePlus}/{domainDns.cases}</strong><div><h3>Domain DNS cases have 3+ handovers</h3><p>{domainDns.breached} are breached. Review ownership history; the export does not establish that handovers caused delay.</p></div></article>
      </div>
    </section>

    <section className="leadership-section action-section">
      <header><p className="section-label">What happens next</p><h2>Five actions, ordered by operational urgency.</h2></header>
      <div className="leadership-table-wrap"><table className="leadership-actions"><thead><tr><th>When</th><th>Action</th><th>Proposed owner</th><th>How I would measure it</th></tr></thead><tbody>{brief.actions.map(row => <tr key={`${row.timing}-${row.action}`}><td>{row.timing}</td><th scope="row">{row.action}</th><td>{row.owner}</td><td>{row.measure}</td></tr>)}</tbody></table></div>
    </section>

    <section className="leadership-section">
      <header><p className="section-label">How we know it is working</p><h2>Measure control, not activity volume.</h2></header>
      <div className="success-grid">{brief.successMeasures.map(item => <article key={item.label}><h3>{item.label}</h3><p>{item.measure}</p></article>)}</div>
    </section>

    <section className="leadership-section evidence-section">
      <header><p className="section-label">Evidence boundary</p><h2>What the data proves—and what it does not.</h2></header>
      <div className="evidence-grid">{brief.evidence.map(item => <article key={item.type}><Classification type={item.type} /><p>{item.text}</p></article>)}</div>
      <div className="scope-warning"><strong>Do not combine the populations.</strong><span>The weekly report closes at {report.latest.closing.toLocaleString('en-GB')} cases; the case export contains {report.caseCount}. Use weekly data for queue movement and case data for identifiable risks until scope and cut-offs reconcile.</span></div>
    </section>

    <footer className="brief-source">Prepared from the fictional assessment workbook. Headline calculations are generated by the same tested engine used in Parts 1 and 2. Recommendations are proposed actions; no stakeholder contact or operational change is implied.</footer>
  </article>;
}
