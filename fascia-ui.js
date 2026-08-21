// Fantacalcio Pro — fascia-ui.js (Versione completa con fasce 1-6 + R)
(function () {
  function fasciaLabel(fascia) {
    return fascia === "R" ? "R" : fascia + "ª";
  }

  function fasciaCell(player) {
    const fascia = typeof player.fascia !== "undefined" ? player.fascia : "R";
    return '<td><span class="fascia-badge-small fb-' + fascia + '">' + fasciaLabel(fascia) + "</span></td>";
  }

  /* 1) Colonna Fascia in ogni riga della tabella */
  if (typeof playerRow === "function") {
    const previousPlayerRow = playerRow;
    playerRow = function (player) {
      const html = previousPlayerRow(player);
      const closeTag = "</td>";
      const index = html.indexOf(closeTag);
      if (index === -1) return html;
      return html.slice(0, index + closeTag.length) + fasciaCell(player) + html.slice(index + closeTag.length);
    };
  }

  /* 2) Ordinamento per fascia (R sempre ultima) */
  if (typeof sortPlayers === "function") {
    const previousSortPlayers = sortPlayers;
    sortPlayers = function (a, b) {
      if (typeof sortKey !== "undefined" && sortKey === "fascia") {
        const value = function (p) { return p.fascia === "R" ? 99 : Number(p.fascia) || 0; };
        const diff = value(a) - value(b);
        if (diff !== 0) {
          const asc = typeof sortDirection !== "undefined" && sortDirection === "asc";
          return asc ? diff : -diff;
        }
      }
      return previousSortPlayers(a, b);
    };
  }

  /* 3) Tabella Giocatori con intestazione a 10 colonne */
  if (typeof renderPlayers === "function" && typeof getFilteredPlayers === "function") {
    renderPlayers = function () {
      const section = document.getElementById("view-players");
      if (!section) return;
      const players = getFilteredPlayers();

      section.innerHTML = `
        <div class="filters">
          ${roleFilterButton("T", "Tutti")}
          ${roleFilterButton("P", "Portieri")}
          ${roleFilterButton("D", "Difensori")}
          ${roleFilterButton("C", "Centrocampisti")}
          ${roleFilterButton("A", "Attaccanti")}
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th onclick="setSort('ruolo')">Ruolo${sortIndicator("ruolo")}</th>
                <th onclick="setSort('fascia')">Fascia${sortIndicator("fascia")}</th>
                <th onclick="setSort('nome')">Nome${sortIndicator("nome")}</th>
                <th onclick="setSort('squadra')">Squadra${sortIndicator("squadra")}</th>
                <th onclick="setSort('qt')">QT${sortIndicator("qt")}</th>
                <th onclick="setSort('qtGaz')">PM Asta 500cr${sortIndicator("qtGaz")}</th>                <th onclick="setSort('mediaFanta')">Media Fanta${sortIndicator("mediaFanta")}</th>
                <th onclick="setSort('gol')">Gol/GS${sortIndicator("gol")}</th>
                <th onclick="setSort('assist')">Assist${sortIndicator("assist")}</th>
                <th>Watchlist</th>
              </tr>
            </thead>
            <tbody>
              ${
                players.length
                  ? players.map((p) => playerRow(p)).join("")
                  : `<tr><td colspan="10"><div class="empty">Nessun giocatore trovato.</div></td></tr>`
              }
            </tbody>
          </table>
        </div>
      `;
    };
  }

  /* 4) Scheda giocatore: tendina fasce 1-6 + R */
  if (typeof renderPlayer === "function") {
    const previousRenderPlayer = renderPlayer;

    renderPlayer = function () {
      previousRenderPlayer();

      const section = document.getElementById("view-player");
      if (!section) return;

      const player =
        typeof getPlayerById === "function" && typeof selectedPlayerId !== "undefined"
          ? getPlayerById(selectedPlayerId)
          : null;
      if (!player) return;

      const subtitle = section.querySelector(".player-title p");
      if (!subtitle) return;

      // Pulizia elementi precedenti (evita duplicati)
      const oldSelect = subtitle.querySelector("select");
      if (oldSelect) oldSelect.remove();
      const oldLock = subtitle.querySelector(".fascia-manual-tag");
      if (oldLock) oldLock.remove();
      const oldRaw = subtitle.querySelector(".raw-fascia-tag");
      if (oldRaw) oldRaw.remove();

      const currentFascia = typeof player.fascia !== "undefined" ? player.fascia : "R";

      const select = document.createElement("select");
      select.style.cssText =
        "margin-left:8px; padding:6px 30px 6px 10px; border-radius:10px; border:1px solid rgba(255,255,255,0.2); background-color:rgba(255,255,255,0.08); color:#f5f7fb; font-size:12px; cursor:pointer; outline:none;";

      const options = [
        { val: 1, label: "1ª Fascia" },
        { val: 2, label: "2ª Fascia" },
        { val: 3, label: "3ª Fascia" },
        { val: 4, label: "4ª Fascia" },
        { val: 5, label: "5ª Fascia" },
        { val: 6, label: "6ª Fascia" },
        { val: "R", label: "Riserva (R)" }
      ];

      options.forEach(function (opt) {
        const option = document.createElement("option");
        option.value = opt.val;
        option.textContent = opt.label;
        if (String(opt.val) === String(currentFascia)) option.selected = true;
        select.appendChild(option);
      });

      select.addEventListener("change", function (e) {
        const rawVal = e.target.value;
        const newVal = rawVal === "R" ? "R" : Number(rawVal);
        if (typeof window.saveManualFascia === "function") {
          window.saveManualFascia(player.id, newVal);
        }
      });

      subtitle.appendChild(select);
    };
  }
})();