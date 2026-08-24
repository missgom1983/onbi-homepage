// 온비 공통 스크롤 리빌 (섹션 진입 opacity+18px, 카드 스태거)
(function () {
  function init() {
    var secs = document.querySelectorAll('section');
    if (!secs.length) { setTimeout(init, 300); return; }
    var targets = [];
    secs.forEach(function (sec, i) {
      if (i === 0) return; // 첫 섹션(히어로)은 즉시 노출
      if (sec.querySelector('[data-ov-cards]')) return; // 카드 스태거 섹션은 카드만
      targets.push(sec);
    });
    document.querySelectorAll('[data-ov-cards] > div, [data-ov-cards] > a').forEach(function (el, i) {
      el.style.transitionDelay = (i % 3) * 90 + 'ms';
      targets.push(el);
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('ov-on'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (el) {
      if (el.classList.contains('ov-rv')) return;
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.9) return;
      el.classList.add('ov-rv');
      io.observe(el);
    });
    // 모바일 슬라이더 진행 도트
    document.querySelectorAll('[data-ov-cards]').forEach(function (target) {
      var n = target.children.length;
      if (n < 2) return;
      if (target.parentElement.querySelector('.ov-dots')) return;
      var dots = document.createElement('div');
      dots.className = 'ov-dots';
      dots.setAttribute('aria-hidden', 'true');
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
          sp.style.background = i === idx ? 'var(--cheongja, #4FB89E)' : 'rgba(31,42,58,0.18)';
        });
      };
      target.addEventListener('scroll', update, { passive: true });
      update();
    });
  }
  if (document.readyState === 'complete') setTimeout(init, 400);
  else window.addEventListener('load', function () { setTimeout(init, 400); });
})();
