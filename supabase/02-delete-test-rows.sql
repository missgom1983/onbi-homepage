-- ============================================================
-- 연동 검증 중 넣은 테스트 행 삭제 (2026-08-29)
--
-- 적재가 되는지 확인하려고 REST 로 2건을 넣었다.
-- anon 키로는 삭제 권한이 없어 여기 남겨 둔다.
-- SQL Editor 에 붙여넣고 Run 하면 정리된다.
-- ============================================================

-- 먼저 무엇이 지워질지 확인 (이것만 실행해 봐도 된다)
-- select id, name, phone, created_at
-- from public.consult_requests
-- where phone in ('010-0000-0000', '010-1111-2222');

-- 실제 삭제 — consents 는 consult_id 외래키가 on delete cascade 라 함께 지워진다
delete from public.consult_requests
where phone in ('010-0000-0000', '010-1111-2222');

-- 남은 행 확인 (실제 신청이 없다면 0 이어야 한다)
select count(*) as remaining from public.consult_requests;
