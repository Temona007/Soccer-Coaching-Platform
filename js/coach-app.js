(function () {
  const session = AuthAPI.requireRole(["coach"]);
  if (!session) return;

  const rootTeamSelect = document.getElementById("team-select");
  const rootWeeklySelect = document.getElementById("weekly-select");
  const form = document.getElementById("weekly-form");
  const teamsList = document.getElementById("teams-list");
  const newTeamForm = document.getElementById("new-team-form");
  const notifBtn = document.getElementById("notif-toggle");
  const notifPanel = document.getElementById("notif-panel");
  const notifClose = document.getElementById("notif-close");
  const notifList = document.getElementById("notif-list");
  const notifBadge = document.getElementById("notif-badge");
  const logoutBtn = document.getElementById("logout");

  let selectedTeamId = null;
  let selectedSessionId = null;

  function state() {
    return StorageAPI.getState();
  }

  function coachTeams() {
    return state().teams.filter((t) => t.coachId === session.userId);
  }

  function sessionsForTeam(teamId) {
    return state().weeklySessions.filter((s) => s.teamId === teamId).sort((a, b) => (a.weekOf < b.weekOf ? 1 : -1));
  }

  function currentSession() {
    if (!selectedTeamId || !selectedSessionId) return null;
    return state().weeklySessions.find((s) => s.id === selectedSessionId) || null;
  }

  function playerIdsForTeam(teamId) {
    return Object.values(state().users)
      .filter((u) => u.role === "player" && u.teamId === teamId)
      .map((u) => u.id);
  }

  function renderTeamsList() {
    const teams = coachTeams();
    teamsList.innerHTML = "";
    if (!teams.length) {
      teamsList.innerHTML = '<p class="muted">No teams yet — create one below.</p>';
      return;
    }
    teams.forEach((t, i) => {
      const row = document.createElement("div");
      row.className = "drill-item";
      row.style.animation = "fadeUp 0.4s ease both";
      row.style.animationDelay = i * 0.04 + "s";
      row.innerHTML = `<strong>${escapeHtml(t.name)}</strong><div class="drill-meta">Created ${Utils.formatWeekLabel(t.createdAt.slice(0, 10))}</div>`;
      teamsList.appendChild(row);
    });
  }

  function fillTeamSelect() {
    const teams = coachTeams();
    rootTeamSelect.innerHTML = "";
    teams.forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = t.name;
      rootTeamSelect.appendChild(opt);
    });
    if (!selectedTeamId && teams[0]) selectedTeamId = teams[0].id;
    if (selectedTeamId) rootTeamSelect.value = selectedTeamId;
  }

  function fillWeeklySelect() {
    if (!selectedTeamId) {
      rootWeeklySelect.innerHTML = "";
      selectedSessionId = null;
      return;
    }
    const sessions = sessionsForTeam(selectedTeamId);
    rootWeeklySelect.innerHTML = "";
    sessions.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = `${Utils.formatWeekLabel(s.weekOf)} — ${s.title}`;
      rootWeeklySelect.appendChild(opt);
    });
    if (!sessions.length) {
      selectedSessionId = null;
      return;
    }
    const stillValid = sessions.some((s) => s.id === selectedSessionId);
    if (!stillValid) selectedSessionId = sessions[0].id;
    rootWeeklySelect.value = selectedSessionId;
  }

  function bindSessionToForm(s) {
    document.getElementById("week-of").value = s.weekOf;
    document.getElementById("week-title").value = s.title;
    document.getElementById("points").value = (s.coachingPoints || []).join("\n");
    const drillsEl = document.getElementById("drills-editor");
    drillsEl.innerHTML = "";
    (s.drills || []).forEach((d) => drillsEl.appendChild(drillRow(d)));
    const vids = document.getElementById("videos-editor");
    vids.innerHTML = "";
    (s.videos || []).forEach((v) => vids.appendChild(videoRow(v)));
    const links = document.getElementById("links-editor");
    links.innerHTML = "";
    (s.links || []).forEach((l) => links.appendChild(linkRow(l)));
  }

  function drillRow(d) {
    const wrap = document.createElement("div");
    wrap.className = "drill-item";
    wrap.innerHTML = `
      <div class="grid-2">
        <div class="field" style="margin:0">
          <label>Drill name</label>
          <input type="text" data-d-title value="${escapeAttr(d.title)}" />
        </div>
        <div class="field" style="margin:0">
          <label>Duration</label>
          <input type="text" data-d-dur value="${escapeAttr(d.duration)}" placeholder="e.g. 15 min" />
        </div>
      </div>
      <div class="field" style="margin-bottom:0">
        <label>Notes</label>
        <textarea data-d-notes>${escapeHtml(d.notes)}</textarea>
      </div>
      <button type="button" class="btn btn--danger btn--sm" data-remove-drill style="margin-top:0.5rem">Remove drill</button>
    `;
    wrap.querySelector("[data-remove-drill]").addEventListener("click", () => wrap.remove());
    return wrap;
  }

  function videoRow(v) {
    const wrap = document.createElement("div");
    wrap.className = "drill-item";
    wrap.innerHTML = `
      <div class="field" style="margin:0">
        <label>Video title</label>
        <input type="text" data-v-title value="${escapeAttr(v.title)}" />
      </div>
      <div class="field" style="margin-bottom:0">
        <label>URL</label>
        <input type="url" data-v-url value="${escapeAttr(v.url)}" placeholder="https://..." />
      </div>
      <button type="button" class="btn btn--danger btn--sm" data-remove-v style="margin-top:0.5rem">Remove</button>
    `;
    wrap.querySelector("[data-remove-v]").addEventListener("click", () => wrap.remove());
    return wrap;
  }

  function linkRow(l) {
    const wrap = document.createElement("div");
    wrap.className = "drill-item";
    wrap.innerHTML = `
      <div class="grid-2">
        <div class="field" style="margin:0">
          <label>Link label</label>
          <input type="text" data-l-label value="${escapeAttr(l.label)}" />
        </div>
        <div class="field" style="margin:0">
          <label>URL</label>
          <input type="url" data-l-url value="${escapeAttr(l.url)}" />
        </div>
      </div>
      <button type="button" class="btn btn--danger btn--sm" data-remove-l style="margin-top:0.5rem">Remove</button>
    `;
    wrap.querySelector("[data-remove-l]").addEventListener("click", () => wrap.remove());
    return wrap;
  }

  function readDrillsFromDom() {
    const drills = [];
    document.querySelectorAll("#drills-editor .drill-item").forEach((el) => {
      const title = el.querySelector("[data-d-title]")?.value.trim() || "Untitled drill";
      const duration = el.querySelector("[data-d-dur]")?.value.trim() || "—";
      const notes = el.querySelector("[data-d-notes]")?.value.trim() || "";
      drills.push({ id: Utils.generateId("d"), title, duration, notes });
    });
    return drills;
  }

  function readVideosFromDom() {
    const videos = [];
    document.querySelectorAll("#videos-editor .drill-item").forEach((el) => {
      const title = el.querySelector("[data-v-title]")?.value.trim() || "Video";
      const url = el.querySelector("[data-v-url]")?.value.trim() || "";
      if (!url) return;
      videos.push({ id: Utils.generateId("v"), title, url });
    });
    return videos;
  }

  function readLinksFromDom() {
    const links = [];
    document.querySelectorAll("#links-editor .drill-item").forEach((el) => {
      const label = el.querySelector("[data-l-label]")?.value.trim() || "Link";
      const url = el.querySelector("[data-l-url]")?.value.trim() || "";
      if (!url) return;
      links.push({ id: Utils.generateId("l"), label, url });
    });
    return links;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, "&#39;");
  }

  function refreshEditor() {
    const weekEmpty = document.getElementById("week-empty");
    const s = currentSession();
    if (!selectedTeamId) {
      form.hidden = true;
      if (weekEmpty) weekEmpty.hidden = true;
      return;
    }
    const sessions = sessionsForTeam(selectedTeamId);
    if (!sessions.length) {
      form.hidden = true;
      if (weekEmpty) weekEmpty.hidden = false;
      return;
    }
    if (weekEmpty) weekEmpty.hidden = true;
    if (!s) {
      form.hidden = true;
      return;
    }
    form.hidden = false;
    bindSessionToForm(s);
  }

  function refreshNotifications() {
    const all = state().notifications.filter((n) => n.userId === session.userId && n.role === "coach");
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

  function markCoachNotifsRead() {
    StorageAPI.update((st) => {
      st.notifications.forEach((n) => {
        if (n.userId === session.userId && n.role === "coach") n.read = true;
      });
    });
    refreshNotifications();
  }

  function openPanel() {
    notifPanel.classList.add("is-open");
    notifPanel.setAttribute("aria-hidden", "false");
    markCoachNotifsRead();
  }

  function closePanel() {
    notifPanel.classList.remove("is-open");
    notifPanel.setAttribute("aria-hidden", "true");
  }

  rootTeamSelect.addEventListener("change", () => {
    selectedTeamId = rootTeamSelect.value;
    selectedSessionId = null;
    fillWeeklySelect();
    refreshEditor();
  });

  rootWeeklySelect.addEventListener("change", () => {
    selectedSessionId = rootWeeklySelect.value;
    refreshEditor();
  });

  document.getElementById("add-drill").addEventListener("click", () => {
    document.getElementById("drills-editor").appendChild(
      drillRow({ title: "", duration: "", notes: "" })
    );
  });
  document.getElementById("add-video").addEventListener("click", () => {
    document.getElementById("videos-editor").appendChild(videoRow({ title: "", url: "" }));
  });
  document.getElementById("add-link").addEventListener("click", () => {
    document.getElementById("links-editor").appendChild(linkRow({ label: "", url: "" }));
  });

  document.getElementById("new-week").addEventListener("click", () => {
    if (!selectedTeamId) return;
    const id = Utils.generateId("session");
    const today = new Date().toISOString().slice(0, 10);
    StorageAPI.update((st) => {
      st.weeklySessions.push({
        id,
        teamId: selectedTeamId,
        weekOf: today,
        title: "New training week",
        drills: [
          {
            id: Utils.generateId("d"),
            title: "Warm-up — dynamic movement",
            duration: "12 min",
            notes: "High knees, lateral shuffle, light stretch.",
          },
        ],
        coachingPoints: ["Focus on quality touches.", "Communicate early."],
        videos: [],
        links: [],
        updatedAt: new Date().toISOString(),
      });
    });
    selectedSessionId = id;
    fillWeeklySelect();
    rootWeeklySelect.value = id;
    refreshEditor();
    Utils.toast("New week created — customize and save.", "success");
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const s = currentSession();
    if (!s) return;
    const weekOf = document.getElementById("week-of").value;
    const title = document.getElementById("week-title").value.trim() || "Training week";
    const coachingPoints = document
      .getElementById("points")
      .value.split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const drills = readDrillsFromDom();
    const videos = readVideosFromDom();
    const links = readLinksFromDom();

    StorageAPI.update((st) => {
      const idx = st.weeklySessions.findIndex((x) => x.id === s.id);
      if (idx === -1) return;
      st.weeklySessions[idx] = {
        ...st.weeklySessions[idx],
        weekOf,
        title,
        drills,
        coachingPoints,
        videos,
        links,
        updatedAt: new Date().toISOString(),
      };

      const targets = playerIdsForTeam(st.weeklySessions[idx].teamId);
      const msg = `Training plan updated: ${title} (${Utils.formatWeekLabel(weekOf)})`;
      targets.forEach((uid) => {
        st.notifications.push({
          id: Utils.generateId("n"),
          userId: uid,
          role: "player",
          message: msg,
          read: false,
          createdAt: new Date().toISOString(),
        });
      });
    });

    Utils.toast("Saved. In-app alerts sent to players; email notification simulated.", "success");
    renderTeamsList();
    fillWeeklySelect();
    refreshNotifications();
  });

  newTeamForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("new-team-name").value.trim();
    if (!name) return;
    const id = Utils.generateId("team");
    StorageAPI.update((st) => {
      st.teams.push({
        id,
        name,
        coachId: session.userId,
        createdAt: new Date().toISOString(),
      });
    });
    document.getElementById("new-team-name").value = "";
    selectedTeamId = id;
    fillTeamSelect();
    fillWeeklySelect();
    refreshEditor();
    renderTeamsList();
    Utils.toast("Team created.", "success");
  });

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

  fillTeamSelect();
  fillWeeklySelect();
  if (rootTeamSelect.value) selectedTeamId = rootTeamSelect.value;
  if (rootWeeklySelect.value) selectedSessionId = rootWeeklySelect.value;
  renderTeamsList();
  refreshEditor();
  refreshNotifications();
})();
