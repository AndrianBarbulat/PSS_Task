import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const technicalPage = readFileSync(
  new URL('../src/pages/TechnicalWork.jsx', import.meta.url),
  'utf8',
);
const technicalStyles = readFileSync(
  new URL('../src/pages/TechnicalWork.css', import.meta.url),
  'utf8',
);
const investigation = readFileSync(
  new URL('../docs/wix-task-2/INVESTIGATION_AND_SOLUTIONS.md', import.meta.url),
  'utf8',
);
const customerResponse = readFileSync(
  new URL('../docs/wix-task-2/USER_FACING_RESPONSE.md', import.meta.url),
  'utf8',
);

test('Part 5 renders both complete Markdown deliverables as its source of truth', () => {
  assert.match(
    technicalPage,
    /INVESTIGATION_AND_SOLUTIONS\.md\?raw/,
  );
  assert.match(
    technicalPage,
    /USER_FACING_RESPONSE\.md\?raw/,
  );
  assert.match(technicalPage, /<MarkdownDocument source=\{investigationMarkdown\}/);
  assert.match(technicalPage, /<MarkdownDocument source=\{responseMarkdown\}/);
});

test('the displayed investigation contains the full findings and conclusion', () => {
  const requiredHeadings = [
    '# Task 2 — Technical investigation and proposed solutions',
    '## Investigation approach',
    '## 1. Main issues preventing a working checkout flow',
    '## 2. Strongly recommended improvements',
    '## 3. Advisory improvements',
    '## Verification requirements',
    '## Final investigation conclusion',
  ];

  for (const heading of requiredHeadings) {
    assert.ok(investigation.includes(heading), `Missing ${heading}`);
  }

  assert.match(investigation, /38\. No Wix platform defect/);
  assert.match(investigation, /A remaining failure can still be reproduced as Wix platform behaviour\./);
});

test('the final response and enlarged Part 5 labels remain present', () => {
  assert.match(customerResponse, /^# User-facing response/m);
  assert.match(customerResponse, /This is Andrian from Wix/);
  assert.match(customerResponse, /lineItemIds\.length > 1/);
  assert.match(customerResponse, /Andrian \| Wix Customer Care/);
  assert.match(technicalStyles, /\.technical-tabs button \{[\s\S]*font-size: 17px;/);
});
