<script>
  (function () {
    var fab = document.getElementById('consultFab');
    var modal = document.getElementById('consultModal');
    if (!fab || !modal) return;
    var form = document.getElementById('consultForm');
    var err = document.getElementById('consultError');
    var formWrap = document.getElementById('consultFormWrap');
    var sentPanel = document.getElementById('consultSent');
    var sentName = document.getElementById('consultSentName');
    var open = false;
    var scrolled = false;
    var visible = 0;   // 화면에 보이는 [data-hide-consult] 섹션 수

    function sync() {
      fab.hidden = !(scrolled && visible === 0 && !open);
    }
    function setOpen(v) {
      open = v;
      modal.hidden = !v;
      if (v) { formWrap.hidden = false; sentPanel.hidden = true; err.hidden = true; }
      sync();
    }

    document.getElementById('consultOpen').addEventListener('click', function () { setOpen(true); });
    document.getElementById('consultBackdrop').addEventListener('click', function () { setOpen(false); });
    document.querySelectorAll('.consult-close').forEach(function (b) {
      b.addEventListener('click', function () { setOpen(false); });
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) setOpen(false); });
    window.addEventListener('onvi-consult-open', function () { setOpen(true); });

    window.addEventListener('scroll', function () {
      var s = window.scrollY > 480;
      if (s !== scrolled) { scrolled = s; sync(); }
    }, { passive: true });

    // CTA 섹션이 보이는 동안에는 플로팅 버튼을 감춘다
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { visible += e.isIntersecting ? 1 : -1; });
      if (visible < 0) visible = 0;
      sync();
    }, { threshold: 0.08 });
    setTimeout(function () {
      document.querySelectorAll('[data-hide-consult]').forEach(function (el) { io.observe(el); });
    }, 500);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      function fail(m, f) { err.textContent = m; err.hidden = false; if (f) f.focus(); }
      var name = (form.name.value || '').trim();
      var phone = (form.phone.value || '').trim();
      if (!name) { fail('성함을 다시 확인해 주세요.', form.name); return; }
      if (!phone) { fail('연락처를 다시 확인해 주세요.', form.phone); return; }
      if (!form.agree.checked) { fail('개인정보 수집·이용에 동의해 주세요.'); return; }
      err.hidden = true;
      sentName.textContent = name;
      formWrap.hidden = true;
      sentPanel.hidden = false;
      var subject = '[상담 신청] ' + name + ' 님';
      var lines = ['성함: ' + name, '연락처: ' + phone, '', '(플로팅 배너에서 신청)', '개인정보 수집·이용 동의: 동의함'];
      window.location.href = 'mailto:contact@onvi.kr?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(lines.join('\n'));
    });

    sync();
  })();
</script>
