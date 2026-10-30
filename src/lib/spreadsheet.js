const JSON_EXTENSIONS = ['.json'];
const EXCEL_EXTENSIONS = ['.xlsx'];
const CSV_EXTENSIONS = ['.csv'];

const extensionOf = name => {
  const index = String(name || '').lastIndexOf('.');
  return index >= 0 ? String(name).slice(index).toLowerCase() : '';
};

const isEmptyRow = row => !Array.isArray(row) || row.every(value => value === null || value === undefined || value === '');

const normalizeCell = value => {
  if (value instanceof Date) {
    if (!Number.isFinite(value.getTime())) return null;
    // Excel serial timestamps can decode a fraction of a millisecond below the
    // displayed second. Round to the workbook's actual second-level precision.
    return new Date(Math.round(value.getTime() / 1000) * 1000).toISOString().replace(/\.000Z$/, '');
  }
  return value === undefined ? null : value;
};

const normalizeRows = rows => {
  const normalized = (Array.isArray(rows) ? rows : []).map(row =>
    (Array.isArray(row) ? row : []).map(normalizeCell)
  );
  while (normalized.length && isEmptyRow(normalized.at(-1))) normalized.pop();
  return normalized;
};

export function parseCsv(text) {
  const source = String(text);
  const rows = [[]];
  let cell = '', quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"' && source[index + 1] === '"') { cell += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else cell += character;
    } else if (character === '"') quoted = true;
    else if (character === ',') { rows.at(-1).push(cell); cell = ''; }
    else if (character === '\n') { rows.at(-1).push(cell.replace(/\r$/, '')); rows.push([]); cell = ''; }
    else cell += character;
  }
  rows.at(-1).push(cell.replace(/\r$/, ''));
  return normalizeRows(rows);
}

const REQUIRED_CASE_FIELDS = ['Case ID', 'Created On', 'Bundle', 'Topic', 'Escalation Source', 'Source Location', 'Escalation Reason', 'Priority', 'Current Owner', 'Handovers', 'Last Action', 'Age (hrs)', 'SLA Target (hrs)', 'SLA Breached'];

export function csvRowsToSnapshot(rows, baseSnapshot) {
  const normalized = normalizeRows(rows);
  if (!normalized.length || !Array.isArray(normalized[0])) throw new Error('The CSV file has no readable header row.');
  const headers = normalized[0].map(value => String(value || '').trim());
  const missing = REQUIRED_CASE_FIELDS.filter(field => !headers.includes(field));
  if (missing.length) throw new Error(`This CSV is not a compatible Open Cases export. Missing columns: ${missing.join(', ')}`);
  if (!baseSnapshot || typeof baseSnapshot !== 'object') throw new Error('A reference snapshot is required to supply SLA, topic and traffic definitions for an Open Cases CSV.');
  const snapshot = structuredClone(baseSnapshot);
  const numericFields = new Set(['Handovers', 'Age (hrs)', 'SLA Target (hrs)']);
  snapshot['Open Cases'] = [headers, ...normalized.slice(1).filter(row => row.some(value => value !== null && value !== '')).map(row => row.map((value, index) => numericFields.has(headers[index]) && value !== '' ? Number(value) : value))];
  const createdIndex = headers.indexOf('Created On');
  const ageIndex = headers.indexOf('Age (hrs)');
  const inferredTimes = snapshot['Open Cases'].slice(1).map(row => {
    const createdText = String(row[createdIndex] || '');
    const created = Date.parse(createdText.endsWith('Z') ? createdText : `${createdText}Z`);
    const age = Number(row[ageIndex]);
    return Number.isFinite(created) && Number.isFinite(age) ? created + age * 3600000 : null;
  }).filter(Number.isFinite).sort((a, b) => a - b);
  if (!inferredTimes.length) throw new Error('The CSV snapshot time could not be inferred from Created On and Age (hrs).');
  const inferred = inferredTimes[Math.floor(inferredTimes.length / 2)];
  const spreadHours = (inferredTimes.at(-1) - inferredTimes[0]) / 3600000;
  if (spreadHours > 1) throw new Error('The CSV rows imply inconsistent snapshot times. Check Created On and Age (hrs) before importing.');
  const notes = snapshot['Data Notes'];
  const snapshotRow = notes.slice(1).find(row => row[0] === 'Snapshot time');
  if (!snapshotRow) throw new Error('The reference Data Notes does not contain Snapshot time.');
  const inferredDate = new Date(inferred);
  const month = inferredDate.toLocaleString('en-GB', { month: 'long', timeZone: 'UTC' });
  const day = inferredDate.getUTCDate();
  const year = inferredDate.getUTCFullYear();
  const hour = String(inferredDate.getUTCHours()).padStart(2, '0');
  const minute = String(inferredDate.getUTCMinutes()).padStart(2, '0');
  snapshotRow[1] = `${month} ${day}, ${year}, ${hour}:${minute}`;
  return snapshot;
}

export function sheetsToSnapshot(sheets) {
  if (!Array.isArray(sheets) || !sheets.length) throw new Error('The workbook does not contain any readable worksheets.');
  const snapshot = {};
  for (const entry of sheets) {
    const name = String(entry?.sheet || '').trim();
    if (!name) throw new Error('A worksheet has no readable name.');
    if (Object.hasOwn(snapshot, name)) throw new Error(`Duplicate worksheet name: ${name}`);
    snapshot[name] = normalizeRows(entry.data);
  }
  return snapshot;
}

export async function parseSnapshotFile(file, excelReader, baseSnapshot) {
  const extension = extensionOf(file?.name);
  if (JSON_EXTENSIONS.includes(extension)) return JSON.parse(await file.text());
  if (CSV_EXTENSIONS.includes(extension)) return csvRowsToSnapshot(parseCsv(await file.text()), baseSnapshot);
  if (!EXCEL_EXTENSIONS.includes(extension)) throw new Error('Choose an .xlsx workbook, compatible Open Cases .csv export, or a compatible .json snapshot.');

  const readExcelFile = excelReader || (await import('read-excel-file/browser')).default;
  return sheetsToSnapshot(await readExcelFile(file));
}
