(function (global) {
  function generateId(prefix) {
    return (prefix ? prefix + "-" : "") + Math.random().toString(36).slice(2, 10);
  }

  function formatWeekLabel(isoDate) {
    if (!isoDate) return "";
    const d = new Date(isoDate + "T12:00:00");
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  function toast(message, type) {
    const root = document.getElementById("toast-root");
    if (!root) return;
    const el = document.createElement("div");
    el.className = "toast" + (type ? " toast--" + type : "");
    el.setAttribute("role", "status");
    el.textContent = message;
    root.appendChild(el);
    requestAnimationFrame(() => el.classList.add("toast--show"));
    const t = setTimeout(() => {
      el.classList.remove("toast--show");
      setTimeout(() => el.remove(), 280);
    }, 3200);
    el.addEventListener("click", () => {
      clearTimeout(t);
      el.remove();
    });
  }

  global.Utils = { generateId, formatWeekLabel, toast };
})(typeof window !== "undefined" ? window : globalThis);
