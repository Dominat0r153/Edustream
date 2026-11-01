const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DEFAULT_DATA_FILE = path.join(DATA_DIR, 'edustream.json');
const DATA_FILE = process.env.EDUSTREAM_DATA_FILE || DEFAULT_DATA_FILE;
const CACHE_ENABLED = process.env.NODE_ENV !== 'test';
let cachedStore = null;
let cacheLoadedAt = 0;

function ensureStore() {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ users: [], classrooms: [], grades: [] }, null, 2));
  }
}

function readStore() {
  ensureStore();
  if (CACHE_ENABLED && cachedStore) return cachedStore;
  try {
    const store = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    if (CACHE_ENABLED) {
      cachedStore = store;
      cacheLoadedAt = Date.now();
    }
    return store;
  } catch (error) {
    throw new Error(`Could not read EduStream data store: ${error.message}`);
  }
}

function writeStore(data) {
  ensureStore();
  const temp = `${DATA_FILE}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(data, null, 2));
  fs.renameSync(temp, DATA_FILE);
  if (CACHE_ENABLED) {
    cachedStore = data;
    cacheLoadedAt = Date.now();
  }
}

function clearStoreCache() {
  cachedStore = null;
  cacheLoadedAt = 0;
}

ensureStore();

const sequelize = {
  async authenticate() { ensureStore(); return true; },
  async sync() { ensureStore(); return true; },
  async close() { clearStoreCache(); return true; }
};

module.exports = { sequelize, readStore, writeStore, clearStoreCache, DATA_FILE, DATA_DIR, getCacheAge: () => cacheLoadedAt ? Date.now() - cacheLoadedAt : null };
