import React, { useRef } from 'react';
import { report as d, capacity, number as n, percent as pct, source } from '../data/report.js';

const sections = [
  ['diagnosis', 'What changed'],
  ['risk', 'Immediate risk'],
  ['drivers', 'What to investigate'],
  ['actions', 'Recommended actions'],
  ['confidence', 'Confidence and gaps'],
];

const business = d.bundles.find(bundle => bundle.bundle === 'Business');
const ads = d.topics.find(topic => topic.name === 'Google Ads w/ Wix');
const dns = d.topics.find(topic => topic.name === 'Domain DNS');
const bug = d.reasons.find(reason => reason.name === 'Bug');
const discoverability = d.reasons.find(reason => reason.name === 'Discoverability');
const bpo = d.sources.find(item => item.name === 'BPO');
const internal = d.sources.find(item => item.name === 'Internal');
const adsBugCount = d.cases.filter(item => item.topic === 'Google Ads w/ Wix' && item.reason === 'Bug').length;

function Table({ caption, headings, rows, text = false }) {
  return <div className="table-scroll" tabIndex="0" role="region" aria-label={caption}>
    <table className={text ? 'text-table' : ''}>
      <caption>{caption}</caption>
      <thead><tr>{headings.map(heading => <th key={heading} scope="col">{heading}</th>)}</tr></thead>
      <tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => cellIndex === 0
        ? <th scope="row" key={cellIndex}>{cell}</th>
        : <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody>
    </table>
  </div>;
}

function Section({ id, number, title, children }) {
  return <section id={id} tabIndex="-1" className="report-section">
    <p className="eyebrow">{number}</p>
    <h2>{title}</h2>
    {children}
  </section>;
}

function Finding({ label, title, children }) {
  return <article className="finding-card">
    <span>{label}</span>
    <h3>{title}</h3>
    <p>{children}</p>
  </article>;
}

export default function Analysis() {
  const article = useRef(null);
  const jump = id => {
    const section = document.getElementById(id);
    section.focus({ preventScroll: true });
    section.scrollIntoView({ behavior: 'auto', block: 'start' });
  };

  return <article ref={article} className="report">
    <div className="hero">
      <p className="eyebrow">Part 01 / Diagnose the operation</p>
      <h1>Incoming work is rising faster than PSG can handle it.</h1>
      <p className="lead">My first priority would be the urgent cases. The operational investigation should then focus on the Business bundle, which explains most of the measured backlog growth, while Google Ads needs a separate case review.</p>
      <p className="reading">{source.snapshot} · Six-minute read</p>
      <div className="tools"><button className="button primary" onClick={() => window.print()}>Print analysis <span aria-hidden="true">↗</span></button></div>
    </div>

    <div className="metrics" aria-label="Key findings with separate population labels">
      <div><span className="metric-label">Weekly report · three-week backlog change</span><strong>+{n(d.totalGrowth)}</strong><span>+{pct(d.growthRate)} from the opening level</span></div>
      <div><span className="metric-label">Weekly report · latest weekly addition</span><strong>+{n(d.latest.net)}</strong><span>{n(d.latest.incoming)} incoming versus {n(d.latest.handled)} handled</span></div>
      <div><span className="metric-label">Open-case export · P1 exposure</span><strong>12 <em>of 15</em></strong><span>already beyond the 12-hour target</span></div>
    </div>

    <aside className="scope-note">
      <strong>Do not combine the two populations.</strong>
      <p>The weekly report closes at {n(d.latest.closing)} cases. The open-case export contains {d.caseCount} cases at a different cut-off. Weekly data explains queue movement; the export identifies cases and concentrations to investigate.</p>
    </aside>

    <nav className="toc" aria-label="Queue analysis sections">
      {sections.map(([id, label]) => <button key={id} onClick={() => jump(id)}>{label}</button>)}
    </nav>

    <Section id="diagnosis" number="01 / What changed" title="Demand growth is the clearest measured driver.">
      <p>Weekly net additions accelerated from <strong>+50</strong> to <strong>+140</strong> and then <strong>+420</strong>. Across the period, incoming volume rose {pct(d.incomingGrowth)}, handled volume rose {pct(d.handledGrowth)}, and actual PSS hours fell {pct(-d.hoursGrowth)}. The operation therefore faced more work while its available hours declined.</p>

      <figure className="growth-chart">
        <figcaption>Net cases added to the weekly backlog</figcaption>
        {d.weeks.map((week, index) => <div className="bar-row" key={week.name}>
          <span>{['14–20 Sep', '21–27 Sep', '28 Sep–4 Oct'][index]}</span>
          <div className="bar-track"><div className="bar-fill" style={{ width: `${week.net / d.latest.net * 100}%` }} /></div>
          <strong>+{week.net}</strong>
        </div>)}
      </figure>

      <Table
        caption="Weekly traffic and backlog"
        headings={['Week', 'Incoming', 'Handled', 'Net addition', 'Closing backlog', 'Actual hours']}
        rows={d.weeks.map(week => [week.name, n(week.incoming), n(week.handled), `+${week.net}`, n(week.closing), n(week.actual)])}
      />

      <p><strong>Business is the first stabilization priority.</strong> It contributed {business.growth} of the {d.totalGrowth} cases added across the period ({pct(business.growth / d.totalGrowth)}). In the latest week alone, Business received {business.incoming}, handled {business.handled}, and added {business.latestNet} cases. P&amp;P was the next-largest contributor at +135.</p>

      <Table
        caption="Backlog growth by bundle"
        headings={['Bundle', 'Opening', 'Closing', 'Three-week growth', 'Share of growth']}
        rows={d.bundles.map(bundle => [bundle.bundle, bundle.opening, bundle.closing, `+${bundle.growth}`, pct(bundle.growth / d.totalGrowth)])}
      />

      <div className="conclusion-strip">
        <strong>Capacity recovery helps, but it does not close the gap.</strong>
        <p>The latest week was 295 hours below schedule. If all those hours were restored and produced at each bundle’s observed handled-per-hour rate, the sensitivity adds about {Math.round(capacity.extraHandled)} handled cases. The queue would still grow by about {Math.round(capacity.scenarioNet)} cases. This is an illustration, not a staffing forecast.</p>
      </div>
      <p className="source">Source: Traffic &amp; Capacity A1:H19.</p>
    </Section>

    <Section id="risk" number="02 / Immediate risk" title="Protect the urgent cases before starting broader recovery work.">
      <p>Within the {d.caseCount}-case export, <strong>{d.breached} cases are beyond their age-based SLA target ({pct(d.breached / d.caseCount)})</strong>. Another {d.due12} are due now or within 12 hours, including {d.due4} within four hours. These figures describe the export, not the full weekly backlog or an overall SLA-attainment rate.</p>

      <Table
        caption="SLA exposure in the open-case export"
        headings={['Priority / target', 'Open', 'Breached', 'Breach share']}
        rows={d.priorities.map(priority => [`${priority.name} / ${{ P1: 12, P2: 48, 'Non-P': 72 }[priority.name]} hours`, priority.n, priority.breached, pct(priority.breachRate)])}
      />

      <div className="finding-grid three">
        <Finding label="Ownership" title={`${d.unassigned} unassigned cases`}>{d.unassignedBreached} are already breached. Each needs a named person responsible for the next action, not only a team queue.</Finding>
        <Finding label="Ageing" title={`${d.stale24} cases without a recent action`}>They have no recorded action for at least 24 hours. Waiting reasons must be checked before interpreting this as inactivity.</Finding>
        <Finding label="Topic concentration" title={`${ads.breached} of ${ads.n} Google Ads cases breached`}>Median age is {ads.medianAge} hours and {adsBugCount} are labelled Bug. Review shared symptoms and blockers before claiming one defect.</Finding>
      </div>

      <p>I would review all 15 P1 cases first, then the unassigned breached cases, cases approaching their target, and the remaining aged work. Confirmed customer impact or a shared live incident may change this order.</p>
      <p className="source">Source: Open Cases A1:N341; SLA Targets A1:C4.</p>
    </Section>

    <Section id="drivers" number="03 / What to investigate" title="The file points to four investigation tracks, not four proven causes.">
      <div className="finding-grid">
        <Finding label="Measured driver" title="Business demand">Business produced {pct(business.growth / d.totalGrowth)} of period growth and {pct(business.latestNet / d.latest.net)} of the latest weekly addition. Daily topic and source data is needed to explain why.</Finding>
        <Finding label="Escalation quality" title={`${d.reviewable} reviewable reason labels`}>Missing Troubleshooting, Wrong Topic and Knowledge Gap appear on {pct(d.reviewable / d.caseCount)} of exported cases. This identifies a review sample, not proven unnecessary escalations.</Finding>
        <Finding label="Routing and handovers" title="Domain DNS ownership path">Domain DNS has {dns.n} cases; {dns.breached} are breached and {dns.threePlus} have at least three handovers. Review event histories for duplicated work and unclear ownership.</Finding>
        <Finding label="Potential product issues" title={`${bug.n} cases labelled Bug`}>A Bug label is not reproduction evidence. Group cases by symptom, flow, timing, configuration and incident reference before involving Product or opening an incident.</Finding>
      </div>

      <p>BPO ({bpo.n}) and Internal ({internal.n}) are the largest recorded sources. However, these are sources of cases still open at the snapshot, not a breakdown of all incoming traffic. Older cases are more likely to remain in the export, and 36 source values are missing.</p>

      <div className="analysis-table-grid">
        <Table
          caption="Sources of currently open cases"
          headings={['Source', 'Cases', 'Share', 'Reviewable reasons']}
          rows={d.sources.map(item => [item.name, item.n, pct(item.n / d.caseCount), item.reviewable])}
        />
        <Table
          caption="Recorded escalation reasons"
          headings={['Reason', 'Cases', 'Breached', 'Breach share']}
          rows={d.reasons.map(item => [item.name, item.n, item.breached, pct(item.breachRate)])}
        />
      </div>

      <p><strong>Two secondary signals are worth checking:</strong> {discoverability.breached} of {discoverability.n} Discoverability cases are breached, and cases with three or more handovers have a {pct(d.handovers.highRate)} breach share versus {pct(d.handovers.lowRate)} for other cases. Neither comparison proves causation.</p>
      <p className="source">Source: Open Cases A1:N341; Topic Mapping A1:B100.</p>
    </Section>

    <Section id="actions" number="04 / Recommended actions" title="Use a daily control loop while the root-cause work continues.">
      <Table text
        caption="Recommended sequence"
        headings={['Timing and action', 'Proposed owner', 'Done when']}
        rows={[
          ['Now: review every P1, unassigned breach and near-term deadline.', 'PSG duty lead and bundle leads.', 'Each case has a named owner, next technical action and customer update.'],
          ['Today: reconcile the weekly report and open-case export.', 'Analyst and reporting owner.', 'Cut-off, scope, status filters and the definition of Handled are agreed.'],
          ['Today and daily: publish opening backlog, incoming, handled, net change and SLA risk by bundle.', 'Analyst, workforce planning and bundle leads.', 'Leadership can see whether containment is working and where coverage is needed.'],
          ['Within 48 hours: investigate Business demand and review Google Ads ageing.', 'Business lead and Google Ads topic lead; Product/QA only where evidence supports it.', 'A confirmed driver, containment action and next step for every aged Google Ads case.'],
          ['This week: sample BPO reviewable cases and Domain DNS handovers.', 'Delivery, QA, P&P, and knowledge or training owners.', 'Specific coaching, guidance, access or routing changes are agreed and measured.'],
        ]}
      />

      <p>Temporary extra hours or qualified cross-team help may protect SLA while the cause is investigated, but the skill match and effect on the donating queue must be checked. A war room is appropriate only if cases share a reproducible live issue or monitoring shows broad platform impact. Backlog size alone is not evidence of an incident.</p>
    </Section>

    <Section id="confidence" number="05 / Confidence and gaps" title="The operational pressure is proven. The root causes are still hypotheses.">
      <div className="confidence-grid">
        <article>
          <h3>What I can conclude</h3>
          <ul>
            <li>The weekly backlog increased by {d.totalGrowth} cases ({pct(d.growthRate)}).</li>
            <li>Business is the largest measured contributor to growth.</li>
            <li>The exported P1, near-SLA and unassigned breached cases need immediate review.</li>
            <li>Actual hours fell, but restoring the observed gap alone would not stop backlog growth.</li>
            <li>The workbook’s flow arithmetic, age calculations, SLA flags and current topic mappings reconcile.</li>
          </ul>
        </article>
        <article>
          <h3>What I cannot conclude</h3>
          <ul>
            <li>That BPO is over-escalating or that all reviewable labels are avoidable.</li>
            <li>That handovers caused SLA breaches.</li>
            <li>That Bug labels or Google Ads ageing represent one Wix platform defect.</li>
            <li>That one staffing increase would resolve the queue sustainably.</li>
            <li>That case-export percentages represent the full {n(d.latest.closing)}-case weekly backlog.</li>
          </ul>
        </article>
      </div>

      <h3 className="analysis-subheading">Information needed for stronger conclusions</h3>
      <ul className="request-list">
        <li>An aligned case export and weekly report using the same cut-off, scope and status rules.</li>
        <li>Daily incoming and handled volume by bundle, topic and source, plus closed cases and reopens.</li>
        <li>Case event histories, waiting reasons, owner changes and time spent between handovers.</li>
        <li>Delivery contact volume so escalation rates can be compared, not only case counts.</li>
        <li>Incident, release and reproduction evidence for suspected product issues.</li>
        <li>Timezone, business-hours calendar, SLA pause rules and productive-capacity assumptions.</li>
      </ul>

      <div className="data-quality-note">
        <h3>Data-quality notes</h3>
        <ul>
          <li>{d.checks.missingSource} cases have no recorded source and remain classified as Unknown.</li>
          <li>CASE-920080 has a Last Action timestamp before its Created On timestamp.</li>
          <li>The export contains 26 cases created on October 5, after the final weekly period ended.</li>
          <li>A case exactly at its SLA target is due now, not breached; an inclusive rule would count 110 rather than 109 breaches.</li>
          <li>The {d.caseCount}-case export and {n(d.latest.closing)}-case weekly backlog remain unreconciled.</li>
        </ul>
      </div>

      <p className="source">All five workbook tabs reviewed. Assessment workbook: {source.filename}. The attached copy contains the same underlying worksheet data used by this analysis.</p>
    </Section>
  </article>;
}
