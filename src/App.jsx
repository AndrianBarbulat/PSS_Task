import React, { useEffect, useRef, useState } from 'react';
import Analysis from './pages/Analysis.jsx';
import Dashboard from './pages/Dashboard.jsx';
import LeadershipBrief from './pages/LeadershipBrief.jsx';
import StakeholderApproach from './pages/StakeholderApproach.jsx';

const pages = [
  { id: 'analysis', title: 'Queue analysis', part: '01', status: 'Analysis complete' },
  { id: 'dashboard', title: 'Daily dashboard', part: '02', status: 'Dashboard complete' },
  { id: 'brief', title: 'Leadership brief', part: '03', status: 'Brief complete' },
  { id: 'stakeholders', title: 'Stakeholder approach', part: '04', status: 'Approach complete' },
  { id: 'technical', title: 'Technical work', part: '05' },
];
const technical = [
  { name: 'Custom cart', text: 'Build and publish a Wix API-powered cart summary with product names, prices, quantities, subtotal and an empty state. Verify updates after add, quantity change and removal. Include the live Wix link, API explanation and test results.' },
  { name: 'Investigation', text: 'Investigate the supplied clone. Record reproduction steps, evidence, root cause, proposed fixes, retest results and escalation decisions for each significant issue. No investigation or platform-defect claim has been completed yet.' },
  { name: 'Customer response', text: 'Write the response after the investigation is complete. Explain what was found, what changed, any remaining limitations and the next steps in clear language.' },
];
function readRoute() { return window.location.hash.slice(2).split('/')[0] || 'analysis'; }

function TechnicalPage({ page }) {
  const [selected, setSelected] = useState(0);
  return <div className="planned-page">
    <p className="eyebrow">Part {page.part} · Not started</p>
    <h1>Technical work, with evidence.</h1>
    <p className="lead">This section is reserved for the working Wix demo and the technical escalation investigation. No demo or findings are being presented as complete.</p>
    <>
      <div className="segmented" role="group" aria-label="Technical deliverables">{technical.map((item, i) => <button key={item.name} aria-pressed={i === selected} onClick={() => setSelected(i)}>{item.name}</button>)}</div>
      <div className="planned-content"><p className="status">Pending implementation</p><h2>{technical[selected].name}</h2><p>{technical[selected].text}</p></div>
      <p className="small muted">Netlify hosts this presentation. The required functioning cart will be published on Wix and linked here.</p>
    </>
    <a className="button" href="#/analysis">Read the completed queue analysis <span aria-hidden="true">↗</span></a>
  </div>;
}

export default function App() {
  const [route, setRoute] = useState(readRoute);
  const main = useRef(null);
  const page = pages.find(p => p.id === route);
  useEffect(() => {
    const change = () => { setRoute(readRoute()); window.scrollTo(0, 0); main.current?.focus(); };
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  useEffect(() => { document.title = `${page?.title || 'Page not found'} · Analyst PSS assessment`; }, [page]);
  return <>
    <a className="skip-link" href="#main" onClick={e => { e.preventDefault(); main.current?.focus(); }}>Skip to content</a>
    <aside className="sidebar">
      <a href="#/analysis" className="brand"><span className="brand-mark" aria-hidden="true">P</span><span>Analyst PSS<span className="brand-sub">ASSESSMENT / 2026</span></span></a>
      <p className="nav-label">The assessment</p>
      <nav aria-label="Assessment parts">{pages.map(p => <a key={p.id} href={`#/${p.id}`} aria-current={p.id === route ? 'page' : undefined}>
        <span className="part-number">{p.part}</span><span>{p.title}<small>{p.status || 'Not started'}</small></span>
      </a>)}</nav>
      <div className="sidebar-note"><span className="status-dot" />Parts 1–4 complete<p>Fictional assessment data only.<br />Not a live operational report.</p></div>
    </aside>
    <div className="workspace">
      <header className="topbar"><span>Advanced Technical Products</span><span>Assessment snapshot · 05 Oct 2026</span></header>
      <main id="main" ref={main} tabIndex="-1">
        {page ? route === 'analysis' ? <Analysis /> : route === 'dashboard' ? <Dashboard /> : route === 'brief' ? <LeadershipBrief /> : route === 'stakeholders' ? <StakeholderApproach /> : <TechnicalPage key={page.id} page={page} /> : <div className="planned-page"><h1>Page not found</h1><a href="#/analysis">Return to queue analysis</a></div>}
      </main>
      <footer>Analyst PSS assessment · Recommendations describe proposed actions, not work already carried out.<br /><span>Section numbering follows the main brief; its submission checklist reverses the dashboard and leadership-summary numbers.</span></footer>
    </div>
  </>;
}
