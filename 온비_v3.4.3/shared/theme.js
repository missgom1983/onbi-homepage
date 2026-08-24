/* On-Gi shared theme controller — reads from localStorage on load
   so tweaks persist across pages (landing ↔ care app ↔ B2G console). */
(function() {
  const KEY = 'ongi.theme.v1';
  function applyTheme(t) {
    const root = document.documentElement;
    if (t.theme) root.setAttribute('data-theme', t.theme);
    if (t.senior !== undefined) root.setAttribute('data-senior', String(!!t.senior));
    if (t.palette) root.setAttribute('data-palette', t.palette);
  }
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch(e) { return {}; }
  }
  function save(t) { localStorage.setItem(KEY, JSON.stringify(t)); }
  function update(patch) {
    const next = { ...load(), ...patch };
    save(next);
    applyTheme(next);
    window.dispatchEvent(new CustomEvent('ongi-theme-change', { detail: next }));
    return next;
  }
  applyTheme(load());
  window.OnGiTheme = { load, save, update, apply: applyTheme };
})();
