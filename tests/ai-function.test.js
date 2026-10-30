import assert from 'node:assert/strict';
import { test } from 'node:test';
import aiBrief from '../netlify/functions/psg-ai-brief.mjs';

test('AI brief function uses the Netlify v2 Response contract', async () => {
  const response = await aiBrief(new Request('http://localhost/api/psg-ai-brief', {
    method: 'GET',
  }));

  assert.ok(response instanceof Response);
  assert.equal(response.status, 405);
  assert.deepEqual(await response.json(), { error: 'Method not allowed.' });
});
