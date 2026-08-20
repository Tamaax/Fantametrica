// Fantacalcio Pro — enhancements.js
// PARTE 3D
// Acquisto dalla scheda giocatore, indicatori di acquisto, export/import e reset.

function getPurchaseByPlayerId(playerId) {
  if (typeof auctionPurchases === "undefined" || !Array.isArray(auctionPurchases)) {
    return null;
  }

  return auctionPurchases.find((purchase) => purchase.playerId === playerId) || null;
}

function getParticipantNameById(participantId) {
  if (typeof getAuctionParticipants === "function") {
    const participant = getAuctionParticipants().find(
      (item) => item.id === participantId
    );

    if (participant) {
      return participant.nome;
    }
  }

  return "N.D.";
}

function updatePlayerAuctionRemaining() {
  const remainingElement = document.getElementById("playerAuctionRemaining");
  const participantSelect = document.getElementById("playerAuctionParticipant");

  if (!remainingElement || !participantSelect) return;

  const participantId = Number(participantSelect.value);

  if (!participantId) {
    remainingElement.textContent = "N.D.";
    return;
  }

  if (typeof getAuctionRemaining === "function") {
    remainingElement.textContent = getAuctionRemaining(participantId);
  } else {
    remainingElement.textContent = "N.D.";
  }
}

function buyPlayerFromCard() {
  if (
    typeof auctionPurchases === "undefined" ||
    !Array.isArray(auctionPurchases)
  ) {
    alert("Funzione asta non disponibile.");
    return;
  }

  const participantSelect = document.getElementById("playerAuctionParticipant");
  const priceInput = document.getElementById("playerAuctionPrice");

  const participantId = participantSelect ? Number(participantSelect.value) : 0;
  const price = priceInput ? Number(priceInput.value) : 0;
  const playerId = Number(selectedPlayerId);

  if (typeof validateAuctionPurchase !== "function") {
    alert("Funzione asta non disponibile.");
    return;
  }

  const validation = validateAuctionPurchase(participantId, playerId, price);

  if (!validation.ok) {
    alert(validation.error);
    return;
  }

  auctionPurchases = [
    ...auctionPurchases,
    {
      id: Date.now(),
      playerId,
      participantId,
      price: validation.price,
      createdAt: new Date().toISOString()
    }
  ];

  if (typeof auctionSaveStorage === "function") {
    auctionSaveStorage("auctionPurchases", auctionPurchases);
  } else {
    localStorage.setItem("auctionPurchases", JSON.stringify(auctionPurchases));
  }

  if (priceInput) {
    priceInput.value = "";
  }

  if (typeof renderAll === "function") {
    renderAll();
  }
}

function exportAuctionData() {
  const exportPayload = {
    exportedAt: new Date().toISOString(),
    participants: typeof participants !== "undefined" ? participants : [],
    watchlist: typeof watchlist !== "undefined" ? watchlist : [],
    auctionPurchases:
      typeof auctionPurchases !== "undefined" ? auctionPurchases : []
  };

  const json = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "fantacalcio-backup.json";
  link.click();

  URL.revokeObjectURL(url);
}

function importAuctionData(input) {
  const file = input && input.files && input.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (event) {
    try {
      const data = JSON.parse(event.target.result);

      if (Array.isArray(data.participants)) {
        participants = data.participants;

        if (typeof saveStorage === "function") {
          saveStorage("participants", participants);
        } else {
          localStorage.setItem("participants", JSON.stringify(participants));
        }
      }

      if (Array.isArray(data.watchlist)) {
        watchlist = data.watchlist;

        if (typeof saveStorage === "function") {
          saveStorage("watchlist", watchlist);
        } else {
          localStorage.setItem("watchlist", JSON.stringify(watchlist));
        }
      }

      if (Array.isArray(data.auctionPurchases)) {
        auctionPurchases = data.auctionPurchases;

        if (typeof auctionSaveStorage === "function") {
          auctionSaveStorage("auctionPurchases", auctionPurchases);
        } else {
          localStorage.setItem(
            "auctionPurchases",
            JSON.stringify(auctionPurchases)
          );
        }
      }

      alert("Importazione completata.");

      if (typeof renderAll === "function") {
        renderAll();
      }
    } catch {
      alert("Il file selezionato non è valido.");
    }
  };

  reader.readAsText(file);

  input.value = "";
}

function resetAllAuctionData() {
  const confirmed = confirm(
    "Vuoi davvero resettare partecipanti, watchlist e acquisti?"
  );

  if (!confirmed) return;

  if (typeof participants !== "undefined") {
    participants = [];
  }

  if (typeof watchlist !== "undefined") {
    watchlist = [];
  }

  if (typeof auctionPurchases !== "undefined") {
    auctionPurchases = [];
  }

  if (typeof saveStorage === "function") {
    saveStorage("participants", participants);
    saveStorage("watchlist", watchlist);
  } else {
    localStorage.setItem("participants", JSON.stringify(participants));
    localStorage.setItem("watchlist", JSON.stringify(watchlist));
  }

  if (typeof auctionSaveStorage === "function") {
    auctionSaveStorage("auctionPurchases", auctionPurchases);
  } else {
    localStorage.setItem("auctionPurchases", JSON.stringify(auctionPurchases));
  }

  if (typeof renderAll === "function") {
    renderAll();
  }
}

function addPlayerAuctionCard() {
  const section = document.getElementById("view-player");

  if (!section) return;

  if (typeof selectedPlayerId === "undefined" || !selectedPlayerId) return;

  const player =
    typeof getPlayerById === "function"
      ? getPlayerById(selectedPlayerId)
      : null;

  if (!player) return;

  if (typeof getAuctionParticipants !== "function") return;

  const purchase = getPurchaseByPlayerId(player.id);

  const card = document.createElement("div");
  card.className = "card player-auction-card";

  if (purchase) {
    const participantName = getParticipantNameById(purchase.participantId);

    const safeParticipantName =
      typeof auctionEscape === "function"
        ? auctionEscape(participantName)
        : participantName;

    card.innerHTML = `
      <h3>Acquisto</h3>

      <p>
        Questo giocatore è già stato acquistato da
        <strong>${safeParticipantName}</strong>
        per
        <strong>${purchase.price}</strong>
        crediti.
      </p>

      <div class="actions">
        <button class="btn small" onclick="removeAuctionPurchase(${purchase.id})">
          Rimuovi acquisto
        </button>

        <button class="btn small" onclick="showView('auction')">
          Apri asta
        </button>
      </div>
    `;
  } else {
    const participantsList = getAuctionParticipants();

    if (!participantsList.length) {
      card.innerHTML = `
        <h3>Acquisto</h3>

        <p class="muted">
          Nessun partecipante disponibile. Aggiungi prima i partecipanti nella sezione Crediti.
        </p>

        <div class="actions">
          <button class="btn primary" onclick="showView('credits')">
            Vai a Crediti
          </button>
        </div>
      `;
    } else {
      const participantOptions = participantsList
        .map((participant) => {
          const safeName =
            typeof auctionEscape === "function"
              ? auctionEscape(participant.nome)
              : participant.nome;

          return `<option value="${participant.id}">${safeName} — budget ${Number(participant.budget || 0)}</option>`;
        })
        .join("");

      card.innerHTML = `
        <h3>Compra all'asta</h3>

        <div class="inline-form">
          <select id="playerAuctionParticipant">
            <option value="">Seleziona partecipante</option>
            ${participantOptions}
          </select>

          <input
            id="playerAuctionPrice"
            type="number"
            min="1"
            placeholder="Prezzo"
          />

          <button class="btn primary" onclick="buyPlayerFromCard()">
            Compra
          </button>
        </div>

        <div class="stat-label">
          Budget residuo selezionato:
          <strong id="playerAuctionRemaining">N.D.</strong>
        </div>
      `;
    }
  }

  const header = section.querySelector(".player-header");

  if (header) {
    header.insertAdjacentElement("afterend", card);
  } else {
    section.prepend(card);
  }

  const participantSelect = document.getElementById("playerAuctionParticipant");

  if (participantSelect) {
    participantSelect.addEventListener("change", updatePlayerAuctionRemaining);
    updatePlayerAuctionRemaining();
  }
}

// ------------------------------------------------------------------
// Estensione delle funzioni esistenti
// ------------------------------------------------------------------

if (typeof playerRow === "function") {
  const originalPlayerRow = playerRow;

  playerRow = function (player) {
    let html = originalPlayerRow(player);

    const purchase = getPurchaseByPlayerId(player.id);

    if (!purchase) {
      return html;
    }

    const participantName = getParticipantNameById(purchase.participantId);

    const safeParticipantName =
      typeof auctionEscape === "function"
        ? auctionEscape(participantName)
        : participantName;

    const ownedTag = `
      <span
        class="owned-tag"
        title="Acquistato da ${safeParticipantName} per ${purchase.price} crediti"
      >
        🛒 ${purchase.price}
      </span>
    `;

    const nameTarget = `<strong>${player.nome}</strong>`;

    if (html.includes(nameTarget)) {
      html = html.replace(
        nameTarget,
        `<strong>${player.nome}</strong> ${ownedTag}`
      );
    }

    html = html.replace('<tr onclick=', '<tr class="owned-row" onclick=');

    return html;
  };
}

if (typeof renderPlayer === "function") {
  const originalRenderPlayer = renderPlayer;

  renderPlayer = function () {
    originalRenderPlayer();

    try {
      addPlayerAuctionCard();
    } catch (error) {
      console.error("Errore in addPlayerAuctionCard:", error);
    }
  };
}

if (typeof renderCredits === "function") {
  const originalRenderCredits = renderCredits;

  renderCredits = function () {
    originalRenderCredits();

    const section = document.getElementById("view-credits");

    if (!section) return;

    const backupCard = document.createElement("div");
    backupCard.className = "card backup-card";

    backupCard.innerHTML = `
      <h3>Backup e ripristino</h3>

      <div class="actions">
        <button class="btn" onclick="exportAuctionData()">
          Esporta dati
        </button>

        <label class="btn">
          Importa dati
          <input
            type="file"
            accept="application/json"
            onchange="importAuctionData(this)"
          />
        </label>

        <button class="btn small" onclick="resetAllAuctionData()">
          Reset totale
        </button>
      </div>

      <p class="muted" style="margin-top:12px;">
        Esporta partecipanti, watchlist e acquisti in un file JSON.
        L'importazione sostituisce i dati attuali.
      </p>
    `;

    section.appendChild(backupCard);
  };
}

if (typeof buySelectedPlayer === "function") {
  const originalBuySelectedPlayer = buySelectedPlayer;

  buySelectedPlayer = function () {
    originalBuySelectedPlayer();

    if (typeof renderAll === "function") {
      renderAll();
    }
  };
}

if (typeof removeAuctionPurchase === "function") {
  const originalRemoveAuctionPurchase = removeAuctionPurchase;

  removeAuctionPurchase = function (id) {
    originalRemoveAuctionPurchase(id);

    if (typeof renderAll === "function") {
      renderAll();
    }
  };
}