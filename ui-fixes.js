// Fantacalcio Pro — ui-fixes.js
// Rende grigio il testo delle tendine quando mostrano il segnaposto,
// funzionando su tutti i browser (non dipende da :has).

(function () {
  function syncSelects() {
    document.querySelectorAll("select").forEach(function (sel) {
      sel.classList.toggle("select-placeholder", sel.value === "");
    });
  }

  // Aggiorna al cambio di valore
  document.addEventListener("change", function (e) {
    if (e.target && e.target.tagName === "SELECT") {
      e.target.classList.toggle("select-placeholder", e.target.value === "");
    }
  });

  // Aggiorna dopo ogni render (le tendine vengono ricreate)
  if (typeof renderAll === "function") {
    const prev = renderAll;
    renderAll = function () {
      prev();
      syncSelects();
    };
  }

  window.addEventListener("load", syncSelects);
  syncSelects();
})();

// ---- Fix ordinamento Gol/GS per i portieri ----
(function () {
  if (typeof sortPlayers !== "function") return;

  const prevSort = sortPlayers;

  sortPlayers = function (a, b) {
    if (typeof sortKey !== "undefined" && sortKey === "gol") {
      const val = function (p) {
        // Portieri -> gol subiti; altri ruoli -> gol fatti
        return Number(p.ruolo === "P" ? (p.golSubiti ?? 0) : (p.gol ?? 0));
      };

      const diff = val(a) - val(b);

      if (diff !== 0) {
        const asc = typeof sortDirection !== "undefined" && sortDirection === "asc";
        return asc ? diff : -diff;
      }
    }
    return prevSort(a, b);
  };
})();