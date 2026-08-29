/* On:Vi — Supabase 연결 설정
 * 배포 시 아래 두 값만 채우면 상담 신청·회원가입 데이터가 Supabase에 적재됩니다.
 * 값이 비어 있으면 데모 모드로 동작하고 화면 흐름은 그대로 유지됩니다.
 * (anon key는 공개용 키입니다. service_role 키는 절대 넣지 마세요.)
 */
/* 2026-08-29 schema.sql 실행 완료 → 적재 모드로 전환.
 * 여기 키는 공개용 publishable 키다. shared/onvi-auth.js 가 쓰는 값과 같다.
 * service_role 키는 절대 넣지 않는다 — 이 파일은 브라우저로 그대로 내려간다. */
window.ONVI_SUPABASE = {
  url: 'https://aiefwvnpmahdcsgdecca.supabase.co',
  anonKey: 'sb_publishable_ek5lBo6JGswGGFCjatIrCw_FtnrmdNz',
  termsVersion: 'privacy-2026-08'
};
