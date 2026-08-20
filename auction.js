// Fantacalcio Pro — auction.js
// Flusso: 1) cerca -> 2) seleziona (fisso nella barra) -> 3) prezzo -> 4) partecipante -> compra

let auctionParticipantId = "";
let auctionPlayerId = null;
let auctionRolePhase = "T";

const AUCTION_LIMITS = { squadSize: 25, P: 3, D: 8, C: 8, A: 6 };

let auctionPurchases = loadPurchases();

function loadPurchases() {
  try {
    const raw = localStorage.getItem("auctionPurchases");
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v : [];
  } catch (e) { return []; }
}

function savePurchases() {
  try { localStorage.setItem("auctionPurchases", JSON.stringify(auctionPurchases)); } catch (e) {}
}

/* ---------- Dati ---------- */
function getDB() {
  if (typeof DB !== "undefined" && Array.isArray(DB)) return DB;
  if (typeof PLAYERS !== "undefined" && Array.isArray(PLAYERS)) return PLAYERS;
  return [];
}

function auctionEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function auctionGetPlayerById(id) {
  return getDB().find(function (p) { return p.id === Number(id); }) || null;
}

function getAuctionParticipants() {
  return typeof participants !== "undefined" && Array.isArray(participants) ? participants : [];
}

function getAuctionPurchases() {
  return Array.isArray(auctionPurchases) ? auctionPurchases : [];
}

function isPlayerPurchased(id) {
  return getAuctionPurchases().some(function (p) { return p.playerId === id; });
}

function getAuctionSpent(pid) {
  return getAuctionPurchases()
    .filter(function (p) { return p.participantId === pid; })
    .reduce(function (s, p) { return s + Number(p.price || 0); }, 0);
}

function getAuctionRemaining(pid) {
  const part = getAuctionParticipants().find(function (p) { return p.id === pid; });
  if (!part) return 0;
  return Math.max(0, Number(part.budget || 0) - getAuctionSpent(pid));
}

function getAuctionRoleCounts(pid) {
  const counts = { P: 0, D: 0, C: 0, A: 0 };
  getAuctionPurchases()
    .filter(function (p) { return p.participantId === pid; })
    .forEach(function (p) {
      const pl = auctionGetPlayerById(p.playerId);
      if (pl && counts[pl.ruolo] !== undefined) counts[pl.ruolo] += 1;
    });
  return counts;
}

/* ---------- Controlli ---------- */
function validateAuctionPurchase(participantId, playerId, price) {
  const participant = getAuctionParticipants().find(function (p) { return p.id === participantId; });
  if (!participant) return { ok: false, error: "Seleziona il partecipante che compra." };

  const player = auctionGetPlayerById(playerId);
  if (!player) return { ok: false, error: "Cerca e seleziona prima un giocatore." };

  if (!Number.isFinite(price) || price < 1) return { ok: false, error: "Inserisci un prezzo valido (almeno 1 credito)." };
  price = Math.round(price);

  if (isPlayerPurchased(player.id)) return { ok: false, error: "Questo giocatore è già stato acquistato." };

  const remaining = getAuctionRemaining(participant.id);
  if (price > remaining) return { ok: false, error: "Crediti insufficienti. Residuo: " + remaining + "." };

  const counts = getAuctionRoleCounts(participant.id);
  const role = player.ruolo;
  if (AUCTION_LIMITS[role] !== undefined && counts[role] >= AUCTION_LIMITS[role]) {
    const label = typeof roleLabels !== "undefined" && roleLabels[role] ? roleLabels[role] : role;
    return { ok: false, error: "Limite ruolo raggiunto: " + label + "." };
  }

  const total = getAuctionPurchases().filter(function (p) { return p.participantId === participant.id; }).length;
  if (total >= AUCTION_LIMITS.squadSize) return { ok: false, error: "Rosa completa. Massimo " + AUCTION_LIMITS.squadSize + " giocatori." };

  return { ok: true, price: price };
}

/* ---------- Fasi ---------- */
function setAuctionRolePhase(role) {
  auctionRolePhase = role;
  if (typeof renderAll === "function") renderAll();
}

function setAuctionParticipant(value) {
  auctionParticipantId = value ? Number(value) : "";
  // Nessun re-render: così il giocatore selezionato resta fisso nella barra
}

/* ---------- Suggerimenti ---------- */
function hideSuggestions() {
  const box = document.getElementById("auctionSuggestions");
  if (box) { box.style.display = "none"; box.innerHTML = ""; }
}

function computeSuggestions() {
  const input = document.getElementById("auctionSearchInput");
  const q = input ? input.value.trim().toLowerCase() : "";
  const roleOrder = { P: 0, D: 1, C: 2, A: 3 };

  return getDB()
    .filter(function (p) { return !isPlayerPurchased(p.id); })
    .filter(function (p) { return auctionRolePhase === "T" || p.ruolo === auctionRolePhase; })
    .filter(function (p) {
      return !q ||
        String(p.nome || "").toLowerCase().includes(q) ||
        String(p.squadra || "").toLowerCase().includes(q);
    })
    .sort(function (a, b) {
      const ra = roleOrder[a.ruolo] ?? 9, rb = roleOrder[b.ruolo] ?? 9;
      if (ra !== rb) return ra - rb;
      return String(a.nome || "").localeCompare(String(b.nome || ""));
    })
    .slice(0, 10);
}

function fasciaTag(p) {
  const f = typeof p.fascia !== "undefined" ? p.fascia : "R";
  return '<span class="fascia-badge-small fb-' + f + '">' + (f === "R" ? "R" : f + "ª") + "</span>";
}

function updateAuctionSuggestions() {
  const box = document.getElementById("auctionSuggestions");
  if (!box) return;

  // Se c'è un giocatore già selezionato (fisso nella barra), non mostrare la tendina
  if (auctionPlayerId) { hideSuggestions(); return; }

  const list = computeSuggestions();
  if (!list.length) { hideSuggestions(); return; }

  box.style.display = "block";
  box.innerHTML = list.map(function (p) {
    return '<div class="auction-sugg-item" onclick="selectAuctionPlayer(' + p.id + ')">' +
      '<span class="badge ' + p.ruolo + '">' + p.ruolo + "</span>" +
      fasciaTag(p) +
      '<div class="auction-sugg-text"><strong>' + auctionEscape(p.nome) + "</strong>" +
      "<span>" + auctionEscape(p.squadra) + " • QT " + (p.qt ?? "N.D.") + "</span></div></div>";
  }).join("");
}

function selectAuctionPlayer(id) {
  const p = auctionGetPlayerById(id);
  if (!p) return;

  auctionPlayerId = id;

  const input = document.getElementById("auctionSearchInput");
  if (input) {
    input.value = p.nome;               // resta fisso nella barra
    input.classList.add("auction-input-selected");
  }
  hideSuggestions();
}

/* ---------- Acquisto ---------- */
function buySelectedPlayer() {
  const sel = document.getElementById("auctionParticipant");
  const priceInput = document.getElementById("auctionPrice");

  const participantId = sel ? Number(sel.value) : 0;
  const playerId = auctionPlayerId;
  const price = priceInput ? Number(priceInput.value) : 0;

  const v = validateAuctionPurchase(participantId, playerId, price);
  if (!v.ok) { alert(v.error); return; }

  auctionPurchases = auctionPurchases.concat([{
    id: Date.now(), playerId: playerId, participantId: participantId,
    price: v.price, createdAt: new Date().toISOString()
  }]);
  savePurchases();

  // Reset: libera barra e prezzo, mantiene il partecipante per gli acquisti successivi
  auctionPlayerId = null;
  const input = document.getElementById("auctionSearchInput");
  if (input) { input.value = ""; input.classList.remove("auction-input-selected"); }
  if (priceInput) priceInput.value = "";

  if (typeof renderAll === "function") renderAll();
}

function removeAuctionPurchase(id) {
  if (!confirm("Vuoi davvero rimuovere questo acquisto?")) return;
  auctionPurchases = auctionPurchases.filter(function (p) { return p.id !== id; });
  savePurchases();
  if (typeof renderAll === "function") renderAll();
}

function resetAuction() {
  if (!confirm("Vuoi davvero svuotare tutti gli acquisti dell'asta?")) return;
  auctionPurchases = [];
  savePurchases();
  if (typeof renderAll === "function") renderAll();
}

/* ---------- Rendering ---------- */
function renderAuction() {
  const section = document.getElementById("view-auction");
  if (!section) return;

  const participantsList = getAuctionParticipants();
  const purchases = getAuctionPurchases();

  const participantOptions = participantsList.map(function (p) {
    const sel = Number(auctionParticipantId) === p.id ? "selected" : "";
    return '<option value="' + p.id + '" ' + sel + ">" + auctionEscape(p.nome) +
      " — residuo " + getAuctionRemaining(p.id) + "</option>";
  }).join("");

  function phaseButton(role, label) {
    const act = auctionRolePhase === role ? "active" : "";
    return '<button class="filter-btn ' + act + '" onclick="setAuctionRolePhase(\'' + role + '\')">' + label + "</button>";
  }

  const budgetRows = participantsList.length
    ? participantsList.map(function (part) {
        const spent = getAuctionSpent(part.id);
        const budget = Number(part.budget || 0);
        const res = Math.max(0, budget - spent);
        const c = getAuctionRoleCounts(part.id);
        const tot = purchases.filter(function (p) { return p.participantId === part.id; }).length;
        return "<tr><td><strong>" + auctionEscape(part.nome) + "</strong></td><td>" + budget +
          "</td><td>" + spent + "</td><td>" + res + "</td><td>" + tot + "/" + AUCTION_LIMITS.squadSize +
          "</td><td>P " + c.P + "/" + AUCTION_LIMITS.P + " • D " + c.D + "/" + AUCTION_LIMITS.D +
          " • C " + c.C + "/" + AUCTION_LIMITS.C + " • A " + c.A + "/" + AUCTION_LIMITS.A + "</td></tr>";
      }).join("")
    : '<tr><td colspan="6"><div class="empty">Nessun partecipante.<br><br><button class="btn primary" onclick="showView(\'credits\')">Aggiungi partecipanti</button></div></td></tr>';

  const purchaseRows = purchases.slice().sort(function (a, b) { return Number(b.id) - Number(a.id); })
    .map(function (purchase) {
      const pl = auctionGetPlayerById(purchase.playerId);
      const part = getAuctionParticipants().find(function (p) { return p.id === purchase.participantId; });
      return "<tr><td><strong>" + auctionEscape(pl ? pl.nome : "N.D.") + "</strong></td>" +
        '<td><span class="badge ' + (pl ? pl.ruolo : "") + '">' + (pl ? pl.ruolo : "N.D.") + "</span></td>" +
        "<td>" + auctionEscape(pl ? pl.squadra : "N.D.") + "</td>" +
        "<td>" + auctionEscape(part ? part.nome : "N.D.") + "</td>" +
        "<td>" + purchase.price + "</td>" +
        '<td><button class="btn small" onclick="removeAuctionPurchase(' + purchase.id + ')">Rimuovi</button></td></tr>';
    }).join("");

  section.innerHTML =
    '<div class="card" style="margin-bottom:16px;">' +
    "<h3>Fase dell'asta</h3>" +
    '<div class="filters">' +
    phaseButton("T", "Tutti i ruoli") +
    phaseButton("P", "Portieri") +
    phaseButton("D", "Difensori") +
    phaseButton("C", "Centrocampisti") +
    phaseButton("A", "Attaccanti") +
    "</div>" +
    '<p class="muted" style="margin:0;">La fase limita ricerca e suggerimenti al ruolo selezionato.</p></div>' +

    '<div class="grid">' +
    '<div class="card"><h3>Acquisto giocatore</h3>' +

    // 1) Ricerca con suggerimenti (il selezionato resta fisso)
    '<div class="auction-search-wrap">' +
    '<input id="auctionSearchInput" placeholder="Cerca giocatore..." autocomplete="off" />' +
    '<div id="auctionSuggestions" class="auction-suggestions"></div></div>' +

    // 2) Prezzo  3) Partecipante  Compra
    '<div class="inline-form" style="margin-top:12px;">' +
    '<input id="auctionPrice" type="number" min="1" placeholder="Prezzo" />' +
    '<select id="auctionParticipant" onchange="setAuctionParticipant(this.value)">' +
    '<option value="">Chi compra?</option>' + participantOptions + "</select>" +
    '<button class="btn primary" onclick="buySelectedPlayer()">Compra</button></div></div>' +

    '<div class="card"><h3>Budget partecipanti</h3><div class="table-wrap"><table>' +
    "<thead><tr><th>Partecipante</th><th>Budget</th><th>Speso</th><th>Residuo</th><th>Rosa</th><th>Ruoli</th></tr></thead>" +
    "<tbody>" + budgetRows + "</tbody></table></div></div></div>" +

    '<div class="section-title" style="display:flex; align-items:center; justify-content:space-between;">' +
    "<span>Acquisti</span>" +
    '<button class="btn small" onclick="resetAuction()">Svuota acquisti</button></div>' +

    '<div class="table-wrap"><table>' +
    "<thead><tr><th>Giocatore</th><th>Ruolo</th><th>Squadra</th><th>Partecipante</th><th>Prezzo</th><th>Azioni</th></tr></thead>" +
    "<tbody>" + (purchaseRows || '<tr><td colspan="6"><div class="empty">Nessun acquisto registrato.</div></td></tr>') +
    "</tbody></table></div>";

  const input = document.getElementById("auctionSearchInput");
  if (input) {
    input.addEventListener("input", function () {
      // Se l'utente modifica il testo, deselecta se non corrisponde più al selezionato
      if (auctionPlayerId) {
        const sel = auctionGetPlayerById(auctionPlayerId);
        const typed = input.value.trim().toLowerCase();
        if (!sel || typed !== String(sel.nome).toLowerCase()) {
          auctionPlayerId = null;
          input.classList.remove("auction-input-selected");
        }
      }
      updateAuctionSuggestions();
    });
    input.addEventListener("focus", updateAuctionSuggestions);
  }
}

/* Chiude la tendina cliccando fuori */
document.addEventListener("click", function (e) {
  const wrap = document.querySelector(".auction-search-wrap");
  if (wrap && !wrap.contains(e.target)) hideSuggestions();
});

/* ---------- Titolo + aggancio ---------- */
if (typeof titles !== "undefined") {
  titles.auction = { title: "Asta", subtitle: "Cerca, seleziona, prezzo, partecipante" };
}

if (typeof renderAll === "function") {
  const previousRenderAll = renderAll;
  renderAll = function () {
    previousRenderAll();
    if (typeof currentView !== "undefined" && currentView === "auction") renderAuction();
  };
}