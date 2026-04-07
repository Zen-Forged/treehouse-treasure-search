// lib/safeStorage.ts
// localStorage wrapper with sessionStorage fallback.
// Safari in private browsing mode throws on localStorage writes and
// clears localStorage between sessions (ITP). This utility tries
// localStorage first, falls back to sessionStorage, then in-memory.

const memFallback: Record<string, string> = {};

function tryLocalStorage(): Storage | null {
  try {
    const test = "__th_test__";
    localStorage.setItem(test, "1");
    localStorage.removeItem(test);
    return localStorage;
  } catch {
    return null;
  }
}

function trySessionStorage(): Storage | null {
  try {
    const test = "__th_test__";
    sessionStorage.setItem(test, "1");
    sessionStorage.removeItem(test);
    return sessionStorage;
  } catch {
    return null;
  }
}

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      const ls = tryLocalStorage();
      if (ls) {
        const val = ls.getItem(key);
        if (val !== null) return val;
      }
      // Also check sessionStorage in case it was saved there previously
      const ss = trySessionStorage();
      if (ss) {
        const val = ss.getItem(key);
        if (val !== null) return val;
      }
      return memFallback[key] ?? null;
    } catch {
      return memFallback[key] ?? null;
    }
  },

  setItem(key: string, value: string): void {
    memFallback[key] = value; // always keep in-memory copy
    try {
      const ls = tryLocalStorage();
      if (ls) { ls.setItem(key, value); return; }
    } catch {}
    try {
      const ss = trySessionStorage();
      if (ss) { ss.setItem(key, value); return; }
    } catch {}
    // memFallback already set above
  },

  removeItem(key: string): void {
    delete memFallback[key];
    try { localStorage.removeItem(key); } catch {}
    try { sessionStorage.removeItem(key); } catch {}
  },
};
