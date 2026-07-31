// Pure client-side storage: everything lives in the browser's localStorage.
// No network calls, no accounts, no external services of any kind.
// This mimics the small get/set/delete/list API the app expects.

const LS_KEY = "trailhead:store";

function readAll() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}
function writeAll(store) {
  localStorage.setItem(LS_KEY, JSON.stringify(store));
}

window.storage = {
  async get(key) {
    const store = readAll();
    if (!(key in store)) return null;
    return { key, value: store[key], shared: false };
  },
  async set(key, value) {
    const store = readAll();
    store[key] = value;
    writeAll(store);
    return { key, value, shared: false };
  },
  async delete(key) {
    const store = readAll();
    const existed = key in store;
    delete store[key];
    writeAll(store);
    return { key, deleted: existed, shared: false };
  },
  async list(prefix) {
    const store = readAll();
    const keys = Object.keys(store).filter((k) => !prefix || k.startsWith(prefix));
    return { keys, prefix, shared: false };
  },
};
