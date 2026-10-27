import React, { useEffect, useRef, useState } from 'react';
import { report as d, capacity, number as n, percent as pct, source } from '../data/report.js';

const sections = [['growth', 'Backlog growth'], ['risk', 'SLA risk'], ['drivers', 'Sources & causes'], ['actions', 'Priorities'], ['limits', 'What is still missing'], ['method', 'Evidence & method']];
const business = d.bundles.find(b => b.bundle === 'Business');
const ads = d.topics.find(t => t.name === 'Google Ads w/ Wix');
const dns = d.topics.find(t => t.name === 'Domain DNS');
const sourceCount = name => d.sources.find(s => s.name === name);
const examples = ['CASE-920311', 'CASE-920052', 'CASE-920330', 'CASE-920023', 'CASE-920044', 'CASE-920098'].map(id => d.cases.find(c => c.id === id));

function Table({ caption, headings, rows, text = false }) {
  return <div className="table-scroll" tabIndex="0" role="region" aria-label={caption}><table className={text ? 'text-table' : ''}>
    <caption>{caption}</caption><thead><tr>{headings.map(h => <th key={h} scope="col">{h}</th>)}</tr></thead>
    <tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => j === 0 ? <th scope="row" key={j}>{cell}</th> : <td key={j}>{cell}</td>)}</tr>)}</tbody>
  </table></div>;
}
function Detail({ title, children }) { return <details><summary>{title}</summary><div className="detail-content">{children}</div></details>; }
function Evidence({ children }) { return <p className="source">Source: {children}</p>; }
function Section({ id, number, title, children }) { return <section id={id} tabIndex="-1" className="report-section"><p className="eyebrow">{number}</p><h2>{title}</h2>{children}</section>; }

function Capacity() {
  const [restore, setRestore] = useState(100);
  const extra = capacity.extraHandled * restore / 100;
  return <div className="capacity">
    <label htmlFor="restore-hours">Restore <strong>{restore}%</strong> of the latest week’s missing hours</label>
    <input id="restore-hours" type="range" min="0" max="100" step="25" value={restore} onChange={e => setRestore(Number(e.target.value))} />
    <div className="scenario-results" aria-live="polite"><div><output data-testid="extra-handled">{extra.toFixed(1)}</output><span>illustrative additional handled</span></div><div><output data-testid="remaining-net">{(d.latest.net - extra).toFixed(1)}</output><span>remaining weekly net additions</span></div></div>
    <p className="small">Sensitivity only, not a forecast. Assumes recovered hours are productive at the same bundle-level rate, with unchanged demand, case mix and quality. This estimates the weekly gap, not a backlog clearance date.</p>
  </div>;
}

export default function Analysis() {
  const article = useRef(null);
  const [allOpen, setAllOpen] = useState(false);
  const [minutes, setMinutes] = useState(6);
  useEffect(() => {
    const root = article.current;
    const copy = root.cloneNode(true);
    copy.querySelectorAll('details,.source,.tools,.toc,.reading,.eyebrow').forEach(e => e.remove());
    setMinutes(Math.ceil(copy.textContent.trim().split(/\s+/).length / 220));
    let prior = [];
    const before = () => { const details = [...root.querySelectorAll('details')]; prior = details.map(e => e.open); details.forEach(e => { e.open = true; }); };
    const after = () => { root.querySelectorAll('details').forEach((e, i) => { e.open = prior[i] ?? false; }); };
    const sync = () => setAllOpen([...root.querySelectorAll('details')].every(e => e.open));
    root.addEventListener('toggle', sync, true);
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => { root.removeEventListener('toggle', sync, true); window.removeEventListener('beforeprint', before); window.removeEventListener('afterprint', after); };
  }, []);
  const expand = () => { article.current.querySelectorAll('details').forEach(e => { e.open = !allOpen; }); setAllOpen(!allOpen); };
  const jump = id => { const section = document.getElementById(id); section.focus({ preventScroll: true }); section.scrollIntoView({ behavior: 'auto', block: 'start' }); };
  return <article ref={article} className="report">
    <div className="hero">
      <p className="eyebrow">Part 01 / Diagnose the operation</p>
      <h1>The queue is growing faster than PSG can work through it.</h1>
      <p className="lead">I would protect the urgent cases first, then focus the backlog investigation on Business. It explains most of the growth. Google Ads needs a separate review of its ageing cases.</p>
      <p className="reading">{source.snapshot} · About {minutes} minutes, plus supporting detail</p>
      <div className="tools"><button className="button primary" onClick={() => window.print()}>Print with evidence <span aria-hidden="true">↗</span></button><button className="button" onClick={expand} aria-expanded={allOpen}>{allOpen ? 'Collapse evidence' : 'Expand evidence'}</button></div>
    </div>

    <div className="metrics" aria-label="Key findings with separate population labels">
      <div><span className="metric-label">Weekly report · three-week change</span><strong>+{n(d.totalGrowth)}</strong><span>backlog cases · +{pct(d.growthRate)}</span></div>
      <div><span className="metric-label">Weekly report · Business contribution</span><strong>{pct(business.growth / d.totalGrowth)}</strong><span>of the total backlog increase</span></div>
      <div><span className="metric-label">Case export · P1s only</span><strong>12 <em>of 15</em></strong><span>already beyond their SLA target</span></div>
    </div>
    <aside className="scope-note"><strong>Two reports. Different populations.</strong><p>The weekly report closes at {n(d.latest.closing)} cases; the open-case export contains {d.caseCount}, at a different cut-off. I would reconcile scope, filters and dates before applying any case-level percentage to the full queue.</p></aside>
    <nav className="toc" aria-label="Queue analysis sections">{sections.map(([id, label]) => <button key={id} onClick={() => jump(id)}>{label}</button>)}</nav>

    <Section id="growth" number="01 / What changed" title="The weekly gap is widening.">
      <p>The backlog increased from {n(d.first.opening)} to {n(d.latest.closing)} across three weeks. Incoming work grew by {pct(d.incomingGrowth)}, while handled volume rose by only {pct(d.handledGrowth)}. The team handled the equivalent of 98 cases per 100 arriving in the first week, falling to 85 in the last. This compares workload and throughput, not same-week resolution rates.</p>
      <figure className="growth-chart"><figcaption>Cases added to the backlog each week</figcaption>{d.weeks.map((week, i) => <div className="bar-row" key={week.name}><span>{['14–20 Sep', '21–27 Sep', '28 Sep–4 Oct'][i]}</span><div className="bar-track"><div className="bar-fill" style={{ width: `${week.net / d.latest.net * 100}%` }} /></div><strong>+{week.net}</strong></div>)}</figure>
      <p><strong>Business is the main growth driver:</strong> {business.growth} of the {d.totalGrowth} additional cases. In the latest week it received {business.incoming} and handled {business.handled}, adding {business.latestNet}. P&amp;P is next, contributing 135 cases over three weeks. Daily arrivals by topic would help explain whether demand, routing, complexity or a product issue changed.</p>
      <p>Actual hours fell {pct(-d.hoursGrowth)}, while scheduled hours stayed unchanged. Restoring all {d.latest.gap} missing hours at each bundle’s latest throughput would add about {Math.round(capacity.extraHandled)} handled cases, still leaving {Math.round(capacity.scenarioNet)} net additions. Capacity matters, but this scenario does not close the gap. Handled cases per actual hour increased, so the data does not show falling throughput per hour.</p>
      <Detail title="Weekly totals and each bundle’s contribution">
        <Table caption="Weekly traffic and backlog" headings={['Week', 'Incoming', 'Handled', 'Net additions', 'Closing backlog']} rows={d.weeks.map(w => [w.name, n(w.incoming), n(w.handled), `+${w.net}`, n(w.closing)])} />
        <Table caption="Three-week growth by bundle" headings={['Bundle', 'Opening', 'Closing', 'Growth', 'Share of growth']} rows={d.bundles.map(b => [b.bundle, b.opening, b.closing, `+${b.growth}`, pct(b.growth / d.totalGrowth)])} />
        <p>Scheduled hours were 3,820 each week. Actual hours were 3,660, 3,605 and 3,525. Missing hours therefore rose from 160 to 295. I would ask workforce planning about absence, training, projects and specialist coverage before interpreting the shortfall.</p>
        <p>Business arrivals rose from 590 to 820 between the final two weeks, explaining 230 of the operation’s 360 extra arrivals. Essentials being close to balance does not establish spare capacity to transfer.</p>
      </Detail>
      <Detail title="Test the capacity assumption"><Capacity /><p>Formula: add up missing hours × handled / actual hours separately for each bundle. Business’s 60 missing hours imply roughly 44 additional handled cases, against its 265-case gap. This is not a causal estimate of staffing impact.</p></Detail>
      <Evidence>Traffic &amp; Capacity A1:H19.</Evidence>
    </Section>

    <Section id="risk" number="02 / Immediate exposure" title="Start with the urgent case list.">
      <p>In the export, <strong>{d.breached} of {d.caseCount} cases are breached ({pct(d.breached / d.caseCount)})</strong>. Another {d.due12} are due now or within 12 hours, including {d.due4} within four hours. The 12-hour window is my triage choice, not another SLA. These open-case shares are not overall SLA attainment rates.</p>
      <p>Twelve of the 15 P1s have breached. The other three have only two to four hours left. I would review all 15 immediately, confirm user impact, and agree an individual owner, next technical action and customer update. Team ownership in the export does not establish who is driving the next step.</p>
      <p>There are {d.unassigned} unassigned cases, including {d.unassignedBreached} breached. Another warning is {d.stale24} cases without a recorded action for at least 24 hours. That needs investigation, not an assumption of neglect: they may be waiting on a customer or another team.</p>
      <p><strong>Google Ads w/ Wix has {ads.breached} breaches among {ads.n} open cases</strong>, with a median age of {ads.medianAge} hours. I would review all 21 for shared blockers. Twelve are labelled Bug, but a common defect still needs reproduction evidence. Delays may block selling, payments, domains or advertising; the file does not quantify lost revenue or actual user impact.</p>
      <Detail title="Priority breakdown and cases to bring to triage">
        <Table caption="Age-based SLA exposure in the 340-case export" headings={['Priority / target', 'Open', 'Breached', 'Breach share']} rows={d.priorities.map(p => [`${p.name} / ${{ P1: 12, P2: 48, 'Non-P': 72 }[p.name]} hours`, p.n, p.breached, pct(p.breachRate)])} />
        <Table text caption="Selected case examples; not the complete triage list" headings={['Case / Open Cases row', 'Topic', 'Priority', 'Position at snapshot']} rows={examples.map(c => [`${c.id} / row ${c.row}`, c.topic, c.priority, `${c.unassigned ? 'Unassigned; ' : ''}${Math.abs(c.remaining)} hours ${c.remaining >= 0 ? 'remaining' : 'overdue'}`])} />
        <p>Start with all P1s and the six unassigned breached cases, then approaching deadlines and other aged cases. Confirmed impact or a shared incident may change the order. An owner assignment or customer update does not reset the age-based SLA.</p>
        <p>Google Ads accounts for 20 of Promote’s 25 breaches. Seventeen of its 21 cases have no recorded action for at least 24 hours. Across the full export, 33 cases have no action for at least 48 hours. Check waiting reasons before judging inactivity.</p>
      </Detail>
      <Evidence>Open Cases A1:N341; SLA Targets A1:C4; Data Notes A1:B11.</Evidence>
    </Section>

    <Section id="drivers" number="03 / Where work comes from" title="The labels suggest where to investigate.">
      <p>BPO ({sourceCount('BPO').n}) and Internal ({sourceCount('Internal').n}) are the largest recorded sources, followed by Priority (52), QA (31) and Unknown (36). “Priority” here is a source, not case urgency. This is the origin of <strong>currently open cases</strong>, not all incoming traffic. Longer-lived cases are more likely to remain in this snapshot, and weekly arrivals have no source breakdown.</p>
      <p>Missing Troubleshooting, Wrong Topic and Knowledge Gap account for {d.reviewable} cases ({pct(d.reviewable / d.caseCount)}). Those reasons appear in 64/116 BPO cases versus 31/105 Internal cases. I would ask Delivery and QA to compare similar topics and priorities, checking guidance, access and completed troubleshooting. These are candidates for review, not {d.reviewable} proven unnecessary escalations.</p>
      <p>Domain DNS has {dns.n} cases, {dns.breached} breached and {dns.threePlus} with at least three handovers. I would trace ownership and repeated work. Across the export, breach shares are {pct(d.handovers.highRate)} with three-plus handovers versus {pct(d.handovers.lowRate)} otherwise: weak evidence of association, not causation. All current topic-to-bundle mappings agree, but earlier routing could still have been wrong.</p>
      <p>Bug is the largest single reason: 106 cases. I would group symptoms and check reproducible behaviour, configuration, custom code and incident timing before approaching Product/QA with a defect claim. The file does not establish why Business demand increased or whether one shared issue explains Google Ads ageing.</p>
      <Detail title="Source mix, reason labels and how I would test the hypotheses">
        <Table caption="Sources of open cases, not source-level escalation rates" headings={['Source', 'Open cases', 'Share of export']} rows={d.sources.map(s => [s.name, s.n, pct(s.n / d.caseCount)])} />
        <Table caption="Recorded escalation reasons" headings={['Reason', 'Cases', 'Share of export']} rows={d.reasons.map(r => [r.name, r.n, pct(r.n / d.caseCount)])} />
        <ul><li><strong>Demand or product issue:</strong> compare daily topic arrivals with shared symptoms and release/incident timing. Reproduce before attributing growth to a defect.</li><li><strong>Preventable escalation:</strong> compare matched cases, guidance available at the time and required permissions. Skipped steps suggest coaching; missing guidance or access suggests a process change.</li><li><strong>DNS routing delay:</strong> inspect timestamps between handovers and duplicated troubleshooting. Required specialist transfers may be appropriate.</li></ul>
        <p>Domain DNS has 16 cases with the three reviewable reason labels. Missing sources stay Unknown; I would not infer source from location. Overall contact volumes are needed before comparing escalation rates across Delivery groups.</p>
      </Detail>
      <Evidence>Open Cases A1:N341; Topic Mapping A1:B100.</Evidence>
    </Section>

    <Section id="actions" number="04 / What I would do" title="Recover urgent cases, then reduce the repeat pressure.">
      <p>I would start case recovery without waiting for perfect reporting. In parallel, I would agree the reporting scope so that staffing and prevention decisions use comparable evidence.</p>
      <Table text caption="Proposed actions, in priority order" headings={['When / action', 'Who I would involve', 'What I would check']} rows={[
        ['Now: review P1s, unassigned breaches and approaching deadlines.', 'PSG duty lead and bundle leads. Agree a named owner, next action and user update.', 'No unassigned breached cases; progress on each P1; fewer new urgent breaches.'],
        ['Monday, in parallel: reconcile the two reports.', 'Analyst and reporting owner. Align filters, statuses, cut-offs and the definition of Handled.', 'The population difference is explained; future reports use agreed definitions.'],
        ['Monday: investigate Business arrivals and effective coverage; review P&P next.', 'Business lead, workforce planning and Analyst. Check topic demand, skills and missing hours.', 'Incoming versus handled, net backlog change, reopens and resolution quality.'],
        ['Monday–Tuesday: review all Google Ads cases for common blockers.', 'Topic lead, with Product/QA if reproduction supports it.', 'Clear next steps, aged cases resolved and fewer repeats after a verified fix.'],
        ['This week: review BPO and DNS cases, then change the specific failing step.', 'Delivery, QA, P&P and knowledge/training owners.', 'Fewer repeat issues and avoidable handovers in comparable cases.'],
      ]} />
      <p>I would find owners through ownership records and escalation guides, bring a short evidence pack and agree a review date. A backlog clearance promise would be premature while arrivals exceed handled volume.</p>
    </Section>

    <Section id="limits" number="05 / Confidence and gaps" title="The pressure is clear. The root causes are not yet proven.">
      <p><strong>I can conclude</strong> that growth accelerated, Business contributed most, actual hours fell and the identified urgent cases need attention. <strong>I cannot conclude</strong> that BPO is over-escalating, handovers caused breaches, one defect caused the surge or a particular staffing increase would solve it.</p>
      <p>Before making a stronger recommendation, I would request an aligned full export; daily arrivals and closed-case history by topic/source, including reopens and transfers; event histories and waiting reasons; contact volumes and reviewed reason labels; and incident, reproduction and productive-capacity evidence. I would also confirm timezone, SLA calendars and pause rules. Three weekly observations are not enough for a reliable forecast.</p>
    </Section>

    <Section id="method" number="06 / Supporting evidence" title="How I checked the figures.">
      <p>I reviewed all five workbook tabs. IDs are unique, recorded ages and SLA flags match recalculation, current topic mappings agree, and weekly backlog arithmetic reconciles. These checks establish internal consistency, not complete coverage of the queue.</p>
      <Detail title="Definitions, formulas and SLA boundaries">
        <dl className="formulas">
          <dt>Net additions</dt><dd>Incoming − Handled</dd>
          <dt>Closing backlog</dt><dd>Opening backlog + Incoming − Handled</dd>
          <dt>Three-week growth</dt><dd>Last closing − first opening = 1,815 − 1,205 = 610</dd>
          <dt>Contribution to growth</dt><dd>Bundle growth ÷ total growth</dd>
          <dt>Case age</dt><dd>Fixed snapshot − creation time, in elapsed hours</dd>
          <dt>Breached</dt><dd>Age &gt; priority SLA target (P1: 12h; P2: 48h; Non-P: 72h)</dd>
          <dt>Due within 12 hours</dt><dd>0 ≤ target − age ≤ 12; excludes breached cases</dd>
        </dl>
        <p>A case exactly at its target is due now, not breached. CASE-920211 is 48 hours old and matches the source’s not-breached flag. An inclusive boundary would give 110 breaches instead of 109.</p>
        <p>The assessment snapshot is fixed at October 5, 2026, 09:00, not today. Timestamps are treated on the same unspecified time basis; no business-hour calendar or pause logic is supplied. The capacity estimate uses each bundle’s own handled-per-hour rate.</p>
      </Detail>
      <Detail title="Validation record and remaining data-quality issues">
        <Table text caption="All five source tabs reviewed" headings={['Source / range', 'Check and treatment']} rows={[
          ['Open Cases A1:N341', '340 unique cases; 36 missing sources retained as Unknown; 19 Unassigned. Recorded ages, targets and breach flags match.'],
          ['Traffic & Capacity A1:H19', 'All 18 flow equations and 12 between-week continuity checks pass. Confirm whether Handled means unique cases leaving the queue.'],
          ['SLA Targets A1:C4', 'Three priority targets applied to the fixed snapshot; exact-boundary rule checked.'],
          ['Data Notes A1:B11', 'Snapshot and scope reviewed. The export includes 26 cases created October 5, after the weekly period ended.'],
          ['Topic Mapping A1:B100', '99 mappings; all 340 current case mappings agree. Does not prove the topic itself is correct.'],
          ['Timestamp anomaly: CASE-920080', 'Last Action is 08:00, before Created On at 09:00 on October 5. Flag the action history; retain valid creation-based SLA calculations.'],
          ['Unreconciled population', '340 exported cases versus 1,815 weekly closing backlog. Request aligned reports; do not extrapolate case-level percentages.'],
        ]} />
        <p>Calculations are kept separate from the presentation. Automated checks cover headline metrics, case examples, SLA boundaries and the capacity scenario. The supplied workbook is preserved unchanged.</p>
        <p className="small">Assessment workbook: {source.filename}. Brief: Analyst Pro PSS - Hiring 2026.docx.txt. Only fictional assessment material is included; no Slack research or real customer cases are part of this site.</p>
      </Detail>
      <Detail title="Where each Part 1 requirement is answered">
        <ul className="coverage-list">{[
          ['Trends, risks and anomalies', 'growth', 'Backlog growth; SLA risk; validation record'],
          ['Backlog and SLA drivers', 'growth', 'Demand, capacity and case-age concentrations'],
          ['Traffic sources and reasons', 'drivers', 'Source mix, reason labels and snapshot limits'],
          ['Inefficiency, routing, knowledge and product issues', 'drivers', 'BPO/DNS review and hypotheses to test'],
          ['What to prioritize and why', 'actions', 'Ordered actions with owners and checks'],
          ['Confident conclusions versus hypotheses', 'limits', 'Explicit distinction between evidence and possible causes'],
          ['Additional information needed', 'limits', 'Aligned exports, histories, denominators and technical evidence'],
        ].map(([label, id, description]) => <li key={label}><strong>{label}</strong><span>{description}</span><button onClick={() => jump(id)}>Go to section <span aria-hidden="true">↗</span></button></li>)}</ul>
      </Detail>
    </Section>
  </article>;
}
