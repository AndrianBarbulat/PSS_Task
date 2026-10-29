import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import investigationMarkdown from '../../docs/wix-task-2/INVESTIGATION_AND_SOLUTIONS.md?raw';
import responseMarkdown from '../../docs/wix-task-2/USER_FACING_RESPONSE.md?raw';
import './TechnicalWork.css';

const investigationUrl = 'https://github.com/AndrianBarbulat/PSS_Task/blob/main/docs/wix-task-2/INVESTIGATION_AND_SOLUTIONS.md';
const responseUrl = 'https://github.com/AndrianBarbulat/PSS_Task/blob/main/docs/wix-task-2/USER_FACING_RESPONSE.md';
const clonedSiteUrl = 'https://andrianb.wixsite.com/psstechtask2/category/all-products';

function MarkdownDocument({ source, className = '' }) {
  return <div className={`markdown-document ${className}`.trim()}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ node: _node, ...props }) => <a {...props} target="_blank" rel="noreferrer" />,
        table: ({ node: _node, ...props }) => <div className="markdown-table-wrap"><table {...props} /></div>,
      }}
    >
      {source}
    </ReactMarkdown>
  </div>;
}

function Investigation() {
  return <section aria-label="Task 2 technical investigation">
    <div className="document-toolbar">
      <div>
        <p className="eyebrow">Deliverable 1 · Investigation &amp; solutions</p>
        <p>The complete investigation is displayed below. The GitHub document is the source used by this page.</p>
      </div>
      <a className="button" href={investigationUrl} target="_blank" rel="noreferrer">View Markdown source ↗</a>
    </div>
    <MarkdownDocument source={investigationMarkdown} />
  </section>;
}

function CustomerResponse() {
  return <section aria-label="Final user-facing response">
    <div className="document-toolbar">
      <div>
        <p className="eyebrow">Deliverable 2 · User-facing response</p>
        <p>The complete response prepared for the user is displayed below.</p>
      </div>
      <a className="button" href={responseUrl} target="_blank" rel="noreferrer">View Markdown source ↗</a>
    </div>
    <MarkdownDocument source={responseMarkdown} className="email-document" />
  </section>;
}

export default function TechnicalWork() {
  const [selected, setSelected] = useState('investigation');

  return <div className="technical-page">
    <header className="technical-hero">
      <p className="eyebrow">Part 05 · Technical work</p>
      <h1>Evidence first. Escalate only what remains.</h1>
      <p className="lead">The investigation identifies the custom-code and CMS causes behind the failed order-request flow, separates blockers from recommended improvements, and preserves the final response prepared for the user.</p>
      <p className="technical-site-link"><strong>Cloned Wix test site:</strong> <a href={clonedSiteUrl} target="_blank" rel="noreferrer">andrianb.wixsite.com/psstechtask2/category/all-products ↗</a></p>
      <div className="technical-statuses"><span>Investigation complete</span><span>Response complete</span><span className="pending">Published retest pending</span></div>
    </header>

    <div className="technical-tabs" role="tablist" aria-label="Technical deliverables">
      <button role="tab" aria-selected={selected === 'investigation'} onClick={() => setSelected('investigation')}>Investigation &amp; solutions</button>
      <button role="tab" aria-selected={selected === 'response'} onClick={() => setSelected('response')}>User-facing response</button>
    </div>

    <div role="tabpanel">
      {selected === 'investigation' ? <Investigation /> : <CustomerResponse />}
    </div>
  </div>;
}
