// Fantacalcio Pro — fascia.js (Fasce 1-6 + R basate su IA)
(function () {
  const FASCIA_ORDER = [1, 2, 3, 4, 5, 6, "R"];

  function fasciaFromIA(ia) {
    const n = Number(ia);
    if (!Number.isFinite(n)) return "R";
    if (n >= 77) return 1;
    if (n >= 74) return 2;
    if (n >= 71) return 3;
    if (n >= 68) return 4;
    if (n >= 65) return 5;
    if (n >= 62) return 6;
    return "R";
  }

  function shiftFascia(raw) {
    const s = String(raw || "").trim();
    if (!s) return null;
    if (/^r$/i.test(s)) return "R";
    const m = s.match(/^(\d+)/);
    return m ? Number(m[1]) + 1 : null;
  }

  // Carica giocatori personalizzati (pulsante +)
  try {
    const customJson = localStorage.getItem("fantacalcio_custom_players");
    if (customJson && typeof PLAYERS !== "undefined") {
      const custom = JSON.parse(customJson);
      if (Array.isArray(custom)) {
        custom.forEach(function (cp) {
          if (!PLAYERS.some(function (p) { return p.id === cp.id; })) PLAYERS.push(cp);
        });
      }
    }
  } catch (e) {}

  function assignFasce() {
    if (typeof PLAYERS === "undefined" || !Array.isArray(PLAYERS)) return;

    let manual = {};
    try {
      const saved = localStorage.getItem("fantacalcio_manual_fasce");
      if (saved) manual = JSON.parse(saved);
    } catch (e) {}

    PLAYERS.forEach(function (player) {
      // Priorità assoluta: modifica manuale
      if (manual[player.id] !== undefined) {
        player.fascia = manual[player.id];
        return;
      }

      if (player.ruolo === "P" && typeof player.fascia === "string" && player.fascia) {
        player.fasciaRaw = player.fascia;
      }

      const ia = Number(player.ia);
      if (Number.isFinite(ia)) {
        player.fascia = fasciaFromIA(ia);
      } else if (player.fasciaRaw) {
        player.fascia = shiftFascia(player.fasciaRaw) ?? "R";
      } else {
        player.fascia = "R";
      }
    });
  }

  assignFasce();

  window.assignFasce = assignFasce;
  window.computeFasciaFromIA = fasciaFromIA;

  window.saveManualFascia = function (playerId, newFascia) {
    let manual = {};
    try {
      const saved = localStorage.getItem("fantacalcio_manual_fasce");
      if (saved) manual = JSON.parse(saved);
    } catch (e) {}
    manual[playerId] = newFascia;
    try { localStorage.setItem("fantacalcio_manual_fasce", JSON.stringify(manual)); } catch (e) {}

    if (typeof getPlayerById === "function") {
      const p = getPlayerById(playerId);
      if (p) p.fascia = newFascia;
    }
    if (typeof renderAll === "function") renderAll();
  };

  /* ---------- Sezione Fasce ---------- */
  function fasciaEscape(v) {
    return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function getDB() {
    if (typeof DB !== "undefined" && Array.isArray(DB)) return DB;
    if (typeof PLAYERS !== "undefined" && Array.isArray(PLAYERS)) return PLAYERS;
    return [];
  }

  function renderFasce() {
    const section = document.getElementById("view-fasce");
    if (!section) return;

    const db = getDB();
    const roleSort = { P: 0, D: 1, C: 2, A: 3 };
    const sortFn = function (a, b) {
      const ra = roleSort[a.ruolo] ?? 9, rb = roleSort[b.ruolo] ?? 9;
      if (ra !== rb) return ra - rb;
      return String(a.nome || "").localeCompare(String(b.nome || ""));
    };

    const cards = FASCIA_ORDER.map(function (fascia) {
      const list = db.filter(function (p) { return p.fascia === fascia; }).sort(sortFn);
      const counts = { P: 0, D: 0, C: 0, A: 0 };
      list.forEach(function (p) { if (counts[p.ruolo] !== undefined) counts[p.ruolo] += 1; });

      const rows = list.map(function (p) {
        return '<tr onclick="openPlayer(' + p.id + ')">' +
          '<td><span class="badge ' + p.ruolo + '">' + p.ruolo + "</span></td>" +
          "<td><strong>" + fasciaEscape(p.nome) + "</strong></td>" +
          "<td>" + fasciaEscape(p.squadra) + "</td>" +
          "<td>" + (p.ia ?? "N.D.") + "</td>" +
          "<td>" + (p.qt ?? 0) + "</td></tr>";
      }).join("");

      const title = fascia === "R" ? "Riserve (R)" : fascia + "ª fascia";

      return '<div class="card fascia-card">' +
        '<div class="fascia-head">' +
        '<span class="fascia-badge fb-' + fascia + '">' + (fascia === "R" ? "R" : fascia + "ª") + "</span>" +
        "<div><h3>" + title + "</h3>" +
        '<div class="fascia-counts">P ' + counts.P + " • D " + counts.D + " • C " + counts.C + " • A " + counts.A + "</div></div>" +
        '<div class="fascia-total">' + list.length + "</div></div>" +
        '<div class="table-wrap"><table><thead><tr>' +
        "<th>Ruolo</th><th>Nome</th><th>Squadra</th><th>Overall</th><th>QT</th>" +
        "</tr></thead><tbody>" +
        (rows || '<tr><td colspan="5"><div class="empty">Nessun giocatore in questa fascia.</div></td></tr>') +
        "</tbody></table></div></div>";
    }).join("");

    section.innerHTML =
      '<div class="card" style="margin-bottom:16px;"><p class="muted" style="margin:0;line-height:1.7;">' +
      "Fasce assegnate in base all'indice Overall</p></div>" +
      '<div class="fasce-grid">' + cards + "</div>";
  }

  if (typeof titles !== "undefined") {
    titles.fasce = { title: "Fasce", subtitle: "Giocatori raggruppati per fascia (1-6 + R)" };
  }

  if (typeof renderAll === "function") {
    const prev = renderAll;
    renderAll = function () {
      prev();
      if (typeof currentView !== "undefined" && currentView === "fasce") renderFasce();
    };
  }
})();