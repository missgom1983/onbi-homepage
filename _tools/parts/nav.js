<script>
  (function () {
    var root = document.getElementById('navRoot');
    var panel = document.getElementById('navPanel');
    var burger = document.getElementById('navBurger');
    var open = false;

    function setOpen(v) {
      open = v;
      panel.classList.toggle('open', v);
      burger.setAttribute('aria-expanded', v ? 'true' : 'false');
    }
    if (panel && burger) {
      burger.addEventListener('click', function () { setOpen(!open); setMenu(false); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) setOpen(false); });
      document.addEventListener('pointerdown', function (e) {
        if (!open) return;
        if (!root.contains(e.target)) setOpen(false);
      });
      panel.addEventListener('click', function (e) { if (e.target.tagName === 'A') setOpen(false); });
    }

    // 모바일: 아래로 스크롤하면 네비를 감추고, 위로 올리면 다시 보여준다
    var lastY = window.scrollY;
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      var d = y - lastY;
      if (Math.abs(d) < 8) return;
      lastY = y;
      if (d > 0 && y > 140 && !open && !menuOpen) root.classList.add('onvi-nav-hidden');
      else if (d < 0 || y <= 140) root.classList.remove('onvi-nav-hidden');
    }, { passive: true });

    // 프로필 드롭다운
    var menuOpen = false;
    var userBtn = document.getElementById('navUserBtn');
    var menu = document.getElementById('navMenu');
    function setMenu(v) {
      menuOpen = v;
      if (menu) menu.hidden = !v;
      if (userBtn) userBtn.setAttribute('aria-expanded', v ? 'true' : 'false');
    }
    if (userBtn && menu) {
      userBtn.addEventListener('click', function (e) { e.stopPropagation(); setMenu(!menuOpen); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuOpen) setMenu(false); });
      document.addEventListener('pointerdown', function (e) {
        if (menuOpen && !root.contains(e.target)) setMenu(false);
      });
    }
    var logoutBtn = document.getElementById('navLogout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        try { localStorage.removeItem('onvi.user.name'); window.dispatchEvent(new Event('onvi-auth')); } catch (e) { /* 무시 */ }
        window.location.href = 'index.html';
      });
    }

    // 로그인 상태에 따라 GNB 우측을 로그인 버튼 ↔ 내 공간으로 전환
    function paint() {
      var name = '';
      try { name = localStorage.getItem('onvi.user.name') || ''; } catch (e) { /* 무시 */ }
      var login = document.getElementById('navLogin');
      var user = document.getElementById('navUser');
      var pLogin = document.getElementById('panelLogin');
      var pUser = document.getElementById('panelUser');
      if (name) {
        if (login) login.hidden = true;
        if (user) { user.hidden = false; document.getElementById('navUserName').textContent = name + ' 님'; }
        if (pLogin) pLogin.hidden = true;
        if (pUser) pUser.hidden = false;
      } else {
        if (login) login.hidden = false;
        if (user) user.hidden = true;
        if (pLogin) pLogin.hidden = false;
        if (pUser) pUser.hidden = true;
      }
    }
    paint();
    window.addEventListener('storage', paint);
    window.addEventListener('onvi-auth', paint);
  })();
</script>
