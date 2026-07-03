/* sso-menu.js — On:Gi 네비게이션 계정/로그인 메뉴
 * <div data-ongi-sso data-system="..."></div> 위치에 로그인 컨트롤을 렌더링한다.
 * 별도 인증 백엔드 없이 동작하는 정적 메뉴 — 클릭 시 드롭다운으로 항목을 노출한다.
 */
(function () {
  'use strict';

  var STYLE_ID = 'ongi-sso-style';
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var css = [
      '.ongi-sso{position:relative;display:inline-flex}',
      '.ongi-sso-btn{display:inline-flex;align-items:center;gap:7px;height:38px;padding:0 16px;',
      'border-radius:9999px;border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.10);',
      'color:#fff;font:600 14px/1 var(--font,system-ui,sans-serif);cursor:pointer;',
      'transition:background .18s var(--ease,ease),border-color .18s}',
      '.ongi-sso-btn:hover{background:rgba(255,255,255,.18);border-color:rgba(255,255,255,.45)}',
      '.ongi-sso-btn svg{width:16px;height:16px}',
      '.ongi-sso-menu{position:absolute;top:calc(100% + 10px);right:0;min-width:190px;padding:8px;',
      'background:var(--surface,#fff);border:1px solid var(--line,#E6E0D1);border-radius:14px;',
      'box-shadow:var(--sh-3,0 18px 48px -16px rgba(31,42,58,.18));z-index:60;',
      'opacity:0;transform:translateY(-6px);pointer-events:none;transition:opacity .16s,transform .16s}',
      '.ongi-sso.is-open .ongi-sso-menu{opacity:1;transform:translateY(0);pointer-events:auto}',
      '.ongi-sso-menu a{display:flex;align-items:center;gap:9px;padding:10px 12px;border-radius:9px;',
      'color:var(--text,#1F2A3A);font:500 14px/1.2 var(--font,system-ui,sans-serif);text-decoration:none}',
      '.ongi-sso-menu a:hover{background:var(--surface-2,#FBF8EF);color:var(--primary-press,#3DA088)}',
      '.ongi-sso-menu .sso-sep{height:1px;margin:6px 4px;background:var(--line-2,#EDE8DC)}',
      '.ongi-sso-menu .sso-head{padding:6px 12px 8px;color:var(--text-3,#7B8699);',
      'font:600 11px/1 var(--font,system-ui,sans-serif);letter-spacing:.08em;text-transform:uppercase}'
    ].join('');
    var el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = css;
    document.head.appendChild(el);
  }

  var USER_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></svg>';

  function render(slot) {
    if (slot.dataset.ssoReady === '1') return;
    slot.dataset.ssoReady = '1';

    var wrap = document.createElement('div');
    wrap.className = 'ongi-sso';
    wrap.innerHTML =
      '<button type="button" class="ongi-sso-btn" aria-haspopup="true" aria-expanded="false">' +
        USER_SVG + '<span>로그인</span>' +
      '</button>' +
      '<div class="ongi-sso-menu" role="menu">' +
        '<div class="sso-head">On:Gi 계정</div>' +
        '<a href="parent-app.html" role="menuitem">로그인</a>' +
        '<a href="pricing.html" role="menuitem">회원가입 · 구독</a>' +
        '<div class="sso-sep"></div>' +
        '<a href="care-hub.html" role="menuitem">돌봄 관제 콘솔</a>' +
        '<a href="#consult" role="menuitem" data-ongi-consult>상담 신청</a>' +
      '</div>';
    slot.appendChild(wrap);

    var btn = wrap.querySelector('.ongi-sso-btn');
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = wrap.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) {
        wrap.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function init() {
    injectStyle();
    document.querySelectorAll('[data-ongi-sso]').forEach(render);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
