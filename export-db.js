// Fantacalcio Pro — export-db.js
// Genera i file originali aggiornati (portieri/difensori/centrocampisti/attaccanti/index)

(function () {
  function cleanPlayer(p) {
    const copy = {};
    for (const k in p) {
      if (typeof p[k] === "function") continue;
      copy[k] = p[k];
    }
    return copy;
  }

  function downloadFile(filename, content) {
    const blob = new Blob([content], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function exportDatabase() {
    if (typeof PLAYERS === "undefined") { alert("Database non disponibile."); return; }

    const groups = { P: [], D: [], C: [], A: [] };
    PLAYERS.forEach(function (p) {
      (groups[p.ruolo] || (groups[p.ruolo] = [])).push(cleanPlayer(p));
    });

    const files = [
      ["portieri.js",       "const PORTIERI = "        + JSON.stringify(groups.P, null, 2) + ";\n"],
      ["difensori.js",      "const DIFENSORI = "       + JSON.stringify(groups.D, null, 2) + ";\n"],
      ["centrocampisti.js", "const CENTROCAMPISTI = "  + JSON.stringify(groups.C, null, 2) + ";\n"],
      ["attaccanti.js",     "const ATTACCANTI = "      + JSON.stringify(groups.A, null, 2) + ";\n"],
      ["index.js",
        "const PLAYERS = []\n  .concat(PORTIERI)\n  .concat(DIFENSORI)\n  .concat(CENTROCAMPISTI)\n  .concat(ATTACCANTI);\n"]
    ];

    files.forEach(function (f, i) {
      setTimeout(function () { downloadFile(f[0], f[1]); }, i * 400);
    });

    alert("Download avviato.\nSostituisci i 5 file nella cartella data/ e ricarica su Netlify.");
  }

  function addExportButton() {
    if (typeof currentView === "undefined" || currentView !== "credits") return;
    const section = document.getElementById("view-credits");
    if (!section) return;
    if (section.querySelector("#btn-export-db")) return;

    const actions = section.querySelector(".backup-card .actions");
    const btn = document.createElement("button");
    btn.id = "btn-export-db";
    btn.className = "btn primary";
    btn.type = "button";
    btn.textContent = "Scarica database aggiornato";
    btn.addEventListener("click", exportDatabase);

    if (actions) actions.appendChild(btn);
    else section.appendChild(btn);
  }

  if (typeof renderAll === "function") {
    const prev = renderAll;
    renderAll = function () { prev(); addExportButton(); };
  }
  addExportButton();
})();