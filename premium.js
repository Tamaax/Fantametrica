// Fantacalcio Pro — premium.js
// PARTE 3F — Grafici dashboard, vista Rose e rifiniture premium.

(function () {
  function premiumEscape(value) {
    if (typeof auctionEscape === "function") {
      return auctionEscape(value);
    }

    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function premiumPlayers() {
    if (typeof DB !== "undefined" && Array.isArray(DB)) {
      return DB;
    }

    if (typeof PLAYERS !== "undefined" && Array.isArray(PLAYERS)) {
      return PLAYERS;
    }

    return [];
  }

  function premiumParticipants() {
    if (typeof getAuctionParticipants === "function") {
      return getAuctionParticipants();
    }

    if (typeof participants !== "undefined" && Array.isArray(participants)) {
      return participants;
    }

    return [];
  }

  function premiumPurchases() {
    return typeof auctionPurchases !== "undefined" && Array.isArray(auctionPurchases)
      ? auctionPurchases
      : [];
  }

  function premiumGetPlayer(id) {
    if (typeof auctionGetPlayerById === "function") {
      return auctionGetPlayerById(id);
    }

    return premiumPlayers().find((player) => player.id === Number(id));
  }

  function premiumLimits() {
    return typeof AUCTION_LIMITS !== "undefined"
      ? AUCTION_LIMITS
      : {
          squadSize: 25,
          P: 3,
          D: 8,
          C: 8,
          A: 6
        };
  }

  function premiumGetSpent(participantId) {
    if (typeof getAuctionSpent === "function") {
      return getAuctionSpent(participantId);
    }

    return premiumPurchases()
      .filter((purchase) => purchase.participantId === participantId)
      .reduce((sum, purchase) => sum + Number(purchase.price || 0), 0);
  }

  function premiumGetRemaining(participantId) {
    if (typeof getAuctionRemaining === "function") {
      return getAuctionRemaining(participantId);
    }

    const participant = premiumParticipants().find(
      (item) => item.id === participantId
    );

    if (!participant) {
      return 0;
    }

    return Math.max(0, Number(participant.budget || 0) - premiumGetSpent(participantId));
  }

  function premiumGetRoleCounts(participantId) {
    if (typeof getAuctionRoleCounts === "function") {
      return getAuctionRoleCounts(participantId);
    }

    const counts = {
      P: 0,
      D: 0,
      C: 0,
      A: 0
    };

    premiumPurchases()
      .filter((purchase) => purchase.participantId === participantId)
      .forEach((purchase) => {
        const player = premiumGetPlayer(purchase.playerId);

        if (player && counts[player.ruolo] !== undefined) {
          counts[player.ruolo] += 1;
        }
      });

    return counts;
  }

  function ensureRoseNavigation() {
    let button = document.querySelector('.nav-btn[data-view="rose"]');

    if (!button) {
      button = document.createElement("button");
      button.className = "nav-btn";
      button.dataset.view = "rose";
      button.textContent = "Rose";

      const nav = document.querySelector(".sidebar nav");

      if (nav) {
        nav.appendChild(button);
      }
    }

    if (!button.dataset.premiumBound) {
      button.dataset.premiumBound = "1";

      button.addEventListener("click", function () {
        if (typeof showView === "function") {
          showView("rose");
        }
      });
    }

    let section = document.getElementById("view-rose");

    if (!section) {
      section = document.createElement("section");
      section.id = "view-rose";
      section.className = "view";

      const main = document.querySelector("main");
      const playerSection = document.getElementById("view-player");

      if (main) {
        if (playerSection) {
          main.insertBefore(section, playerSection);
        } else {
          main.appendChild(section);
        }
      }
    }
  }

  function syncRoseNav() {
    const button = document.querySelector('.nav-btn[data-view="rose"]');

    if (!button) return;

    const isActive =
      typeof currentView !== "undefined" && currentView === "rose";

    button.classList.toggle("active", isActive);
  }

  function renderPremiumDashboard() {
    const section = document.getElementById("view-dashboard");

    if (!section) return;

    const existing = document.getElementById("premium-dashboard-charts");

    if (existing) {
      existing.remove();
    }

    const players = premiumPlayers();

    const topPlayers = players
      .filter((player) => Number(player.mediaFanta) > 0)
      .sort((a, b) => Number(b.mediaFanta) - Number(a.mediaFanta))
      .slice(0, 10);

    const maxMedia = topPlayers.length
      ? Number(topPlayers[0].mediaFanta)
      : 0;

    const roleCounts = {
      P: 0,
      D: 0,
      C: 0,
      A: 0
    };

    players.forEach((player) => {
      if (roleCounts[player.ruolo] !== undefined) {
        roleCounts[player.ruolo] += 1;
      }
    });

    const maxRole = Math.max(
      roleCounts.P,
      roleCounts.D,
      roleCounts.C,
      roleCounts.A,
      1
    );

    const topRows = topPlayers.length
      ? topPlayers
          .map((player) => {
            const width = maxMedia
              ? Math.max(2, (Number(player.mediaFanta) / maxMedia) * 100)
              : 0;

            return `
              <div class="bar-row" onclick="openPlayer(${player.id})">
                <div class="bar-label">
                  <span class="badge ${player.ruolo}" style="margin-right:6px;">
                    ${player.ruolo}
                  </span>
                  ${premiumEscape(player.nome)}
                </div>

                <div class="bar-track">
                  <div class="bar-fill" style="width:${width}%;"></div>
                </div>

                <div class="bar-value">
                  ${Number(player.mediaFanta).toFixed(2)}
                </div>
              </div>
            `;
          })
          .join("")
      : `<div class="empty">Nessun dato disponibile.</div>`;

    const roleRows = ["P", "D", "C", "A"]
      .map((role) => {
        const count = roleCounts[role];
        const width = maxRole ? Math.max(2, (count / maxRole) * 100) : 0;

        const roleLabel =
          typeof roleLabels !== "undefined" && roleLabels[role]
            ? roleLabels[role]
            : role;

        return `
          <div class="bar-row">
            <div class="bar-label">${premiumEscape(roleLabel)}</div>

            <div class="bar-track">
              <div class="bar-fill role-${role}" style="width:${width}%;"></div>
            </div>

            <div class="bar-value">${count}</div>
          </div>
        `;
      })
      .join("");

    const wrapper = document.createElement("div");

    wrapper.id = "premium-dashboard-charts";
    wrapper.className = "grid two premium-chart";
    wrapper.style.marginTop = "16px";

    wrapper.innerHTML = `
      <div class="card">
        <h3>Top 10 per media fantacalcio</h3>
        ${topRows}
      </div>

      <div class="card">
        <h3>Distribuzione database</h3>
        ${roleRows}
      </div>
    `;

    section.appendChild(wrapper);
  }

  function renderRose() {
    const section = document.getElementById("view-rose");

    if (!section) return;

    const participantsList = premiumParticipants();

    if (!participantsList.length) {
      section.innerHTML = `
        <div class="card">
          <div class="empty">
            Nessun partecipante inserito.
            <br><br>
            Aggiungi prima i partecipanti nella sezione Crediti, poi usa la sezione Asta per registrare gli acquisti.
            <br><br>
            <button class="btn primary" onclick="showView('credits')">
              Aggiungi partecipanti
            </button>
          </div>
        </div>
      `;

      return;
    }

    const purchases = premiumPurchases();
    const limits = premiumLimits();
    const roleOrder = ["P", "D", "C", "A"];

    const cards = participantsList
      .map((participant) => {
        const spent = premiumGetSpent(participant.id);
        const budget = Number(participant.budget || 0);
        const remaining = premiumGetRemaining(participant.id);
        const counts = premiumGetRoleCounts(participant.id);

        const participantPurchases = purchases.filter(
          (purchase) => purchase.participantId === participant.id
        );

        const total = participantPurchases.length;

        const chips = [
          `<span class="rose-count ${
            total >= limits.squadSize ? "full" : ""
          }">Totale ${total}/${limits.squadSize ?? "-"}</span>`
        ]
          .concat(
            roleOrder.map((role) => {
              const count = counts[role] || 0;
              const limit = limits[role];
              const full = Number.isFinite(limit) && count >= limit;

              return `<span class="rose-count ${
                full ? "full" : ""
              }">${role} ${count}/${Number.isFinite(limit) ? limit : "-"}</span>`;
            })
          )
          .join("");

        const items = [];

        roleOrder.forEach((role) => {
          participantPurchases
            .filter((purchase) => {
              const player = premiumGetPlayer(purchase.playerId);
              return player && player.ruolo === role;
            })
            .sort((a, b) => Number(b.price || 0) - Number(a.price || 0))
            .forEach((purchase) => {
              const player = premiumGetPlayer(purchase.playerId);

              if (!player) return;

              items.push(`
                <div class="rose-item">
                  <div class="rose-item-left">
                    <span class="badge ${player.ruolo}">${player.ruolo}</span>

                    <div style="min-width:0;">
                      <div class="rose-item-name">
                        ${premiumEscape(player.nome)}
                      </div>

                      <div class="rose-item-meta">
                        ${premiumEscape(player.squadra)}
                      </div>
                    </div>
                  </div>

                  <div class="rose-item-right">
                    <span class="rose-price">${purchase.price}</span>

                    <button
                      class="btn small"
                      onclick="removeAuctionPurchase(${purchase.id})"
                    >
                      Rimuovi
                    </button>
                  </div>
                </div>
              `);
            });
        });

        const list = items.length
          ? items.join("")
          : `<div class="empty">Nessun acquisto registrato per questo partecipante.</div>`;

        return `
          <div class="card rose-card">
            <div class="rose-header">
              <div>
                <h3>${premiumEscape(participant.nome)}</h3>
                <div class="rose-item-meta">
                  Budget iniziale: ${budget}
                </div>
              </div>

              <div class="rose-budget">
                Speso: ${spent}
                <br>
                Residuo: ${remaining}
              </div>
            </div>

            <div class="rose-counts">
              ${chips}
            </div>

            ${list}
          </div>
        `;
      })
      .join("");

    section.innerHTML = `
      <div class="card" style="margin-bottom:16px;">
        <div
          style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:12px;
            flex-wrap:wrap;
          "
        >
          <div>
            <h3 style="margin:0;">Rose partecipanti</h3>

            <p class="muted" style="margin:4px 0 0;">
              Acquisti raggruppati per ruolo, con budget e limiti della rosa.
            </p>
          </div>

          <div class="actions">
            <button class="btn" onclick="showView('auction')">
              Apri asta
            </button>

            <button class="btn" onclick="showView('credits')">
              Gestisci crediti
            </button>
          </div>
        </div>
      </div>

      <div class="rose-grid">
        ${cards}
      </div>
    `;
  }

  function initPremium() {
    ensureRoseNavigation();

    if (typeof titles !== "undefined") {
      titles.rose = {
        title: "Rose",
        subtitle: "Giocatori acquistati per partecipante"
      };
    }

    if (typeof renderAll === "function") {
      const previousRenderAll = renderAll;

      renderAll = function () {
        previousRenderAll();

        try {
          syncRoseNav();

          if (typeof currentView !== "undefined" && currentView === "dashboard") {
            renderPremiumDashboard();
          }

          if (typeof currentView !== "undefined" && currentView === "rose") {
            renderRose();
          }
        } catch (error) {
          console.error("Errore premium:", error);
        }
      };
    }

    if (typeof currentView !== "undefined" && currentView === "dashboard") {
      renderPremiumDashboard();
    }

    if (typeof currentView !== "undefined" && currentView === "rose") {
      renderRose();
    }
  }

  initPremium();
})();