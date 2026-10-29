import React, { useEffect, useRef, useState } from 'react';
import Analysis from './pages/Analysis.jsx';
import Dashboard from './pages/Dashboard.jsx';
import LeadershipBrief from './pages/LeadershipBrief.jsx';
import StakeholderApproach from './pages/StakeholderApproach.jsx';
import TechnicalWork from './pages/TechnicalWork.jsx';

const pages = [
  { id: 'analysis', title: 'Queue analysis', part: '01', status: 'Analysis complete' },
  { id: 'dashboard', title: 'Daily dashboard', part: '02', status: 'Dashboard complete' },
  { id: 'brief', title: 'Leadership brief', part: '03', status: 'Brief complete' },
  { id: 'stakeholders', title: 'Stakeholder approach', part: '04', status: 'Approach complete' },
  { id: 'technical', title: 'Technical work', part: '05', status: 'Investigation complete' },
];
function readRoute() { return window.location.hash.slice(2).split('/')[0] || 'analysis'; }

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
      <div className="sidebar-note"><span className="status-dot" />All five sections documented<p>Part 5 published retest remains pending.<br />Not a live operational report.</p></div>
    </aside>
    <div className="workspace">
      <header className="topbar"><span>Advanced Technical Products</span><span>Assessment snapshot · 05 Oct 2026</span></header>
      <main id="main" ref={main} tabIndex="-1">
        {page ? route === 'analysis' ? <Analysis /> : route === 'dashboard' ? <Dashboard /> : route === 'brief' ? <LeadershipBrief /> : route === 'stakeholders' ? <StakeholderApproach /> : <TechnicalWork /> : <div className="planned-page"><h1>Page not found</h1><a href="#/analysis">Return to queue analysis</a></div>}
      </main>
      <footer>Analyst PSS assessment · Recommendations describe proposed actions, not work already carried out.<br /><span>Section numbering follows the main brief; its submission checklist reverses the dashboard and leadership-summary numbers.</span></footer>
    </div>
  </>;
}
