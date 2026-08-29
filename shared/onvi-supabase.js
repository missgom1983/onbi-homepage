/* On:Vi — Supabase 적재 헬퍼
 * 화면 코드는 window.OnViDB.saveConsult / saveSignup 두 함수만 씁니다.
 * 설정이 없으면 { skipped: true }를 돌려주고, 화면은 데모 흐름을 유지합니다.
 *
 * 필요 테이블: consult_requests, consents, profiles (supabase/schema.sql)
 */
(function () {
  var CFG = window.ONVI_SUPABASE || {};
  var VER = CFG.termsVersion || 'privacy-2026-08';
  var client = null;

  function ready() {
    return !!(CFG.url && CFG.anonKey && window.supabase && window.supabase.createClient);
  }

  function db() {
    if (!ready()) return null;
    if (!client) client = window.supabase.createClient(CFG.url, CFG.anonKey);
    return client;
  }

  // 오래된 사파리까지 고려해 randomUUID 가 없으면 직접 만든다
  function newId() {
    try {
      if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    } catch (e) { /* 무시 */ }
    var s = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
    return s.replace(/[xy]/g, function (ch) {
      var r = Math.random() * 16 | 0;
      return (ch === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  function nowUser() {
    var c = db();
    if (!c) return Promise.resolve(null);
    return c.auth.getUser().then(function (r) {
      return (r && r.data && r.data.user) ? r.data.user.id : null;
    }).catch(function () { return null; });
  }

  /* 상담 신청 — consult_requests + 동의 이력 */
  function saveConsult(p) {
    var c = db();
    if (!c) return Promise.resolve({ skipped: true });
    return nowUser().then(function (uid) {
      var row = {
        // id 를 여기서 정해 둔다. 상담 신청은 스키마상 '관리자 또는 본인'만 읽을 수 있어
        // insert 결과를 되받으려(select) 하면 RLS 에 막힌다. 되받지 않고 이 id 로 동의 이력을 잇는다.
        id: newId(),
        user_id: uid,
        name: p.name,
        phone: p.phone,
        email: p.email || null,
        message: [
          p.parentHonor ? ('부모님: ' + p.parentHonor) : '',
          p.slot ? ('통화 희망: ' + p.slot) : '',
          p.memo || ''
        ].filter(Boolean).join(' / ') || null,
        source: p.source || 'pricing_page',
        status: 'new'
      };
      return c.from('consult_requests').insert(row).then(function (res) {
        if (res.error) throw res.error;
        var consultId = row.id;
        var consents = [
          { consult_id: consultId, user_id: uid, kind: 'privacy_required', version: VER, granted: true, channel: 'web' }
        ];
        if (typeof p.marketing === 'boolean') {
          consents.push({ consult_id: consultId, user_id: uid, kind: 'marketing', version: VER, granted: p.marketing, channel: 'web' });
        }
        return c.from('consents').insert(consents).then(function () {
          return { ok: true, id: consultId };
        });
      });
    });
  }

  /* 회원가입 — profiles 갱신 + 약관/마케팅 동의 이력 */
  function saveSignup(p) {
    var c = db();
    if (!c) return Promise.resolve({ skipped: true });
    return nowUser().then(function (uid) {
      if (!uid) return { skipped: true, reason: 'no_session' };
      var prof = {
        id: uid,
        name: p.name,
        phone: p.phone || null,
        email: p.email || null,
        relation: p.relation || null,
        marketing_opt_in: !!p.marketing,
        updated_at: new Date().toISOString()
      };
      return c.from('profiles').upsert(prof).then(function (res) {
        if (res.error) throw res.error;
        var consents = [
          { user_id: uid, kind: 'privacy_required', version: VER, granted: true, channel: 'web' },
          { user_id: uid, kind: 'marketing', version: VER, granted: !!p.marketing, channel: 'web' }
        ];
        return c.from('consents').insert(consents).then(function () {
          return { ok: true, id: uid };
        });
      });
    });
  }

  window.OnViDB = { ready: ready, saveConsult: saveConsult, saveSignup: saveSignup };
})();
