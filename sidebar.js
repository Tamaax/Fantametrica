// Fantacalcio Pro — sidebar.js
// Sidebar retrattile: Toggle identico agli altri bottoni, spostato dinamicamente

(function () {
  const ICONS = {
    dashboard: '<rect x="3" y="3" width="7" height="7" rx="1.5"></rect><rect x="14" y="3" width="7" height="7" rx="1.5"></rect><rect x="3" y="14" width="7" height="7" rx="1.5"></rect><rect x="14" y="14" width="7" height="7" rx="1.5"></rect>',
    players: '<path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"></path><circle cx="10" cy="7" r="4"></circle><path d="M20 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>',
    fasce: '<polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline>',
    watchlist: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>',
    credits: '<line x1="12" y1="2" x2="12" y2="22"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>',
    auction: '<path d="m14 13-7.5 7.5a2.12 2.12 0 0 1-3-3L11 10"></path><path d="m16 16 6-6"></path><path d="m8 8 6-6"></path><path d="m9 7 8 8"></path><path d="m21 11-8-8"></path>',
    rose: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>',
    collapse: '<polyline points="11 17 6 12 11 7"></polyline><polyline points="18 17 13 12 18 7"></polyline>',
    expand: '<polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline>'
  };

  function svgWrap(inner) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
  }

  const sidebar = document.querySelector(".sidebar");
  if (!sidebar) return;

  const brand = sidebar.querySelector(".brand");
  const nav = sidebar.querySelector("nav");

  // 1. Prepara il testo della brand per nasconderlo
  if (brand) {
    const textWrap = brand.querySelector("div:not(.logo)");
    if (textWrap) textWrap.classList.add("brand-text");
  }

  // 2. Crea il pulsante Toggle (identico agli altri bottoni nav)
  const toggle = document.createElement("button");
  toggle.className = "nav-btn sidebar-toggle"; // Usa nav-btn per avere lo stesso stile!
  toggle.type = "button";
  
  // Contenitore icona (come gli altri bottoni)
  const iconSpan = document.createElement("span");
  iconSpan.className = "nav-icon";
  
  // Etichetta vuota (per mantenere la struttura flex, ma senza testo)
  const labelSpan = document.createElement("span");
  labelSpan.className = "nav-label";
  labelSpan.style.display = "none"; // Niente testo per il toggle

  toggle.appendChild(iconSpan);
  toggle.appendChild(labelSpan);

  // 3. Logica di spostamento e stato
  const KEY = "sidebarCollapsed";

  function updateTogglePosition(isCollapsed) {
    // Aggiorna icona
    iconSpan.innerHTML = svgWrap(isCollapsed ? ICONS.expand : ICONS.collapse);
    toggle.title = isCollapsed ? "Espandi sidebar" : "Comprimi sidebar";

    // SPOSTA FISICAMENTE il bottone
    if (isCollapsed) {
      // Se compresso: mettilo nel NAV (sotto il logo, con gli altri)
      if (nav && toggle.parentElement !== nav) {
        nav.insertBefore(toggle, nav.firstChild);
      }
    } else {
      // Se espanso: mettilo nella BRAND (accanto al logo)
      if (brand && toggle.parentElement !== brand) {
        brand.appendChild(toggle);
      }
    }
  }

  function setCollapsed(collapsed) {
    document.body.classList.toggle("sidebar-collapsed", collapsed);
    updateTogglePosition(collapsed);
    try { localStorage.setItem(KEY, collapsed ? "1" : "0"); } catch (e) {}
  }

  toggle.addEventListener("click", function () {
    setCollapsed(!document.body.classList.contains("sidebar-collapsed"));
  });

  // Inizializzazione
  let saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  setCollapsed(saved === "1");

  // 4. Decora gli altri bottoni della nav con le icone
  function decorateNav() {
    document.querySelectorAll(".nav-btn:not(.sidebar-toggle)").forEach(function (btn) {
      if (btn.dataset.iconDone) return;
      btn.dataset.iconDone = "1";

      const view = btn.dataset.view || "";
      const rawLabel = btn.textContent.trim();

      const iSpan = document.createElement("span");
      iSpan.className = "nav-icon";
      iSpan.innerHTML = svgWrap(ICONS[view] || ICONS.dashboard);

      const lSpan = document.createElement("span");
      lSpan.className = "nav-label";
      lSpan.textContent = rawLabel;

      btn.textContent = "";
      btn.appendChild(iSpan);
      btn.appendChild(lSpan);
      if (!btn.title) btn.title = rawLabel;
    });
  }

  decorateNav();

  // Observer per bottoni aggiunti dinamicamente (es. Rose)
  const observer = new MutationObserver(decorateNav);
  observer.observe(sidebar, { childList: true, subtree: true });
})();