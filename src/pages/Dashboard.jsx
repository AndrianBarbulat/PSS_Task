import React, { useMemo, useRef, useState } from 'react';
import assessment from '../data/assessment.json';
import { calculatePSG } from '../lib/calculatePSG.js';
import { buildTriage, compareSnapshots, groupForExplorer, scenario, snapshotRecord, validateSnapshot } from '../lib/dashboard.js';

const views = [
  ['overview', 'Morning overview'],
  ['triage', 'Triage queue'],
  ['drivers', 'Drivers'],
  ['recovery', 'Recovery plan'],
  ['quality', 'Data quality'],
];
const defaultActions = [
  { id: 'urgent', action: 'Review all P1s and unassigned breached cases', owner: 'PSG duty lead + bundle leads', measure: 'Every reviewed case has an individual owner and next action', status: 'Open' },
  { id: 'scope', action: 'Reconcile weekly and case-export populations', owner: 'Analyst + reporting owner', measure: 'Scope, filters, cut-off and Handled definition agreed', status: 'Open' },
  { id: 'business', action: 'Investigate the Business demand increase', owner: 'Business lead + workforce planning', measure: 'Daily incoming versus handled by topic and source', status: 'Open' },
  { id: 'ads', action: 'Review the 21 Google Ads cases for shared blockers', owner: 'Google Ads topic lead', measure: 'Aged cases progressed and repeated symptoms tracked', status: 'Open' },
];

const format = value => Number(value).toLocaleString('en-GB', { maximumFractionDigits: 1 });
const pct = value => `${(Number(value) * 100).toFixed(1)}%`;
const snapshotLabel = report => report.notes['Snapshot time'];
function loadLocal(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

function Card({ label, value, note, tone = '' }) {
  return <div className={`dashboard-card ${tone}`}><span>{label}</span><strong>{value}</strong><small>{note}</small></div>;
}
function Panel({ title, kicker, children, className = '' }) {
  return <section className={`dashboard-panel ${className}`}><header><div>{kicker && <p className="panel-kicker">{kicker}</p>}<h2>{title}</h2></div></header>{children}</section>;
}
function MiniBars({ rows, value, label, maximum }) {
  const max = maximum || Math.max(...rows.map(value), 1);
  return <div className="mini-bars">{rows.map(row => <div className="mini-bar" key={row.name}>
    <span title={row.name}>{row.name}</span><div><i style={{ width: `${Math.max(2, value(row) / max * 100)}%` }} /></div><strong>{label(row)}</strong>
  </div>)}</div>;
}

function Overview({ report, comparison, setView }) {
  const business = report.bundles.find(b => b.bundle === 'Business');
  const ads = report.topics.find(t => t.name === 'Google Ads w/ Wix');
  return <>
    <div className="dashboard-grid four">
      <Card label="Open case export" value={format(report.caseCount)} note="Case-level population" />
      <Card label="Breached" value={format(report.breached)} note={`${pct(report.breached / report.caseCount)} of exported cases`} tone="danger" />
      <Card label="Due within 12h" value={format(report.due12)} note={`${report.due4} due now or within 4h`} tone="warning" />
      <Card label="Unassigned" value={format(report.unassigned)} note={`${report.unassignedBreached} already breached`} tone="warning" />
    </div>
    <div className="dashboard-grid two">
      <Panel title="What needs attention this morning" kicker="Recommended order">
        <ol className="morning-list">
          <li><strong>Protect urgent cases.</strong><span>Review all 15 P1s and the {report.unassignedBreached} unassigned breached cases.</span><button onClick={() => setView('triage')}>Open triage queue</button></li>
          <li><strong>Investigate Business demand.</strong><span>It contributed {business.growth} of the {report.totalGrowth} additional weekly-report cases.</span><button onClick={() => setView('drivers')}>Explore drivers</button></li>
          <li><strong>Review Google Ads ageing.</strong><span>{ads.breached} of {ads.n} exported cases are breached; test for shared blockers before claiming one defect.</span><button onClick={() => setView('drivers')}>Inspect concentration</button></li>
        </ol>
      </Panel>
      <Panel title="Change since the previous snapshot" kicker="Open-case snapshots">
        {comparison ? <div className="change-grid">
          <Card label="Open cases" value={`${comparison.caseDelta >= 0 ? '+' : ''}${comparison.caseDelta}`} note={`versus ${comparison.previousLabel}`} />
          <Card label="Newly present" value={comparison.added.length} note="Not necessarily newly created" />
          <Card label="Newly breached" value={comparison.newlyBreached.length} note="Same IDs crossing the SLA boundary" tone="danger" />
          <Card label="No longer present" value={comparison.noLongerOpen.length} note="Not automatically resolved" />
        </div> : <div className="empty-state"><strong>No earlier snapshot to compare.</strong><p>Save this baseline, then import a later compatible snapshot. The dashboard will identify new, no-longer-present, newly breached and owner-changed cases.</p></div>}
      </Panel>
    </div>
    <div className="dashboard-grid two">
      <Panel title="Weekly operating pressure" kicker="Traffic & capacity report">
        <MiniBars rows={report.weeks} value={w => w.net} label={w => `+${w.net}`} />
        <p className="panel-note">Net additions rose from +{report.first.net} to +{report.latest.net}. Incoming work grew {pct(report.incomingGrowth)} while handled volume grew {pct(report.handledGrowth)}.</p>
      </Panel>
      <Panel title="Read this before using the percentages" kicker="Scope warning" className="scope-panel">
        <strong>{format(report.latest.closing)} weekly closing backlog ≠ {format(report.caseCount)} exported open cases</strong>
        <p>The reports have different cut-offs and unreconciled scope. Weekly data explains overall movement. The case export identifies cases and concentrations to investigate. Case-level percentages must not be presented as shares of the full weekly backlog.</p>
      </Panel>
    </div>
  </>;
}

function Triage({ report }) {
  const queue = useMemo(() => buildTriage(report.cases), [report]);
  const [filters, setFilters] = useState({ search: '', priority: 'All', bundle: 'All', signal: 'Actionable' });
  const update = (key, value) => setFilters(current => ({ ...current, [key]: value }));
  const filtered = queue.filter(c => {
    const text = `${c.id} ${c.topic} ${c.owner} ${c.source}`.toLowerCase();
    return (!filters.search || text.includes(filters.search.toLowerCase())) &&
      (filters.priority === 'All' || c.priority === filters.priority) &&
      (filters.bundle === 'All' || c.bundle === filters.bundle) &&
      (filters.signal === 'All' || filters.signal === 'Actionable' && c.triage.level <= 6 || c.triage.label === filters.signal);
  });
  const bundles = [...new Set(report.cases.map(c => c.bundle))].sort();
  return <Panel title="Explainable morning triage" kicker="Rules, not a black-box score">
    <p className="section-intro">Cases are ordered by explicit operational rules: breached P1, approaching P1, unassigned breach, approaching SLA, other breach, stalled, then process review. Confirmed user impact can override this order.</p>
    <div className="filter-bar">
      <label>Search<input type="search" value={filters.search} onChange={e => update('search', e.target.value)} placeholder="Case, topic, owner or source" /></label>
      <label>Priority<select value={filters.priority} onChange={e => update('priority', e.target.value)}><option>All</option><option>P1</option><option>P2</option><option>Non-P</option></select></label>
      <label>Bundle<select value={filters.bundle} onChange={e => update('bundle', e.target.value)}><option>All</option>{bundles.map(b => <option key={b}>{b}</option>)}</select></label>
      <label>Signal<select value={filters.signal} onChange={e => update('signal', e.target.value)}><option>Actionable</option><option>All</option><option>Critical</option><option>Ownership risk</option><option>SLA risk</option><option>Breached</option><option>Stalled</option><option>Process review</option></select></label>
    </div>
    <p className="result-count">Showing {Math.min(filtered.length, 75)} of {filtered.length} matching cases · {queue.length} total</p>
    <div className="dashboard-table-wrap" tabIndex="0"><table className="dashboard-table"><thead><tr><th>Signal</th><th>Case</th><th>Topic</th><th>Priority</th><th>Owner</th><th>Age</th><th>Why it is here</th></tr></thead><tbody>
      {filtered.slice(0, 75).map(c => <tr key={c.id}><td><span className={`signal level-${c.triage.level}`}>{c.triage.label}</span></td><th scope="row">{c.id}</th><td>{c.topic}<small>{c.bundle}</small></td><td>{c.priority}</td><td>{c.owner || 'Unassigned'}</td><td>{format(c.age)}h</td><td>{c.triage.reason}<small>{c.source} · {c.handovers} handovers</small></td></tr>)}
    </tbody></table></div>
    {filtered.length > 75 && <p className="panel-note">The prototype limits the rendered list to 75 rows. Filters still run across all {filtered.length} matching records.</p>}
  </Panel>;
}

function Drivers({ report }) {
  const [dimension, setDimension] = useState('topic');
  const [selected, setSelected] = useState('');
  const rows = useMemo(() => groupForExplorer(report, dimension), [report, dimension]);
  const selectedRow = rows.find(r => r.name === selected) || rows[0];
  const maxBreaches = Math.max(...rows.map(r => r.breached), 1);
  const cases = report.cases.filter(c => c[dimension] === selectedRow?.name);
  return <div className="dashboard-grid driver-layout">
    <Panel title="Concentration explorer" kicker="Where the open work sits">
      <div className="segmented dashboard-segments">{[['topic','Topic'],['bundle','Bundle'],['source','Source'],['reason','Reason']].map(([key,label]) => <button key={key} aria-pressed={dimension === key} onClick={() => { setDimension(key); setSelected(''); }}>{label}</button>)}</div>
      <div className="driver-list">{rows.slice(0, 14).map(row => <button key={row.name} className={row.name === selectedRow?.name ? 'selected' : ''} onClick={() => setSelected(row.name)}>
        <span>{row.name}</span><i><b style={{ width: `${Math.max(2, row.breached / maxBreaches * 100)}%` }} /></i><strong>{row.breached}/{row.n}</strong>
      </button>)}</div>
      <p className="panel-note">Bars show breached case count within the exported open-case population, not incoming traffic or defect incidence.</p>
    </Panel>
    <Panel title={selectedRow?.name || 'Select a concentration'} kicker={`${dimension} evidence`}>
      {selectedRow && <>
        <div className="dashboard-grid two compact"><Card label="Open cases" value={selectedRow.n} note={`${pct(selectedRow.n / report.caseCount)} of export`} /><Card label="Breached" value={selectedRow.breached} note={`${pct(selectedRow.breachRate)} of this group`} tone="danger" /><Card label="Reviewable reasons" value={selectedRow.reviewable} note="Not confirmed avoidable" /><Card label="Unassigned" value={selectedRow.unassigned} note="Confirm individual ownership" /></div>
        <h3>What I would test</h3>
        <p>{dimension === 'reason' && selectedRow.name === 'Bug' ? 'Group the cases by symptom, product flow, timing and incident reference. Reproduce the behavior and rule out custom code, configuration and access before treating the label as a platform defect.' : 'Compare like-for-like cases, inspect event history and waiting reasons, and look for a shared symptom or a repeated process failure. The concentration identifies where to investigate; it does not establish causation.'}</p>
        <h3>Supporting cases</h3>
        <ul className="case-chips">{cases.slice(0, 12).map(c => <li key={c.id}>{c.id}<span>{c.priority} · {c.breach ? 'breached' : `${c.remaining}h left`}</span></li>)}</ul>
        {cases.length > 12 && <p className="panel-note">+{cases.length - 12} additional cases in this selection.</p>}
      </>}
    </Panel>
  </div>;
}

function Recovery({ report }) {
  const [inputs, setInputs] = useState({ restorePercent: 0, demandPercent: 0, handledPercent: 0 });
  const [actions, setActions] = useState(() => loadLocal('pss-actions-v1', defaultActions));
  const result = scenario(report, inputs);
  const updateInput = (key, value) => setInputs(current => ({ ...current, [key]: Number(value) }));
  const updateAction = (id, status) => {
    const next = actions.map(a => a.id === id ? { ...a, status } : a);
    setActions(next); localStorage.setItem('pss-actions-v1', JSON.stringify(next));
  };
  return <>
    <Panel title="Recovery scenario" kicker="Assumptions, not a forecast">
      <p className="section-intro">Change one assumption at a time and use the result to frame a discussion. Three weeks of data are not enough for a reliable forecast or staffing commitment.</p>
      <div className="scenario-controls">
        <label>Restore missing hours <strong>{inputs.restorePercent}%</strong><input type="range" min="0" max="100" step="25" value={inputs.restorePercent} onChange={e => updateInput('restorePercent', e.target.value)} /></label>
        <label>Incoming volume change <strong>{inputs.demandPercent > 0 ? '+' : ''}{inputs.demandPercent}%</strong><input type="range" min="-20" max="30" step="5" value={inputs.demandPercent} onChange={e => updateInput('demandPercent', e.target.value)} /></label>
        <label>Handled-volume change <strong>{inputs.handledPercent > 0 ? '+' : ''}{inputs.handledPercent}%</strong><input type="range" min="-20" max="30" step="5" value={inputs.handledPercent} onChange={e => updateInput('handledPercent', e.target.value)} /></label>
      </div>
      <div className="dashboard-grid four scenario-cards"><Card label="Scenario incoming" value={format(result.incoming)} note={`Observed: ${format(report.latest.incoming)}`} /><Card label="Scenario handled" value={format(result.handled)} note={`Observed: ${format(report.latest.handled)}`} /><Card label="Weekly net change" value={`${result.weeklyNet >= 0 ? '+' : ''}${format(result.weeklyNet)}`} note={result.weeklyNet >= 0 ? 'Backlog still growing' : 'Backlog declining'} tone={result.weeklyNet >= 0 ? 'danger' : 'positive'} /><Card label="Illustrative clearance" value={result.weeksToClear ? `${result.weeksToClear.toFixed(1)} wks` : 'Not clearing'} note="Uses latest closing backlog; quality unchanged" /></div>
      <p className="panel-note">Recovered hours use each bundle’s observed handled-per-actual-hour rate. The result assumes unchanged skills, complexity, reopens and resolution quality.</p>
    </Panel>
    <Panel title="Action register" kicker="From finding to follow-through">
      <div className="dashboard-table-wrap"><table className="dashboard-table actions-table"><thead><tr><th>Action</th><th>Proposed involvement</th><th>Success measure</th><th>Status</th></tr></thead><tbody>{actions.map(a => <tr key={a.id}><th scope="row">{a.action}</th><td>{a.owner}</td><td>{a.measure}</td><td><select value={a.status} onChange={e => updateAction(a.id, e.target.value)}><option>Open</option><option>In progress</option><option>Blocked</option><option>Complete</option></select></td></tr>)}</tbody></table></div>
      <p className="panel-note">Statuses are stored only in this browser. They describe the prototype action plan and do not imply that stakeholders have been contacted.</p>
    </Panel>
  </>;
}

function DataQuality({ report, importState, onImport, onSave, history }) {
  const input = useRef(null);
  const checks = [
    ['Unique case IDs', report.checks.duplicateIds === 0, `${report.checks.duplicateIds} duplicates`],
    ['SLA values calculable', report.checks.invalidSLA === 0, `${report.checks.invalidSLA} unavailable`],
    ['Age and breach flags recalculate', report.checks.ageMismatches + report.checks.flagMismatches === 0, `${report.checks.ageMismatches + report.checks.flagMismatches} mismatches`],
    ['Topic mappings agree', report.checks.mappingMismatches === 0, `${report.checks.mappingMismatches} mismatches`],
    ['Weekly flow arithmetic reconciles', report.checks.flowMismatches === 0, `${report.checks.flowMismatches} mismatches`],
    ['Between-week continuity reconciles', report.checks.continuityMismatches === 0, `${report.checks.continuityMismatches} mismatches`],
  ];
  return <div className="dashboard-grid two quality-layout">
    <Panel title="Import and snapshot workflow" kicker="Local prototype">
      <div className="import-box"><strong>Current snapshot</strong><span>{snapshotLabel(report)} · {report.caseCount} cases</span><div><button className="button primary" onClick={() => input.current.click()}>Import compatible JSON</button><button className="button" onClick={onSave}>Save current snapshot</button></div><input ref={input} type="file" accept="application/json,.json" onChange={onImport} hidden /></div>
      <p className="panel-note">The calculation and validation workflow is implemented. Direct `.xlsx` parsing still requires the spreadsheet package that could not be installed in this environment. Imported files stay in the browser and are not uploaded.</p>
      {importState && <div className={`import-message ${importState.type}`}><strong>{importState.title}</strong>{importState.messages?.map(message => <span key={message}>{message}</span>)}</div>}
      <h3>Saved browser snapshots</h3>
      {history.length ? <ul className="snapshot-list">{history.map(item => <li key={item.key}><strong>{item.label}</strong><span>{item.metrics.cases} cases · {item.metrics.breached} breached</span></li>)}</ul> : <div className="empty-state small"><strong>No saved snapshots.</strong><p>Save this baseline before importing a later snapshot.</p></div>}
    </Panel>
    <Panel title="Validation results" kicker="Current data">
      <ul className="check-list">{checks.map(([label, pass, detail]) => <li key={label}><span className={pass ? 'pass' : 'fail'}>{pass ? 'Pass' : 'Review'}</span><strong>{label}</strong><small>{detail}</small></li>)}</ul>
      <h3>Warnings that still matter</h3>
      <ul><li><strong>Population mismatch:</strong> {report.latest.closing} weekly closing backlog versus {report.caseCount} exported cases.</li><li><strong>Missing source:</strong> {report.checks.missingSource} cases are retained as Unknown.</li><li><strong>Timestamp anomaly:</strong> {report.checks.timestampAnomalies.join(', ')} has an action before creation.</li><li><strong>Time basis:</strong> the workbook supplies no timezone, business-hours calendar or SLA pause logic.</li></ul>
    </Panel>
    <Panel title="Metric dictionary" kicker="Reproducibility" className="full-span">
      <div className="dictionary"><div><strong>Breached</strong><span>Elapsed case age &gt; priority SLA target. Exact target is due now, not breached.</span></div><div><strong>Due within 12h</strong><span>Not breached and 0–12 elapsed hours remain. The window is an analyst triage rule.</span></div><div><strong>Stalled</strong><span>No recorded action for at least 24 hours, excluding timestamp anomalies. Waiting reason is unknown.</span></div><div><strong>Reviewable reason</strong><span>Missing Troubleshooting, Wrong Topic or Knowledge Gap. A review candidate, not confirmed avoidable.</span></div><div><strong>Weekly net change</strong><span>Incoming − Handled. Handled may include older cases and needs a confirmed business definition.</span></div><div><strong>No longer present</strong><span>Case ID absent from a later open export. Not automatically resolved or closed.</span></div></div>
    </Panel>
  </div>;
}

export default function Dashboard() {
  const [view, setView] = useState('overview');
  const [raw, setRaw] = useState(assessment);
  const [history, setHistory] = useState(() => loadLocal('pss-snapshots-v1', []));
  const [importState, setImportState] = useState(null);
  const report = useMemo(() => calculatePSG(raw), [raw]);
  const current = useMemo(() => snapshotRecord(report), [report]);
  const previous = [...history].filter(item => item.key !== current.key).sort((a, b) => b.key.localeCompare(a.key))[0];
  const comparison = compareSnapshots(current, previous);

  const save = () => {
    const existing = history.some(item => item.key === current.key);
    if (existing && !window.confirm('A snapshot with this timestamp already exists. Replace it?')) return;
    const next = [...history.filter(item => item.key !== current.key), current].sort((a, b) => a.key.localeCompare(b.key));
    setHistory(next); localStorage.setItem('pss-snapshots-v1', JSON.stringify(next));
    setImportState({ type: 'success', title: existing ? 'Snapshot replaced.' : 'Snapshot saved.', messages: [`${current.label} is stored only in this browser.`] });
  };
  const importFile = async event => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const validation = validateSnapshot(parsed);
      if (!validation.valid) { setImportState({ type: 'error', title: 'Import blocked.', messages: validation.errors }); return; }
      calculatePSG(parsed);
      setRaw(parsed);
      setImportState({ type: 'success', title: 'Snapshot loaded.', messages: validation.warnings.length ? validation.warnings : ['All required tabs and columns are present. Save it when you are ready to compare snapshots.'] });
      setView('overview');
    } catch (error) { setImportState({ type: 'error', title: 'Import blocked.', messages: [error.message || 'The file could not be read.'] }); }
  };
  return <article className="dashboard-page">
    <header className="dashboard-hero"><div><p className="eyebrow">Part 02 / Build the missing view</p><h1>Daily queue control.</h1><p className="lead">Start with urgent cases, understand what changed, investigate concentrations and turn findings into owned actions.</p></div><div className="snapshot-badge"><span>Current snapshot</span><strong>{snapshotLabel(report)}</strong><small>Fixed fictional assessment data</small></div></header>
    <nav className="dashboard-tabs" aria-label="Dashboard views">{views.map(([key, label]) => <button key={key} aria-current={view === key ? 'page' : undefined} onClick={() => setView(key)}>{label}</button>)}</nav>
    <div className="dashboard-view">{view === 'overview' ? <Overview report={report} comparison={comparison} setView={setView} /> : view === 'triage' ? <Triage report={report} /> : view === 'drivers' ? <Drivers report={report} /> : view === 'recovery' ? <Recovery report={report} /> : <DataQuality report={report} importState={importState} onImport={importFile} onSave={save} history={history} />}</div>
  </article>;
}
