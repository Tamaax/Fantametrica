// Fantacalcio Pro — app.js
// PARTE 3B
// Miglioramenti: ricerca, filtri, ordinamento, scheda giocatore, watchlist, crediti, dashboard.

const DB = typeof PLAYERS !== "undefined" ? PLAYERS : [];

let currentView = "dashboard";
let selectedPlayerId = null;
let roleFilter = "T";
let sortKey = "fascia";
let sortDirection = "asc";

const roleLabels = {
  P: "Portieri",
  D: "Difensori",
  C: "Centrocampisti",
  A: "Attaccanti"
};

const roleSingular = {
  P: "Portiere",
  D: "Difensore",
  C: "Centrocampista",
  A: "Attaccante"
};

const titles = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Panoramica rapida del listone"
  },
  players: {
    title: "Giocatori",
    subtitle: "Consulta, filtra e ordina tutti i giocatori"
  },
  watchlist: {
    title: "Watchlist",
    subtitle: "Giocatori osservati per l'asta"
  },
  credits: {
    title: "Crediti",
    subtitle: "Budget dei partecipanti"
  },
  player: {
    title: "Scheda giocatore",
    subtitle: "Statistiche dettagliate"
  }
};

function loadStorage(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function saveStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

let watchlist = loadStorage("watchlist", []);

if (!Array.isArray(watchlist)) {
  watchlist = [];
}

watchlist = watchlist
  .map((item) => (typeof item === "object" && item !== null ? item.id : item))
  .filter((id) => Number.isFinite(id));

let participants = loadStorage("participants", [
  { id: 1, nome: "Partecipante 1", budget: 500 },
  { id: 2, nome: "Partecipante 2", budget: 500 },
  { id: 3, nome: "Partecipante 3", budget: 500 },
  { id: 4, nome: "Partecipante 4", budget: 500 }
]);

if (!Array.isArray(participants)) {
  participants = [];
}

participants = participants
  .filter((p) => p && Number.isFinite(p.id) && typeof p.nome === "string")
  .map((p) => ({
    id: p.id,
    nome: p.nome,
    budget: Number.isFinite(p.budget) ? p.budget : 500
  }));

const navButtons = Array.from(document.querySelectorAll(".nav-btn"));
const searchInput = document.getElementById("searchInput");
const viewTitle = document.getElementById("viewTitle");
const viewSubtitle = document.getElementById("viewSubtitle");

function showView(view) {
  currentView = view;
  
  // Salva la vista corrente
  localStorage.setItem("fantacalcio_last_view", view);

  // Se NON siamo nella scheda giocatore, cancella l'ID salvato
  if (view !== "player") {
    selectedPlayerId = null;
    localStorage.removeItem("fantacalcio_last_player_id");
  }

  document.querySelectorAll(".view").forEach((section) => {
    section.classList.remove("active");
  });

  const target = document.getElementById(`view-${view}`);
  if (target) {
    target.classList.add("active");
  }

  navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });

  const title = titles[view] || {
    title: "Fantacalcio",
    subtitle: ""
  };

  if (viewTitle) {
    viewTitle.textContent = title.title;
  }

  if (viewSubtitle) {
    viewSubtitle.textContent = title.subtitle;
  }

  renderAll();
}

function renderAll() {
  if (currentView === "dashboard") renderDashboard();
  if (currentView === "players") renderPlayers();
  if (currentView === "watchlist") renderWatchlist();
  if (currentView === "credits") renderCredits();
  if (currentView === "player") renderPlayer();
}

function fmtStat(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : "N.D.";
}

function getPlayerById(id) {
  return DB.find((player) => player.id === id);
}

function countRole(role) {
  return DB.filter((player) => player.ruolo === role).length;
}

function quickRole(role) {
  roleFilter = role;
  showView("players");
}

function topMedia(limit = 6) {
  return DB
    .filter((player) => Number(player.mediaFanta) > 0)
    .sort((a, b) => Number(b.mediaFanta) - Number(a.mediaFanta))
    .slice(0, limit);
}

function topGol(limit = 6) {
  return DB
    .filter((player) => player.ruolo !== "P" && Number(player.gol) > 0)
    .sort((a, b) => Number(b.gol) - Number(a.gol))
    .slice(0, limit);
}

function topAssist(limit = 6) {
  return DB
    .filter((player) => player.ruolo !== "P" && Number(player.assist) > 0)
    .sort((a, b) => Number(b.assist) - Number(a.assist))
    .slice(0, limit);
}

function playerListItem(player, rightValue) {
  return `
    <div class="list-item" onclick="openPlayer(${player.id})">
      <div>
        <strong>${player.nome}</strong>
        <span>${roleSingular[player.ruolo] || ""} • ${player.squadra}</span>
      </div>
      <strong>${rightValue}</strong>
    </div>
  `;
}

function listOrEmpty(items, renderer) {
  if (!items.length) {
    return `<div class="empty">Nessun dato disponibile.</div>`;
  }

  return items.map(renderer).join("");
}

function renderDashboard() {
  const section = document.getElementById("view-dashboard");
  if (!section) return;

  const media = topMedia();
  const gol = topGol();
  const assist = topAssist();

  section.innerHTML = `
    <div class="grid cards">
      <div class="card" onclick="quickRole('P')" style="cursor:pointer;">
        <h3>Portieri</h3>
        <div class="stat-value">${countRole("P")}</div>
        <div class="stat-label">Apri elenco portieri</div>
      </div>

      <div class="card" onclick="quickRole('D')" style="cursor:pointer;">
        <h3>Difensori</h3>
        <div class="stat-value">${countRole("D")}</div>
        <div class="stat-label">Apri elenco difensori</div>
      </div>

      <div class="card" onclick="quickRole('C')" style="cursor:pointer;">
        <h3>Centrocampisti</h3>
        <div class="stat-value">${countRole("C")}</div>
        <div class="stat-label">Apri elenco centrocampisti</div>
      </div>

      <div class="card" onclick="quickRole('A')" style="cursor:pointer;">
        <h3>Attaccanti</h3>
        <div class="stat-value">${countRole("A")}</div>
        <div class="stat-label">Apri elenco attaccanti</div>
      </div>
    </div>

    <div class="grid two">
      <div class="card">
        <h3>Top per media fantacalcio</h3>
        ${listOrEmpty(media, (player) => playerListItem(player, fmtStat(player.mediaFanta)))}
      </div>

      <div class="card">
        <h3>Riepilogo</h3>

        <div class="list-item" onclick="showView('players')">
          <div>
            <strong>Giocatori totali</strong>
            <span>Apri il listone completo</span>
          </div>
          <strong>${DB.length}</strong>
        </div>

        <div class="list-item" onclick="showView('watchlist')">
          <div>
            <strong>Watchlist</strong>
            <span>Giocatori osservati</span>
          </div>
          <strong>${watchlist.length}</strong>
        </div>

        <div class="list-item" onclick="showView('credits')">
          <div>
            <strong>Partecipanti</strong>
            <span>Gestione crediti</span>
          </div>
          <strong>${participants.length}</strong>
        </div>

        <div class="list-item" onclick="showView('players')">
          <div>
            <strong>Ricerca rapida</strong>
            <span>Cerca per nome o squadra</span>
          </div>
          <strong>→</strong>
        </div>
      </div>
    </div>

    <div class="grid two">
      <div class="card">
        <h3>Top per gol</h3>
        ${listOrEmpty(gol, (player) => playerListItem(player, fmtStat(player.gol)))}
      </div>

      <div class="card">
        <h3>Top per assist</h3>
        ${listOrEmpty(assist, (player) => playerListItem(player, fmtStat(player.assist)))}
      </div>
    </div>
  `;
}

function setRoleFilter(role) {
  roleFilter = role;
  renderAll();
}

function setSort(key) {
  if (sortKey === key) {
    sortDirection = sortDirection === "asc" ? "desc" : "asc";
  } else {
    sortKey = key;
    sortDirection = "desc";
  }

  renderAll();
}

function sortIndicator(key) {
  if (sortKey !== key) return "";
  return sortDirection === "asc" ? " ↑" : " ↓";
}

function sortPlayers(a, b) {
  if (sortKey === "nome" || sortKey === "squadra" || sortKey === "ruolo") {
    const av = String(a[sortKey] || "");
    const bv = String(b[sortKey] || "");

    return sortDirection === "asc"
      ? av.localeCompare(bv)
      : bv.localeCompare(av);
  }

  const av = Number(a[sortKey] ?? 0);
  const bv = Number(b[sortKey] ?? 0);

  return sortDirection === "asc" ? av - bv : bv - av;
}

function getFilteredPlayers() {
  const query = searchInput ? searchInput.value.trim().toLowerCase() : "";

  return DB
    .filter((player) => {
      const matchesRole = roleFilter === "T" || player.ruolo === roleFilter;

      const matchesSearch =
        !query ||
        String(player.nome || "").toLowerCase().includes(query) ||
        String(player.squadra || "").toLowerCase().includes(query);

      return matchesRole && matchesSearch;
    })
    .sort(sortPlayers);
}

function roleFilterButton(role, label) {
  return `
    <button
      class="filter-btn ${roleFilter === role ? "active" : ""}"
      onclick="setRoleFilter('${role}')"
    >
      ${label}
    </button>
  `;
}

function playerRow(player) {
  const isPortiere = player.ruolo === "P";
  const mainStat = isPortiere ? fmtStat(player.golSubiti) : fmtStat(player.gol);
  const assistStat = isPortiere ? "-" : fmtStat(player.assist);
  const isWatchlisted = watchlist.includes(player.id);

  return `
    <tr onclick="openPlayer(${player.id})">
      <td><span class="badge ${player.ruolo}">${player.ruolo}</span></td>
      <td><strong>${player.nome}</strong></td>
      <td>${player.squadra}</td>
      <td>${fmtStat(player.qt)}</td>
      <td>${fmtStat(player.qtGaz)}</td>
      <td>${fmtStat(player.mediaFanta)}</td>
      <td>${mainStat}</td>
      <td>${assistStat}</td>
      <td>
        <button
          class="star ${isWatchlisted ? "active" : ""}"
          onclick="event.stopPropagation(); toggleWatchlist(${player.id})"
          title="Aggiungi o rimuovi dalla watchlist"
        >
          ★
        </button>
      </td>
    </tr>
  `;
}

function renderPlayers() {
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
            <th onclick="setSort('nome')">Nome${sortIndicator("nome")}</th>
            <th onclick="setSort('squadra')">Squadra${sortIndicator("squadra")}</th>
            <th onclick="setSort('qt')">QT${sortIndicator("qt")}</th>
            <th onclick="setSort('qtGaz')">PM Asta 500cr${sortIndicator("qtGaz")}</th>            <th onclick="setSort('mediaFanta')">Media Fanta${sortIndicator("mediaFanta")}</th>
            <th onclick="setSort('gol')">Gol/GS${sortIndicator("gol")}</th>
            <th onclick="setSort('assist')">Assist${sortIndicator("assist")}</th>
            <th>Watchlist</th>
          </tr>
        </thead>
        <tbody>
          ${
            players.length
              ? players.map(playerRow).join("")
              : `<tr><td colspan="9"><div class="empty">Nessun giocatore trovato.</div></td></tr>`
          }
        </tbody>
      </table>
    </div>
  `;
}

function renderWatchlist() {
  const section = document.getElementById("view-watchlist");
  if (!section) return;

  const players = watchlist
    .map((id) => getPlayerById(id))
    .filter(Boolean);

  section.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Ruolo</th>
            <th>Nome</th>
            <th>Squadra</th>
            <th>QT</th>
            <th>QT Fanta</th>
            <th>Media Fanta</th>
            <th>Gol/GS</th>
            <th>Assist</th>
            <th>Rimuovi</th>
          </tr>
        </thead>
        <tbody>
          ${
            players.length
              ? players.map(playerRow).join("")
              : `<tr><td colspan="9"><div class="empty">Nessun giocatore in watchlist.<br><br>Apri la sezione Giocatori e clicca sulla stella ★ per aggiungere un giocatore.</div></td></tr>`
          }
        </tbody>
      </table>
    </div>
  `;
}

function openPlayer(id) {
  selectedPlayerId = Number(id);
  // Salva l'ID del giocatore corrente
  localStorage.setItem("fantacalcio_last_player_id", selectedPlayerId);
  showView("player");
}

function toggleWatchlist(id) {
  if (watchlist.includes(id)) {
    watchlist = watchlist.filter((playerId) => playerId !== id);
  } else {
    watchlist = [...watchlist, id];
  }

  saveStorage("watchlist", watchlist);
  renderAll();
}

function renderPlayer() {
  const section = document.getElementById("view-player");
  if (!section) return;

  const player = getPlayerById(selectedPlayerId);

  if (!player) {
    section.innerHTML = `
      <div class="empty">
        Giocatore non trovato.
        <br><br>
        <button class="btn" onclick="showView('players')">Torna al listone</button>
      </div>
    `;
    return;
  }

  const isPortiere = player.ruolo === "P";
  const inWatchlist = watchlist.includes(player.id);

  const mainBonusLabel = isPortiere ? "Gol subiti" : "Gol";
  const mainBonusValue = isPortiere ? fmtStat(player.golSubiti) : fmtStat(player.gol);
  const assistValue = isPortiere ? "-" : fmtStat(player.assist);

  section.innerHTML = `
    <div class="player-header">
      <div class="player-title">
        <span class="badge ${player.ruolo}">${player.ruolo}</span>
        <div>
          <h2>${player.nome}</h2>
          <p>${roleSingular[player.ruolo]} • ${player.squadra}</p>
        </div>
      </div>

      <div class="actions">
        <button class="btn" onclick="showView('players')">← Torna al listone</button>
        <button
          class="btn ${inWatchlist ? "" : "primary"}"
          onclick="toggleWatchlist(${player.id})"
        >
          ${inWatchlist ? "Rimuovi dalla watchlist" : "Aggiungi alla watchlist"}
        </button>
      </div>
    </div>

    <div class="grid detail-grid">
      <div class="card">
        <h3>Quotazione iniziale</h3>
        <div class="stat-value">${fmtStat(player.qt)}</div>
        <div class="stat-label">Crediti base</div>
      </div>

      <div class="card">
        <h3>Quotazione Fanta</h3>
        <div class="stat-value">${fmtStat(player.qtFanta)}</div>
        <div class="stat-label">Valore indicativo</div>
      </div>

      <div class="card">
        <h3>Prezzo Medio asta 500cr</h3>
        <div class="stat-value">${fmtStat(player.qtGaz)}</div>
        <div class="stat-label">Prezzo medio</div>
      </div>

      <div class="card">
        <h3>Media fanta</h3>
        <div class="stat-value">${fmtStat(player.mediaFanta)}</div>
        <div class="stat-label">Media voto: ${fmtStat(player.mediaVoto)}</div>
      </div>
    </div>

    <div class="section-title">Statistiche principali</div>

    <div class="grid detail-grid">
      <div class="card">
        <h3>${mainBonusLabel}</h3>
        <div class="stat-value">${mainBonusValue}</div>
        <div class="stat-label">Bonus principali</div>
      </div>

      <div class="card">
        <h3>${isPortiere ? "Nota" : "Assist"}</h3>
        <div class="stat-value">${assistValue}</div>
        <div class="stat-label">${isPortiere ? "Portiere" : "Bonus secondari"}</div>
      </div>

      <div class="card">
        <h3>Ammonizioni</h3>
        <div class="stat-value">${fmtStat(player.amm)}</div>
        <div class="stat-label">Malus</div>
      </div>

      <div class="card">
        <h3>Overall</h3>
        <div class="stat-value" style="font-size:22px; padding-top:8px;">
          ${player.ia || "N.D."}
        </div>
        <div class="stat-label">${player.valore || "N.D."}</div>
      </div>
    </div>

    <div class="section-title">Analisi</div>

    <div class="card">
      <p><strong>Indicazione IA:</strong> ${player.ia || "N.D."}</p>
      <p><strong>Valore:</strong> ${player.valore || "N.D."}</p>
      <p><strong>SOS:</strong> ${player.sos || "N.D."}</p>
      ${player.fascia ? `<p><strong>Fascia:</strong> ${player.fascia}</p>` : ""}
      <p class="muted">
        I dati provengono dal database importato dai PDF. Eventuali valori mancanti sono mostrati come N.D.
      </p>
    </div>
  `;
}

function renderCredits() {
  const section = document.getElementById("view-credits");
  if (!section) return;

  section.innerHTML = `
    <div class="card">
      <h3>Aggiungi partecipante</h3>

      <div class="inline-form">
        <input id="newParticipantName" placeholder="Nome partecipante" />
        <input id="newParticipantBudget" type="number" value="500" min="0" />
        <button class="btn primary" onclick="addParticipant()">Aggiungi</button>
      </div>
    </div>

    <div class="section-title">Budget partecipanti</div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Partecipante</th>
            <th>Budget</th>
            <th>Modifica</th>
            <th class="right">Azioni</th>
          </tr>
        </thead>
        <tbody>
          ${
            participants.length
              ? participants
                  .map(
                    (participant) => `
                      <tr>
                        <td><strong>${participant.nome}</strong></td>
                        <td>
                          <span class="budget-value">${participant.budget}</span>
                        </td>
                        <td>
                          <div class="budget-controls">
                            <button class="btn small" onclick="changeBudget(${participant.id}, -10)">-10</button>
                            <button class="btn small" onclick="changeBudget(${participant.id}, -1)">-1</button>
                            <button class="btn small" onclick="changeBudget(${participant.id}, 1)">+1</button>
                            <button class="btn small" onclick="changeBudget(${participant.id}, 10)">+10</button>
                          </div>
                        </td>
                        <td class="right">
                          <button class="btn small" onclick="removeParticipant(${participant.id})">Elimina</button>
                        </td>
                      </tr>
                    `
                  )
                  .join("")
              : `<tr><td colspan="4"><div class="empty">Nessun partecipante.<br><br>Aggiungi il primo partecipante usando il modulo in alto.</div></td></tr>`
          }
        </tbody>
      </table>
    </div>
  `;
}

function addParticipant() {
  const nameInput = document.getElementById("newParticipantName");
  const budgetInput = document.getElementById("newParticipantBudget");

  const nome = nameInput ? nameInput.value.trim() : "";
  const budget = budgetInput ? Number(budgetInput.value || 500) : 500;

  if (!nome) {
    alert("Inserisci il nome del partecipante.");
    return;
  }

  participants = [
    ...participants,
    {
      id: Date.now(),
      nome,
      budget: Number.isFinite(budget) ? budget : 500
    }
  ];

  saveStorage("participants", participants);
  renderAll();
}

function changeBudget(id, delta) {
  participants = participants.map((participant) => {
    if (participant.id === id) {
      return {
        ...participant,
        budget: Math.max(0, participant.budget + delta)
      };
    }

    return participant;
  });

  saveStorage("participants", participants);
  renderAll();
}

function removeParticipant(id) {
  const participant = participants.find((item) => item.id === id);

  if (!participant) return;

  const confirmed = confirm(`Vuoi davvero eliminare ${participant.nome}?`);

  if (!confirmed) return;

  participants = participants.filter((item) => item.id !== id);
  saveStorage("participants", participants);
  renderAll();
}

// Funzione helper per ordinare le fasce correttamente (R va alla fine)
function getFasciaValue(fascia) {
  if (fascia === "R" || fascia === "r") return 99;
  return Number(fascia) || 99;
}

// Sovrascriviamo sortPlayers per gestire la fascia
const originalSortPlayers = sortPlayers;
sortPlayers = function(a, b) {
  if (sortKey === "fascia") {
    const valA = getFasciaValue(a.fascia);
    const valB = getFasciaValue(b.fascia);
    return sortDirection === "asc" ? valA - valB : valB - valA;
  }
  return originalSortPlayers(a, b);
};

function init() {
  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      showView(button.dataset.view);
    });
  });

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      if (currentView !== "players") {
        showView("players");
      } else {
        renderAll();
      }
    });
  }

  // --- LOGICA DI RIPRISTINO ALL'AVVIO ---
  const savedView = localStorage.getItem("fantacalcio_last_view");
  const savedPlayerId = localStorage.getItem("fantacalcio_last_player_id");

  if (savedView === "player" && savedPlayerId) {
    // Verifica che il giocatore esista davvero nel database prima di mostrarlo
    const player = getPlayerById(Number(savedPlayerId));
    
    if (player) {
      // Il giocatore esiste: ripristina ID e vista
      selectedPlayerId = Number(savedPlayerId);
      showView("player");
    } else {
      // Il giocatore è stato eliminato o non esiste: pulisci e torna al listone
      localStorage.removeItem("fantacalcio_last_player_id");
      showView("players");
    }
  } else if (savedView && savedView !== "dashboard") {
    // Ripristina un'altra vista (es. Giocatori, Watchlist, Asta)
    showView(savedView);
  } else {
    // Default
    showView("dashboard");
  }
}

init();