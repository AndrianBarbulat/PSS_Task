import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import investigationMarkdown from '../../docs/wix-task-2/INVESTIGATION_AND_SOLUTIONS.md?raw';
import responseMarkdown from '../../docs/wix-task-2/USER_FACING_RESPONSE.md?raw';
import './TechnicalWork.css';

const investigationUrl = 'https://github.com/AndrianBarbulat/PSS_Task/blob/main/docs/wix-task-2/INVESTIGATION_AND_SOLUTIONS.md';
const responseUrl = 'https://github.com/AndrianBarbulat/PSS_Task/blob/main/docs/wix-task-2/USER_FACING_RESPONSE.md';
const clonedSiteUrl = 'https://andrianb.wixsite.com/psstechtask2/category/all-products';
const cartSummaryUrl = 'https://andrianb.wixstudio.com/cart-summary/cart-summary';

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
      <p className="lead">This section includes the published custom cart summary and the investigation of the custom order-request flow.</p>
      <p className="technical-site-link"><strong>Cloned Wix test site:</strong> <a href={clonedSiteUrl} target="_blank" rel="noreferrer">andrianb.wixsite.com/psstechtask2/category/all-products ↗</a></p>
      <div className="technical-statuses"><span>Task 1 published</span><span>Investigation complete</span><span>Response complete</span><span className="pending">Task 2 retest pending</span></div>
    </header>

    <section className="cart-summary-deliverable" aria-labelledby="cart-summary-title">
      <div>
        <p className="eyebrow">Task 1 · Build a custom cart summary</p>
        <h2 id="cart-summary-title">Published cart summary</h2>
        <p>I built the cart summary with the Wix eCommerce Current Cart and frontend APIs. It displays product images, names, options, quantities, prices and the subtotal, supports quantity changes and removal, and uses the cart-change event to keep the page synchronized. A visitor without an active cart is handled as the expected empty-cart state.</p>
      </div>
      <a className="button" href={cartSummaryUrl} target="_blank" rel="noreferrer">Open published site ↗</a>
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
