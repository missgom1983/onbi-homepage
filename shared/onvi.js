/* onvi.js — On:Vi 정적 사이트 공용 동작
 * 1) style-hover 속성 → 마우스 hover 시 인라인 스타일 적용 (디자인 원본의 hover 효과 재현)
 * 2) [data-reveal] → 스크롤 진입 시 .is-visible 로 페이드업
 * 3) 모바일 네비 햄버거 토글
 * 4) 상담 배너: 스크롤 시 등장 + 닫기(세션 기억) */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function () {
    // 1) style-hover 일반 처리
    document.querySelectorAll('[style-hover]').forEach(function (el) {
      var hover = el.getAttribute('style-hover');
      if (!hover) return;
      var base = el.getAttribute('style') || '';
      el.addEventListener('mouseenter', function () { el.setAttribute('style', base + ';' + hover); });
      el.addEventListener('mouseleave', function () { el.setAttribute('style', base); });
    });

    // 2) 스크롤 리빌
    var reveals = document.querySelectorAll('[data-reveal]');
    if (reveals.length) {
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
          });
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
        reveals.forEach(function (el) { io.observe(el); });
      } else {
        reveals.forEach(function (el) { el.classList.add('is-visible'); });
      }
    }

    // 3) 모바일 네비 토글
    var nav = document.querySelector('.onvi-nav');
    if (nav) {
      var toggle = nav.querySelector('.onvi-nav-toggle');
      if (toggle) toggle.addEventListener('click', function () { nav.classList.toggle('open'); });
      nav.querySelectorAll('.onvi-mobile-panel a').forEach(function (a) {
        a.addEventListener('click', function () { nav.classList.remove('open'); });
      });
      window.addEventListener('resize', function () {
        if (window.innerWidth > 880) nav.classList.remove('open');
      });
    }

    // 3.5) FAQ 아코디언 — 버튼 다음 형제가 max-height:0 패널이면 클릭 시 토글
    document.querySelectorAll('button').forEach(function (btn) {
      var panel = btn.nextElementSibling;
      if (!panel || !/max-height:\s*0/.test(panel.getAttribute('style') || '')) return;
      var icon = btn.querySelector('span:last-child');
      btn.addEventListener('click', function () {
        var isOpen = panel.style.maxHeight && panel.style.maxHeight !== '0px';
        if (isOpen) {
          panel.style.maxHeight = '0px'; panel.style.opacity = '0';
          if (icon) icon.style.transform = 'none';
        } else {
          panel.style.maxHeight = panel.scrollHeight + 'px'; panel.style.opacity = '1';
          if (icon) icon.style.transform = 'rotate(45deg)';
        }
      });
    });

    // 3.8) Lottie 애니메이션 — [data-lottie="경로.json"] 요소에 자동 로드
    //      (shared/lottie.min.js 가 로드된 페이지에서만 동작; 없으면 조용히 건너뜀)
    if (window.lottie) {
      document.querySelectorAll('[data-lottie]').forEach(function (el) {
        if (el.dataset.lottieReady) return;
        el.dataset.lottieReady = '1';
        try {
          window.lottie.loadAnimation({
            container: el,
            renderer: 'svg',
            loop: el.getAttribute('data-lottie-loop') !== 'false',
            autoplay: el.getAttribute('data-lottie-autoplay') !== 'false',
            path: el.getAttribute('data-lottie')
          });
        } catch (e) {}
      });
    }

    // 4) 상담 배너
    var consult = document.querySelector('.onvi-consult');
    if (consult) {
      var dismissed = false;
      try { dismissed = sessionStorage.getItem('onvi_consult_dismissed') === '1'; } catch (e) {}
      if (dismissed) {
        consult.parentNode && consult.parentNode.removeChild(consult);
      } else {
        var threshold = function () { return Math.max(400, (window.innerHeight || 800) * 0.7); };
        var onScroll = function () {
          var past = window.scrollY > threshold();
          var nearEnd = false;
          var marker = document.querySelector('[data-hide-consult]');
          if (marker) nearEnd = marker.getBoundingClientRect().top < (window.innerHeight || 800) * 0.85;
          consult.classList.toggle('show', past && !nearEnd);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        onScroll();
        var x = consult.querySelector('.onvi-consult-x');
        if (x) x.addEventListener('click', function () {
          try { sessionStorage.setItem('onvi_consult_dismissed', '1'); } catch (e) {}
          consult.classList.remove('show');
          setTimeout(function () { consult.parentNode && consult.parentNode.removeChild(consult); }, 400);
        });
      }
    }
  });
})();
