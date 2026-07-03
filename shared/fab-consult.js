/* fab-consult.js — On:Gi 플로팅 상담 버튼 + 상담 모달
 * 화면 우하단에 "상담 신청" 버튼을 띄우고, 클릭 시 상담 모달을 연다.
 * [data-ongi-consult] 요소나 href="#consult" 링크도 모달을 연다.
 * 백엔드 없이 mailto로 상담 내용을 전달한다.
 */
(function () {
  'use strict';

  var CONSULT_EMAIL = 'contact@onvi.kr';
  var STYLE_ID = 'ongi-consult-style';

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var css = [
      '.ongi-fab{position:fixed;right:22px;bottom:22px;z-index:80;display:inline-flex;align-items:center;',
      'gap:9px;height:54px;padding:0 22px 0 20px;border:none;border-radius:9999px;cursor:pointer;',
      'background:var(--primary,#4FB89E);color:#fff;font:700 15px/1 var(--font,system-ui,sans-serif);',
      'box-shadow:0 14px 34px -10px rgba(31,42,58,.42);transition:transform .18s var(--ease,ease),background .18s}',
      '.ongi-fab:hover{transform:translateY(-3px);background:var(--primary-press,#3DA088)}',
      '.ongi-fab svg{width:20px;height:20px}',
      '@media(max-width:640px){.ongi-fab{right:16px;bottom:16px;height:50px;padding:0 18px}}',
      '.ongi-modal-mask{position:fixed;inset:0;z-index:90;display:flex;align-items:center;justify-content:center;',
      'padding:20px;background:rgba(20,28,40,.55);opacity:0;pointer-events:none;transition:opacity .2s}',
      '.ongi-modal-mask.is-open{opacity:1;pointer-events:auto}',
      '.ongi-modal{width:100%;max-width:440px;background:var(--surface,#fff);border-radius:22px;',
      'padding:30px 28px 26px;box-shadow:var(--sh-hero,0 60px 120px -40px rgba(31,42,58,.28));',
      'transform:translateY(14px) scale(.98);transition:transform .2s var(--ease,ease);font-family:var(--font,system-ui,sans-serif)}',
      '.ongi-modal-mask.is-open .ongi-modal{transform:none}',
      '.ongi-modal h3{margin:0 0 6px;font-size:22px;font-weight:700;color:var(--text,#1F2A3A);letter-spacing:-.02em}',
      '.ongi-modal p.sub{margin:0 0 20px;font-size:14px;line-height:1.55;color:var(--text-2,#46546A)}',
      '.ongi-modal label{display:block;margin:0 0 5px;font-size:12.5px;font-weight:600;color:var(--text-2,#46546A)}',
      '.ongi-modal .fld{margin-bottom:14px}',
      '.ongi-modal input,.ongi-modal textarea{width:100%;box-sizing:border-box;padding:11px 13px;',
      'border:1px solid var(--line,#E6E0D1);border-radius:11px;background:var(--surface-2,#FBF8EF);',
      'font:400 14px/1.4 var(--font,system-ui,sans-serif);color:var(--text,#1F2A3A);outline:none;transition:border-color .15s}',
      '.ongi-modal input:focus,.ongi-modal textarea:focus{border-color:var(--primary,#4FB89E)}',
      '.ongi-modal textarea{resize:vertical;min-height:82px}',
      '.ongi-modal .row{display:flex;gap:12px}.ongi-modal .row .fld{flex:1}',
      '.ongi-modal .actions{display:flex;gap:10px;margin-top:6px}',
      '.ongi-modal .actions button{flex:1;height:46px;border-radius:11px;border:none;cursor:pointer;',
      'font:700 15px/1 var(--font,system-ui,sans-serif)}',
      '.ongi-modal .btn-send{background:var(--primary,#4FB89E);color:#fff}',
      '.ongi-modal .btn-send:hover{background:var(--primary-press,#3DA088)}',
      '.ongi-modal .btn-cancel{background:transparent;color:var(--text-2,#46546A);border:1px solid var(--line,#E6E0D1)!important}',
      '.ongi-modal .modal-x{position:absolute;top:16px;right:18px;border:none;background:none;cursor:pointer;',
      'font-size:22px;line-height:1;color:var(--text-3,#7B8699)}',
      '.ongi-modal-wrap{position:relative}'
    ].join('');
    var el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = css;
    document.head.appendChild(el);
  }

  var CHAT_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.9-.9L3 20l1.4-4.1A8.4 8.4 0 1 1 21 11.5z"/></svg>';

  var mask;
  function buildModal() {
    if (mask) return;
    mask = document.createElement('div');
    mask.className = 'ongi-modal-mask';
    mask.innerHTML =
      '<div class="ongi-modal-wrap"><div class="ongi-modal" role="dialog" aria-modal="true" aria-label="상담 신청">' +
        '<button class="modal-x" type="button" aria-label="닫기">&times;</button>' +
        '<h3>상담 신청</h3>' +
        '<p class="sub">부모님과 가족에게 맞는 방법을 함께 찾아드려요. 남겨주시면 빠르게 연락드립니다.</p>' +
        '<form>' +
          '<div class="row">' +
            '<div class="fld"><label>성함</label><input name="name" required placeholder="홍길동"></div>' +
            '<div class="fld"><label>연락처</label><input name="phone" required placeholder="010-0000-0000"></div>' +
          '</div>' +
          '<div class="fld"><label>문의 내용</label><textarea name="msg" placeholder="어떤 점이 궁금하신가요?"></textarea></div>' +
          '<div class="actions">' +
            '<button type="button" class="btn-cancel">닫기</button>' +
            '<button type="submit" class="btn-send">상담 신청하기</button>' +
          '</div>' +
        '</form>' +
      '</div></div>';
    document.body.appendChild(mask);

    function close() { mask.classList.remove('is-open'); }
    mask.addEventListener('click', function (e) { if (e.target === mask) close(); });
    mask.querySelector('.modal-x').addEventListener('click', close);
    mask.querySelector('.btn-cancel').addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

    mask.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target;
      var name = (f.name.value || '').trim();
      var phone = (f.phone.value || '').trim();
      var msg = (f.msg.value || '').trim();
      var body = '성함: ' + name + '\n연락처: ' + phone + '\n\n문의 내용:\n' + msg;
      window.location.href = 'mailto:' + CONSULT_EMAIL +
        '?subject=' + encodeURIComponent('[On:Gi] 상담 신청 · ' + name) +
        '&body=' + encodeURIComponent(body);
      close();
    });
  }

  function open() { buildModal(); requestAnimationFrame(function () { mask.classList.add('is-open'); }); }

  function init() {
    injectStyle();
    var fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'ongi-fab';
    fab.innerHTML = CHAT_SVG + '<span>상담 신청</span>';
    fab.addEventListener('click', open);
    document.body.appendChild(fab);

    // #consult 링크 및 [data-ongi-consult] 트리거 연결
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-ongi-consult], a[href="#consult"], a[href$="#consult"]');
      if (t) { e.preventDefault(); open(); }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
