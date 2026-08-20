// Fantacalcio Pro — watchlist-filters.js
// PARTE 4B — Filtri Watchlist per ruolo, per fascia e combinati

(function () {
  let wlRoleFilter = "T";
  let wlFasciaFilter = "T";

  function wlEscape(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function wlFmt(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : "N.D.";
  }

  function wlGetPlayer(id) {
    if (typeof getPlayerById === "function") {
      return getPlayerById(id);
    }

    const db =
      typeof DB !== "undefined" && Array.isArray(DB)
        ? DB
        : typeof PLAYERS !== "undefined" && Array.isArray(PLAYERS)
          ? PLAYERS
          : [];

    return db.find((p) => p.id === Number(id)) || null;
  }

  function wlGetWatchPlayers() {
    if (typeof watchlist === "undefined" || !Array.isArray(watchlist)) {
      return [];
    }

    return watchlist.map((id) => wlGetPlayer(id)).filter(Boolean);
  }

  window.setWlRoleFilter = function (role) {
    wlRoleFilter = role;
    if (typeof renderAll === "function") renderAll();
  };

  window.setWlFasciaFilter = function (fascia) {
    wlFasciaFilter = fascia;
    if (typeof renderAll === "function") renderAll();
  };

  window.resetWlFilters = function () {
    wlRoleFilter = "T";
    wlFasciaFilter = "T";
    if (typeof renderAll === "function") renderAll();
  };

  function wlRoleButton(role, label) {
    const active = wlRoleFilter === role ? "active" : "";
    return `<button class="filter-btn ${active}" onclick="setWlRoleFilter('${role}')">${label}</button>`;
  }

  function wlFasciaButton(fascia, label) {
    const active = wlFasciaFilter === fascia ? "active" : "";
    const arg = fascia === "R" ? "'R'" : String(fascia);
    return `<button class="filter-btn ${active}" onclick="setWlFasciaFilter(${arg})">${label}</button>`;
  }

  function wlPlayerRow(player) {
    const isPortiere = player.ruolo === "P";
    const mainStat = isPortiere ? wlFmt(player.golSubiti) : wlFmt(player.gol);
    const assistStat = isPortiere ? "-" : wlFmt(player.assist);
    const fascia = typeof player.fascia !== "undefined" ? player.fascia : "R";
    const isWatchlisted =
      typeof watchlist !== "undefined" && watchlist.includes(player.id);

    return `
      <tr onclick="openPlayer(${player.id})">
        <td><span class="badge ${player.ruolo}">${player.ruolo}</span></td>
        <td>
          <span class="fascia-badge-small fb-${fascia}">
            ${fascia === "R" ? "R" : fascia + "ª"}
          </span>
        </td>
        <td><strong>${wlEscape(player.nome)}</strong></td>
        <td>${wlEscape(player.squadra)}</td>
        <td>${wlFmt(player.qt)}</td>
        <td>${wlFmt(player.mediaFanta)}</td>
        <td>${mainStat}</td>
        <td>${assistStat}</td>
        <td>
          <button
            class="star ${isWatchlisted ? "active" : ""}"
            onclick="event.stopPropagation(); toggleWatchlist(${player.id})"
            title="Rimuovi dalla watchlist"
          >★</button>
        </td>
      </tr>
    `;
  }

  function renderWatchlistFiltered() {
    const section = document.getElementById("view-watchlist");

    if (!section) return;

    const all = wlGetWatchPlayers();
    const total = all.length;

    let players = all;

    if (wlRoleFilter !== "T") {
      players = players.filter((p) => p.ruolo === wlRoleFilter);
    }

    if (wlFasciaFilter !== "T") {
      players = players.filter((p) => p.fascia === wlFasciaFilter);
    }

    const body =
      total === 0
        ? `<tr><td colspan="9"><div class="empty">Nessun giocatore in watchlist.<br><br>Apri la sezione Giocatori e clicca sulla stella ★ per aggiungere un giocatore.</div></td></tr>`
        : players.length
          ? players.map(wlPlayerRow).join("")
          : `<tr><td colspan="9"><div class="empty">Nessun giocatore corrisponde ai filtri selezionati.</div></td></tr>`;

    section.innerHTML = `
      <div class="card" style="margin-bottom:16px;">
        <div class="filter-bar">
          <div class="filter-row">
            <span class="filter-label">Ruolo</span>
            ${wlRoleButton("T", "Tutti")}
            ${wlRoleButton("P", "Portieri")}
            ${wlRoleButton("D", "Difensori")}
            ${wlRoleButton("C", "Centrocampisti")}
            ${wlRoleButton("A", "Attaccanti")}
          </div>

          <div class="filter-row">
            <span class="filter-label">Fascia</span>
            ${wlFasciaButton("T", "Tutte")}
            ${wlFasciaButton(1, "1ª")}
            ${wlFasciaButton(2, "2ª")}
            ${wlFasciaButton(3, "3ª")}
            ${wlFasciaButton(4, "4ª")}
            ${wlFasciaButton(5, "5ª")}
            ${wlFasciaButton(6, "6ª")}
            ${wlFasciaButton("R", "R")}
          </div>

          <div class="filter-row">
            <span class="filter-label">Esito</span>
            <span class="muted" style="font-size:13px;">
              ${total} in watchlist • ${players.length} visualizzati
            </span>
            <button
              class="btn small"
              style="margin-left:auto;"
              onclick="resetWlFilters()"
            >
              Azzera filtri
            </button>
          </div>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Ruolo</th>
              <th>Fascia</th>
              <th>Nome</th>
              <th>Squadra</th>
              <th>QT</th>
              <th>Media Fanta</th>
              <th>Gol/GS</th>
              <th>Assist</th>
              <th>Rimuovi</th>
            </tr>
          </thead>
          <tbody>
            ${body}
          </tbody>
        </table>
      </div>
    `;
  }

  if (typeof renderWatchlist === "function") {
    renderWatchlist = renderWatchlistFiltered;
  }
})();