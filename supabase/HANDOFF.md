# Supabase 연동 — 완료 (2026-08-29)

**작업 A·B 모두 끝났다.** 이 문서는 기록용으로 남긴다.

---

## 결과

| 항목 | 상태 |
|---|---|
| onvi.kr 배포 | ✅ v3.5.1, 라이브 검증 0건 |
| 예전 테이블 7개 | ✅ 삭제 완료 |
| 새 테이블 11개 | ✅ 생성 완료 |
| `shared/onvi-config.js` | ✅ 값 입력됨 = **적재 모드** |
| 상담 신청 → `consult_requests` | ✅ REST 로 201 확인 |
| 동의 이력 → `consents` | ✅ REST 로 201 확인 |

Supabase 프로젝트: `aiefwvnpmahdcsgdecca`

---

## 진행 중 잡은 버그 (중요)

`saveConsult` 가 insert 후 `.select('id')` 로 결과를 되받고 있었다.
그런데 `consult_requests` 는 스키마상 **읽기가 '관리자 또는 본인'만** 허용이라
익명·비정상 세션에서는 RLS(42501)에 막힌다.

증상은 고약했다 — **행은 저장되는데 화면에는 "신청이 접수되지 않았어요"** 가 뜬다.
사용자는 실패한 줄 알고 다시 누르고, 중복 신청이 쌓인다.

수정: id 를 클라이언트에서 만들어 함께 넣고 되받지 않는다. 그 id 로
`consents.consult_id` 를 잇는다. `crypto.randomUUID` 가 없는 환경도 대비했다.

---

## 남은 일

### 1. 테스트 행 삭제 (선택)

검증하느라 넣은 2건이 `consult_requests` 에 남아 있다.
`supabase/02-delete-test-rows.sql` 을 SQL Editor 에서 실행하면 정리된다.
(`consents` 는 cascade 로 함께 지워진다.)

### 2. 구독·결제 테이블 설계 (나중에)

삭제한 `subscriptions`·`payments` 에 대응하는 게 `schema.sql` 에 없다.
결제 기능을 붙일 때 따로 설계해야 한다.

### 3. 중복 신청 판정을 서버 기준으로 (나중에)

지금은 브라우저 로컬(`onvi.consult.v2.at`)로만 판정한다. 다른 기기·브라우저에서는
중복 신청이 가능하다. 같은 번호/사용자 기준 서버 검증으로 바꾸는 게 맞다.

---

## 확인 명령

```bash
URL="https://aiefwvnpmahdcsgdecca.supabase.co"
KEY="sb_publishable_ek5lBo6JGswGGFCjatIrCw_FtnrmdNz"
for t in profiles consents consult_requests households household_members \
         household_invites parents parent_addresses applications \
         retention_notices admin_users; do
  printf "%-20s %s\n" "$t" \
    "$(curl -s -o /dev/null -w '%{http_code}' "$URL/rest/v1/$t?select=*&limit=1" -H "apikey: $KEY")"
done
```

전부 `200` 이면 정상.

상담 신청 내역은 anon 키로 못 읽는다(설계상 맞다).
Supabase 대시보드 `Table Editor` → `consult_requests` 에서 확인한다.

---

## 실행 완료된 SQL 파일

- `00-cleanup-before-schema.sql` — 실행 완료
- `01-drop-legacy-tables.sql` — 실행 완료
- `schema.sql` — 실행 완료
- `02-delete-test-rows.sql` — **미실행** (위 '남은 일 1')
