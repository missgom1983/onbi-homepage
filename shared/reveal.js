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
  }
  if (document.readyState === 'complete') setTimeout(init, 400);
  else window.addEventListener('load', function () { setTimeout(init, 400); });
})();
