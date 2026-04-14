(function (global) {
  const SESSION_KEY = "soccerCoachMvp_session";

  function getSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function setSession(user) {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        teamId: user.teamId || null,
      })
    );
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  function login(email, password) {
    const state = global.StorageAPI.getState();
    const users = Object.values(state.users);
    const user = users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
    );
    if (!user) return { ok: false, error: "Invalid email or password." };
    setSession(user);
    return { ok: true, user };
  }

  function requireRole(roles) {
    const s = getSession();
    if (!s || !roles.includes(s.role)) {
      global.location.href = "index.html";
      return null;
    }
    return s;
  }

  global.AuthAPI = { getSession, setSession, clearSession, login, requireRole };
})(typeof window !== "undefined" ? window : globalThis);
