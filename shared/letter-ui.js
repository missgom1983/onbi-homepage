// 금요편지 카드 · 모달 — LetterCard.dc.html / LetterModal.dc.html 을 옮긴 것.
// 데이터는 shared/letters-v6.js 의 window.ONVI_V6 를 그대로 쓴다.
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  var F_LETTER = 'font-family:var(--font-letter);';

  // ── 편지 카드 ────────────────────────────────────────────────────────
  function annBadge(text, sub) {
    var h = '<span style="font-size:13px; font-weight:700; color:var(--simhae); background:rgba(44,74,107,0.10); border-radius:999px; padding:4px 12px;">' + esc(text) + '</span>';
    if (sub) h += '<span style="font-size:13px; color:#6A7789;">' + esc(sub) + '</span>';
    return h;
  }

  function renderCard(L, annotate) {
    if (!L) return '';
    var ann = !!annotate;
    var h = '<article style="max-width:640px; margin:0 auto; background:#FFFFFF; border-radius:20px; border-top:2px solid var(--noeul); box-shadow:0 8px 32px rgba(31,42,58,0.10); padding:clamp(24px,4.5vw,42px); color:var(--simya); letter-spacing:-0.012em;">';

    h += '<div style="display:flex; justify-content:space-between; align-items:baseline; gap:14px; flex-wrap:wrap; margin-bottom:18px;">' +
         '<span style="font-size:13px; font-weight:700; letter-spacing:0.04em; color:#2A7360;">' + esc(L.meta) + '</span>' +
         '<span style="font-size:13px; color:#6A7789;">' + esc(L.date) + '</span></div>';

    if (L.badge) {
      h += '<div style="display:flex; flex-direction:column; align-items:flex-start; gap:8px; margin-bottom:20px;">';
      if (ann) h += annBadge('지난주에서 이어진 자리');
      h += '<span style="display:inline-flex; align-items:center; gap:8px; background:var(--hanji); border-radius:999px; padding:8px 16px; font-size:13px; font-weight:600; color:var(--simhae); line-height:1.5;">' +
           '<span aria-hidden="true" style="color:#2A7360;">' + (L.badge.icon === 'photo' ? '▣' : '⌒') + '</span>' + esc(L.badge.text) + '</span></div>';
    }
    if (ann) h += '<div style="margin-bottom:10px;">' + annBadge('이번 주 이야기') + '</div>';

    h += '<h3 style="' + F_LETTER + ' font-size:clamp(20px,2.4vw,24px); line-height:1.5; font-weight:700; letter-spacing:-0.01em; margin:0 0 18px; color:var(--simya); text-wrap:balance;">' + esc(L.title) + '</h3>';

    if (L.greeting) {
      if (ann) h += '<span style="display:block; font-size:11px; font-weight:700; letter-spacing:0.12em; color:var(--simhae); margin-bottom:6px;">편지를 여는 인사</span>';
      h += '<p style="' + F_LETTER + ' font-size:clamp(15.5px,1.6vw,17px); line-height:1.85; color:#3F4D62; margin:0 0 18px; text-wrap:pretty;">' + esc(L.greeting) + '</p>';
    }

    function paras(list) {
      return (list || []).map(function (p) {
        return '<p style="' + F_LETTER + ' font-size:clamp(17px,1.8vw,20px); line-height:1.85; color:#2A3646; margin:0;">' + esc(p) + '</p>';
      }).join('');
    }
    h += '<div style="display:flex; flex-direction:column; gap:1em;">' + paras(L.paras) + '</div>';

    if (L.media) {
      h += '<figure style="margin:22px auto; max-width:480px; background:var(--hanji); border-radius:12px; padding:16px;">' +
           '<div style="position:relative; border-radius:8px; overflow:hidden; aspect-ratio:4/3; background:linear-gradient(160deg, #E9E2CF 0%, #DDD4BC 100%);">' +
           '<svg viewBox="0 0 400 300" style="position:absolute; inset:0; width:100%; height:100%;" aria-hidden="true">' +
           '<circle cx="316" cy="64" r="26" fill="#D9B88C" opacity="0.55"></circle>' +
           '<path d="M0 226 Q100 176 200 210 T400 196 L400 300 L0 300 Z" fill="#2C4A6B" opacity="0.18"></path>' +
           '<path d="M118 232 c0-38 18-62 40-62 s40 24 40 62" fill="#2C4A6B" opacity="0.5"></path>' +
           '<circle cx="158" cy="150" r="17" fill="#2C4A6B" opacity="0.5"></circle>' +
           '<path d="M212 236 c0-30 14-50 32-50 s32 20 32 50" fill="#2C4A6B" opacity="0.34"></path>' +
           '<circle cx="244" cy="172" r="13" fill="#2C4A6B" opacity="0.34"></circle></svg>';
      if (L.media.kind === 'video') {
        h += '<span style="position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); display:inline-flex; align-items:center; gap:8px; background:rgba(31,42,58,0.82); color:#FFFFFF; border-radius:999px; padding:10px 18px; font-size:13.5px; font-weight:700;">▶ 가족이 보낸 영상 ' + esc(L.media.dur) + '</span>';
      }
      h += '</div><figcaption style="font-size:13px; line-height:1.6; color:#6A7789; margin-top:11px;">' + esc(L.media.caption) + '</figcaption></figure>';
    }
    if (L.paras2) h += '<div style="display:flex; flex-direction:column; gap:1em; margin-top:4px;">' + paras(L.paras2) + '</div>';

    if (L.ps) {
      h += '<section style="margin-top:30px; padding-top:18px; border-top:1px solid rgba(31,42,58,0.13);">';
      if (ann) h += '<span style="display:block; font-size:11px; font-weight:700; letter-spacing:0.12em; color:var(--simhae); margin-bottom:6px;">담당자가 덧붙이는 한 줄</span>';
      h += '<p style="' + F_LETTER + ' font-size:clamp(15.5px,1.6vw,17px); line-height:1.85; color:#3F4D62; margin:0; text-wrap:pretty;"><span style="font-weight:700; color:var(--simhae); letter-spacing:0.02em;">추신.</span> ' + esc(L.ps) + '</p>';
      if (L.psFrom) h += '<p style="margin:12px 0 0; font-size:12.5px; letter-spacing:0.03em; color:#8A93A0;">' + esc(L.psFrom) + '</p>';
      h += '</section>';
    }

    h += '<div style="margin-top:26px;">';
    if (ann) h += '<div style="display:flex; flex-direction:column; align-items:flex-start; gap:6px; margin-bottom:10px;">' +
                  annBadge('부모님이 직접 들려주신 안부', '숫자와 점검표가 아니라, 부모님의 말로 적습니다.') + '</div>';
    h += '<div style="background:var(--hanji); border-radius:16px; padding:22px 24px;">' +
         '<div style="font-size:13px; font-weight:700; letter-spacing:0.05em; color:#2A7360; margin-bottom:14px;">' + esc(L.careLabel) + '</div>' +
         '<div class="ovc-care" style="display:grid; grid-template-columns:1fr 1fr; gap:14px 20px;">' +
         (L.care || []).map(function (c) {
           return '<div><div style="font-size:12.5px; font-weight:700; color:var(--simhae); margin-bottom:4px;">' + esc(c.k) + '</div>' +
                  '<div style="font-size:14.5px; line-height:1.65; color:#3F4D62;">' + esc(c.v) + '</div></div>';
         }).join('') + '</div>';
    if (L.chip) h += '<div style="margin-top:16px; background:var(--noeul); border-radius:12px; padding:14px 18px; font-size:14px; line-height:1.7; font-weight:600; color:#1F2A3A;">' + esc(L.chip) + '</div>';
    h += '</div></div>';

    h += '<div style="margin:26px 0 0; display:flex; flex-direction:column; gap:10px;">' +
         (L.quotes || []).map(function (q) {
           return '<blockquote style="margin:0; padding:6px 0 6px 18px; border-left:3px solid var(--noeul); ' + F_LETTER + ' font-size:clamp(17.5px,1.9vw,21px); line-height:1.6; color:var(--simya);">' + esc(q) + '</blockquote>';
         }).join('');
    if (L.extra) h += '<span style="align-self:flex-start; background:var(--noeul); color:#1F2A3A; border-radius:999px; padding:6px 15px; font-size:13px; font-weight:700;">' + esc(L.extra) + '</span>';
    h += '</div>';

    h += '<div style="margin-top:28px;">';
    if (ann) h += '<div style="margin-bottom:10px;">' + annBadge('가족의 답장 자리') + '</div>';
    h += '<div style="font-size:13px; font-weight:700; letter-spacing:0.05em; color:#2A7360; margin-bottom:12px;">' + esc(L.replyLabel) + '</div>' +
         '<div style="display:flex; flex-direction:column; gap:9px;">' +
         (L.replies || []).map(function (r, i) {
           var row = 'display:flex; flex-direction:column;' + (r.indent ? ' margin-left:26px;' : '');
           if (r.voice) {
             return '<div style="' + row + '"><div style="position:relative; align-self:flex-start;">' +
               '<button type="button" class="ovc-voice" data-tip="' + i + '" style="display:inline-flex; align-items:center; gap:9px; background:rgba(79,184,158,0.10); border:none; border-radius:14px; padding:11px 16px; font-family:inherit; font-size:14.5px; color:#2A3646; cursor:pointer; min-height:44px;">' +
               '<strong style="font-size:11px; letter-spacing:0.03em; color:var(--simhae);">' + esc(r.who) + '</strong>' +
               '<span aria-hidden="true" style="display:inline-flex; align-items:center; justify-content:center; width:26px; height:26px; border-radius:999px; background:var(--cheongja); color:#FFFFFF; font-size:11px;">▶</span>' +
               '<span style="font-weight:600;">▶ ' + esc(r.voice) + '</span><span style="color:#6A7789;">' + esc(r.note || '') + '</span></button>' +
               '<span class="ovc-tip" hidden role="status" style="position:absolute; left:0; top:calc(100% + 6px); z-index:5; background:var(--simya); color:#FFFFFF; border-radius:10px; padding:9px 14px; font-size:13px; white-space:nowrap; box-shadow:0 10px 24px -8px rgba(31,42,58,0.45);">신청하시면 가족의 목소리로 들을 수 있어요</span>' +
               '</div></div>';
           }
           return '<div style="' + row + '"><div style="align-self:flex-start; background:var(--hanji); border-radius:14px; padding:11px 16px; font-size:14.5px; line-height:1.65; color:#2A3646;">' +
             '<strong style="display:block; font-size:11px; letter-spacing:0.03em; color:var(--simhae); margin-bottom:3px;">' + esc(r.who) + '</strong>' + esc(r.text) + '</div></div>';
         }).join('') + '</div>' +
         '<p style="font-size:13px; color:#6A7789; margin:14px 0 0;">' + esc(L.replyClose) + '</p></div>';

    h += '<div style="margin-top:26px; border-top:1px solid var(--noeul); padding-top:20px;">';
    if (ann) h += '<div style="margin-bottom:10px;">' + annBadge('다음 주로 이어지는 씨앗') + '</div>';
    h += '<div style="font-size:13px; font-weight:700; letter-spacing:0.05em; color:#B07E3E; margin-bottom:10px;">다음 이야기 씨앗</div>' +
         '<p style="font-size:15px; line-height:1.75; color:#3F4D62; margin:0;">' + esc(L.seed) + '</p>';
    if (L.seedJoin) h += '<p style="font-size:14px; line-height:1.7; color:#6A7789; margin:8px 0 0;">' + esc(L.seedJoin) + '</p>';
    if (L.seedOptions) {
      h += '<div style="margin-top:14px;"><div style="font-size:13px; font-weight:600; color:var(--simhae); margin-bottom:8px;">가족이 고르는 다음 질문</div>' +
           '<div style="display:flex; flex-wrap:wrap; gap:8px;">' +
           L.seedOptions.map(function (t, i) {
             return '<span title="편지 예시에서는 선택할 수 없어요" style="display:inline-flex; align-items:center; gap:7px; border:1px solid #E0D9C6; border-radius:999px; padding:9px 16px; font-size:13.5px; color:#3F4D62; background:#FFFFFF;">' +
                    '<span style="color:#2A7360; font-weight:700;">' + ['①', '②', '③'][i] + '</span>' + esc(t) + '</span>';
           }).join('') + '</div></div>';
    }
    if (L.wishlist) h += '<p style="margin:14px 0 0; font-size:14px; color:#3F4D62;"><span style="font-weight:700; color:#B07E3E;">언젠가 목록에 새로 담긴 것</span> · ' + esc(L.wishlist) + '</p>';
    h += '</div>';

    if (L.notice) h += '<p style="margin:22px 0 0; padding-top:16px; border-top:1px solid rgba(31,42,58,0.12); font-size:13px; line-height:1.65; color:#6A7789;">' + esc(L.notice) + '</p>';
    return h + '</article>';
  }

  // ── 모달 ─────────────────────────────────────────────────────────────
  var st = { seg: '', act: 1, mode: 'letter', openEp: null, fullEp: null, special: false, sheet: false, pushed: false };
  var root = null;

  function stepBtn(i, sel) {
    var names = ['한 주의 편지', '이어지는 이야기', '한 권의 책'];
    var s = 'flex:1; min-height:44px; border-radius:999px; border:none; font-family:inherit; font-size:13px; font-weight:700; cursor:pointer; letter-spacing:-0.01em; transition:background .2s, color .2s; ' +
      (sel ? 'background:var(--cheongja); color:#FFFFFF;' : 'background:rgba(31,42,58,0.06); color:var(--simhae);');
    return '<button type="button" class="ovm-step" role="tab" aria-selected="' + sel + '" data-act="' + (i + 1) + '" style="' + s + '">' +
           '<strong>' + '①②③'[i] + '</strong><span> ' + names[i] + '</span></button>';
  }

  function tabS(on) {
    return 'min-height:40px; padding:0 18px; border-radius:999px; border:none; font-family:inherit; font-size:13.5px; font-weight:700; cursor:pointer; transition:background .2s, color .2s; ' +
      (on ? 'background:var(--simya); color:#FFFFFF;' : 'background:transparent; color:var(--simhae);');
  }

  function act1(D, seg) {
    var letterSel = st.mode === 'letter';
    var h = '<div class="ovm-act"><div style="display:flex; justify-content:center; margin-bottom:18px;">' +
      '<div role="tablist" aria-label="보기 방식" style="display:inline-flex; background:#FFFFFF; border:1px solid #E0D9C6; border-radius:999px; padding:4px;">' +
      '<button type="button" role="tab" data-mode="letter" aria-selected="' + letterSel + '" style="' + tabS(letterSel) + '">편지로 보기</button>' +
      '<button type="button" role="tab" data-mode="struct" aria-selected="' + !letterSel + '" style="' + tabS(!letterSel) + '">구성으로 보기</button>' +
      '</div></div>';
    h += renderCard(D.episodes[seg.rep], !letterSel);
    if (seg.wish && seg.wish.length) {
      h += '<div style="max-width:640px; margin:20px auto 0; background:#FFFFFF; border-radius:20px; border-top:2px solid var(--noeul); box-shadow:0 8px 32px rgba(31,42,58,0.10); padding:clamp(22px,3.5vw,32px);">' +
        '<div style="display:flex; justify-content:space-between; align-items:baseline; gap:12px; flex-wrap:wrap; margin-bottom:6px;">' +
        '<h4 style="font-size:16px; font-weight:700; letter-spacing:-0.02em; color:var(--simya); margin:0;">' + esc((seg.wishOwner || '부모님') + '의 언젠가 목록') + '</h4>' +
        '<span style="font-size:12.5px; color:#6A7789;">통화에서 지나가듯 하신 말을 모았어요</span></div>' +
        '<div style="display:flex; flex-direction:column;">' +
        seg.wish.map(function (w) {
          var dot = 'flex-shrink:0; width:18px; height:18px; border-radius:999px; display:inline-flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; transform:translateY(3px); ' +
            (w.done ? 'background:var(--cheongja); color:#FFFFFF;' : 'box-shadow:inset 0 0 0 1.5px #D8D0BC; color:transparent;');
          return '<div style="display:flex; gap:12px; align-items:baseline; padding:12px 0; border-top:1px solid #EFEAD9;">' +
            '<span aria-hidden="true" style="' + dot + '">' + (w.done ? '✓' : '') + '</span>' +
            '<span style="flex:1; ' + F_LETTER + ' font-size:15.5px; line-height:1.6; color:#2A3646;">' + esc(w.t) + '</span>' +
            (w.done ? '<span style="flex-shrink:0; font-size:11.5px; font-weight:700; letter-spacing:0.02em; background:rgba(79,184,158,0.14); color:#2A7360; border-radius:999px; padding:4px 11px;">이뤄졌어요 · 편지가 됐어요</span>' : '') +
            '</div>';
        }).join('') + '</div>' +
        '<p style="margin:12px 0 0; font-size:13px; line-height:1.65; color:#6A7789;">"그건 제가 모실게요" — 가족의 답장 한 줄이, 다음 계획이 됩니다.</p></div>';
    }
    return h + '</div>';
  }

  function act2(D, seg, segKey) {
    var eps = seg.episodes.map(function (k) { return { key: k, L: D.episodes[k] }; });
    var loops = D.loops[segKey] || [];
    var h = '<div class="ovm-act" style="max-width:640px; margin:0 auto;"><div style="display:flex; flex-direction:column;">';
    eps.forEach(function (e, i) {
      var L = e.L, open = st.openEp === e.key, full = st.fullEp === e.key;
      var rep1 = !L.stub && L.replies ? L.replies.filter(function (r) { return r.text; })[0] : null;
      var dot = 'width:36px; height:36px; border-radius:999px; border:none; font-family:inherit; font-size:14px; font-weight:700; cursor:pointer; flex-shrink:0; transition:background .2s; ' +
        (open ? 'background:var(--cheongja); color:#FFFFFF;' : 'background:#FFFFFF; color:var(--simhae); box-shadow:inset 0 0 0 1.5px #D8D0BC;');
      h += '<div style="display:grid; grid-template-columns:36px 1fr; gap:0 16px;">' +
        '<div style="display:flex; flex-direction:column; align-items:center;">' +
        '<button type="button" class="ovm-node" data-ep="' + esc(e.key) + '" aria-expanded="' + open + '" style="' + dot + '">' + (i + 1) + '</button>' +
        ((i < eps.length - 1 || open) ? '<span aria-hidden="true" style="flex:1; width:1.5px; background:#D8D0BC; min-height:26px;"></span>' : '') +
        '</div><div style="padding-bottom:22px; min-width:0;">' +
        '<button type="button" class="ovm-node" data-ep="' + esc(e.key) + '" style="display:block; width:100%; text-align:left; background:transparent; border:none; padding:6px 0 0; font-family:inherit; cursor:pointer; min-height:44px;">' +
        '<span style="display:block; font-size:12.5px; font-weight:700; color:#2A7360;">' + esc(L.meta) + '</span>' +
        '<span style="display:block; font-size:17px; font-weight:700; letter-spacing:-0.02em; color:var(--simya); margin-top:3px;">' + esc(L.title) + '</span>' +
        '<span style="display:block; font-size:13px; color:#6A7789; margin-top:3px;">' + esc(L.date) + '</span></button>';
      if (open) {
        h += '<div class="ovm-act" style="margin-top:14px; background:#FFFFFF; border-radius:16px; border-top:2px solid var(--noeul); box-shadow:0 2px 12px rgba(31,42,58,0.06); padding:20px 22px;">';
        if (L.badge) h += '<span style="display:inline-flex; align-items:center; gap:8px; background:var(--hanji); border-radius:999px; padding:7px 14px; font-size:12.5px; font-weight:600; color:var(--simhae); line-height:1.5; margin-bottom:12px;">' +
          '<span aria-hidden="true" style="color:#2A7360;">' + (L.badge.icon === 'photo' ? '▣' : '⌒') + '</span>' + esc(L.badge.text) + '</span>';
        h += '<p style="' + F_LETTER + ' font-size:16px; line-height:1.8; color:#2A3646; margin:0;">' + esc(L.stub ? L.teaser : (L.paras && L.paras[0]) || '') + '</p>';
        if (rep1) h += '<div style="margin-top:14px; background:var(--hanji); border-radius:12px; padding:10px 14px; font-size:13.5px; line-height:1.6; color:#2A3646;">' +
          '<strong style="display:block; font-size:11px; color:var(--simhae); margin-bottom:2px;">' + esc(rep1.who) + '</strong>' + esc(rep1.text) + '</div>';
        if (!L.stub && L.seed) h += '<p style="margin:14px 0 0; font-size:13.5px; line-height:1.65; color:#3F4D62;"><span style="font-weight:700; color:#B07E3E;">다음 이야기 씨앗</span> · ' + esc(L.seed) + '</p>';
        if (!L.stub) h += '<button type="button" class="ovm-full" data-ep="' + esc(e.key) + '" aria-expanded="' + full + '" style="margin-top:16px; display:inline-flex; align-items:center; gap:7px; background:transparent; border:none; padding:0; font-family:inherit; font-size:14px; font-weight:700; color:#2A7360; cursor:pointer; min-height:44px;">' + (full ? '접기 ▴' : '전문 읽기 ▾') + '</button>';
        if (L.stub) h += '<p style="margin:16px 0 0; font-size:13px; color:#6A7789;">전문은 곧 열려요</p>';
        if (full) h += '<div class="ovm-act" style="margin:18px -22px -20px; padding:4px 0 0;">' + renderCard(L, false) + '</div>';
        h += '</div>';
      }
      if (!open && i < loops.length && loops[i]) h += '<p style="margin:16px 0 0; font-size:12px; font-weight:600; color:var(--simhae);">' + esc(loops[i]) + '</p>';
      h += '</div></div>';
    });
    h += '</div><p style="text-align:center; font-size:18px; font-weight:700; letter-spacing:-0.02em; color:var(--simya); margin:10px 0 28px; text-wrap:balance;">' + esc(D.loopEnd[segKey] || D.loopEnd.default) + '</p>' +
      '<div style="background:#FFFFFF; border:1px solid #E0D9C6; border-radius:16px; overflow:hidden;">' +
      '<button type="button" id="ovmSpecial" aria-expanded="' + st.special + '" style="display:flex; width:100%; align-items:center; justify-content:space-between; gap:14px; background:transparent; border:none; padding:18px 22px; font-family:inherit; font-size:15.5px; font-weight:700; color:var(--simya); cursor:pointer; min-height:52px; text-align:left;">그리고, 이런 주도 있습니다 <span aria-hidden="true" style="color:#2A7360;">' + (st.special ? '▴' : '▾') + '</span></button>';
    if (st.special) h += '<div class="ovm-act" style="padding:0 0 8px;">' + renderCard(D.special, false) + '</div>';
    return h + '</div></div>';
  }

  function act3(D, seg, segKey) {
    var toc = (D.bookToc.B || []).map(function (ch) {
      var t = ch.t;
      if (segKey !== 'B') {
        if (ch.now) t = seg.bookTitle;
        if (ch.n === '부록' && seg.bookNote) t = seg.bookNote.replace('부록 · ', '');
      }
      return { n: ch.n, t: t, p: ch.p, now: !!ch.now };
    });
    var rep = D.episodes[seg.rep], sp;
    if (segKey === 'B') {
      var b = D.bookSpread.B;
      sp = { head: b.left.head, body: b.left.body, pnL: b.left.pn, caption: b.right.caption, quote: b.right.quote, pnR: b.right.pn };
    } else {
      sp = { head: '3장 ' + seg.bookTitle, body: (rep.paras && rep.paras[0]) || '', pnL: 'p.41',
             caption: rep.media ? rep.media.caption : '그 주의 편지에 함께 실린 장면.',
             quote: (rep.quotes && rep.quotes[0]) || '', pnR: 'p.42' };
    }
    var h = '<div class="ovm-act" style="max-width:640px; margin:0 auto;">' +
      '<p style="text-align:center; font-size:16.5px; font-weight:600; color:var(--simhae); margin:4px 0 24px;">' + esc(D.bookIntro) + '</p>' +
      '<div style="background:#FFFFFF; border-radius:16px; box-shadow:0 2px 12px rgba(31,42,58,0.06); padding:clamp(24px,4vw,40px); ' + F_LETTER + '">' +
      '<div style="text-align:center; font-size:clamp(19px,2.2vw,23px); font-weight:700; color:var(--simya);">' + esc(seg.person) + '</div>' +
      '<hr style="width:28px; height:2px; background:var(--noeul); border:none; margin:18px auto 22px;">' +
      '<div style="display:flex; flex-direction:column; gap:10px;">' +
      toc.map(function (ch) {
        return '<div style="display:flex; justify-content:space-between; align-items:baseline; gap:14px; padding:7px 10px; border-radius:8px; color:var(--simya);' + (ch.now ? ' background:rgba(79,184,158,0.14);' : '') + '">' +
          '<span style="display:flex; align-items:baseline; gap:10px; min-width:0;"><span style="font-size:13px; color:#B07E3E; flex-shrink:0;">' + esc(ch.n) + '</span><span style="font-size:15.5px;">' + esc(ch.t) + '</span></span>' +
          '<span style="display:flex; align-items:baseline; gap:12px; flex-shrink:0;">' +
          (ch.now ? '<span style="font-family:var(--font-ui); font-size:11px; font-weight:700; letter-spacing:0.02em; background:var(--cheongja); color:#FFFFFF; border-radius:999px; padding:3px 10px;">지금 읽으신 이야기</span>' : '') +
          '<span style="font-size:13px; color:#6A7789;">' + esc(ch.p) + '</span></span></div>';
      }).join('') + '</div></div>' +
      '<div class="ovm-spread" style="margin-top:22px; background:var(--hanji); border:1px solid #E0D9C6; border-radius:16px; padding:clamp(14px,3vw,24px); display:grid; grid-template-columns:1fr 1fr; gap:2px;">' +
      '<div style="background:#FFFDF8; border-radius:10px 2px 2px 10px; box-shadow:inset -8px 0 14px -10px rgba(31,42,58,0.18); padding:clamp(18px,3vw,28px); display:flex; flex-direction:column;">' +
      '<div style="' + F_LETTER + ' font-size:15px; font-weight:700; color:var(--simya); margin-bottom:12px;">' + esc(sp.head) + '</div>' +
      '<p style="' + F_LETTER + ' font-size:14px; line-height:1.9; color:#2A3646; margin:0; flex:1;">' + esc(sp.body) + '</p>' +
      '<div style="font-size:11px; color:#6A7789; margin-top:16px;">' + esc(sp.pnL) + '</div></div>' +
      '<div style="background:#FFFDF8; border-radius:2px 10px 10px 2px; box-shadow:inset 8px 0 14px -10px rgba(31,42,58,0.18); padding:clamp(18px,3vw,28px); display:flex; flex-direction:column; gap:14px;">' +
      '<figure style="margin:0; background:var(--hanji); border-radius:8px; padding:10px;">' +
      '<div style="border-radius:5px; aspect-ratio:4/3; background:linear-gradient(160deg, #E9E2CF 0%, #DDD4BC 100%); position:relative; overflow:hidden;">' +
      '<svg viewBox="0 0 400 300" style="position:absolute; inset:0; width:100%; height:100%;" aria-hidden="true"><path d="M0 226 Q100 176 200 210 T400 196 L400 300 L0 300 Z" fill="#2C4A6B" opacity="0.18"></path><path d="M150 236 c0-36 17-58 38-58 s38 22 38 58" fill="#2C4A6B" opacity="0.46"></path><circle cx="188" cy="158" r="16" fill="#2C4A6B" opacity="0.46"></circle></svg></div>' +
      '<figcaption style="font-size:11.5px; line-height:1.55; color:#6A7789; margin-top:8px;">' + esc(sp.caption) + '</figcaption></figure>' +
      '<blockquote style="margin:0; padding:4px 0 4px 14px; border-left:3px solid var(--noeul); ' + F_LETTER + ' font-size:15px; line-height:1.7; color:var(--simya); flex:1;">' + esc(sp.quote) + '</blockquote>' +
      '<div style="font-size:11px; color:#6A7789; text-align:right;">' + esc(sp.pnR) + '</div></div></div>' +
      '<p style="font-size:13.5px; line-height:1.7; color:#6A7789; text-align:center; margin:18px auto 0; max-width:440px;">인생책 실물 제작은 준비 중입니다. 디지털판이 먼저 제공되고, 실물은 시범 가정께 가장 먼저 안내드려요.</p></div>';
    return h;
  }

  function sheetHtml(D) {
    return '<div class="ovm-sheet-back" role="presentation" style="position:fixed; inset:0; z-index:630; background:rgba(31,42,58,0.45);"></div>' +
      '<div class="ovm-dlg" role="dialog" aria-modal="true" aria-label="참여하시면, 가족이 받는 것" style="display:flex; flex-direction:column; background:#FFFFFF; z-index:640; box-shadow:0 40px 100px -30px rgba(31,42,58,0.6); overflow:hidden;">' +
      '<header style="flex-shrink:0; display:flex; align-items:center; justify-content:space-between; gap:12px; padding:20px 22px 14px; border-bottom:1px solid rgba(31,42,58,0.10);">' +
      '<div style="font-size:17px; font-weight:700; letter-spacing:-0.02em; color:var(--simya);">참여하시면, 가족이 받는 것</div>' +
      '<button type="button" class="ovm-sheet-close" aria-label="닫기" style="width:44px; height:44px; border:none; background:transparent; border-radius:12px; font-size:20px; color:var(--simhae); cursor:pointer;">✕</button></header>' +
      '<div style="flex:1; overflow-y:auto; overscroll-behavior:contain; padding:22px clamp(18px,4vw,30px) 28px;">' +
      '<div style="display:flex; flex-direction:column; gap:24px;">' +
      (D.benefits || []).map(function (grp) {
        return '<div><div style="font-size:12px; font-weight:700; letter-spacing:0.12em; color:#2A7360; padding-bottom:8px; border-bottom:1px solid #E6E0D1; margin-bottom:12px;">' + esc(grp.period) + '</div>' +
          '<div style="display:flex; flex-direction:column; gap:10px;">' +
          (grp.items || []).map(function (it) {
            return '<div style="display:flex; gap:12px; align-items:baseline;"><span style="width:5px; height:5px; border-radius:999px; background:var(--cheongja); flex-shrink:0; transform:translateY(-2px);"></span>' +
              '<p style="margin:0; font-size:14.5px; line-height:1.65; color:#3F4D62;"><strong style="color:var(--simya);">' + esc(it.t) + '</strong> — ' + esc(it.d) + '</p></div>';
          }).join('') + '</div></div>';
      }).join('') + '</div>' +
      '<p style="margin:24px 0 0; font-size:13px; line-height:1.65; color:#6A7789;">케어 신호는 안부의 참고 정보이며, 의료 진단·응급 대응 서비스가 아닙니다.</p></div>' +
      '<footer style="flex-shrink:0; padding:14px 20px calc(14px + env(safe-area-inset-bottom)); border-top:1px solid rgba(31,42,58,0.10); display:flex; justify-content:center;">' +
      '<a href="pricing.html#apply" style="display:inline-flex; align-items:center; justify-content:center; gap:9px; width:100%; max-width:420px; height:54px; border-radius:999px; background:var(--cheongja); color:#FFFFFF; font-size:16px; font-weight:700; text-decoration:none;">무료 첫 통화 신청하기 <span aria-hidden="true">→</span></a></footer></div>';
  }

  function render() {
    var D = window.ONVI_V6;
    if (!root) return;
    if (!D || !st.seg || !D.segments[st.seg]) { root.innerHTML = ''; document.body.style.overflow = ''; return; }
    var seg = D.segments[st.seg];
    var body = st.act === 1 ? act1(D, seg) : st.act === 2 ? act2(D, seg, st.seg) : act3(D, seg, st.seg);

    root.innerHTML = '<div style="color:var(--simya); letter-spacing:-0.012em;">' +
      '<div class="ovm-back" role="presentation" style="position:fixed; inset:0; z-index:610; background:rgba(31,42,58,0.5); backdrop-filter:blur(3px);"></div>' +
      '<div class="ovm-dlg" role="dialog" aria-modal="true" aria-label="' + esc(seg.name) + '" style="display:flex; flex-direction:column; background:var(--hanji); box-shadow:0 40px 100px -30px rgba(31,42,58,0.6); overflow:hidden;">' +
      '<div class="ovm-grab" aria-hidden="true" style="padding:10px 0 2px;"><span style="display:block; width:36px; height:4px; border-radius:999px; background:rgba(31,42,58,0.25); margin:0 auto;"></span></div>' +
      '<header style="flex-shrink:0; display:flex; flex-direction:column; gap:12px; padding:18px 20px 14px; background:var(--hanji); border-bottom:1px solid rgba(31,42,58,0.10);">' +
      '<div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">' +
      '<div style="font-size:14px; font-weight:700; color:#2A7360;">' + esc(seg.name) + '</div>' +
      '<button type="button" class="ovm-close" aria-label="닫기" style="width:44px; height:44px; border:none; background:transparent; border-radius:12px; font-size:20px; color:var(--simhae); cursor:pointer; flex-shrink:0;">✕</button></div>' +
      '<div role="tablist" aria-label="편지 이야기 단계" style="display:flex; gap:6px;">' +
      [0, 1, 2].map(function (i) { return stepBtn(i, st.act === i + 1); }).join('') + '</div></header>' +
      '<div class="ovm-scroll" style="flex:1; overflow-y:auto; overscroll-behavior:contain; padding:24px clamp(16px,4vw,32px) 32px;">' + body +
      '<p style="margin:28px auto 0; max-width:560px; text-align:center; font-size:13px; line-height:1.7; color:#6A7789;">' + esc(D.legal) + '</p></div>' +
      '<footer style="flex-shrink:0; display:flex; flex-direction:column; align-items:center; gap:10px; padding:14px 20px calc(14px + env(safe-area-inset-bottom)); background:#FFFFFF; border-top:1px solid rgba(31,42,58,0.10);">' +
      '<a href="pricing.html" style="display:inline-flex; align-items:center; justify-content:center; gap:9px; width:100%; max-width:420px; height:54px; border-radius:999px; background:var(--cheongja); color:#FFFFFF; font-size:16px; font-weight:700; letter-spacing:-0.01em; text-decoration:none;">우리 가족의 편지 받아보기 <span aria-hidden="true">→</span></a>' +
      '<button type="button" id="ovmSheetOpen" style="background:transparent; border:none; font-family:inherit; font-size:14px; font-weight:700; color:var(--simhae); cursor:pointer; min-height:44px;">가족이 받는 것 모두 보기 ▾</button></footer></div>' +
      (st.sheet ? sheetHtml(D) : '') + '</div>';
    document.body.style.overflow = 'hidden';
  }

  function setHash(replace) {
    var h = '#letter=' + st.seg + '&act=' + st.act;
    if (replace) history.replaceState(null, '', h); else history.pushState(null, '', h);
  }

  function open(seg) {
    st.seg = seg; st.act = 1; st.mode = 'letter';
    st.openEp = null; st.fullEp = null; st.special = false; st.sheet = false;
    st.pushed = true;
    setHash(false);
    render();
  }
  function close() {
    if (st.pushed) { st.pushed = false; history.back(); return; }
    history.replaceState(null, '', location.pathname + location.search);
    st.seg = '';
    render();
  }
  function syncFromHash(initial) {
    var m = location.hash.match(/letter=([A-E])(?:&act=([123]))?/);
    if (m) {
      st.seg = m[1]; st.act = m[2] ? Number(m[2]) : 1;
      st.mode = 'letter'; st.openEp = null; st.fullEp = null; st.special = false; st.sheet = false;
      render();
    } else if (!initial) { st.seg = ''; render(); }
  }

  function init() {
    root = document.getElementById('letterModalRoot');
    if (!root) return;

    root.addEventListener('click', function (e) {
      var t = e.target;
      if (t.closest('.ovm-back') || t.closest('.ovm-close')) { close(); return; }
      if (t.closest('.ovm-sheet-back') || t.closest('.ovm-sheet-close')) { st.sheet = false; render(); return; }
      if (t.closest('#ovmSheetOpen')) { st.sheet = true; render(); return; }

      var step = t.closest('.ovm-step');
      if (step) { st.act = Number(step.getAttribute('data-act')); setHash(true); render(); return; }

      var mode = t.closest('[data-mode]');
      if (mode) { st.mode = mode.getAttribute('data-mode'); render(); return; }

      var full = t.closest('.ovm-full');
      if (full) { var fk = full.getAttribute('data-ep'); st.fullEp = st.fullEp === fk ? null : fk; render(); return; }

      var node = t.closest('.ovm-node');
      if (node) { var nk = node.getAttribute('data-ep'); st.openEp = st.openEp === nk ? null : nk; st.fullEp = null; render(); return; }

      if (t.closest('#ovmSpecial')) { st.special = !st.special; render(); return; }

      var voice = t.closest('.ovc-voice');
      if (voice) {
        var tip = voice.parentElement.querySelector('.ovc-tip');
        if (tip) tip.hidden = !tip.hidden;
      }
    });

    // 좌우 스와이프로 단계 이동
    var tx = 0, ty = 0;
    root.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
    root.addEventListener('touchend', function (e) {
      if (!st.seg) return;
      var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        var n = st.act + (dx < 0 ? 1 : -1);
        if (n >= 1 && n <= 3) { st.act = n; setHash(true); render(); }
      }
    }, { passive: true });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !st.seg) return;
      if (st.sheet) { st.sheet = false; render(); } else close();
    });
    window.addEventListener('popstate', function () { syncFromHash(false); });

    // 세그먼트 카드 → 모달
    document.querySelectorAll('[data-letter-seg]').forEach(function (b) {
      b.addEventListener('click', function () { open(b.getAttribute('data-letter-seg')); });
    });

    if (window.ONVI_V6) syncFromHash(true);
    else {
      var poll = setInterval(function () {
        if (!window.ONVI_V6) return;
        clearInterval(poll);
        syncFromHash(true);
      }, 120);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.OnViLetters = { open: open, close: close, renderCard: renderCard };
})();
