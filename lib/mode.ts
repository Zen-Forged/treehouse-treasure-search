// lib/mode.ts
// Explorer / Curator mode toggle.
// Explorer = buyer browsing finds.
// Curator  = vendor managing their shelf.
// Stored in localStorage. Defaults to "explorer".

export type AppMode = "explorer" | "curator";

const MODE_KEY = "treehouse_mode";

export function getMode(): AppMode {
  try {
    const v = localStorage.getItem(MODE_KEY);
    if (v === "curator") return "curator";
  } catch {}
  return "explorer";
}

export function setMode(mode: AppMode): void {
  try { localStorage.setItem(MODE_KEY, mode); } catch {}
}

export function toggleMode(): AppMode {
  const next = getMode() === "explorer" ? "curator" : "explorer";
  setMode(next);
  return next;
}
