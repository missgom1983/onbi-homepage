#!/usr/bin/env python3
"""디자인 툴 export(.dc.html) → 운영 배포용 정적 .html 컴파일러.

- <helmet> → <head> 로 이전, _ds/<uuid>/ 참조를 배포 가능한 shared/ds/ 로 rewrite
- <dc-import Nav/Footer> → index.html·brand.html 과 동일한 표준 마크업으로 치환
- <dc-import ConsultBanner> → 제거 (index.html·brand.html 컴파일 규칙과 동일)
- sc-for / sc-if / {{ }} 는 DCLogic 의 데이터로 정적 전개하고, 상호작용은 바닐라 JS 로 대체
- style-hover="..." → 실제 :hover CSS 규칙으로 변환
- .dc.html 링크 → 운영 .html, 최적화된 .jpg 로 이미지 경로 rewrite
"""
import re
import sys
from pathlib import Path

ROOT = Path(sys.argv[1])
PARTS = Path(sys.argv[2])

DS_UUID = "_ds/on-vi-design-system-3a95f1fd-6070-4b3f-8f35-51e5e83a250f/"

LINKS = {
    "Home.dc.html": "index.html",
    "Service.dc.html": "service.html",
    "Pricing.dc.html": "pricing.html",
    "Brand.dc.html": "brand.html",
    "Support.dc.html": "support.html",
    "Contact.dc.html": "contact.html",
    "Login.dc.html": "login.html",
    "Signup.dc.html": "signup.html",
    "MyPage.dc.html": "mypage.html",
}

# sips 로 웹용 JPG 변환을 마친 사진들
JPGIFIED = [
    "beach-1997", "care-call-grandma", "care-lifebook", "care-voice2",
    "family-breakfast", "lifebook-series", "problem-album", "quote-daughter",
    "quote-dil-bright", "quote-son-face", "venice-family",
    "family-reply", "founder-lp", "founder-shoes", "letter-delivery-box",
    "paradox-two-grandmothers", "service-hero-breakfast", "venice-family-wide",
    "cherry-couple", "care-officer", "letter-bg",
]

NAV = (PARTS / "nav.html").read_text(encoding="utf-8").rstrip("\n")
NAV_CSS = (PARTS / "nav.css").read_text(encoding="utf-8").rstrip("\n")
FOOTER = (PARTS / "footer.html").read_text(encoding="utf-8").rstrip("\n")
FOOTER_CSS = (PARTS / "footer.css").read_text(encoding="utf-8").rstrip("\n")
CONSULT = (PARTS / "consult.html").read_text(encoding="utf-8").rstrip("\n")
CONSULT_CSS = (PARTS / "consult.css").read_text(encoding="utf-8").rstrip("\n")
CONSULT_SCRIPT = (PARTS / "consult.js").read_text(encoding="utf-8").rstrip("\n")

# 편지 모달은 데이터(shared/letters-v6.js)를 읽어 shared/letter-ui.js 가 그린다
LETTER_ROOT = '<div id="letterModalRoot"></div>'
LETTER_HEAD = ('<script src="shared/letters-v6.js"></script>\n'
               '<script src="shared/letter-ui.js" defer></script>')
LETTER_CSS = """  .ovm-dlg{ position:fixed; left:50%; top:50%; transform:translate(-50%,-50%); width:min(680px, calc(100vw - 32px)); height:86vh; border-radius:24px; z-index:620; animation:ovmIn .18s cubic-bezier(.22,.61,.36,1); }
  .ovm-grab{ display:none; }
  @keyframes ovmIn{ from{ opacity:0; transform:translate(-50%,-50%) scale(0.98); } to{ opacity:1; transform:translate(-50%,-50%) scale(1); } }
  @keyframes ovmUp{ from{ transform:translateY(24px); opacity:0; } to{ transform:none; opacity:1; } }
  @keyframes ovmAct{ from{ opacity:0; transform:translateX(10px); } to{ opacity:1; transform:none; } }
  .ovm-act{ animation:ovmAct .18s cubic-bezier(.22,.61,.36,1); }
  @media (max-width: 760px){
    .ovm-dlg{ left:0; top:auto; bottom:0; transform:none; width:100vw; height:92vh; border-radius:24px 24px 0 0; animation:ovmUp .18s cubic-bezier(.22,.61,.36,1); }
    .ovm-grab{ display:block; }
    .ovm-step span{ display:none; }
    .ovc-care{ grid-template-columns:1fr !important; }
  }
  @media (max-width: 360px){ .ovm-spread{ grid-template-columns:1fr !important; } }
  @media (prefers-reduced-motion: reduce){ .ovm-dlg, .ovm-act{ animation:none !important; } }"""

# 공통 크롬 CSS (네비·푸터·버튼·타이포) — 단일 원본
CHROME_CSS = (PARTS / "chrome.css").read_text(encoding="utf-8").rstrip("\n")

NAV_SCRIPT = (PARTS / "nav.js").read_text(encoding="utf-8").rstrip("\n")

FAQ_SCRIPT = """<script>
  (function () {
    function setOpen(btn, on) {
      btn.setAttribute('aria-expanded', on ? 'true' : 'false');
      var a = btn.nextElementSibling;
      if (a) a.hidden = !on;
      var c = btn.querySelector('.chev');
      if (c) c.style.transform = on ? 'rotate(180deg)' : 'rotate(0deg)';
    }
    var btns = document.querySelectorAll('.faq-q');
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        setOpen(btn, btn.getAttribute('aria-expanded') !== 'true');
      });
    });
    document.querySelectorAll('[data-faq-group]').forEach(function (card) {
      card.addEventListener('click', function () {
        var g = card.getAttribute('data-faq-group');
        btns.forEach(function (btn) { setOpen(btn, btn.getAttribute('data-group') === g); });
      });
    });
  })();
</script>"""

# 상담 신청 폼 — Contact.dc.html 의 DCLogic(검증 → mailto → 완료 화면)을 그대로 옮긴 것
CONTACT_SCRIPT = """<script>
  (function () {
    var form = document.getElementById('consultForm');
    if (!form) return;
    var formSection = document.getElementById('formSection');
    var sentPanel = document.getElementById('sentPanel');
    var sentName = document.getElementById('sentName');
    var errorBox = document.getElementById('formError');
    var pills = document.querySelectorAll('[data-method]');
    var method = '이음';

    var BASE = 'display:inline-flex; align-items:center; padding:11px 20px; border-radius:999px; font-size:14px; font-weight:600; cursor:pointer; font-family:inherit; letter-spacing:-0.01em; transition:all .18s; min-height:44px;';
    var ON = ' background:#EAF4EF; border:1px solid #4FB89E; color:#2A7360; font-weight:700; box-shadow:0 0 0 3px #EAF4EF;';
    var OFF = ' background:#FBF8EF; border:1px solid #E6E0D1; color:#3F4D62;';
    function paint() {
      pills.forEach(function (p) {
        p.setAttribute('style', BASE + (p.getAttribute('data-method') === method ? ON : OFF));
      });
    }
    pills.forEach(function (p) {
      p.addEventListener('click', function () { method = p.getAttribute('data-method'); paint(); });
    });
    paint();

    function fail(msg, field) {
      errorBox.textContent = msg;
      errorBox.hidden = false;
      if (field) field.focus();
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = (form.name.value || '').trim();
      var phone = (form.phone.value || '').trim();
      if (!name) { fail('성함을 다시 확인해 주세요.', form.name); return; }
      if (!phone) { fail('연락처를 다시 확인해 주세요.', form.phone); return; }
      if (!form.agree.checked) { fail('개인정보 수집·이용에 동의해 주세요.'); return; }

      errorBox.hidden = true;
      sentName.textContent = name;
      formSection.hidden = true;
      sentPanel.hidden = false;
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (err) { /* 무시 */ }

      var message = (form.message.value || '').trim();
      var subject = '[상담 신청] ' + name + ' 님 (' + form.relation.value + ')';
      var lines = ['성함: ' + name, '연락처: ' + phone, '신청자 관계: ' + form.relation.value,
        '희망 방식: ' + method, '', '상담 내용:', (message || '(작성 없음)'), '',
        '개인정보 수집·이용 동의: 동의함'];
      window.location.href = 'mailto:contact@onvi.kr?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(lines.join('\\n'));
    });

    document.getElementById('resetBtn').addEventListener('click', function () {
      sentPanel.hidden = true;
      formSection.hidden = false;
      errorBox.hidden = true;
    });
  })();
</script>"""


# ── DCLogic 에 있던 데이터 ────────────────────────────────────────────────
PRICING_PLANS = [
    ("씨앗", "9,900", "매주의 안부와 금요편지, 가장 단정한 시작.",
     ["주 1회 안부 전화", "금요편지", "케어 신호 (평안·살핌·확인)", "가족 공유 1인"], "씨앗으로 시작하기"),
    ("이야기", "19,900", "온 가족이 함께 답하고, 인생책이 쌓이는 방법.",
     ["씨앗의 모든 혜택", "인생책 자동 축적", "가족 댓글·음성 답장", "가족 공유 3인", "사진·음성 첨부"], "이야기로 시작하기"),
    ("평생", "39,900", "평생 소장까지, 가장 깊게 남기는 방법.",
     ["이야기의 모든 혜택", "인생책 인쇄본 제작", "가족 공유 무제한", "평생 소장 보관"], "평생으로 시작하기"),
]
FEATURED_PLAN = "이야기"  # data-props 기본값

PRICING_FAQS = [
    ("도중에 다른 요금제로 바꿀 수 있나요?", "네, 언제든 바꿀 수 있어요. 다음 결제일부터 새 요금제가 적용되고, 그동안 쌓인 편지와 기록은 그대로 이어집니다.", None),
    ("약정이나 위약금이 있나요?", "없습니다. 원하실 때 해지하실 수 있고, 해지 후에도 쌓인 편지와 기록은 내려받아 간직하실 수 있도록 안내해드려요.", None),
    ("이음과 새김 중 무엇을 골라야 할지 모르겠어요.", "두 방식은 요금 차이가 없어요. 매주의 대화를 이어가는 데 무게를 둘지, 한 권으로 남기는 데 무게를 둘지의 차이입니다. 상담에서 가족 상황을 들어보고 함께 정해드립니다.", None),
    ("가족은 몇 명까지 함께할 수 있나요?", "씨앗은 1인, 이야기는 3인, 평생은 무제한입니다. 초대된 가족만 편지를 읽고 답장을 남길 수 있어요.", None),
]

SUPPORT_FAQS = [
    ("시작하려면 무엇을 준비해야 하나요?", "부모님 성함과 연락처만 있으면 됩니다. 상담에서 편한 통화 요일과 시간을 함께 정하고, 부모님께 첫인사꾸러미를 먼저 보내드려요.", "시작하기"),
    ("첫인사꾸러미에는 무엇이 담겨 있나요?", "온비를 소개하는 손편지와 첫 통화 안내가 담겨 있습니다. 낯선 번호가 아니라 이미 인사를 나눈 곳에서 전화가 걸려오도록, 부모님이 편안하게 시작하실 수 있게 하는 준비예요.", "시작하기"),
    ("부모님이 스마트폰을 잘 못 다루셔도 되나요?", "네, 괜찮습니다. 부모님은 늘 하시던 대로 전화만 받으시면 돼요. 앱 설치도, 글쓰기도 필요 없습니다.", "시작하기"),
    ("요금제 변경이나 해지는 어떻게 하나요?", "언제든 가능합니다. 다음 결제일부터 다른 요금제로 변경되며, 해지 시 약정이나 위약금이 없습니다.", "요금·결제"),
    ("해지하면 쌓인 기록은 사라지나요?", "아니요. 해지 후에도 그동안 쌓인 편지와 기록은 내려받아 간직하실 수 있도록 안내해드립니다.", "요금·결제"),
    ("이음과 새김은 요금이 다른가요?", "두 방식은 요금 차이가 없습니다. 매주의 대화에 집중할지, 한 권으로 남기는 데 집중할지 방식의 차이예요. 어떤 쪽이 맞을지 상담에서 함께 정합니다.", "요금·결제"),
    ("가족은 어떻게 참여하나요?", "매주 도착하는 금요편지에 댓글과 음성 답장을 남길 수 있어요. 가족의 반응은 다음 통화 때 부모님께 전해져, 편지가 대화로 이어집니다.", "가족 참여·기능"),
    ("해외에 있는 가족도 함께할 수 있나요?", "네, 인터넷만 있으면 어디서든 편지를 읽고 답장을 남길 수 있습니다. 시차 걱정 없이 각자의 시간에 참여하세요.", "가족 참여·기능"),
    ("인생책은 언제 만들어지나요?", "한 시즌이 마무리될 때, 그동안 쌓인 편지와 가족의 답장을 엮어 만듭니다. 디지털 앨범으로 받아보시고, 평생 요금제는 인쇄본으로도 제작해드려요.", "가족 참여·기능"),
    ("케어 신호는 어떤 의미인가요?", "평안·살핌·확인 세 단계로 부모님의 한 주를 전하는 참고 신호입니다. 의료 진단이나 응급 대응 서비스는 아니에요.", "가족 참여·기능"),
    ("통화 내용은 누구까지 볼 수 있나요?", "통화는 부모님 본인의 동의 후에만 기록되며, 초대된 가족에게만 공개됩니다. 외부에 공유되는 일은 없습니다.", "가족 참여·기능"),
]

CHEV = "font-size:15px; color:#6A7789; flex-shrink:0; transition:transform .25s;"
Q_BTN = ("width:100%; display:flex; align-items:center; justify-content:space-between; gap:16px; "
         "padding:22px 4px; background:none; border:none; cursor:pointer; text-align:left; "
         "font-family:inherit; min-height:44px;")
A_P = "margin:0; padding:0 4px 24px; font-size:15px; line-height:1.7; color:#3F4D62; max-width:640px;"


def render_faqs(faqs):
    """DCLogic 의 아코디언을 정적 마크업으로. 기본은 모두 접힘(state.open = {})."""
    out = []
    for q, a, group in faqs:
        grp_attr = ' data-group="%s"' % group if group else ""
        head = ""
        if group:
            head = ('<span style="display:flex; flex-direction:column; gap:6px;">'
                    '<span style="font-size:11.5px; font-weight:700; letter-spacing:0.14em; color:#2A7360;">%s</span>'
                    '<span style="font-size:16.5px; font-weight:700; letter-spacing:-0.02em; color:var(--simya); line-height:1.4;">%s</span>'
                    '</span>') % (group, q)
        else:
            head = ('<span style="font-size:16.5px; font-weight:700; letter-spacing:-0.02em; '
                    'color:var(--simya); line-height:1.4;">%s</span>') % q
        out.append(
            '          <div style="border-top:1px solid #E6E0D1;">\n'
            '            <button class="faq-q" type="button"%s aria-expanded="false" style="%s">\n'
            '              %s\n'
            '              <span class="chev" style="%s">▾</span>\n'
            '            </button>\n'
            '            <p class="faq-a" hidden style="%s">%s</p>\n'
            '          </div>' % (grp_attr, Q_BTN, head, CHEV, A_P, a)
        )
    return "\n".join(out)


def render_plans():
    out = []
    for name, price, desc, feats, btn_label in PRICING_PLANS:
        f = name == FEATURED_PLAN
        card = ("position:relative; display:flex; flex-direction:column; background:#22384F; "
                "border-radius:24px; padding:38px 34px; color:#FFFFFF; "
                "box-shadow:0 34px 70px -36px rgba(31,42,58,0.55);") if f else (
               "position:relative; display:flex; flex-direction:column; background:#FFFFFF; "
               "border:1px solid #E6E0D1; border-radius:24px; padding:38px 34px;")
        name_s = "font-size:15px; font-weight:700; letter-spacing:-0.01em; " + ("color:#7CC5A9;" if f else "color:#2A7360;")
        price_s = "font-size:clamp(34px,3vw,42px); font-weight:700; letter-spacing:-0.04em; line-height:1; " + ("color:#FFFFFF;" if f else "color:#1F2A3A;")
        per_s = "font-size:15px; font-weight:600; " + ("color:rgba(255,255,255,0.6);" if f else "color:#6A7789;")
        desc_s = "margin:8px 0 0; font-size:14px; line-height:1.6; " + ("color:rgba(255,255,255,0.72);" if f else "color:#3F4D62;")
        div_s = "height:1px; margin:24px 0; " + ("background:rgba(255,255,255,0.14);" if f else "background:#E6E0D1;")
        feat_s = "display:flex; align-items:flex-start; gap:10px; font-size:14.5px; line-height:1.5; " + ("color:rgba(255,255,255,0.85);" if f else "color:#3F4D62;")
        chk_s = "font-weight:700; flex-shrink:0; " + ("color:#7CC5A9;" if f else "color:#4FB89E;")
        btn_s = ("display:inline-flex; align-items:center; justify-content:center; margin-top:28px; "
                 "padding:14px 24px; border-radius:999px; font-size:15px; font-weight:700; "
                 "letter-spacing:-0.01em; text-decoration:none; transition:background .2s, border-color .2s; ") + (
                 "background:#4FB89E; color:#FFFFFF;" if f else "background:transparent; border:1.5px solid #4FB89E; color:#2A7360;")
        btn_hover = "background:var(--action-primary-hover);" if f else "background:#4FB89E; color:#FFFFFF; border-color:#4FB89E;"
        badge = ('\n            <span style="position:absolute; top:-13px; left:50%; transform:translateX(-50%); '
                 'display:inline-flex; align-items:center; padding:6px 16px; border-radius:999px; background:#4FB89E; '
                 'color:#FFFFFF; font-size:12px; font-weight:700; letter-spacing:0.02em; white-space:nowrap;">가장 많이 선택해요</span>') if f else ""
        feats_html = "\n".join(
            '                <span style="%s"><span style="%s">✓</span>%s</span>' % (feat_s, chk_s, ft)
            for ft in feats
        )
        out.append(
            '          <div style="%s">%s\n'
            '            <div style="%s">%s</div>\n'
            '            <div style="display:flex; align-items:baseline; gap:6px; margin-top:14px;">\n'
            '              <span style="%s">%s</span>\n'
            '              <span style="%s">원/월</span>\n'
            '            </div>\n'
            '            <p style="%s">%s</p>\n'
            '            <div style="%s"></div>\n'
            '            <div style="display:flex; flex-direction:column; gap:12px;">\n'
            '%s\n'
            '            </div>\n'
            '            <a href="contact.html" style="%s" style-hover="%s">%s</a>\n'
            '          </div>' % (card, badge, name_s, name, price_s, price, per_s,
                                  desc_s, desc, div_s, feats_html, btn_s, btn_hover, btn_label)
        )
    return "\n".join(out)


def cut_block(html, start_pat, tag):
    """중첩을 고려해 <tag ...> ... </tag> 블록의 (시작, 끝) 인덱스를 찾는다."""
    m = re.search(start_pat, html)
    if not m:
        return None
    depth, i = 0, m.start()
    open_re = re.compile(r"<%s\b" % tag)
    close_re = re.compile(r"</%s>" % tag)
    pos = m.start()
    while pos < len(html):
        o = open_re.search(html, pos)
        c = close_re.search(html, pos)
        if c is None:
            break
        if o is not None and o.start() < c.start():
            depth += 1
            pos = o.end()
        else:
            depth -= 1
            pos = c.end()
            if depth == 0:
                return m.start(), pos
    return None


def replace_block(html, start_pat, tag, new):
    span = cut_block(html, start_pat, tag)
    if span is None:
        raise SystemExit("블록을 찾지 못함: %s" % start_pat)
    return html[:span[0]] + new + html[span[1]:]


def unwrap_block(html, start_pat, tag):
    """sc-if 등을 껍데기만 벗기고 내용은 남긴다."""
    span = cut_block(html, start_pat, tag)
    if span is None:
        raise SystemExit("블록을 찾지 못함: %s" % start_pat)
    inner = html[span[0]:span[1]]
    inner = re.sub(r"^<%s\b[^>]*>" % tag, "", inner)
    inner = re.sub(r"</%s>$" % tag, "", inner)
    return html[:span[0]] + inner + html[span[1]:]


# ── 페이지별 동적 전개 ────────────────────────────────────────────────────
PRICING_INCLUDED = [
    ("이야기 통화", "매주 1회·30분·같은 담당자"),
    ("주중 안부", "씨앗 배달과 가벼운 안부"),
    ("금요편지", "매주 1통·이야기와 한 주의 안부·가족 여러 명 수신"),
    ("가족 씨앗", "사진·영상 올리기, 질문 남기기"),
    ("언젠가 목록", "부모님의 바람 모음"),
    ("받아 적은 별지", "레시피·약도·노랫말 정리"),
    ("목소리 조각", "그 주의 한마디를 음성으로 보관"),
    ("부모님 수신본", "큰 글씨 편지+계절 종이 묶음"),
    ("가족 아카이브", "언제든 다시 읽고 내려받기"),
    ("곁을 살피는 신호", "평안·살핌·확인"),
    ("특별한 날", "생신·명절 특집 편지"),
]

PRICING_PERKS = [
    ("01", "시범가 유지", "정식 출시 후에도, 시범 가정은 첫 6개월간 지금의 참여비 기준으로 이어가실 수 있습니다."),
    ("02", "인생책 첫 제작 우선권", "실물 인생책 제작이 시작되면 가장 먼저 안내드리고, 첫 제작 가정으로 모십니다."),
    ("03", "만드는 과정에의 초대", "분기마다 시범 가정의 이야기를 듣는 자리를 엽니다. 온비는 이 서른 가정과 함께 만들어지는 서비스입니다."),
]

PRICING_PATH = [
    ("신청", "1분", "아래 폼에 성함과 연락처만 남겨주세요."),
    ("안내 전화", "하루 안에", "온비가 먼저 전화드려 부모님 성향과 편한 시간을 여쭙습니다. 부모님께 미리 건넬 한마디도 함께 준비해드려요."),
    ("첫인사 꾸러미 발송", "", "부모님 댁으로 손편지와 담당자 소개가 담긴 꾸러미가 갑니다."),
    ("부모님 첫 통화", "무료", "부모님이 직접 허락하시면 그때부터 이야기를 담기 시작합니다."),
    ("첫 금요편지", "무료", "첫 편지를 받아보신 뒤, 이어가실지 정하시면 됩니다. 이어가시는 경우에만 참여비를 안내드려요."),
]

PRICING_FAQS_V34 = [
    ("지금 돈을 내야 하나요", "아니요. 첫 통화와 첫 편지까지 무료이고, 받아보신 뒤에 참여비를 안내드립니다."),
    ("참여비는 왜 계좌이체인가요", "정식 출시 전 시범 운영 단계라 카드 결제 대신 대표 실명 계좌로 받고 있어요. 입금 확인서를 보내드리고, 전액 환불을 보장합니다."),
    ("환불은 정말 되나요", "됩니다. 사유를 여쭙지 않고 요청하신 날 남은 기간과 관계없이 전액 돌려드립니다."),
    ("3개월이 지나면요", "종료 2주 전에 미리 여쭙습니다. 자동으로 연장되지 않습니다."),
    ("부모님이 싫어하시면요", "첫 통화에서 거절하시면 그대로 종료됩니다. 기록도, 참여비도 없습니다."),
    ("가족 사진이나 영상은 어떻게 올리나요", "카카오톡 채널로 보내주시면 됩니다. 온비가 다음 통화의 이야깃거리로 부모님께 전해드려요."),
    ("부모님이 스마트폰을 안 쓰시는데요", "일반 전화로 걸어드립니다. 카카오톡 안부도 전화와 문자로 대신하고, 가족이 보낸 사진은 통화에서 말로 그려드린 뒤 계절 종이 묶음에 인화해 함께 보내드려요."),
    ("정식 출시되면 요금이 오르나요", "예정 요금은 월 9,900원~19,900원입니다. 시범 가정은 출시 후 6개월간 지금 기준을 유지해드립니다."),
]

PRICING_INTENTS = [
    ("pilot", "시범 참여 3개월 29,700원"),
    ("full_price", "정식 요금 월 19,900원이어도"),
    ("unsure", "아직 모르겠어요"),
]

PRICING_SCRIPT = """<script>
  (function () {
    var form = document.getElementById('applyForm');
    var donePanel = document.getElementById('applyDone');
    var failed = document.getElementById('applyFailed');
    var bar = document.querySelector('.ov-bar');
    var t0 = Date.now();

    // 개인정보 안내 펼치기
    var pv = document.getElementById('privacyToggle');
    var pvBox = document.getElementById('privacyBox');
    if (pv && pvBox) {
      pv.addEventListener('click', function () {
        var on = pvBox.hidden;
        pvBox.hidden = !on;
        pv.textContent = on ? '접기 ▴' : '자세히 ▾';
      });
    }

    // 신청 후 의향 선택
    var caption = document.getElementById('intentCaption');
    var ON = 'background:var(--cheongja); border:1px solid var(--cheongja); color:#FFFFFF;';
    var OFF = 'background:#FFFFFF; border:1px solid #E0D9C6; color:#3F4D62;';
    var BASE = 'min-height:44px; padding:11px 20px; border-radius:999px; font-family:inherit; font-size:14px; font-weight:600; cursor:pointer; transition:background .2s, color .2s, border-color .2s; ';
    var chips = document.querySelectorAll('[data-intent]');
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        chips.forEach(function (o) { o.setAttribute('style', BASE + (o === c ? ON : OFF)); });
        if (caption) caption.textContent = '고마워요. 준비에 큰 도움이 됩니다.';
      });
    });

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var fd = new FormData(form);
        if (fd.get('company') || Date.now() - t0 < 3000) return;   // 봇·오조작 방지
        var ep = form.getAttribute('data-endpoint') || '';
        var send = (ep && ep.indexOf('{') !== 0)
          ? fetch(ep, { method: 'POST', body: fd }).then(function (r) { if (!r.ok) throw 0; })
          : Promise.resolve();
        send.then(function () {
          failed.hidden = true;
          form.hidden = true;
          donePanel.hidden = false;
          if (bar) bar.setAttribute('data-on', 'false');
          try { window.scrollTo({ top: donePanel.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' }); } catch (er) { /* 무시 */ }
        }).catch(function () { failed.hidden = false; });
      });
    }

    // 하단 고정 바 — 폼이 보이거나 닫았으면 감춘다
    var closed = false;
    try { closed = sessionStorage.getItem('onvi_bar_closed') === '1'; } catch (e) { /* 무시 */ }
    var closeBtn = document.getElementById('barClose');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        closed = true;
        try { sessionStorage.setItem('onvi_bar_closed', '1'); } catch (e) { /* 무시 */ }
        if (bar) bar.setAttribute('data-on', 'false');
      });
    }
    window.addEventListener('scroll', function () {
      if (!bar) return;
      var apply = document.getElementById('apply');
      var visible = false;
      if (apply) { var r = apply.getBoundingClientRect(); visible = r.top < window.innerHeight && r.bottom > 0; }
      var on = !closed && (form ? !form.hidden : true) && window.scrollY > 400 && !visible;
      bar.setAttribute('data-on', on ? 'true' : 'false');
    }, { passive: true });
  })();
</script>"""


def expand_pricing(body):
    rows = "\n".join(
        '              <div style="display:flex; gap:11px; align-items:baseline;">'
        '<span style="width:5px; height:5px; border-radius:999px; background:var(--cheongja); flex-shrink:0; transform:translateY(-2px);"></span>'
        '<p style="margin:0; font-size:14.5px; line-height:1.6; color:#3F4D62;">'
        '<strong style="color:var(--simya);">%s</strong> %s</p></div>' % (t, d)
        for t, d in PRICING_INCLUDED
    )
    body = replace_block(body, r'<sc-for list="\{\{ included \}\}"', "sc-for", rows)

    tpl = re.search(r'<sc-for list="\{\{ perks \}\}"[^>]*>(.*?)</sc-for>', body, re.S).group(1)
    perks = "".join(
        tpl.replace("{{ pk.n }}", n).replace("{{ pk.t }}", t).replace("{{ pk.d }}", d).rstrip()
        for n, t, d in PRICING_PERKS
    )
    body = replace_block(body, r'<sc-for list="\{\{ perks \}\}"', "sc-for", perks)

    tpl = re.search(r'<sc-for list="\{\{ path \}\}"[^>]*>(.*?)</sc-for>', body, re.S).group(1)
    steps = []
    for i, (t, tag, d) in enumerate(PRICING_PATH):
        last = i == len(PRICING_PATH) - 1
        dot = ("display:inline-flex; align-items:center; justify-content:center; width:36px; height:36px; "
               "border-radius:999px; font-size:14px; font-weight:700; flex-shrink:0; ") + (
              "background:var(--cheongja); color:#FFFFFF;" if last
              else "background:#FFFFFF; color:var(--simhae); box-shadow:inset 0 0 0 1.5px #D8D0BC;")
        row = tpl.replace("{{ st.dot }}", dot).replace("{{ st.n }}", str(i + 1))
        row = row.replace("{{ st.t }}", t).replace("{{ st.tag }}", tag).replace("{{ st.d }}", d)
        if last:
            row = replace_block(row, r'<sc-if value="\{\{ st.line \}\}"', "sc-if", "")
        else:
            row = unwrap_block(row, r'<sc-if value="\{\{ st.line \}\}"', "sc-if")
        steps.append(row.rstrip())
    body = replace_block(body, r'<sc-for list="\{\{ path \}\}"', "sc-for", "".join(steps))

    faqs = "\n".join(
        '          <details class="ov-faq"><summary>%s</summary><p>%s</p></details>' % (q, a)
        for q, a in PRICING_FAQS_V34
    )
    body = replace_block(body, r'<sc-for list="\{\{ faqs \}\}"', "sc-for", faqs)

    # 신청 폼 / 완료 화면
    body = unwrap_block(body, r'<sc-if value="\{\{ notDone \}\}"', "sc-if")
    body = body.replace('<form onSubmit="{{ submit }}"',
                        '<form id="applyForm" novalidate data-endpoint="{{FORM_ENDPOINT}}"')
    body = body.replace('onClick="{{ togglePrivacy }}"', 'id="privacyToggle"')
    body = body.replace("{{ privacyGlyph }}", "자세히 ▾")
    body = unwrap_block(body, r'<sc-if value="\{\{ privacyOn \}\}"', "sc-if")
    body = body.replace(
        '<div style="background:#FFFFFF; border-radius:12px; padding:16px 18px; font-size:13px; line-height:1.75; color:#3F4D62;">',
        '<div id="privacyBox" hidden style="background:#FFFFFF; border-radius:12px; padding:16px 18px; font-size:13px; line-height:1.75; color:#3F4D62;">', 1)
    body = replace_block(
        body, r'<sc-if value="\{\{ failed \}\}"', "sc-if",
        '<p id="applyFailed" hidden role="alert" style="margin:0; background:rgba(217,184,140,0.3); '
        'border-left:3px solid var(--noeul); border-radius:8px; padding:12px 16px; font-size:14px; '
        'line-height:1.65; color:var(--simya);">전송이 되지 않았어요. 잠시 후 다시 눌러주세요. '
        '급하시면 문의 연락처로 문자 주세요.</p>'
    )

    done = re.search(r'<sc-if value="\{\{ done \}\}"[^>]*>(.*?)</sc-if>', body, re.S)
    if done:
        inner = done.group(1)
        chips = "\n".join(
            '              <button type="button" data-intent="%s" style="min-height:44px; padding:11px 20px; '
            'border-radius:999px; font-family:inherit; font-size:14px; font-weight:600; cursor:pointer; '
            'transition:background .2s, color .2s, border-color .2s; background:#FFFFFF; border:1px solid #E0D9C6; '
            'color:#3F4D62;">%s</button>' % (k, t)
            for k, t in PRICING_INTENTS
        )
        inner = replace_block(inner, r'<sc-for list="\{\{ intents \}\}"', "sc-for", chips)
        inner = inner.replace("{{ intentCaption }}",
                              '<span id="intentCaption">답해주시면 준비에 큰 도움이 됩니다.</span>')
        inner = re.sub(r'(<section[^>]*)(>)', r'\1 id="applyDone" hidden\2', inner, count=1)
        if 'id="applyDone"' not in inner:
            inner = '<div id="applyDone" hidden>' + inner + '</div>'
        body = body[:done.start()] + inner + body[done.end():]

    # 하단 고정 바
    body = body.replace('data-on="{{ barOn }}"', 'data-on="false"')
    body = body.replace('onClick="{{ closeBar }}"', 'id="barClose"')
    return body


def expand_support(body):
    body = replace_block(body, r'<sc-for list="\{\{ faqs \}\}"', "sc-for", render_faqs(SUPPORT_FAQS))
    for handler, group in (("openStart", "시작하기"), ("openBilling", "요금·결제"), ("openFamily", "가족 참여·기능")):
        body = body.replace('onClick="{{ %s }}"' % handler, 'data-faq-group="%s"' % group)
    return body


def expand_contact(body):
    # 완료 화면: 기본 숨김, 폼 제출 시 노출
    body = body.replace(
        '<sc-if value="{{ sent }}" hint-placeholder-val="{{ false }}">', "<!-- 신청 완료 -->"
    ).replace("</sc-if>\n\n  <!-- ── 상담 신청 폼 ── -->", "\n  <!-- ── 상담 신청 폼 ── -->")
    body = body.replace(
        '<section data-screen-label="02 완료" data-hide-consult="" style="border-radius:28px;',
        '<section id="sentPanel" hidden data-hide-consult="" style="border-radius:28px;'
    )
    body = body.replace("{{ sentName }}", '<span id="sentName"></span>')
    body = body.replace('onClick="{{ reset }}"', 'id="resetBtn"')

    # 폼 섹션: formSectionStyle 의 기본값(미제출 상태)을 그대로 인라인
    body = body.replace(
        '<section data-screen-label="02 폼" data-hide-consult="" style="{{ formSectionStyle }}">',
        '<section id="formSection" data-hide-consult="" style="border-radius:28px; '
        'background:color-mix(in srgb, var(--hanji) 72%, #FFFFFF); '
        'padding:clamp(40px,6vw,88px) clamp(24px,5vw,88px);">'
    )
    body = body.replace('<form onSubmit="{{ submit }}"', '<form id="consultForm" novalidate')

    # 희망 방식 pill — 기본 선택은 '이음'
    base = ("display:inline-flex; align-items:center; padding:11px 20px; border-radius:999px; "
            "font-size:14px; font-weight:600; cursor:pointer; font-family:inherit; "
            "letter-spacing:-0.01em; transition:all .18s; min-height:44px;")
    on = " background:#EAF4EF; border:1px solid #4FB89E; color:#2A7360; font-weight:700; box-shadow:0 0 0 3px #EAF4EF;"
    off = " background:#FBF8EF; border:1px solid #E6E0D1; color:#3F4D62;"
    pills = "\n".join(
        '              <button type="button" data-method="%s" style="%s" style-hover="border-color:#A6D5C2;">%s</button>'
        % (label, base + (on if label == "이음" else off), label)
        for label in ("이음", "새김", "잘 모르겠어요")
    )
    body = replace_block(body, r'<sc-for list="\{\{ methods \}\}"', "sc-for", pills)

    # 검증 오류 문구
    body = replace_block(
        body, r'<sc-if value="\{\{ error \}\}"', "sc-if",
        '<p id="formError" hidden style="margin:0; font-size:13.5px; font-weight:600; color:var(--simhae);"></p>'
    )
    return body


# ── 로그인/가입/마이페이지 (Login·Signup·MyPage.dc.html 의 DCLogic 포팅) ──
# 주의: 실제 서버 인증이 아니라 디자인 시안입니다. localStorage 에 이름만 보관합니다.
LOGIN_SCRIPT = """<script>
  (function () {
    function signIn(name) {
      try {
        localStorage.setItem('onvi.user.name', name);
        window.dispatchEvent(new Event('onvi-auth'));
      } catch (e) { /* 무시 */ }
      window.location.href = 'mypage.html';
    }
    document.querySelectorAll('[data-social]').forEach(function (b) {
      b.addEventListener('click', function () {
        try { localStorage.setItem('onvi.user.provider', b.getAttribute('data-social')); } catch (e) { /* 무시 */ }
        signIn('박지현');
      });
    });
    var form = document.getElementById('loginForm');
    var err = document.getElementById('loginError');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = (form.name.value || '').trim();
      var phone = (form.phone.value || '').trim();
      function fail(m, f) { err.textContent = m; err.hidden = false; if (f) f.focus(); }
      if (!name) { fail('성함을 다시 확인해 주세요.', form.name); return; }
      if (!phone) { fail('연락처를 다시 확인해 주세요.', form.phone); return; }
      err.hidden = true;
      signIn(name);
    });
  })();
</script>"""

SIGNUP_SCRIPT = """<script>
  (function () {
    var form = document.getElementById('signupForm');
    var err = document.getElementById('signupError');
    var step1 = document.getElementById('step1');
    var step2 = document.getElementById('step2');
    var backBtn = document.getElementById('backBtn');
    var submitBtn = document.getElementById('submitBtn');
    var dot1 = document.getElementById('dot1');
    var dot2 = document.getElementById('dot2');
    var donePanel = document.getElementById('donePanel');
    var formSection = document.getElementById('signupSection');
    var doneName = document.getElementById('doneName');
    var DOT_ON = 'width:26px; height:6px; border-radius:999px; background:var(--cheongja); transition:background .2s;';
    var DOT_OFF = 'width:26px; height:6px; border-radius:999px; background:#E6E0D1; transition:background .2s;';
    var step = 1;

    var CHIP = 'display:inline-flex; align-items:center; padding:11px 20px; border-radius:999px; font-size:14px; font-weight:600; cursor:pointer; font-family:inherit; letter-spacing:-0.01em; transition:all .18s; min-height:44px;';
    var ON = ' background:#EAF4EF; border:1px solid #4FB89E; color:#2A7360; font-weight:700; box-shadow:0 0 0 3px #EAF4EF;';
    var OFF = ' background:#FBF8EF; border:1px solid #E6E0D1; color:#3F4D62;';
    var relation = '딸';
    var chips = document.querySelectorAll('[data-relation]');
    function paintChips() {
      chips.forEach(function (c) {
        c.setAttribute('style', CHIP + (c.getAttribute('data-relation') === relation ? ON : OFF));
      });
    }
    chips.forEach(function (c) {
      c.addEventListener('click', function () { relation = c.getAttribute('data-relation'); paintChips(); });
    });
    paintChips();

    function render() {
      step1.hidden = step !== 1;
      step2.hidden = step !== 2;
      backBtn.hidden = step !== 2;
      submitBtn.textContent = step === 1 ? '다음 →' : '가족 공간 만들기';
      dot1.setAttribute('style', step === 1 ? DOT_ON : DOT_OFF);
      dot2.setAttribute('style', step === 2 ? DOT_ON : DOT_OFF);
    }
    render();

    backBtn.addEventListener('click', function () { step = 1; err.hidden = true; render(); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      function fail(m, f) { err.textContent = m; err.hidden = false; if (f) f.focus(); }
      if (step === 1) {
        if (!(form.name.value || '').trim()) { fail('성함을 다시 확인해 주세요.', form.name); return; }
        if (!(form.phone.value || '').trim()) { fail('연락처를 다시 확인해 주세요.', form.phone); return; }
        step = 2; err.hidden = true; render();
        return;
      }
      if (!form.agree.checked) { fail('개인정보 수집·이용에 동의해 주세요.'); return; }
      err.hidden = true;
      var name = (form.name.value || '').trim();
      doneName.textContent = name || '온비';
      formSection.hidden = true;
      donePanel.hidden = false;
      var head = document.getElementById('signupHead');
      if (head) head.hidden = true;
      try {
        localStorage.setItem('onvi.user.name', name);
        window.dispatchEvent(new Event('onvi-auth'));
      } catch (er) { /* 무시 */ }
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (er) { /* 무시 */ }
    });
  })();
</script>"""

MYPAGE_SCRIPT = """<script>
  (function () {
    var name = '';
    try { name = localStorage.getItem('onvi.user.name') || ''; } catch (e) { /* 무시 */ }
    var g = document.getElementById('greetName');
    if (g) g.textContent = name || '지현';

    var inviteBtn = document.getElementById('inviteBtn');
    var invited = document.getElementById('invitedNote');
    if (inviteBtn && invited) {
      inviteBtn.addEventListener('click', function () { invited.hidden = false; });
    }
    var out = document.getElementById('logoutBtn');
    if (out) {
      out.addEventListener('click', function () {
        try {
          localStorage.removeItem('onvi.user.name');
          window.dispatchEvent(new Event('onvi-auth'));
        } catch (e) { /* 무시 */ }
        window.location.href = 'index.html';
      });
    }
  })();
</script>"""


def expand_login(body):
    for provider, label in (("google", "Google"), ("naver", "네이버"), ("kakao", "카카오")):
        body = body.replace('onClick="{{ login%s }}"' % label.capitalize() if False else
                            'onClick="{{ login%s }}"' % {"google": "Google", "naver": "Naver", "kakao": "Kakao"}[provider],
                            'data-social="%s"' % provider)
    body = body.replace('<form onSubmit="{{ submit }}"', '<form id="loginForm" novalidate')
    body = replace_block(
        body, r'<sc-if value="\{\{ error \}\}"', "sc-if",
        '<p id="loginError" hidden style="margin:0; font-size:13.5px; font-weight:600; color:#A2652A;"></p>'
    )
    return body


def expand_signup(body):
    # 헤더 문구 — 가입 완료 시 감춘다
    body = unwrap_block(body, r'<sc-if value="\{\{ notDone \}\}"', "sc-if")
    body = body.replace('<div>\n          <h1 style="font-size:clamp(28px,3.6vw,40px);',
                        '<div id="signupHead">\n          <h1 style="font-size:clamp(28px,3.6vw,40px);')

    # 완료 패널 — 기본 숨김
    body = body.replace('<sc-if value="{{ done }}" hint-placeholder-val="{{ false }}">', "<!-- 가입 완료 -->")
    body = re.sub(r'(<section)(\s+data-screen-label="03 가입 완료")', r'\1 id="donePanel" hidden\2', body)
    body = body.replace("    </section>\n  </sc-if>", "    </section>")
    body = body.replace("{{ doneName }}", '<span id="doneName"></span>')

    # 폼 섹션 (formStyle 기본값 = 노출)
    body = re.sub(r'(<section\s+data-screen-label="02 폼")\s+style="\{\{ formStyle \}\}"',
                  r'\1 id="signupSection" style="border-radius:28px; background:color-mix(in srgb, var(--hanji) 72%, #FFFFFF); padding:clamp(32px,6vw,64px) clamp(20px,4vw,56px);"',
                  body)
    body = body.replace('<form onSubmit="{{ submit }}"', '<form id="signupForm" novalidate')
    body = body.replace('<span style="{{ dot1 }}"></span><span style="{{ dot2 }}"></span>',
                        '<span id="dot1" style="width:26px; height:6px; border-radius:999px; background:var(--cheongja); transition:background .2s;"></span>'
                        '<span id="dot2" style="width:26px; height:6px; border-radius:999px; background:#E6E0D1; transition:background .2s;"></span>')

    # 단계 래퍼
    body = body.replace('<sc-if value="{{ step1 }}" hint-placeholder-val="{{ true }}">\n          <div style="display:flex; flex-direction:column; gap:20px;">',
                        '<div id="step1" style="display:flex; flex-direction:column; gap:20px;">')
    body = body.replace('<sc-if value="{{ step2 }}" hint-placeholder-val="{{ false }}">\n          <div style="display:flex; flex-direction:column; gap:20px;">',
                        '<div id="step2" hidden style="display:flex; flex-direction:column; gap:20px;">')
    body = body.replace("          </div>\n        </sc-if>", "          </div>")

    # 관계 선택 chip
    chip = ("display:inline-flex; align-items:center; padding:11px 20px; border-radius:999px; font-size:14px; "
            "font-weight:600; cursor:pointer; font-family:inherit; letter-spacing:-0.01em; transition:all .18s; min-height:44px;")
    on = " background:#EAF4EF; border:1px solid #4FB89E; color:#2A7360; font-weight:700; box-shadow:0 0 0 3px #EAF4EF;"
    off = " background:#FBF8EF; border:1px solid #E6E0D1; color:#3F4D62;"
    chips = "\n".join(
        '                  <button type="button" data-relation="%s" style="%s" style-hover="border-color:#A6D5C2;">%s</button>'
        % (label, chip + (on if label == "딸" else off), label)
        for label in ("딸", "아들", "며느리", "사위", "손주", "기타")
    )
    body = replace_block(body, r'<sc-for list="\{\{ relations \}\}"', "sc-for", chips)

    body = replace_block(
        body, r'<sc-if value="\{\{ error \}\}"', "sc-if",
        '<p id="signupError" hidden style="margin:0; font-size:13.5px; font-weight:600; color:#A2652A;"></p>'
    )
    body = replace_block(body, r'<sc-if value="\{\{ step2 \}\}"', "sc-if",
        '<button id="backBtn" type="button" hidden style="flex-shrink:0; display:inline-flex; align-items:center; '
        'justify-content:center; padding:15px 24px; border-radius:999px; background:transparent; border:1px solid #E6E0D1; '
        'color:var(--simya); font-size:15px; font-weight:600; cursor:pointer; font-family:inherit; min-height:44px; '
        'transition:border-color .2s;" style-hover="border-color:var(--cheongja);">이전</button>')
    body = body.replace("{{ submitLabel }}", "다음 →")
    body = body.replace('<button type="submit" style="flex:1;', '<button id="submitBtn" type="submit" style="flex:1;')
    body = re.sub(r'\s+value="\{\{ v\w+ \}\}"\s+onChange="\{\{ set\w+ \}\}"', "", body)
    return body


MEMBERS = [
    ("김순자", "어머니 · 이야기의 주인공", "母", "var(--morae)", "#7A5526", "주인공", True),
    ("박지현", "딸 · 공간 관리", "딸", "var(--angae)", "#2A7360", "나", True),
    ("박민준", "아들", "아", "var(--saebyeok)", "#2A7360", "함께", False),
    ("이서연", "손녀", "손", "var(--angae)", "#2A7360", "함께", False),
]


def expand_mypage(body):
    body = body.replace("{{ greetName }}", '<span id="greetName">지현</span>')
    # 케어 신호 기본값 '평안'
    body = body.replace('<span style="{{ signalDot }}"></span>',
                        '<span style="width:9px; height:9px; border-radius:999px; background:var(--cheongja); flex-shrink:0;"></span>')
    body = body.replace("{{ signalLabel }}", "평안")
    # 인생책 진행 (기본 12주 / 52주 = 23%)
    body = body.replace("{{ weeks }}", "12").replace("{{ percent }}", "23")
    body = body.replace('<div style="{{ barStyle }}"></div>',
                        '<div style="height:100%; width:23%; border-radius:999px; background:var(--cheongja); transition:width .4s;"></div>')
    body = body.replace("{{ replyCount }}", "2")
    body = body.replace("{{ planName }}", "이야기").replace("{{ planPrice }}", "19,900")

    badge_main = "font-size:11.5px; font-weight:700; padding:5px 11px; border-radius:999px; background:var(--saebyeok); color:#2A7360;"
    badge_sub = "font-size:11.5px; font-weight:600; padding:5px 11px; border-radius:999px; background:#FBF8EF; border:1px solid #E6E0D1; color:#6A7789;"
    rows = []
    for nm, role, initial, bg, fg, badge, main in MEMBERS:
        avatar = ("flex-shrink:0; width:40px; height:40px; border-radius:999px; background:%s; display:inline-flex; "
                  "align-items:center; justify-content:center; font-size:13px; font-weight:700; color:%s;") % (bg, fg)
        rows.append(
            '            <div style="display:flex; align-items:center; gap:14px; padding:15px 0; border-top:1px solid #F0EBDD;">\n'
            '              <span style="%s">%s</span>\n'
            '              <div style="display:flex; flex-direction:column; gap:2px; flex:1;">\n'
            '                <span style="font-size:15px; font-weight:700;">%s</span>\n'
            '                <span style="font-size:12.5px; color:#6A7789;">%s</span>\n'
            '              </div>\n'
            '              <span style="%s">%s</span>\n'
            '            </div>' % (avatar, initial, nm, role, badge_main if main else badge_sub, badge)
        )
    body = replace_block(body, r'<sc-for list="\{\{ members \}\}"', "sc-for", "\n".join(rows))

    body = body.replace('onClick="{{ invite }}"', 'id="inviteBtn"')
    body = replace_block(
        body, r'<sc-if value="\{\{ invited \}\}"', "sc-if",
        '<div id="invitedNote" hidden style="display:flex; align-items:center; gap:10px; margin-top:14px; '
        'padding:13px 16px; background:var(--saebyeok); border-radius:12px;">'
        '<span style="width:7px; height:7px; border-radius:999px; background:var(--cheongja); flex-shrink:0;"></span>'
        '<span style="font-size:13.5px; font-weight:600; color:#2A7360;">초대 링크를 보냈어요. 가족이 수락하면 여기에 나타나요.</span></div>'
    )
    body = body.replace('onClick="{{ logout }}"', 'id="logoutBtn"')
    return body




# ── Home / Brand (v3.1 부터 .dc.html 에서 직접 컴파일) ──────────────────
HOME_SCRIPT = """<script>
  (function () {
    // 섹션 진입 리빌 — 히어로(01)와 카드 스태거 섹션(03·05)은 카드만 움직인다
    var targets = [];
    document.querySelectorAll('section').forEach(function (sec) {
      if (sec.hasAttribute('data-no-reveal')) return;
      targets.push(sec);
    });
    document.querySelectorAll('#how-cards > div, #review-cards > div').forEach(function (el, i) {
      el.style.transitionDelay = (i % 3) * 90 + 'ms';
      targets.push(el);
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('ov-on'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
      el.classList.add('ov-rv');
      io.observe(el);
    });

    // 모바일 가로 슬라이더: 현재 위치를 알려주는 진행 도트
    ['how-cards', 'review-cards'].forEach(function (id) {
      var target = document.getElementById(id);
      if (!target || !target.children.length) return;
      if (target.parentElement.querySelector('.ov-dots')) return;
      var dots = document.createElement('div');
      dots.className = 'ov-dots';
      dots.setAttribute('aria-hidden', 'true');
      var n = target.children.length;
      for (var i = 0; i < n; i++) {
        var sp = document.createElement('span');
        sp.style.cssText = 'width:7px; height:7px; border-radius:999px; background:rgba(31,42,58,0.18); transition:width .25s, background .25s;';
        dots.appendChild(sp);
      }
      target.insertAdjacentElement('afterend', dots);
      var update = function () {
        var first = target.firstElementChild;
        if (!first) return;
        var w = first.offsetWidth + 12;
        var idx = Math.min(n - 1, Math.max(0, Math.round(target.scrollLeft / w)));
        Array.prototype.forEach.call(dots.children, function (sp, i) {
          sp.style.width = i === idx ? '20px' : '7px';
          sp.style.background = i === idx ? 'var(--cheongja)' : 'rgba(31,42,58,0.18)';
        });
      };
      target.addEventListener('scroll', update, { passive: true });
      update();
    });
  })();
</script>"""

# Home.dc.html 의 props 기본값 (mood=한지결, voice=이음, letterProof=true)
HOME_VALS = {
    "softBg": "#FBF8EF",
    "darkBg": "var(--saebyeok)",
    "ctaBg": "#22384F",
    "kicker": "금요편지",
    "lead2": "통화 한 통이 편지가 되어, 온 가족에게 닿아요.",
    "seasonNote": "이야기는 다음 권으로 계속 이어져요",
}


def expand_home(body):
    # 리빌 대상 제외 표시 (히어로·카드 스태거 섹션)
    for label in ("01", "03", "05"):
        body = re.sub(r'(<section[^>]*data-screen-label="' + label + r'[^"]*")',
                      r'\1 data-no-reveal=""', body)
    for k, v in HOME_VALS.items():
        body = body.replace("{{ " + k + " }}", v)
    return body


# 브랜드 비전 영상 — 원본(uploads/)은 배포 제외라 assets/videos/ 로 옮겨 서빙한다
BRAND_VIDEOS = {
    "uploads/app-video-latest.mp4": "assets/videos/vision-app.mp4",
    "uploads/A_single_smart_home_care_devic.mp4": "assets/videos/vision-device.mp4",
    "uploads/A_single_friendly_companion_ho.mp4": "assets/videos/vision-robot.mp4",
}

BRAND_SCRIPT = """<script>
  (function () {
    var btn = document.querySelector('[data-scroll-story]');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var s = document.querySelector('[data-story-anchor]');
      if (s) window.scrollTo({ top: s.getBoundingClientRect().top + window.scrollY - 64, behavior: 'smooth' });
    });
  })();
</script>"""


def expand_brand(body):
    body = body.replace('onClick="{{ scrollToStory }}"', 'data-scroll-story=""')
    body = re.sub(r'(<section[^>]*data-screen-label="02 [^"]*")', r'\1 data-story-anchor=""', body)
    # 영상: DC 불리언 속성을 표준 HTML 속성으로
    body = re.sub(r'\s(autoPlay|loop|muted|playsInline)="\{\{ true \}\}"',
                  lambda m: " " + m.group(1).lower(), body)
    for src, dst in BRAND_VIDEOS.items():
        body = body.replace(src, dst)
    # props 기본값 (founderName 없음, ctaMode='상담 신청')
    body = body.replace("{{ founderSign }}", "")
    body = body.replace("{{ ctaLabel }}", "상담 신청하기")
    body = body.replace("{{ ctaLead }}", "부모님과 가족에게 맞는 방법을 온비가 함께 찾아드립니다.")
    return body


# ── Service (v3.4): 세그먼트 카드 슬라이더 + 편지 모달 ──────────────────
SERVICE_SEGS = {
    "E": {
        "name": "멀리 살아 자주 못 가는 가족",
        "hook1": "멀어서 못 가는 대신,",
        "hook2": "매주 곁에 있는 방법.",
        "preview": "화요일에 영상을 보내드렸더니, 수요일 통화는 아버지의 웃음으로 시작됐습니다. \"고놈 걸음이 지 아빠랑 똑같네.\""
    },
    "C": {
        "name": "손맛을 잃고 싶지 않은 가족",
        "hook1": "엄마의 그 김치 맛,",
        "hook2": "물려받을 수 있을 때예요.",
        "preview": "이번 주는 열무김치 담그시는 날이었어요. 통화 내내 어머니는 손을 놀리시면서 순서를 하나하나 불러주셨습니다. \"열무는 씻을 때 살살, 풋내 나니까.\" 풀은 밀가루 말고 감자를 삶아 으깨서 쓰신다는 건 처음 알았어요. 외할머니께 그렇게 배우셨다고 합니다."
    },
    "D": {
        "name": "두 분이 함께 계신 집",
        "hook1": "같은 맞선 날,",
        "hook2": "두 분의 기억이 달라요.",
        "preview": "이번 주는 두 분과 번갈아 통화했어요. 주제는 1979년 맞선 날. 아버지 말씀으로는, 다방에서 어머니가 먼저 말을 거셨답니다. \"용감한 사람이었어, 그때부터.\" 그런데 어머니 기억은 다릅니다. \"저이가 삼십 분을 말이 없길래, 내가 답답해서 그랬지.\""
    },
    "A": {
        "name": "말수가 적어지신 어머니",
        "hook1": "\"괜찮다.\" 그 말 뒤에",
        "hook2": "숨은 일주일이 있어요.",
        "preview": "첫 통화라 서로 어색할 줄 알았는데, 어머니는 첫인사 꾸러미의 손편지를 읽으셨다며 먼저 말을 꺼내셨어요. \"요즘 누가 손으로 편지를 쓰니\" 하시면서도, 냉장고에 붙여두셨다고 하십니다."
    },
    "B": {
        "name": "이야기를 안 하시는 아버지",
        "hook1": "아버지와의 통화, 오늘도",
        "hook2": "3분을 못 넘겼다면.",
        "preview": "지난주 편지에 따님이 물으셨지요. \"그 운동화 가게 골목 이름이 뭐예요? 나 거기 가보고 싶어.\" 화요일에 그 질문을 그대로 전해드렸더니, 수요일 통화에서 아버지는 종이에 약도까지 그려두고 기다리고 계셨습니다."
    }
}

SERVICE_IMG = {
    "A": ("assets/photos/care-call-grandma.jpg", "center 30%"),
    "B": ("assets/photos/founder-shoes.jpg", "center 60%"),
    "C": ("assets/photos/grandma-kimchi.jpeg", "center 35%"),
    "D": ("assets/photos/cherry-couple.jpg", "center 32%"),
    "E": ("assets/photos/venice-family.jpg", "center 45%"),
}

SERVICE_SCRIPT = """<script>
  (function () {
    // 세그먼트 카드는 letters-v6 데이터로 채운다
    function fill() {
      var D = window.ONVI_V6;
      if (!D) return false;
      document.querySelectorAll('[data-letter-seg]').forEach(function (btn) {
        var k = btn.getAttribute('data-letter-seg');
        var s = D.segments[k];
        if (!s) return;
        var rep = D.episodes[s.rep];
        var set = function (sel, txt) { var el = btn.querySelector(sel); if (el && !el.textContent.trim()) el.textContent = txt; };
        set('[data-seg-name]', s.name);
        set('[data-seg-hook1]', s.hook[0]);
        set('[data-seg-hook2]', s.hook[1]);
        var pv = btn.querySelector('[data-seg-preview]');
        if (pv && pv.firstChild && !pv.firstChild.nodeValue.trim()) pv.firstChild.nodeValue = (rep.paras || [''])[0];
      });
      return true;
    }
    if (!fill()) {
      var poll = setInterval(function () { if (fill()) clearInterval(poll); }, 120);
    }

    // 슬라이더 진행 도트
    function bindDots(sliderSel, dotsSel, n) {
      var el = document.querySelector(sliderSel);
      var dots = document.querySelectorAll(dotsSel + ' > span');
      if (!el || !dots.length) return;
      var update = function () {
        var max = el.scrollWidth - el.clientWidth;
        var i = max > 0 ? Math.min(n - 1, Math.max(0, Math.round(el.scrollLeft / max * (n - 1)))) : 0;
        dots.forEach(function (d, j) {
          d.style.width = j === i ? '18px' : '7px';
          d.style.background = j === i ? 'var(--cheongja)' : '#D8D0BC';
        });
      };
      el.addEventListener('scroll', update, { passive: true });
      update();
    }
    bindDots('.ov-slider', '[data-seg-dots]', 5);
    bindDots('.ov-gslider', '[data-give-dots]', 7);

    var g = document.querySelector('.ov-gslider');
    var prev = document.querySelector('[data-give-prev]');
    var next = document.querySelector('[data-give-next]');
    if (g && prev) prev.addEventListener('click', function () { g.scrollBy({ left: -344, behavior: 'smooth' }); });
    if (g && next) next.addEventListener('click', function () { g.scrollBy({ left: 344, behavior: 'smooth' }); });
  })();
</script>"""


def expand_service(body):
    body = body.replace(' onScroll="{{ sliderScroll }}"', '').replace(' onScroll="{{ giveScroll }}"', '')
    body = body.replace('onClick="{{ givePrev }}"', 'data-give-prev=""')
    body = body.replace('onClick="{{ giveNext }}"', 'data-give-next=""')

    tpl = re.search(r'<sc-for list="\{\{ cards \}\}"[^>]*>(.*?)</sc-for>', body, re.S).group(1)
    cards = []
    for k in ("E", "C", "D", "A", "B"):          # ONVI_V6.order
        img, pos = SERVICE_IMG[k]
        c = tpl.replace('onClick="{{ cd.open }}"', 'data-letter-seg="%s"' % k)
        c = c.replace("{{ cd.imgStyle }}",
                      "position:absolute; inset:0; background-image:url('%s'); background-size:cover; background-position:%s;" % (img, pos))
        d = SERVICE_SEGS[k]
        c = c.replace("{{ cd.name }}", '<span data-seg-name="">%s</span>' % d["name"])
        c = c.replace("{{ cd.hook1 }}", '<span data-seg-hook1="">%s</span>' % d["hook1"])
        c = c.replace("{{ cd.hook2 }}", '<span data-seg-hook2="">%s</span>' % d["hook2"])
        c = c.replace("{{ cd.preview }}", d["preview"])
        c = c.replace('class="ov-preview"', 'class="ov-preview" data-seg-preview=""')
        cards.append(c.rstrip())
    body = replace_block(body, r'<sc-for list="\{\{ cards \}\}"', "sc-for", "".join(cards))

    dot = '<span style="width:7px; height:7px; border-radius:999px; transition:width .25s, background .25s; background:#D8D0BC;"></span>'
    body = replace_block(body, r'<sc-for list="\{\{ dots \}\}"', "sc-for", dot * 5)
    body = replace_block(body, r'<sc-for list="\{\{ giveDots \}\}"', "sc-for", dot * 7)
    body = re.sub(r'(<div[^>]*?)(>\s*' + re.escape(dot) + r'{5})', r'\1 data-seg-dots=""\2', body, count=1)
    body = re.sub(r'(<div[^>]*?)(>\s*' + re.escape(dot) + r'{7})', r'\1 data-give-dots=""\2', body, count=1)
    return body


# 준비 중인 화면임을 알리는 안내 (실제 서비스로 오인되지 않도록)
PREVIEW_NOTE = {
    "login.html": "실제 로그인은 아직 준비 중이라, 남겨주신 내용은 저장되지 않아요.",
    "signup.html": "실제 가입은 아직 준비 중이라, 남겨주신 내용은 저장되지 않아요.",
    "mypage.html": "화면에 보이는 가족과 편지는 예시로 만든 내용이에요.",
}


def preview_banner(text):
    return (
        '\n<div style="width:min(760px,92%); margin:100px auto 0;">\n'
        '  <div style="display:flex; align-items:flex-start; gap:11px; padding:15px 20px; '
        'background:var(--morae,#EBD9C5); border-radius:16px;">\n'
        '    <span aria-hidden="true" style="flex-shrink:0; width:8px; height:8px; border-radius:999px; '
        'background:var(--noeul,#D9B88C); margin-top:7px;"></span>\n'
        '    <p style="margin:0; font-size:14px; line-height:1.65; color:#6B4E2E; letter-spacing:-0.01em;">'
        '<b style="font-weight:700;">미리 보기 화면이에요.</b> ' + text + '</p>\n'
        '  </div>\n'
        '</div>'
    )


PAGES = {
    "Home.dc.html": ("index.html", "home", expand_home, [HOME_SCRIPT]),
    "Brand.dc.html": ("brand.html", "brand", expand_brand, [BRAND_SCRIPT]),
    "Service.dc.html": ("service.html", "service", expand_service, [SERVICE_SCRIPT]),
    "Pricing.dc.html": ("pricing.html", "pricing", expand_pricing, [PRICING_SCRIPT]),
    "Support.dc.html": ("support.html", "support", expand_support, [FAQ_SCRIPT]),
    "Contact.dc.html": ("contact.html", "contact", expand_contact, [CONTACT_SCRIPT]),
    "Login.dc.html": ("login.html", "none", expand_login, [LOGIN_SCRIPT]),
    "Signup.dc.html": ("signup.html", "none", expand_signup, [SIGNUP_SCRIPT]),
    "MyPage.dc.html": ("mypage.html", "none", expand_mypage, [MYPAGE_SCRIPT]),
}


def nav_for(current):
    out = NAV
    for key in ("service", "pricing", "brand", "support"):
        token = "__A_" + key.upper() + "__"
        out = out.replace(token, ' class="active"' if key == current else "")
    return out


def strip_tool_attrs(html):
    html = re.sub(r'\s+hint-(?:size|placeholder-count|placeholder-val)="[^"]*"', "", html)
    html = re.sub(r'\s+data-screen-label="[^"]*"', "", html)
    return html


def convert_hovers(html):
    rules = {}

    def repl(m):
        tag, before, decls, after = m.group(1), m.group(2), m.group(3), m.group(4)
        decls = decls.strip().rstrip(";")
        if decls not in rules:
            rules[decls] = "hv%d" % (len(rules) + 1)
        cls = rules[decls]
        attrs = before + after
        cm = re.search(r'class="([^"]*)"', attrs)
        if cm:
            attrs = attrs[:cm.start(1)] + (cm.group(1) + " " + cls) + attrs[cm.end(1):]
        else:
            attrs = ' class="%s"' % cls + attrs
        return "<%s%s>" % (tag, attrs.rstrip())

    html = re.sub(r'<(\w+)([^>]*?)\sstyle-hover="([^"]*)"([^>]*?)>', repl, html)
    css = "\n".join("  .%s:hover{ %s; }" % (c, d) for d, c in rules.items())
    return html, css



def balance_sections(html, page=""):
    """디자인 툴 export 가 종종 섹션 안에서 <div> 짝을 흘린다.
    섹션이 열릴 때의 깊이를 기억했다가 </section> 에서 어긋나면 그 자리에서 맞춘다."""
    out, depth, stack, fixed = [], 0, [], 0
    for tok in re.split(r'(<div\b|</div>|<section\b|</section>)', html):
        if tok == "<div":
            depth += 1
        elif tok == "</div>":
            depth -= 1
        elif tok == "<section":
            stack.append(depth)
        elif tok == "</section>":
            if stack:
                want = stack.pop()
                if depth > want:
                    out.append("</div>" * (depth - want)); fixed += depth - want; depth = want
                elif depth < want:
                    out.append("<div>" * (want - depth)); fixed += want - depth; depth = want
        out.append(tok)
    html = "".join(out)
    if depth > 0:      # 섹션 밖에서 열린 채 끝난 경우
        html += "</div>" * depth
        fixed += depth
    if fixed:
        print("  ! %s: 원본 마크업의 <div> 짝 %d곳을 보정" % (page, fixed))
    return html

def rewrite_paths(html):
    html = html.replace(DS_UUID, "shared/ds/")
    for src, dst in LINKS.items():
        html = html.replace('"%s' % src, '"%s' % dst)
    for name in JPGIFIED:
        html = html.replace("assets/photos/%s.png" % name, "assets/photos/%s.jpg" % name)
    # 원본 export 의 깨진 앵커 교정 (대상 섹션이 실제로 존재하는 곳으로)
    html = html.replace('"index.html#sample"', '"service.html#letters"')
    html = html.replace('"service.html#sample"', '"service.html#letters"')
    html = html.replace('"service.html#join"', '"pricing.html#apply"')
    html = html.replace('"service.html#lifebook"', '"service.html#give"')
    return html


def compile_page(src_name, out_name, current, expand, extra_scripts):
    src = (ROOT / src_name).read_text(encoding="utf-8")

    helmet = re.search(r"<helmet>(.*?)</helmet>", src, re.S).group(1)
    body = src.split("</helmet>", 1)[1].split("</x-dc>", 1)[0]

    title = re.search(r"<title>(.*?)</title>", helmet, re.S).group(1).strip()
    dm = re.search(r'<meta name="description" content="([^"]*)"', helmet)
    desc = dm.group(1) if dm else ""
    page_css = "\n".join(
        m.group(1).strip("\n") for m in re.finditer(r"<style>(.*?)</style>", helmet, re.S)
    )

    if expand:
        body = expand(body)
    if out_name in PREVIEW_NOTE:
        body = body.replace('style="padding:150px 0 96px; flex:1;"', 'style="padding:34px 0 96px; flex:1;"')
        body = body.replace('<section id="signupSection" style="padding:140px 0 96px;">',
                            '<section id="signupSection" style="padding:34px 0 96px;">')
        body = body.replace('<section id="donePanel" hidden style="padding:150px 0 110px;">',
                            '<section id="donePanel" hidden style="padding:34px 0 110px;">')
        body = body.replace('style="padding:140px 0 0;"', 'style="padding:34px 0 0;"')

    has_letter = 'name="LetterModal"' in body
    body = re.sub(r'<dc-import name="LetterModal"[^>]*></dc-import>',
                  lambda m: LETTER_ROOT if has_letter else "", body)
    has_consult = 'name="ConsultBanner"' in body
    body = re.sub(r'<dc-import name="ConsultBanner"[^>]*></dc-import>',
                  lambda m: CONSULT if has_consult else "", body)
    nav_html = nav_for(current)
    if out_name in PREVIEW_NOTE:
        nav_html += preview_banner(PREVIEW_NOTE[out_name])
    body = re.sub(r'<dc-import name="Nav"[^>]*></dc-import>', lambda m: nav_html, body)
    body = re.sub(r'<dc-import name="Footer"[^>]*></dc-import>', FOOTER, body)
    body = strip_tool_attrs(body)
    body, hover_css = convert_hovers(body)
    body = balance_sections(body, out_name)
    body = rewrite_paths(body)
    page_css = rewrite_paths(page_css)

    extra_head = LETTER_HEAD if has_letter else ""
    head_links = "\n".join(
        '<link rel="stylesheet" href="shared/ds/%s">' % f
        for f in ("tokens/fonts.css", "tokens/colors.css", "tokens/colorways.css",
                  "tokens/typography.css", "tokens/spacing.css", "styles.css")
    )

    css_blocks = [CHROME_CSS, NAV_CSS, FOOTER_CSS]
    if has_consult:
        css_blocks.append(CONSULT_CSS)
    if has_letter:
        css_blocks.append(LETTER_CSS)
    if page_css.strip():
        css_blocks.append("  /* 페이지 고유 */\n" + page_css)
    if hover_css.strip():
        css_blocks.append("  /* 디자인 툴 hover */\n" + hover_css)

    all_scripts = [NAV_SCRIPT]
    if has_consult:
        all_scripts.append(CONSULT_SCRIPT)
    scripts = "\n".join(all_scripts + extra_scripts)
    out = """<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>%s</title>
%s
%s
%s
<style>
%s
</style>
</head>
<body>%s
<script src="shared/reveal.js"></script>
%s
</body>
</html>
""" % (title, ('<meta name="description" content="%s">' % desc) if desc else "",
       head_links, extra_head, "\n".join(css_blocks), body.rstrip("\n"), scripts)
    out = re.sub(r"\n{3,}", "\n\n", out)
    (ROOT / out_name).write_text(out, encoding="utf-8")
    print("  %-18s -> %-14s (%d bytes)" % (src_name, out_name, len(out)))


print("컴파일:")
for src_name, (out_name, current, expand, extra) in PAGES.items():
    compile_page(src_name, out_name, current, expand, extra)
