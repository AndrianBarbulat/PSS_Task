const DATABASE_NAME = 'pss-queue-control';
const DATABASE_VERSION = 1;
const STORE_NAME = 'snapshots';

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('This browser does not support local snapshot storage.'));
      return;
    }
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onerror = () => reject(request.error || new Error('Could not open the snapshot library.'));
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('snapshotKey', 'snapshotKey', { unique: false });
        store.createIndex('importedAt', 'importedAt', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

function transact(mode, operation) {
  return openDatabase().then(database => new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = operation(store);
    let result;
    request.addEventListener('error', () => reject(request.error || new Error('The snapshot operation failed.')));
    request.addEventListener('success', () => { result = request.result; });
    transaction.oncomplete = () => { database.close(); resolve(result); };
    transaction.onerror = () => { database.close(); reject(transaction.error || new Error('The snapshot transaction failed.')); };
  }));
}

const createId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function createSnapshotEntry({ raw, report, record, sourceName, warnings = [], id = createId() }) {
  return {
    id,
    snapshotKey: record.key,
    label: record.label,
    sourceName,
    importedAt: new Date().toISOString(),
    raw,
    record,
    warnings,
    aiBrief: null,
  };
}

export function sortSnapshots(entries) {
  return [...entries].sort((a, b) =>
    b.snapshotKey.localeCompare(a.snapshotKey) || b.importedAt.localeCompare(a.importedAt)
  );
}

export function selectPreviousSnapshot(entries, currentEntry, selectedBaselineId = '') {
  if (!currentEntry) return null;
  const selected = entries.find(entry => entry.id === selectedBaselineId && entry.id !== currentEntry.id);
  if (selected) return selected;
  return sortSnapshots(entries)
    .find(entry => entry.id !== currentEntry.id && entry.snapshotKey < currentEntry.snapshotKey) || null;
}

export function listSnapshotEntries() {
  return transact('readonly', store => store.getAll()).then(sortSnapshots);
}

export function saveSnapshotEntry(entry) {
  return transact('readwrite', store => store.put(entry)).then(() => entry);
}

export function removeSnapshotEntry(id) {
  return transact('readwrite', store => store.delete(id));
}

export function saveSnapshotBrief(id, brief) {
  return transact('readwrite', store => {
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      if (!getRequest.result) return;
      store.put({ ...getRequest.result, aiBrief: brief });
    };
    return getRequest;
  });
}
