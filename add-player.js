// Fantacalcio Pro — add-player.js (Versione con MODIFICA giocatore)
(function () {
  const btnAdd = document.getElementById("btn-add-player");
  const modal = document.getElementById("modal-add-player");
  const btnClose = document.getElementById("btn-close-modal");
  const btnCancel = document.getElementById("btn-cancel-modal");
  const btnSave = document.getElementById("btn-save-player");
  const modalTitle = modal ? modal.querySelector(".modal-header h3") : null;

  const F = {
    name: document.getElementById("new-p-name"),
    role: document.getElementById("new-p-role"),
    team: document.getElementById("new-p-team"),
    qt: document.getElementById("new-p-qt"),
    qtFanta: document.getElementById("new-p-qt-fanta"),
    qtGaz: document.getElementById("new-p-qt-gaz"),
    ia: document.getElementById("new-p-ia"),
    fascia: document.getElementById("new-p-fascia"),
    mediaVoto: document.getElementById("new-p-media-voto"),
    mediaFanta: document.getElementById("new-p-media-fanta"),
    gol: document.getElementById("new-p-gol"),
    assist: document.getElementById("new-p-assist"),
    amm: document.getElementById("new-p-amm"),
    sos: document.getElementById("new-p-sos"),
    valore: document.getElementById("new-p-valore")
  };

  const KEY_CUSTOM = "fantacalcio_custom_players";
  const KEY_REMOVED = "fantacalcio_removed_players";
  const KEY_EDITS = "fantacalcio_player_edits";
  const KEY_FASCE = "fantacalcio_manual_fasce";

  let editingPlayerId = null;

  function readJSON(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function readMap(key) {
    try {
      const raw = localStorage.getItem(key);
      const v = raw ? JSON.parse(raw) : {};
      return v && typeof v === "object" && !Array.isArray(v) ? v : {};
    } catch (e) { return {}; }
  }

  function writeJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  function numU(input) {
    if (!input) return undefined;
    const v = String(input.value).trim();
    if (v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }

  function txtU(input) {
    if (!input) return undefined;
    const v = String(input.value).trim();
    return v === "" ? undefined : v;
  }

  function getPlayer(id) {
    if (typeof PLAYERS === "undefined" || !Array.isArray(PLAYERS)) return null;
    return PLAYERS.find(function (p) { return p.id === id; }) || null;
  }

  /* ---------- Persistenza: rimozioni e modifiche ---------- */
  function applyRemovals() {
    const removed = readJSON(KEY_REMOVED);
    if (!removed.length) return;
    if (typeof PLAYERS !== "undefined" && Array.isArray(PLAYERS)) {
      for (let i = PLAYERS.length - 1; i >= 0; i--) {
        if (removed.includes(PLAYERS[i].id)) PLAYERS.splice(i, 1);
      }
    }
    const custom = readJSON(KEY_CUSTOM).filter(function (cp) {
      return !removed.includes(cp.id);
    });
    writeJSON(KEY_CUSTOM, custom);
  }

  function applyEdits() {
    const edits = readMap(KEY_EDITS);
    const ids = Object.keys(edits);
    if (!ids.length) return;
    ids.forEach(function (idStr) {
      const player = getPlayer(Number(idStr));
      if (!player) return;
      const changes = edits[idStr] || {};
      Object.keys(changes).forEach(function (k) {
        if (changes[k] === null) delete player[k];
        else player[k] = changes[k];
      });
    });
  }

  /* ---------- Pulsante + solo in Giocatori ---------- */
  function syncAddButton() {
    if (!btnAdd) return;
    const show = typeof currentView !== "undefined" && currentView === "players";
    btnAdd.style.display = show ? "flex" : "none";
  }

  /* ---------- Modale: apertura ---------- */
  function openModal() {
    if (!modal) return;
    editingPlayerId = null;
    modal.style.display = "flex";
    Object.keys(F).forEach(function (k) { if (F[k]) F[k].value = ""; });
    if (F.role) F.role.value = "C";
    if (modalTitle) modalTitle.textContent = "Nuovo Giocatore";
    if (btnSave) btnSave.textContent = "Salva Giocatore";
    if (F.name) F.name.focus();
  }

  function openEditModal(player) {
    if (!modal || !player) return;
    editingPlayerId = player.id;
    modal.style.display = "flex";

    F.name.value = player.nome || "";
    F.role.value = player.ruolo || "C";
    F.team.value = player.squadra && player.squadra !== "N.D." ? player.squadra : "";
    F.qt.value = player.qt !== undefined ? player.qt : "";
    F.qtFanta.value = player.qtFanta !== undefined ? player.qtFanta : "";
    F.qtGaz.value = player.qtGaz !== undefined ? player.qtGaz : "";
    F.ia.value = player.ia !== undefined ? player.ia : "";
    F.mediaVoto.value = player.mediaVoto !== undefined ? player.mediaVoto : "";
    F.mediaFanta.value = player.mediaFanta !== undefined ? player.mediaFanta : "";
    F.gol.value = player.ruolo === "P"
      ? (player.golSubiti !== undefined ? player.golSubiti : "")
      : (player.gol !== undefined ? player.gol : "");
    F.assist.value = player.assist !== undefined ? player.assist : "";
    F.amm.value = player.amm !== undefined ? player.amm : "";
    F.sos.value = player.sos && player.sos !== "N.D." ? player.sos : "";
    F.valore.value = player.valore || "";

    // Fascia: mostra quella manuale se esiste, altrimenti "Calcola da IA"
    let manual = null;
    try {
      const map = readMap(KEY_FASCE);
      if (map[player.id] !== undefined) manual = map[player.id];
    } catch (e) {}
    F.fascia.value = manual !== null ? String(manual) : "";

    if (modalTitle) modalTitle.textContent = "Modifica Giocatore";
    if (btnSave) btnSave.textContent = "Salva Modifiche";
  }

  function closeModal() {
    if (modal) modal.style.display = "none";
    editingPlayerId = null;
  }

  if (btnAdd) btnAdd.addEventListener("click", openModal);
  if (btnClose) btnClose.addEventListener("click", closeModal);
  if (btnCancel) btnCancel.addEventListener("click", closeModal);
  if (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target === modal) closeModal();
    });
  }

  function generateId() {
    return Date.now() + Math.floor(Math.random() * 1000);
  }

  /* ---------- Salvataggio NUOVO giocatore ---------- */
  function saveNew() {
    const name = txtU(F.name);
    if (!name) { alert("Inserisci almeno il nome del giocatore."); return; }

    const role = F.role ? F.role.value : "C";
    const newPlayer = {
      id: generateId(),
      nome: name,
      ruolo: role,
      squadra: txtU(F.team) || "N.D."
    };

    const ia = numU(F.ia);       if (ia !== undefined) newPlayer.ia = ia;
    const qt = numU(F.qt);       if (qt !== undefined) newPlayer.qt = qt;
    const qf = numU(F.qtFanta);  if (qf !== undefined) newPlayer.qtFanta = qf;
    const qg = numU(F.qtGaz);    if (qg !== undefined) newPlayer.qtGaz = qg;
    const mv = numU(F.mediaVoto);   if (mv !== undefined) newPlayer.mediaVoto = mv;
    const mf = numU(F.mediaFanta);  if (mf !== undefined) newPlayer.mediaFanta = mf;
    const gol = numU(F.gol);
    if (gol !== undefined) { if (role === "P") newPlayer.golSubiti = gol; else newPlayer.gol = gol; }
    const ass = numU(F.assist);  if (ass !== undefined) newPlayer.assist = ass;
    const amm = numU(F.amm);     if (amm !== undefined) newPlayer.amm = amm;
    const sos = txtU(F.sos);     if (sos) newPlayer.sos = sos;
    const val = txtU(F.valore);  if (val) newPlayer.valore = val;

    const fasciaSel = F.fascia ? F.fascia.value : "";
    if (fasciaSel) newPlayer.fasciaManual = fasciaSel === "R" ? "R" : Number(fasciaSel);

    if (typeof PLAYERS !== "undefined") PLAYERS.push(newPlayer);
    const custom = readJSON(KEY_CUSTOM);
    custom.push(newPlayer);
    writeJSON(KEY_CUSTOM, custom);

    if (newPlayer.fasciaManual !== undefined && typeof window.saveManualFascia === "function") {
      window.saveManualFascia(newPlayer.id, newPlayer.fasciaManual);
    }
    if (typeof window.assignFasce === "function") window.assignFasce();

    closeModal();
    if (typeof renderAll === "function") renderAll();
    alert("Giocatore " + name + " aggiunto.");
  }

  /* ---------- Salvataggio MODIFICA giocatore ---------- */
  function saveEdit() {
    const player = getPlayer(editingPlayerId);
    if (!player) { closeModal(); return; }

    const name = txtU(F.name);
    if (!name) { alert("Inserisci almeno il nome del giocatore."); return; }

    const role = F.role ? F.role.value : "C";

    const changes = {
      nome: name,
      ruolo: role,
      squadra: txtU(F.team) || "N.D."
    };

    const ia = numU(F.ia);      changes.ia = ia !== undefined ? ia : null;
    const qt = numU(F.qt);      changes.qt = qt !== undefined ? qt : null;
    const qf = numU(F.qtFanta); changes.qtFanta = qf !== undefined ? qf : null;
    const qg = numU(F.qtGaz);   changes.qtGaz = qg !== undefined ? qg : null;
    const mv = numU(F.mediaVoto);  changes.mediaVoto = mv !== undefined ? mv : null;
    const mf = numU(F.mediaFanta); changes.mediaFanta = mf !== undefined ? mf : null;
    const gol = numU(F.gol);
    if (role === "P") {
      changes.golSubiti = gol !== undefined ? gol : null;
      changes.gol = null;
    } else {
      changes.gol = gol !== undefined ? gol : null;
      changes.golSubiti = null;
    }
    const ass = numU(F.assist); changes.assist = ass !== undefined ? ass : null;
    const amm = numU(F.amm);    changes.amm = amm !== undefined ? amm : null;
    const sos = txtU(F.sos);    changes.sos = sos !== undefined ? sos : null;
    const val = txtU(F.valore); changes.valore = val !== undefined ? val : null;

    // Applica subito al giocatore in memoria
    Object.keys(changes).forEach(function (k) {
      if (changes[k] === null) delete player[k];
      else player[k] = changes[k];
    });

    // Persistenza modifiche (sopravvive a ricaricamenti e nuove importazioni)
    const edits = readMap(KEY_EDITS);
    edits[player.id] = changes;
    writeJSON(KEY_EDITS, edits);

    // Aggiorna anche la lista personalizzati, se presente
    const custom = readJSON(KEY_CUSTOM);
    const cIdx = custom.findIndex(function (cp) { return cp.id === player.id; });
    if (cIdx !== -1) {
      Object.keys(changes).forEach(function (k) {
        if (changes[k] === null) delete custom[cIdx][k];
        else custom[cIdx][k] = changes[k];
      });
      writeJSON(KEY_CUSTOM, custom);
    }

    // Gestione fascia
    const fasciaSel = F.fascia ? F.fascia.value : "";
    if (fasciaSel) {
      if (typeof window.saveManualFascia === "function") {
        window.saveManualFascia(player.id, fasciaSel === "R" ? "R" : Number(fasciaSel));
      }
    } else {
      // "Calcola da IA": rimuove eventuale fascia manuale e ricalcola
      try {
        const map = readMap(KEY_FASCE);
        if (map[player.id] !== undefined) {
          delete map[player.id];
          writeJSON(KEY_FASCE, map);
        }
      } catch (e) {}
    }
    if (typeof window.assignFasce === "function") window.assignFasce();

    closeModal();
    if (typeof renderAll === "function") renderAll();
    alert("Giocatore " + name + " aggiornato.");
  }

  if (btnSave) {
    btnSave.addEventListener("click", function () {
      if (editingPlayerId !== null) saveEdit();
      else saveNew();
    });
  }

  /* ---------- Pulsanti Matita + Elimina nella scheda ---------- */
  function injectPlayerButtons() {
    if (typeof currentView === "undefined" || currentView !== "player") return;
    const section = document.getElementById("view-player");
    if (!section) return;
    if (section.querySelector(".btn-delete-player")) return;

    const player =
      typeof getPlayerById === "function" && typeof selectedPlayerId !== "undefined"
        ? getPlayerById(selectedPlayerId)
        : null;
    if (!player) return;

    const header = section.querySelector(".player-header");
    const actions = header ? header.querySelector(".actions") : null;

    // Matita (modifica)
    const btnEdit = document.createElement("button");
    btnEdit.className = "btn-edit-player";
    btnEdit.type = "button";
    btnEdit.title = "Modifica giocatore";
    btnEdit.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>';
    btnEdit.addEventListener("click", function () {
      openEditModal(player);
    });

    // Elimina dal listone
    const btnX = document.createElement("button");
    btnX.className = "btn-delete-player";
    btnX.type = "button";
    btnX.title = "Elimina giocatore dal database";
    btnX.textContent = "Elimina dal listone";
    btnX.addEventListener("click", function () {
      const ok = confirm("Vuoi eliminare definitivamente " + player.nome + " dal database?");
      if (!ok) return;

      const removed = readJSON(KEY_REMOVED);
      if (!removed.includes(player.id)) removed.push(player.id);
      writeJSON(KEY_REMOVED, removed);

      if (typeof PLAYERS !== "undefined") {
        const idx = PLAYERS.findIndex(function (p) { return p.id === player.id; });
        if (idx !== -1) PLAYERS.splice(idx, 1);
      }

      const custom = readJSON(KEY_CUSTOM).filter(function (cp) { return cp.id !== player.id; });
      writeJSON(KEY_CUSTOM, custom);

      if (typeof watchlist !== "undefined" && Array.isArray(watchlist)) {
        const wIdx = watchlist.indexOf(player.id);
        if (wIdx !== -1) {
          watchlist.splice(wIdx, 1);
          if (typeof saveStorage === "function") saveStorage("watchlist", watchlist);
        }
      }

      if (typeof showView === "function") showView("players");
      if (typeof renderAll === "function") renderAll();
    });

    if (actions) {
      actions.appendChild(btnEdit);
      actions.appendChild(btnX);
    } else if (header) {
      header.appendChild(btnEdit);
      header.appendChild(btnX);
    }
  }

  /* ---------- Aggancio al rendering ---------- */
  if (typeof renderAll === "function") {
    const prevRenderAll = renderAll;
    renderAll = function () {
      prevRenderAll();
      syncAddButton();
      injectPlayerButtons();
    };
  }

  // Avvio
  applyRemovals();
  applyEdits();
  if (typeof window.assignFasce === "function") window.assignFasce();
  syncAddButton();
  injectPlayerButtons();
  if (typeof renderAll === "function") renderAll();
})();