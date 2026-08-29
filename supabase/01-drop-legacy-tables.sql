-- ============================================================
-- On:Vi — 예전 설계 테이블 정리 (schema.sql 실행 전 마지막 단계)
--
-- 대상 7개
--   elders · families · family_members · payments
--   pilot_applications · subscriptions · waitlist
--
-- 왜 지우는가
--   schema.sql 의 households · parents · household_members · applications 와
--   같은 개념이 두 벌로 겹친다. 두 벌을 함께 두면 나중에 어느 쪽에 데이터가
--   쌓였는지 알 수 없게 된다. 지금 배포된 코드는 schema.sql 쪽 이름을 쓴다.
--
-- ⚠️ 이 파일은 되돌릴 수 없다. 반드시 0단계를 먼저 실행해 0 인지 확인할 것.
--    (REST 로 본 0건은 RLS 에 가려진 값일 수 있어 근거로 삼지 않는다.)
--
-- 남는 숙제
--   subscriptions · payments 가 담당하던 구독·결제는 schema.sql 에 없다.
--   결제 기능을 붙일 때 따로 설계한다.
-- ============================================================


-- ── 0단계. 이것만 먼저 실행해서 전부 0 인지 확인한다 ─────────
-- select
--   (select count(*) from public.elders)             as elders,
--   (select count(*) from public.families)           as families,
--   (select count(*) from public.family_members)     as family_members,
--   (select count(*) from public.payments)           as payments,
--   (select count(*) from public.pilot_applications) as pilot_applications,
--   (select count(*) from public.subscriptions)      as subscriptions,
--   (select count(*) from public.waitlist)           as waitlist;


-- ── 1단계. 위가 전부 0 일 때만 아래를 실행한다 ───────────────
-- cascade 를 붙여 서로 참조하는 외래키까지 함께 정리한다.

drop table if exists public.payments cascade;
drop table if exists public.subscriptions cascade;
drop table if exists public.pilot_applications cascade;
drop table if exists public.waitlist cascade;
drop table if exists public.family_members cascade;
drop table if exists public.elders cascade;
drop table if exists public.families cascade;

-- 예전 설계가 만들었을 수 있는 타입도 이름이 겹치면 정리한다
-- (없으면 아무 일도 일어나지 않는다)
drop type if exists elder_status cascade;
drop type if exists subscription_status cascade;
drop type if exists payment_status cascade;

-- 여기까지 성공하면 schema.sql 전체를 새 쿼리로 실행한다.
