(function () {
  const session = AuthAPI.requireRole(["player"]);
  if (!session) return;

  const notifBtn = document.getElementById("notif-toggle");
  const notifPanel = document.getElementById("notif-panel");
  const notifClose = document.getElementById("notif-close");
  const notifList = document.getElementById("notif-list");
  const notifBadge = document.getElementById("notif-badge");
  const logoutBtn = document.getElementById("logout");
  const teamNameEl = document.getElementById("team-name");
  const weekTitleEl = document.getElementById("week-title");
  const weekMetaEl = document.getElementById("week-meta");
  const drillsOut = document.getElementById("drills-out");
  const pointsOut = document.getElementById("points-out");
  const videosOut = document.getElementById("videos-out");
  const linksOut = document.getElementById("links-out");
  const checklistEl = document.getElementById("checklist");
  const emptyState = document.getElementById("player-empty");

  function state() {
    return StorageAPI.getState();
  }

  function teamForPlayer() {
    const tid = session.teamId;
    return state().teams.find((t) => t.id === tid) || null;
  }

  function latestSession() {
    const tid = session.teamId;
    const sessions = state()
      .weeklySessions.filter((s) => s.teamId === tid)
      .sort((a, b) => (a.weekOf < b.weekOf ? 1 : -1));
    return sessions[0] || null;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function refreshNotifications() {
    const all = state().notifications.filter((n) => n.userId === session.userId && n.role === "player");
    const unread = all.filter((n) => !n.read).length;
    notifBadge.hidden = unread === 0;
    notifBadge.textContent = String(unread);
    notifList.innerHTML = "";
    if (!all.length) {
      notifList.innerHTML = '<p class="empty-state">No notifications yet.</p>';
      return;
    }
    all
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .forEach((n) => {
        const el = document.createElement("div");
        el.className = "notif-item" + (n.read ? "" : " notif-item--unread");
        el.innerHTML = `<p style="margin:0">${escapeHtml(n.message)}</p><span class="notif-time">${new Date(n.createdAt).toLocaleString()}</span>`;
        notifList.appendChild(el);
      });
  }

  function markPlayerNotifsRead() {
    StorageAPI.update((st) => {
      st.notifications.forEach((n) => {
        if (n.userId === session.userId && n.role === "player") n.read = true;
      });
    });
    refreshNotifications();
  }

  function openPanel() {
    notifPanel.classList.add("is-open");
    notifPanel.setAttribute("aria-hidden", "false");
    markPlayerNotifsRead();
  }

  function closePanel() {
    notifPanel.classList.remove("is-open");
    notifPanel.setAttribute("aria-hidden", "true");
  }

  function checklistKey(sessionId) {
    return session.userId + "::" + sessionId;
  }

  function getChecklistState(sessionId) {
    const st = state();
    const key = checklistKey(sessionId);
    const raw = st.playerChecklists[key];
    if (raw) return raw;
    const tmpl = {};
    st.checklistTemplates.forEach((c) => {
      tmpl[c.id] = false;
    });
    return tmpl;
  }

  function saveChecklistItem(sessionId, itemId, done) {
    StorageAPI.update((st) => {
      const key = checklistKey(sessionId);
      if (!st.playerChecklists[key]) {
        st.playerChecklists[key] = {};
        st.checklistTemplates.forEach((c) => {
          st.playerChecklists[key][c.id] = false;
        });
      }
      st.playerChecklists[key][itemId] = done;
    });
    if (done) Utils.toast("Nice — keep the habit going.", "success");
  }

  function renderTraining(s) {
    if (!s) {
      emptyState.hidden = false;
      document.getElementById("training-content").hidden = true;
      return;
    }
    emptyState.hidden = true;
    document.getElementById("training-content").hidden = false;

    teamNameEl.textContent = teamForPlayer()?.name || "Your team";
    weekTitleEl.textContent = s.title;
    weekMetaEl.textContent = "Week of " + Utils.formatWeekLabel(s.weekOf);

    drillsOut.innerHTML = "";
    (s.drills || []).forEach((d) => {
      const el = document.createElement("div");
      el.className = "drill-item";
      el.style.animation = "fadeUp 0.45s ease both";
      el.innerHTML = `<h4>${escapeHtml(d.title)}</h4><div class="drill-meta">${escapeHtml(d.duration)}</div><p class="muted" style="margin:0">${escapeHtml(d.notes)}</p>`;
      drillsOut.appendChild(el);
    });

    pointsOut.innerHTML = "";
    (s.coachingPoints || []).forEach((p) => {
      const li = document.createElement("li");
      li.textContent = p;
      pointsOut.appendChild(li);
    });

    videosOut.innerHTML = "";
    (s.videos || []).forEach((v) => {
      const row = document.createElement("div");
      row.className = "drill-item";
      row.innerHTML = `<strong>${escapeHtml(v.title)}</strong><div style="margin-top:0.35rem"><a href="${escapeAttr(v.url)}" target="_blank" rel="noopener noreferrer">Open video ↗</a></div>`;
      videosOut.appendChild(row);
    });

    linksOut.innerHTML = "";
    (s.links || []).forEach((l) => {
      const row = document.createElement("div");
      row.className = "drill-item";
      row.innerHTML = `<a href="${escapeAttr(l.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(l.label)} ↗</a>`;
      linksOut.appendChild(row);
    });

    const checks = getChecklistState(s.id);
    checklistEl.innerHTML = "";
    state().checklistTemplates.forEach((c, idx) => {
      const li = document.createElement("li");
      li.style.animation = "fadeUp 0.4s ease both";
      li.style.animationDelay = idx * 0.04 + "s";
      const id = "chk-" + c.id;
      li.innerHTML = `<input type="checkbox" id="${id}" ${checks[c.id] ? "checked" : ""} />
        <label for="${id}">${escapeHtml(c.label)}</label>`;
      const input = li.querySelector("input");
      input.addEventListener("change", () => saveChecklistItem(s.id, c.id, input.checked));
      checklistEl.appendChild(li);
    });
  }

  function escapeAttr(s) {
    return String(s).replace(/"/g, "&quot;");
  }

  notifBtn.addEventListener("click", () => {
    if (notifPanel.classList.contains("is-open")) closePanel();
    else openPanel();
  });
  notifClose.addEventListener("click", closePanel);
  notifPanel.querySelector(".notif-panel__backdrop").addEventListener("click", closePanel);

  logoutBtn.addEventListener("click", () => {
    AuthAPI.clearSession();
    window.location.href = "index.html";
  });

  document.getElementById("user-label").textContent = session.name || session.email;

  renderTraining(latestSession());
  refreshNotifications();
})();
