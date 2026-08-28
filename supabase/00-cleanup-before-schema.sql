-- ============================================================
-- On:Vi — schema.sql 실행 전 정리 스크립트
--
-- 왜 필요한가
--   schema.sql 의 create 문에는 "if not exists" 가 없다.
--   그런데 프로젝트에는 이미 profiles · consents 두 테이블이 있어서,
--   schema.sql 을 그대로 실행하면 20번째 줄에서 멈춘다.
--     ERROR: relation "profiles" already exists
--
--   게다가 기존 consents 는 지금 코드가 쓰는 구조와 완전히 다르다.
--   (user_id · kind · version · granted · channel · granted_at 이 전부 없다)
--   기존 profiles 도 email · relation · updated_at 이 빠져 있다.
--   즉 예전 설계의 잔재이므로, 비우고 새로 만드는 편이 맞다.
--
-- ⚠️ 실행 전 반드시 확인할 것
--   아래 0단계 쿼리로 두 테이블이 정말 비어 있는지 직접 확인한다.
--   0 이 아니면 이 스크립트를 실행하지 말고 먼저 알려줄 것.
--   (REST 로 확인한 0건은 RLS 때문에 가려진 값일 수 있어 신뢰하지 않는다.)
-- ============================================================


-- ── 0단계. 먼저 이것만 실행해서 0 인지 확인한다 ──────────────
-- select
--   (select count(*) from public.profiles) as profiles_rows,
--   (select count(*) from public.consents) as consents_rows;


-- ── 1단계. 위가 둘 다 0 일 때만 아래를 실행한다 ──────────────

-- 트리거와 함수 (schema.sql 이 다시 만든다)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- 기존 테이블 (비어 있음을 0단계에서 확인했을 것)
drop table if exists public.consents cascade;
drop table if exists public.profiles cascade;

-- ENUM 타입 — 예전 실행 때 만들어졌다면 이름이 충돌한다
drop type if exists onvi_relation cascade;
drop type if exists onvi_member_role cascade;
drop type if exists onvi_living cascade;
drop type if exists onvi_parent_consent cascade;
drop type if exists onvi_mode cascade;
drop type if exists onvi_consult_status cascade;
drop type if exists onvi_app_status cascade;
drop type if exists onvi_consent_kind cascade;

-- 여기까지 성공하면 schema.sql 전체를 새 쿼리로 실행한다.
