// Questo file crea il database unico PLAYERS
// unendo portieri, difensori, centrocampisti e attaccanti.

const PLAYERS = [
  ...(typeof PORTIERI !== "undefined" ? PORTIERI : []),
  ...(typeof DIFENSORI !== "undefined" ? DIFENSORI : []),
  ...(typeof CENTROCAMPISTI !== "undefined" ? CENTROCAMPISTI : []),
  ...(typeof ATTACCANTI !== "undefined" ? ATTACCANTI : [])
];

console.log("Database giocatori caricato:", PLAYERS.length, "giocatori");