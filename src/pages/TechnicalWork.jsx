import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import investigationMarkdown from '../../docs/wix-task-2/INVESTIGATION_AND_SOLUTIONS.md?raw';
import responseMarkdown from '../../docs/wix-task-2/USER_FACING_RESPONSE.md?raw';
import './TechnicalWork.css';

const investigationUrl = 'https://github.com/AndrianBarbulat/PSS_Task/blob/main/docs/wix-task-2/INVESTIGATION_AND_SOLUTIONS.md';
const responseUrl = 'https://github.com/AndrianBarbulat/PSS_Task/blob/main/docs/wix-task-2/USER_FACING_RESPONSE.md';
const headlessCartUrl = 'https://absnowpssheadlessproject.netlify.app/';
const studioCartUrl = 'https://andrianb.wixstudio.com/cart-summary/cart-summary';

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
        <p className="eyebrow">Task 2 · Deliverable 1 · Investigation &amp; solutions</p>
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
        <p className="eyebrow">Task 2 · Deliverable 2 · User-facing response</p>
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
    </header>

    <section className="cart-summary-deliverable" aria-labelledby="cart-summary-title">
      <div className="cart-summary-heading">
        <p className="eyebrow">Task 1 · Build a custom cart summary</p>
        <h2 id="cart-summary-title">Two published implementations</h2>
        <p>I completed the cart-summary requirement in both a self-managed Wix Headless application and Wix Studio. This demonstrates the same commerce flow across the Wix JavaScript SDK and the native Wix editor environment.</p>
      </div>

      <div className="cart-implementation-grid">
        <article className="cart-implementation cart-implementation--featured">
          <div className="implementation-labels">
            <span>Wix Headless</span>
            <span>React + TypeScript</span>
          </div>
          <h3>Wix SDK cart summary</h3>
          <p>This self-managed frontend uses the Wix JavaScript SDK with Products V3, eCommerce Cart V2 and OAuth visitor authentication. Products, variants, quantities, prices and Wix-calculated subtotals remain synchronized with the visitor’s live cart without exposing an API key or client secret.</p>
          <p className="implementation-msid"><strong>MSID</strong><code>18f3c97d-8a8f-42e2-97e7-352a12873bf0</code></p>
          
          <p className="implementation-msid">
  <strong>GithubLink</strong>
  <a href="https://github.com/AndrianBarbulat/pssHeadlessProject" target="_blank" rel="noopener noreferrer">
    <code>https://github.com/AndrianBarbulat/pssHeadlessProject</code>
  </a>
</p>
          <a className="button" href={headlessCartUrl} target="_blank" rel="noreferrer">Open Headless site ↗</a>
        </article>

        <article className="cart-implementation">
          <div className="implementation-labels">
            <span>Wix Studio</span>
            <span>Velo</span>
          </div>
          <h3>Wix Studio cart summary</h3>
          <p>This implementation uses Wix Studio and Velo with Wix eCommerce Current Cart and frontend APIs. It displays product images, names, options, quantities, prices and subtotal, supports quantity changes and removal, and treats the absence of an active cart as the expected empty state.</p>
          <p className="implementation-msid"><strong>MSID</strong><code>e35197ab-f991-400f-b0db-5b2fccda1a55</code></p>
          <a className="button" href={studioCartUrl} target="_blank" rel="noreferrer">Open Wix Studio site ↗</a>
        </article>
      </div>
    </section>

    <div className="technical-tabs" role="tablist" aria-label="Technical deliverables">
      <button role="tab" aria-selected={selected === 'investigation'} onClick={() => setSelected('investigation')}>Investigation &amp; solutions</button>
      <button role="tab" aria-selected={selected === 'response'} onClick={() => setSelected('response')}>User-facing response</button>
    </div>

    <div role="tabpanel">
      {selected === 'investigation' ? <Investigation /> : <CustomerResponse />}
    </div>
  </div>;
}
