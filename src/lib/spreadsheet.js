const JSON_EXTENSIONS = ['.json'];
const EXCEL_EXTENSIONS = ['.xlsx'];

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

export async function parseSnapshotFile(file, excelReader) {
  const extension = extensionOf(file?.name);
  if (JSON_EXTENSIONS.includes(extension)) return JSON.parse(await file.text());
  if (!EXCEL_EXTENSIONS.includes(extension)) throw new Error('Choose an .xlsx workbook or a compatible .json snapshot.');

  const readExcelFile = excelReader || (await import('read-excel-file/browser')).default;
  return sheetsToSnapshot(await readExcelFile(file));
}
