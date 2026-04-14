(function () {
  function go(role) {
    const users = window.DEMO_SEED.users;
    const creds =
      role === "coach"
        ? { email: users.coach.email, password: users.coach.password }
        : { email: users.player.email, password: users.player.password };
    const res = window.AuthAPI.login(creds.email, creds.password);
    if (!res.ok) {
      window.Utils.toast(res.error || "Login failed", "error");
      return;
    }
    window.location.href = role === "coach" ? "coach.html" : "player.html";
  }

  document.getElementById("btn-coach")?.addEventListener("click", () => go("coach"));
  document.getElementById("btn-player")?.addEventListener("click", () => go("player"));

  const form = document.getElementById("manual-login");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const res = window.AuthAPI.login(email, password);
      if (!res.ok) {
        window.Utils.toast(res.error || "Login failed", "error");
        return;
      }
      const role = res.user.role;
      window.location.href = role === "coach" ? "coach.html" : "player.html";
    });
  }
})();
