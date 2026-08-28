/* On:Vi — Supabase 연결 설정
 * 배포 시 아래 두 값만 채우면 상담 신청·회원가입 데이터가 Supabase에 적재됩니다.
 * 값이 비어 있으면 데모 모드로 동작하고 화면 흐름은 그대로 유지됩니다.
 * (anon key는 공개용 키입니다. service_role 키는 절대 넣지 마세요.)
 */
/* 2026-08-29 현재 비워 둔 이유 — supabase/schema.sql 이 아직 실행되지 않았다.
 * 프로젝트에 존재하는 테이블은 profiles·consents 둘뿐이고 consult_requests 는 없다.
 * 이 상태에서 값을 채우면 상담 신청이 insert 단계에서 실패한다.
 * SQL Editor 에서 schema.sql 을 1회 실행한 뒤 아래 두 값을 채우면 바로 적재된다. */
window.ONVI_SUPABASE = {
  url: '',      // 예: 'https://xxxxxxxx.supabase.co'
  anonKey: '',  // 예: 'sb_publishable_...'  (service_role 키 금지)
  termsVersion: 'privacy-2026-08'
};
