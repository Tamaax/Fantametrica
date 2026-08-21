// state-manager.js
(function() {
  const VIEW_KEY = 'fantacalcio_current_view';
  const PLAYER_KEY = 'fantacalcio_current_player';
  
  // Salva la vista quando cambia
  if (typeof showView === 'function') {
    const originalShowView = showView;
    showView = function(viewName, playerId) {
      originalShowView(viewName, playerId);
      try { 
        localStorage.setItem(VIEW_KEY, viewName);
        if (playerId) localStorage.setItem(PLAYER_KEY, playerId);
      } catch(e) {}
    };
  }
  
  // Ripristina al caricamento
  window.addEventListener('load', function() {
    try {
      const savedView = localStorage.getItem(VIEW_KEY);
      const savedPlayer = localStorage.getItem(PLAYER_KEY);
      
      if (savedView && typeof showView === 'function') {
        if (savedView === 'player' && savedPlayer) {
          showView('player', savedPlayer);
        } else if (savedView !== 'dashboard') {
          showView(savedView);
        }
      }
    } catch(e) {}
  });
})();