/**
 * Persists MVP state in localStorage with one-time seed from DEMO_SEED.
 */
(function (global) {
  const KEY = "soccerCoachMvp_v1";

  function loadRaw() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function seedIfNeeded() {
    const existing = loadRaw();
    if (existing && existing.version === 1) return existing;

    const seed = global.DEMO_SEED;
    if (!seed) throw new Error("DEMO_SEED missing");

    const state = {
      version: 1,
      users: { ...seed.users },
      teams: [...seed.teams],
      weeklySessions: seed.weeklySessions.map((s) => JSON.parse(JSON.stringify(s))),
      notifications: seed.notifications.map((n) => ({ ...n })),
      checklistTemplates: [...seed.checklistTemplates],
      playerChecklists: {},
    };

    localStorage.setItem(KEY, JSON.stringify(state));
    return state;
  }

  function save(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function getState() {
    return seedIfNeeded();
  }

  function update(mutator) {
    const state = getState();
    mutator(state);
    save(state);
    return state;
  }

  global.StorageAPI = { getState, update, loadRaw, KEY };
})(typeof window !== "undefined" ? window : globalThis);
