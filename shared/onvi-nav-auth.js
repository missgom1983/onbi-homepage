/* On:Vi GNB 로그인 상태 — v3.5.0 Nav 판정 규칙의 단일 구현
   회원 = 이름 · 계정연결(provider) · 온보딩 셋이 모두 있을 때만이다.
   셋 중 일부만 남은 고아 상태는 그때그때 정리해 Nav와 본문이 어긋나지 않게 한다.
   가입 중(이름·계정연결은 있고 온보딩만 아직)은 정상적인 진행 상태라 지우지 않는다.
   이전에는 페이지마다 판정이 흩어져 있어(1회성 A형 / repaint B형) 뒤로가기·탭 복귀에서
   Nav가 실제 세션과 어긋났다. 판정과 다시 읽기를 여기로 모은다. */
(function () {
  var KEYS = ['onvi.user.name', 'onvi.user.provider', 'onvi.onboarded'];

  function get(k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }
  function clearAll() { try { KEYS.forEach(function (k) { localStorage.removeItem(k); }); } catch (e) { /* 무시 */ } }

  function readAuth() {
    var name = get('onvi.user.name');
    var prov = get('onvi.user.provider');
    var done = get('onvi.onboarded');
    var whole = !!(name && prov && done);
    var pending = !!(name && prov && !done);
    if (!whole && !pending && (name || prov || done)) clearAll();
    return whole ? name : '';
  }

  /* 햄버거 패널의 계정 링크는 상태에 따라 로그인 ↔ 내 공간으로 오간다.
     되돌릴 수 있도록 원래 값을 처음 한 번만 기억해 둔다. */
  var panelLink = null, panelHref = '', panelText = '';
  function accountLink() {
    if (panelLink === null) {
      panelLink = document.querySelector('#navPanel a[href="login.html"]') || false;
      if (panelLink) { panelHref = panelLink.getAttribute('href'); panelText = panelLink.textContent; }
    }
    return panelLink || null;
  }

  function paint() {
    var name = readAuth();
    var login = document.getElementById('navLogin');
    var user = document.getElementById('navUser');
    var pLogin = document.getElementById('panelLogin');
    var pUser = document.getElementById('panelUser');

    if (login) login.hidden = !!name;
    if (user) user.hidden = !name;
    if (pLogin) pLogin.hidden = !!name;
    if (pUser) pUser.hidden = !name;

    // 이름 슬롯은 페이지에 따라 #navUserName 또는 [data-name] 이다
    var slot = document.getElementById('navUserName') || (user && user.querySelector('[data-name]'));
    if (slot) slot.textContent = name ? name + ' 님' : '';
    var av = document.querySelector('[data-avatar-initial]');
    if (av) av.textContent = name ? (name.trim().charAt(0) || '') : '';

    var a = accountLink();
    if (a) {
      if (name) { a.setAttribute('href', 'mypage.html'); a.textContent = name + ' 님의 공간'; }
      else { a.setAttribute('href', panelHref); a.textContent = panelText; }
    }
  }

  function signOut() {
    if (window.OnViAuth && window.OnViAuth.signOut) { window.OnViAuth.signOut(); return; }
    clearAll();
    try { window.dispatchEvent(new Event('onvi-auth')); } catch (e) { /* 무시 */ }
    window.location.href = 'index.html';
  }

  function bindLogout(id) {
    var el = document.getElementById(id);
    if (!el || el.__onviLogout) return;
    el.__onviLogout = 1;
    el.addEventListener('click', function (e) { e.preventDefault(); signOut(); });
  }

  function start() {
    paint();
    bindLogout('navLogout');
    bindLogout('panelLogout');

    // 뒤로가기(캐시 복원)·탭 복귀처럼 스크립트가 다시 돌지 않는 경우까지 다시 읽는다
    window.addEventListener('pageshow', paint);
    window.addEventListener('focus', paint);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) paint(); });
    window.addEventListener('storage', paint);
    window.addEventListener('onvi-auth', paint);
    // 같은 페이지의 다른 스크립트가 마운트 직후 로그인 상태를 쓰는 경우
    setTimeout(paint, 250);
    setTimeout(paint, 1200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  window.OnViNavAuth = { paint: paint, readAuth: readAuth, signOut: signOut };
})();
