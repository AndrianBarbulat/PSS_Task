import React, { useState } from 'react';
import './TechnicalWork.css';

const investigationUrl = 'https://github.com/AndrianBarbulat/PSS_Task/blob/main/docs/wix-task-2/INVESTIGATION_AND_SOLUTIONS.md';
const responseUrl = 'https://github.com/AndrianBarbulat/PSS_Task/blob/main/docs/wix-task-2/USER_FACING_RESPONSE.md';
const baselineUrl = 'https://github.com/AndrianBarbulat/PSS_Task/tree/main/docs/wix-task-2';
const clonedSiteUrl = 'https://andrianb.wixsite.com/psstechtask2/category/all-products';

const mainIssues = [
  {
    number: '1.1',
    title: 'A valid one-line cart was treated as empty',
    evidence: "The original condition used lineItems.length === 1, so one distinct product line was rejected even when its quantity was greater than one.",
    resolution: 'Treat a cart as empty only when it contains zero line items.',
    code: `const lineItems = cart?.lineItems ?? [];

if (lineItems.length === 0) {
    showError('Your cart is empty.');
    return;
}`,
    classification: 'Custom-code logic error',
  },
  {
    number: '1.2',
    title: 'The flow used inconsistent CMS collection IDs',
    evidence: 'The backend inserted into TestOrderRequest, updated OrderRequests, and the Success page queried TestOrderRequest. The Wix logs also reported WDE0025 because TestOrderRequest did not exist.',
    resolution: 'Define OrderRequests once and use it for the insert, update, and protected lookup.',
    code: `const COLLECTION_ID = 'OrderRequests';`,
    classification: 'Custom-code and CMS configuration error',
  },
  {
    number: '1.3',
    title: 'The Success page did not have collection read permission',
    evidence: 'The direct frontend query produced WDE0027. Opening the entire collection to members would remove the error but expose customer and order-request information too broadly.',
    resolution: 'Keep the collection restrictive and retrieve one member-owned record through a protected backend web method.',
    code: `export const getOrderRequest = webMethod(
    Permissions.SiteMember,
    async (orderId) => {
        // Retrieve and authorize one record.
    }
);`,
    classification: 'CMS permission and implementation-security issue',
  },
  {
    number: '1.4',
    title: 'The generated payment link was incomplete',
    evidence: 'The original value had no https:// protocol and inserted the order ID without encoding.',
    resolution: 'Generate a complete encoded URL, while clearly identifying testpayment.link as a placeholder rather than a payment integration.',
    code: 'const paymentLink =\n    `https://testpayment.link/pay?orderId=${encodeURIComponent(orderId)}`;',
    classification: 'Custom-code and integration-scope issue',
  },
];

const strongRecommendations = [
  'Verify record ownership in the backend; member authentication alone is not record authorization.',
  'Load the authoritative current cart in backend code instead of trusting a browser-supplied cart object.',
  'Replace the unsupported item.product reference with documented line-item fields.',
  'Store readable variants, quantities and prices from productName and descriptionLines.',
  'Correct the related one-line cleanup condition; for this flow, delete the complete submitted cart after CMS creation succeeds.',
  'Separate creation, cart deletion, UI refresh and navigation failures so a partial success is reported accurately.',
  'Confirm the actual CMS field IDs and available member profile data before changing the schema.',
];

const advisoryRecommendations = [
  'Treat reuse of an emptied cart ID as expected behaviour, not evidence of a Wix defect.',
  'Describe suppressAuth accurately; the original backend already used it, and the improvement is controlled backend access plus ownership checks.',
  'Handle partial insert/update results and add duplicate-submission protection.',
  'Handle a completely missing current cart as an empty-cart state.',
  'Display success only after the authorized record has been retrieved.',
  'Describe this as a custom order-request flow, not a native Wix checkout or order.',
  'Keep the payment-provider limitation explicit until a real payment session is implemented.',
];

const documentation = [
  ['Current Cart', 'https://dev.wix.com/docs/velo/apis/wix-ecom-backend/current-cart/get-current-cart'],
  ['Delete Current Cart', 'https://dev.wix.com/docs/velo/apis/wix-ecom-backend/current-cart/delete-current-cart'],
  ['Web Methods', 'https://dev.wix.com/docs/velo/apis/wix-web-module/introduction'],
  ['Security best practices', 'https://dev.wix.com/docs/develop-websites/articles/best-practices/security-best-practices'],
  ['Wix Data Get', 'https://dev.wix.com/docs/velo/apis/wix-data/get'],
];

function Investigation() {
  return <>
    <section className="technical-intro">
      <p className="eyebrow">Deliverable 1 · Investigation &amp; solutions</p>
      <h2>Task 2 — Technical investigation and proposed solutions</h2>
      <p>Based on my experience working with Velo APIs, I treated the report as a sequence to reproduce rather than assuming the user’s diagnosis or a Wix platform defect was correct.</p>
      <div className="failure-flow" aria-label="Main failure sequence">
        <span>One-line cart rejected</span><b>→</b><span>Collection IDs diverge</span><b>→</b><span>Success lookup fails</span><b>→</b><span>Frontend read denied</span>
      </div>
    </section>

    <section className="technical-section">
      <p className="eyebrow">1 · Main blockers</p>
      <h2>Main issues preventing the flow</h2>
      <div className="issue-grid">
        {mainIssues.map(issue => <article className="issue-card" key={issue.number}>
          <p className="issue-number">{issue.number}</p>
          <h3>{issue.title}</h3>
          <p>{issue.evidence}</p>
          <pre><code>{issue.code}</code></pre>
          <p><strong>Resolution:</strong> {issue.resolution}</p>
          <p className="classification">{issue.classification} · No Wix escalation required</p>
        </article>)}
      </div>
    </section>

    <section className="technical-section recommendation-layout">
      <div>
        <p className="eyebrow">2 · Strongly recommended</p>
        <h2>Security, correctness and reliability</h2>
        <ol>{strongRecommendations.map(item => <li key={item}>{item}</li>)}</ol>
      </div>
      <div>
        <p className="eyebrow">3 · Advisory</p>
        <h2>Production hardening</h2>
        <ul>{advisoryRecommendations.map(item => <li key={item}>{item}</li>)}</ul>
      </div>
    </section>

    <section className="technical-section conclusion-card">
      <p className="eyebrow">Escalation decision</p>
      <h2>No Wix platform defect demonstrated</h2>
      <p>The available evidence is explained by custom-code and CMS-configuration issues. In my opinion, escalation would become appropriate only if the corrected implementation is published, the CMS configuration is verified, the complete test matrix is executed, and a remaining failure can still be reproduced as Wix platform behaviour.</p>
      <div className="technical-links">
        <a className="button primary" href={investigationUrl} target="_blank" rel="noreferrer">Read the complete investigation ↗</a>
        <a className="button" href={baselineUrl} target="_blank" rel="noreferrer">Review the coding baseline ↗</a>
      </div>
    </section>

    <section className="technical-section">
      <p className="eyebrow">Official documentation</p>
      <div className="documentation-list">{documentation.map(([name, url]) => <a href={url} target="_blank" rel="noreferrer" key={url}><strong>{name}</strong><span>{url}</span></a>)}</div>
    </section>
  </>;
}

function CustomerResponse() {
  return <section className="email-preview" aria-labelledby="customer-response-title">
    <header>
      <p className="eyebrow">Deliverable 2 · User-facing response</p>
      <h2 id="customer-response-title">Final response to the user</h2>
      <a href={responseUrl} target="_blank" rel="noreferrer">Open the Markdown version on GitHub ↗</a>
    </header>
    <div className="email-paper">
      <p>Hello,</p>
      <p>This is Andrian from Wix, and I hope you are having a fabulous day!</p>
      <p>I’m sorry to hear about the problem you encountered with your custom order flow. I recreated the reported behaviour and reviewed the Cart page, backend web method, Success page and CMS configuration.</p>
      <p>During my investigation, I found several implementation issues contributing to the failure. Correcting the following points should allow you to continue working on the project.</p>
      <p>The first issue is the Cart-page validation:</p>
      <pre><code>{`if (!cart.lineItems || cart.lineItems.length === 1)`}</code></pre>
      <p>This condition treats a cart containing exactly one product line as empty. It should check whether the cart contains zero line items instead:</p>
      <pre><code>{`const lineItems = cart?.lineItems ?? [];

if (lineItems.length === 0) {
    // The cart is empty.
}`}</code></pre>
      <p>The second issue concerns the CMS collection IDs. The backend creates the record in <code>TestOrderRequest</code>, updates <code>OrderRequests</code>, and the Success page then searches <code>TestOrderRequest</code>.</p>
      <p>Consequently, the order ID and payment link can be written to a different collection from the one queried by the Success page. In my opinion, the clearest solution is to use one collection ID consistently throughout the entire flow—for example:</p>
      <pre><code>{`const COLLECTION_ID = 'OrderRequests';`}</code></pre>
      <p>The third issue is the way the Success page retrieves the order. It queries the collection directly from frontend code, but the logged-in member does not have permission to read that collection. This produces the reported permissions error.</p>
      <p>I would not recommend opening the CMS collection to general member access simply to make this query work. Based on my experience with Velo APIs, the more secure solution is to keep the collection restricted and retrieve the request through a protected backend web method:</p>
      <pre><code>{`export const getOrderRequest = webMethod(
    Permissions.SiteMember,
    async (orderId) => {
        // Retrieve the record and verify that it belongs
        // to the currently logged-in member.
    }
);`}</code></pre>
      <p>This approach keeps the CMS data protected and prevents one member from retrieving another member’s request by changing the order ID in the page URL.</p>
      <p><strong>Relevant documentation:</strong></p>
      <ul className="email-links">
        <li><a href="https://dev.wix.com/docs/velo/apis/wix-web-module/introduction" target="_blank" rel="noreferrer">Wix Web Methods</a></li>
        <li><a href="https://dev.wix.com/docs/develop-websites/articles/best-practices/security-best-practices" target="_blank" rel="noreferrer">Velo security best practices</a></li>
        <li><a href="https://dev.wix.com/docs/velo/articles/getting-started/writing-backend-code" target="_blank" rel="noreferrer">Writing backend code</a></li>
        <li><a href="https://dev.wix.com/docs/velo/apis/wix-data/get" target="_blank" rel="noreferrer">Wix Data Get</a></li>
      </ul>
      <p>I also identified a second, related condition in the cart-cleanup logic:</p>
      <pre><code>{`if (lineItemIds.length > 1)`}</code></pre>
      <p>This condition clears the cart only when it contains two or more line items. Initially, this problem is hidden by the earlier validation because a one-line cart is rejected before the cleanup code can run. Once the validation is corrected, however, a successfully submitted one-line cart would still remain uncleared.</p>
      <p>If the submitted cart should be removed completely, I recommend:</p>
      <pre><code>{`await currentCart.deleteCurrentCart();
await wixEcomFrontend.refreshCart();`}</code></pre>
      <p>Alternatively, if the implementation should remove only the submitted line items, the existing condition should be changed from <code>lineItemIds.length &gt; 1</code> to <code>lineItemIds.length &gt; 0</code>.</p>
      <p><strong>Relevant documentation:</strong></p>
      <ul className="email-links">
        <li><a href="https://dev.wix.com/docs/velo/apis/wix-ecom-backend/current-cart/delete-current-cart" target="_blank" rel="noreferrer">Delete Current Cart</a></li>
        <li><a href="https://dev.wix.com/docs/velo/apis/wix-ecom-backend/current-cart/remove-line-items-from-current-cart" target="_blank" rel="noreferrer">Remove Line Items From Current Cart</a></li>
        <li><a href="https://dev.wix.com/docs/velo/apis/wix-ecom-frontend/refresh-cart" target="_blank" rel="noreferrer">Refresh Cart</a></li>
      </ul>
      <p>As an additional recommendation, the product information stored in the CMS should include the selected variants, quantity and price. This would make products with different options—for example, the same sweater in different colours or sizes—clearly distinguishable in the collection.</p>
      <p>After applying the corrections, I recommend testing the complete flow again.</p>
      <p>If you have further questions, don’t hesitate to contact us. We will be happy to assist you!</p>
      <p>Kind regards,<br />Andrian | Wix Customer Care</p>
    </div>
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

    <div role="tabpanel">{selected === 'investigation' ? <Investigation /> : <CustomerResponse />}</div>
  </div>;
}
