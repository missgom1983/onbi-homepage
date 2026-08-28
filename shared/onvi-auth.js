/* On:Vi 카카오 로그인 (Supabase Auth) — "로그인부터" v1 (2026-08)
   - 카카오 버튼([data-onvi-login]) → Supabase signInWithOAuth('kakao')
   - 로그인 성공 → 홈(/).  (family_members 분기는 온보딩 준비 후 켠다)
   - 세션을 nav용 localStorage(onvi.onboarded / onvi.user.name / onvi.user.provider)로 미러링 → 기존 nav paint()가 회원 UI로 전환
   - 로그아웃(#navLogout)은 Supabase 세션까지 종료
   ⚠️ 여기 anon 자리에는 신형 publishable 키(sb_publishable_…)를 그대로 넣는다. */
(function () {
  var SUPABASE_URL = 'https://aiefwvnpmahdcsgdecca.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_ek5lBo6JGswGGFCjatIrCw_FtnrmdNz';
  var ONBOARDING_READY = false; // /onboarding/family 준비되면 true 로 바꾼다

  function boot() {
    if (!(window.supabase && window.supabase.createClient)) { return setTimeout(boot, 60); }
    var client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' }
    });

    function nameOf(user) {
      var m = (user && user.user_metadata) || {};
      return m.name || m.full_name || m.nickname || m.preferred_username || (user && user.email) || '온비 가족';
    }
    function mirror(session) {
      try {
        if (session && session.user) {
          localStorage.setItem('onvi.onboarded', '1');
          localStorage.setItem('onvi.user.name', nameOf(session.user));
          localStorage.setItem('onvi.user.provider', 'kakao');
        } else {
          localStorage.removeItem('onvi.onboarded');
          localStorage.removeItem('onvi.user.name');
          localStorage.removeItem('onvi.user.provider');
        }
      } catch (e) { /* 무시 */ }
      try { window.dispatchEvent(new Event('onvi-auth')); } catch (e) {}
    }

    // 로그인 직후에만 실행 (pendingLogin 플래그로 일반 로드와 구분)
    function routeAfterLogin() {
      // 로그인 전에 하던 일(예: 상담 신청)이 있으면 그 화면으로 돌려보낸다.
      // 열린 리다이렉트가 되지 않도록 같은 출처의 경로만 받는다.
      var back = '';
      try { back = sessionStorage.getItem('onvi.after_login') || ''; } catch (e) { /* 무시 */ }
      if (back) {
        try { sessionStorage.removeItem('onvi.after_login'); } catch (e) { /* 무시 */ }
        if (/^\/(?!\/)/.test(back)) { location.replace(back); return; }
      }
      if (!ONBOARDING_READY) { if (location.pathname !== '/') location.replace('/'); return; }
      client.from('family_members').select('id').limit(1).then(function (r) {
        var has = r && r.data && r.data.length > 0;
        location.replace(has ? '/' : '/onboarding/family');
      }, function () { location.replace('/'); });
    }

    function bindLoginButtons() {
      Array.prototype.forEach.call(document.querySelectorAll('[data-onvi-login]'), function (b) {
        if (b.__onviBound) return; b.__onviBound = 1;
        b.addEventListener('click', function (e) { e.preventDefault(); OnViAuth.signInKakao(); });
      });
    }
    function bindLogout() {
      var lo = document.getElementById('navLogout');
      if (lo && !lo.__onviBound) {
        var c = lo.cloneNode(true); c.__onviBound = 1;      // 기존 인라인 핸들러 제거 후 재바인딩
        lo.parentNode.replaceChild(c, lo);
        c.addEventListener('click', function (e) { e.preventDefault(); OnViAuth.signOut(); });
      }
    }

    window.OnViAuth = {
      client: client,
      signInKakao: function () {
        try { sessionStorage.setItem('onvi.pendingLogin', '1'); } catch (e) {}
        client.auth.signInWithOAuth({ provider: 'kakao', options: { redirectTo: location.origin + '/' } });
      },
      signOut: function () {
        var go = function () { mirror(null); location.href = '/'; };
        try { var p = client.auth.signOut(); (p && p.then) ? p.then(go, go) : go(); } catch (e) { go(); }
      }
    };

    // 초기 세션 + OAuth 복귀 처리
    client.auth.getSession().then(function (res) {
      var session = res && res.data ? res.data.session : null;
      mirror(session);
      var pending = false;
      try { pending = sessionStorage.getItem('onvi.pendingLogin') === '1'; } catch (e) {}
      if (session && pending) {
        try { sessionStorage.removeItem('onvi.pendingLogin'); } catch (e) {}
        routeAfterLogin();
      }
    });
    client.auth.onAuthStateChange(function (event, session) {
      mirror(session);
      if (event === 'SIGNED_IN') {
        var pending = false;
        try { pending = sessionStorage.getItem('onvi.pendingLogin') === '1'; } catch (e) {}
        if (pending) { try { sessionStorage.removeItem('onvi.pendingLogin'); } catch (e) {} routeAfterLogin(); }
      }
    });

    bindLoginButtons(); bindLogout();
    document.addEventListener('DOMContentLoaded', function () { bindLoginButtons(); bindLogout(); });
  }
  boot();
})();
