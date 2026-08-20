// Fantacalcio Pro — apply-updates.js
// Applica aggiornamenti, aggiunte e rimozioni al database PLAYERS.

(function () {
  if (typeof PLAYERS === "undefined" || !Array.isArray(PLAYERS)) {
    console.warn("apply-updates: PLAYERS non disponibile.");
    return;
  }

  const updates =
    typeof DATA_UPDATES !== "undefined" && Array.isArray(DATA_UPDATES)
      ? DATA_UPDATES
      : [];

  const newPlayers =
    typeof DATA_NEW_PLAYERS !== "undefined" && Array.isArray(DATA_NEW_PLAYERS)
      ? DATA_NEW_PLAYERS
      : [];

  const removeIds =
    typeof DATA_REMOVE_PLAYER_IDS !== "undefined" &&
    Array.isArray(DATA_REMOVE_PLAYER_IDS)
      ? DATA_REMOVE_PLAYER_IDS
      : [];

  let appliedUpdates = 0;
  let addedPlayers = 0;
  let removedPlayers = 0;

  // Modifica giocatori esistenti
  updates.forEach((update) => {
    if (
      !update ||
      !Number.isFinite(update.id) ||
      typeof update.changes !== "object" ||
      update.changes === null
    ) {
      return;
    }

    const player = PLAYERS.find((item) => item.id === update.id);

    if (!player) return;

    Object.assign(player, update.changes);
    appliedUpdates += 1;
  });

  // Valori predefiniti per nuovi giocatori
  const defaultPlayer = {
    nome: "Nuovo giocatore",
    ruolo: "C",
    squadra: "N.D.",
    qt: 0,
    qtFanta: 0,
    qtGaz: 0,
    ia: "N.D.",
    valore: "N.D.",
    sos: "N.D.",
    mediaVoto: 0,
    mediaFanta: 0,
    gol: 0,
    assist: 0,
    amm: 0
  };

  // Aggiungi nuovi giocatori
  newPlayers.forEach((newPlayer) => {
    if (!newPlayer || !Number.isFinite(newPlayer.id)) return;

    const alreadyExists = PLAYERS.some((item) => item.id === newPlayer.id);

    if (alreadyExists) return;

    PLAYERS.push({
      ...defaultPlayer,
      ...newPlayer
    });

    addedPlayers += 1;
  });

  // Rimuovi giocatori
  if (removeIds.length) {
    for (let i = PLAYERS.length - 1; i >= 0; i -= 1) {
      if (removeIds.includes(PLAYERS[i].id)) {
        PLAYERS.splice(i, 1);
        removedPlayers += 1;
      }
    }
  }

  console.log("apply-updates:", {
    appliedUpdates,
    addedPlayers,
    removedPlayers,
    totalPlayers: PLAYERS.length
  });

  // Funzione utile per cercare un giocatore dalla console
  function findPlayerIdByName(name) {
    const query = String(name || "").toLowerCase();

    return PLAYERS
      .filter((player) =>
        String(player.nome || "").toLowerCase().includes(query)
      )
      .map((player) => ({
        id: player.id,
        nome: player.nome,
        ruolo: player.ruolo,
        squadra: player.squadra
      }));
  }

  window.findPlayerIdByName = findPlayerIdByName;

  // Riepilogo ruoli
  const roleSummary = PLAYERS.reduce(
    (acc, player) => {
      acc[player.ruolo] = (acc[player.ruolo] || 0) + 1;
      return acc;
    },
    {
      P: 0,
      D: 0,
      C: 0,
      A: 0
    }
  );

  console.log("Riepilogo ruoli:", roleSummary);
})();