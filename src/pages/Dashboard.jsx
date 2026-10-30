import React, { useEffect, useMemo, useRef, useState } from 'react';
import assessment from '../data/assessment.json';
import { calculatePSG } from '../lib/calculatePSG.js';
import { buildTriage, compareSnapshots, groupForExplorer, scenario, snapshotRecord, validateSnapshot } from '../lib/dashboard.js';
import { parseSnapshotFile } from '../lib/spreadsheet.js';
import { buildAiFactPack, requestAiBrief } from '../lib/aiBrief.js';
import { createSnapshotEntry, listSnapshotEntries, removeSnapshotEntry, saveSnapshotBrief, saveSnapshotEntry, selectPreviousSnapshot } from '../lib/snapshotLibrary.js';

const views = [
  ['overview', 'Morning overview'],
  ['triage', 'Triage queue'],
  ['drivers', 'Drivers'],
  ['recovery', 'Recovery plan'],
  ['library', 'Snapshot library'],
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

function Evidence({ ids, evidence }) {
  if (!ids?.length) return null;
  return <div className="ai-evidence">{ids.map(id => <span key={id}>{evidence.get(id) || id}</span>)}</div>;
}

function AiBriefPanel({ factPack, brief, aiState, onGenerate }) {
  const evidence = useMemo(() => {
    const entries = [
      ...factPack.metrics,
      ...(factPack.comparison?.metrics || []),
      ...factPack.concentrations.map(item => ({ id: item.id, label: `${item.dimension}: ${item.name}`, value: `${item.breached}/${item.open} breached` })),
      ...factPack.priorityCases.map(item => ({ id: item.evidenceId, label: item.id, value: item.signal })),
    ];
    return new Map(entries.map(item => [item.id, `${item.label}: ${item.value}`]));
  }, [factPack]);
  const sections = brief ? [
    ['Confirmed findings', brief.findings],
    ['Immediate risks', brief.risks],
    ['Recommended actions', brief.recommendations],
    ['Hypotheses to validate', brief.hypotheses],
    ['Data limitations', brief.limitations],
  ] : [];
  return <Panel title="AI-assisted morning brief" kicker="Evidence-backed interpretation" className="ai-brief-panel">
    <div className="ai-brief-heading"><p>The dashboard calculates the facts. DeepSeek is used only to interpret the verified fact pack and runs only when requested.</p><button className="button primary" onClick={onGenerate} disabled={aiState.type === 'loading'}>{aiState.type === 'loading' ? 'Generating…' : brief ? 'Regenerate brief' : 'Generate AI brief'}</button></div>
    {aiState.type === 'error' && <div className="import-message error" role="alert"><strong>Brief unavailable.</strong><span>{aiState.message}</span></div>}
    {brief ? <div className="ai-brief-content">
      <div className="ai-summary"><span>Executive position</span><p>{brief.executiveSummary}</p><small>Generated {new Date(brief.generatedAt).toLocaleString('en-GB')} · AI-assisted, Analyst review required</small></div>
      <div className="ai-brief-sections">{sections.map(([title, items]) => <section key={title}><h3>{title}</h3>{items.length ? <ul>{items.map((item, index) => <li key={`${title}-${index}`}><p>{item.text}</p>{item.validation && <small><strong>Validation:</strong> {item.validation}</small>}<Evidence ids={item.evidence} evidence={evidence} /></li>)}</ul> : <p className="panel-note">No additional item returned.</p>}</section>)}</div>
    </div> : aiState.type !== 'loading' && <div className="empty-state small"><strong>No AI brief generated.</strong><p>This is optional. The deterministic dashboard remains fully usable without it, and no API credits are spent until you choose to generate a brief.</p></div>}
  </Panel>;
}

function Overview({ report, comparison, setView, factPack, brief, aiState, onGenerate }) {
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
        </div> : <div className="empty-state"><strong>No earlier snapshot to compare.</strong><p>Import another compatible snapshot or choose a baseline in the Snapshot Library. The dashboard will identify new, no-longer-present, newly breached and owner-changed cases.</p></div>}
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
    <AiBriefPanel factPack={factPack} brief={brief} aiState={aiState} onGenerate={onGenerate} />
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

function SnapshotLibrary({ entries, activeId, baselineId, importState, onImport, onOpen, onBaseline, onDelete, setView }) {
  const input = useRef(null);
  const active = entries.find(entry => entry.id === activeId);
  return <div className="dashboard-grid two library-layout">
    <Panel title="Import independent snapshots" kicker="Local snapshot library">
      <div className="import-box"><strong>Add one or more daily snapshots</strong><span>Each valid file is stored separately. Files are never silently merged.</span><small>Supported: complete five-sheet .xlsx workbooks, compatible Open Cases .csv exports, and compatible .json snapshots.</small><div><button className="button primary" onClick={() => input.current.click()} disabled={importState?.type === 'loading'}>{importState?.type === 'loading' ? 'Reading files…' : 'Import snapshots'}</button></div><input ref={input} multiple type="file" accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,application/json,.xlsx,.csv,.json" onChange={onImport} hidden /></div>
      <div className="sample-snapshots"><strong>Test the comparison workflow</strong><span>Download both fictional snapshots, then import them together.</span><div><a href="/test-data/PSG_Daily_Snapshot_2026-10-06.xlsx" download>October 6 snapshot</a><a href="/test-data/PSG_Daily_Snapshot_2026-10-07.xlsx" download>October 7 snapshot</a></div></div>
      <p className="panel-note">The original workbook data, normalized dashboard record and validation warnings are retained in this browser. Only a compact operational fact pack is sent externally when you explicitly generate an AI brief.</p>
      {importState && <div className={`import-message ${importState.type}`} role={importState.type === 'error' ? 'alert' : 'status'} aria-live="polite"><strong>{importState.title}</strong>{importState.messages?.map((message, index) => <span key={`${message}-${index}`}>{message}</span>)}</div>}
    </Panel>
    <Panel title="Comparison control" kicker="Explicit baseline">
      <label className="library-select">Comparison baseline<select value={baselineId} onChange={event => onBaseline(event.target.value)}><option value="">Automatic: nearest earlier snapshot</option>{entries.filter(entry => entry.id !== activeId).map(entry => <option value={entry.id} key={entry.id}>{entry.label} · {entry.sourceName}</option>)}</select></label>
      <div className="comparison-summary"><span>Current</span><strong>{active?.label || 'Loading snapshot library…'}</strong><small>{active?.sourceName}</small></div>
      <p className="panel-note">A baseline is compared with the current snapshot; case rows from different dates are not appended together. If no baseline is selected, the nearest earlier saved snapshot is used.</p>
    </Panel>
    <Panel title="Saved snapshots" kicker={`${entries.length} independent dataset${entries.length === 1 ? '' : 's'}`} className="full-span">
      {entries.length ? <div className="snapshot-library-list">{entries.map(entry => <article key={entry.id} className={entry.id === activeId ? 'active' : ''}>
        <div><span className="snapshot-status">{entry.id === activeId ? 'Current' : entry.id === baselineId ? 'Baseline' : 'Saved'}</span><h3>{entry.label}</h3><p>{entry.sourceName}</p><small>Imported {new Date(entry.importedAt).toLocaleString('en-GB')}</small></div>
        <dl><div><dt>Open</dt><dd>{entry.record.metrics.cases}</dd></div><div><dt>Breached</dt><dd>{entry.record.metrics.breached}</dd></div><div><dt>Warnings</dt><dd>{entry.warnings?.length || 0}</dd></div><div><dt>AI brief</dt><dd>{entry.aiBrief ? 'Ready' : 'Not generated'}</dd></div></dl>
        <div className="snapshot-actions"><button className="button" disabled={entry.id === activeId} onClick={() => onOpen(entry.id)}>Open</button><button className="button" disabled={entry.id === activeId} onClick={() => onBaseline(entry.id)}>Use as baseline</button>{entry.id === activeId && <button className="button" onClick={() => setView('overview')}>Analyse</button>}<button className="button danger-button" disabled={entry.id === activeId} onClick={() => onDelete(entry.id)}>Remove</button></div>
      </article>)}</div> : <div className="empty-state"><strong>No snapshots stored yet.</strong><p>Import a compatible workbook to create the first independent snapshot.</p></div>}
    </Panel>
  </div>;
}

function DataQuality({ report, sourceName, activeEntry, setView }) {
  const checks = [
    ['Unique case IDs', report.checks.duplicateIds === 0, `${report.checks.duplicateIds} duplicates`],
    ['SLA values calculable', report.checks.invalidSLA === 0, `${report.checks.invalidSLA} unavailable`],
    ['Age and breach flags recalculate', report.checks.ageMismatches + report.checks.flagMismatches === 0, `${report.checks.ageMismatches + report.checks.flagMismatches} mismatches`],
    ['Topic mappings agree', report.checks.mappingMismatches === 0, `${report.checks.mappingMismatches} mismatches`],
    ['Weekly flow arithmetic reconciles', report.checks.flowMismatches === 0, `${report.checks.flowMismatches} mismatches`],
    ['Between-week continuity reconciles', report.checks.continuityMismatches === 0, `${report.checks.continuityMismatches} mismatches`],
  ];
  return <div className="dashboard-grid two quality-layout">
    <Panel title="Current dataset" kicker="Snapshot provenance">
      <div className="comparison-summary"><span>Current snapshot</span><strong>{snapshotLabel(report)} · {report.caseCount} cases</strong><small>{sourceName}</small></div>
      <p className="panel-note">{activeEntry ? `Stored independently in this browser on ${new Date(activeEntry.importedAt).toLocaleString('en-GB')}.` : 'The bundled assessment snapshot is currently displayed.'}</p>
      <button className="button" onClick={() => setView('library')}>Open snapshot library</button>
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
  const [library, setLibrary] = useState([]);
  const [activeId, setActiveId] = useState('');
  const [baselineId, setBaselineId] = useState('');
  const [libraryReady, setLibraryReady] = useState(false);
  const [importState, setImportState] = useState(null);
  const [aiState, setAiState] = useState({ type: 'idle', message: '' });
  const [sourceName, setSourceName] = useState('Bundled fictional assessment snapshot');
  const report = useMemo(() => calculatePSG(raw), [raw]);
  const current = useMemo(() => snapshotRecord(report), [report]);
  const activeEntry = library.find(entry => entry.id === activeId) || null;
  const previousEntry = useMemo(() => selectPreviousSnapshot(library, activeEntry, baselineId), [library, activeEntry, baselineId]);
  const comparison = compareSnapshots(current, previousEntry?.record);
  const factPack = useMemo(() => buildAiFactPack(report, comparison, sourceName), [report, comparison, sourceName]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let entries = await listSnapshotEntries();
        if (!entries.length) {
          const bundledReport = calculatePSG(assessment);
          const bundledRecord = snapshotRecord(bundledReport);
          const bundled = createSnapshotEntry({ raw: assessment, report: bundledReport, record: bundledRecord, sourceName: 'Bundled fictional assessment snapshot', id: 'bundled-assessment-v1' });
          await saveSnapshotEntry(bundled);
          entries = [bundled];
        }
        if (cancelled) return;
        setLibrary(entries);
        const initial = entries[0];
        setActiveId(initial.id); setRaw(initial.raw); setSourceName(initial.sourceName);
      } catch (error) {
        if (!cancelled) setImportState({ type: 'error', title: 'Snapshot storage unavailable.', messages: [error.message] });
      } finally { if (!cancelled) setLibraryReady(true); }
    })();
    return () => { cancelled = true; };
  }, []);

  const refreshLibrary = async () => setLibrary(await listSnapshotEntries());
  const importFiles = async event => {
    const files = [...(event.target.files || [])]; event.target.value = '';
    if (!files.length) return;
    setImportState({ type: 'loading', title: 'Reading snapshots…', messages: [`Checking ${files.length} file${files.length === 1 ? '' : 's'}.`] });
    const successes = [], failures = [];
    let latest = null;
    for (const file of files) {
      try {
        const parsed = await parseSnapshotFile(file, undefined, raw);
        const validation = validateSnapshot(parsed);
        if (!validation.valid) { failures.push(`${file.name}: ${validation.errors.join(' ')}`); continue; }
        const importedReport = calculatePSG(parsed);
        const record = snapshotRecord(importedReport);
        const reportWarnings = [
          ...validation.warnings,
          file.name.toLowerCase().endsWith('.csv') ? 'This CSV supplied Open Cases only. SLA targets, topic mappings, traffic data and definitions were inherited from the previously active reference snapshot.' : null,
          importedReport.checks.timestampAnomalies.length ? `${importedReport.checks.timestampAnomalies.length} timestamp anomalies need review.` : null,
          importedReport.checks.mappingMismatches ? `${importedReport.checks.mappingMismatches} topic-to-bundle mappings need review.` : null,
        ].filter(Boolean);
        const entry = createSnapshotEntry({ raw: parsed, report: importedReport, record, sourceName: file.name, warnings: reportWarnings });
        await saveSnapshotEntry(entry); successes.push(`${file.name}: stored separately as ${record.label}`); if (!latest || entry.snapshotKey > latest.snapshotKey) latest = entry;
      } catch (error) { failures.push(`${file.name}: ${error.message || 'could not be read'}`); }
    }
    await refreshLibrary();
    if (latest) { setActiveId(latest.id); setRaw(latest.raw); setSourceName(latest.sourceName); setAiState({ type: 'idle', message: '' }); }
    setImportState({ type: failures.length ? successes.length ? 'success' : 'error' : 'success', title: failures.length ? successes.length ? 'Import completed with warnings.' : 'Import blocked.' : 'Snapshots stored.', messages: [...successes, ...failures] });
    setView(latest ? 'overview' : 'library');
  };
  const openSnapshot = id => {
    const entry = library.find(item => item.id === id); if (!entry) return;
    setActiveId(entry.id); setRaw(entry.raw); setSourceName(entry.sourceName); setAiState({ type: 'idle', message: '' }); setView('overview');
  };
  const deleteSnapshot = async id => {
    const entry = library.find(item => item.id === id); if (!entry || id === activeId) return;
    if (!window.confirm(`Remove ${entry.label} from this browser? This cannot be undone.`)) return;
    await removeSnapshotEntry(id); if (baselineId === id) setBaselineId(''); await refreshLibrary();
  };
  const generateBrief = async () => {
    if (!activeEntry || !window.confirm('Generate an AI brief for this snapshot? This makes one DeepSeek API request and uses a small amount of API credit.')) return;
    setAiState({ type: 'loading', message: '' });
    try {
      const brief = await requestAiBrief(factPack);
      await saveSnapshotBrief(activeEntry.id, brief);
      setLibrary(items => items.map(item => item.id === activeEntry.id ? { ...item, aiBrief: brief } : item));
      setAiState({ type: 'success', message: '' });
    } catch (error) { setAiState({ type: 'error', message: error.message }); }
  };
  return <article className="dashboard-page">
    <div className="ai-implementation-banner"><span>Secure AI intelligence</span><strong>DeepSeek-powered operational analysis is now integrated.</strong><small>Evidence-grounded briefs are generated on demand, cached per snapshot, and protected by server-side credentials.</small></div>
    <header className="dashboard-hero"><div><p className="eyebrow">Part 02 / Daily operations</p><h1>Daily queue control.</h1><p className="lead">Start with urgent cases, understand what changed, investigate concentrations and turn findings into owned actions.</p></div><div className="snapshot-badge"><span>Current snapshot</span><strong>{snapshotLabel(report)}</strong><small>{sourceName}</small></div></header>
    <nav className="dashboard-tabs" aria-label="Dashboard views">{views.map(([key, label]) => <button key={key} aria-current={view === key ? 'page' : undefined} onClick={() => setView(key)}>{label}</button>)}</nav>
    <div className="dashboard-view">{view === 'overview' ? <Overview report={report} comparison={comparison} setView={setView} factPack={factPack} brief={activeEntry?.aiBrief} aiState={aiState} onGenerate={generateBrief} /> : view === 'triage' ? <Triage report={report} /> : view === 'drivers' ? <Drivers report={report} /> : view === 'recovery' ? <Recovery report={report} /> : view === 'library' ? <SnapshotLibrary entries={library} activeId={activeId} baselineId={baselineId} importState={importState} onImport={importFiles} onOpen={openSnapshot} onBaseline={setBaselineId} onDelete={deleteSnapshot} setView={setView} /> : <DataQuality report={report} sourceName={sourceName} activeEntry={activeEntry} setView={setView} />}</div>
    {!libraryReady && <p className="panel-note" role="status">Loading the local snapshot library…</p>}
  </article>;
}
