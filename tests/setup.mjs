// Minimal in-memory localStorage/sessionStorage so the pure data layer can run in Node.
class MemoryStorage {
  constructor() { this.m = new Map(); }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) { this.m.set(k, String(v)); }
  removeItem(k) { this.m.delete(k); }
  clear() { this.m.clear(); }
}
export function installBrowser() {
  globalThis.window = { localStorage: new MemoryStorage(), sessionStorage: new MemoryStorage() };
  return globalThis.window;
}
export function freshBrowser() {
  return installBrowser();
}
