# Supabase 연동 인수인계 — 2026-08-29

웹사이트 배포는 끝났다. **남은 일은 DB 스키마 생성과 설정값 입력 두 가지뿐이다.**

---

## 1. 지금 상태

| 항목 | 상태 |
|---|---|
| onvi.kr 배포 | ✅ 완료 (v3.5.1, 라이브 검증 0건) |
| git | ✅ `62a9d13`, 워킹트리 클린, origin 동기화됨 |
| 예전 테이블 7개 | ✅ 삭제 완료 (elders·families·family_members·payments·pilot_applications·subscriptions·waitlist) |
| **새 테이블 11개** | ❌ **0/11 — 아직 안 만들어짐** |
| `shared/onvi-config.js` | ⏸ 비어 있음 = 데모 모드 (화면은 정상, 데이터 미적재) |

Supabase 프로젝트: `aiefwvnpmahdcsgdecca`
대시보드: https://supabase.com/dashboard/project/aiefwvnpmahdcsgdecca

---

## 2. 남은 작업

### 작업 A — `supabase/schema.sql` 실행 (필수, 선행)

이 저장소의 `supabase/schema.sql`(288줄)을 Supabase에서 1회 실행한다.
테이블 11개가 만들어진다: `profiles` `consents` `consult_requests` `households`
`household_members` `household_invites` `parents` `parent_addresses`
`applications` `retention_notices` `admin_users`

**주의: `create table`에 `if not exists`가 없다.** 실패하면 중간까지만 만들어진
상태일 수 있으니, 재시도 전에 무엇이 생겼는지 먼저 확인할 것.

### 작업 B — 설정값 입력 후 재배포

`shared/onvi-config.js`의 빈 두 값을 채운다.

```js
window.ONVI_SUPABASE = {
  url: 'https://aiefwvnpmahdcsgdecca.supabase.co',
  anonKey: '<Project Settings → API → anon public 키>',
  termsVersion: 'privacy-2026-08'
};
```

- **service_role 키를 넣지 말 것.** 공개 번들에 포함된다.
- 그 다음 `npx wrangler deploy` → `python3 _tools/verify.py --live`

---

## 3. 검증 방법

작업 A 후, 터미널에서 아래를 실행하면 로그인 없이 확인된다.

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

11개가 전부 `200`이면 성공. `404`는 아직 없는 것.

작업 B 후에는 onvi.kr 요금제 페이지에서 실제로 상담 신청을 제출하고,
`consult_requests`에 행이 쌓이는지 확인한다.

---

## 4. 실행 수단 (아무거나 하나)

브라우저 SQL Editor에 288줄을 붙여넣는 게 반복해서 실패했다. 대안:

**(a) 터미널에서 직접 — 가장 확실**
Supabase → `Project Settings` → `Database` → `Connection string` → `URI` 탭의
주소(비밀번호 포함)가 있으면 아래로 끝난다.

```bash
psql "<연결주소>" -f supabase/schema.sql
```

`psql`이 없으면 `brew install libpq` 후
`/opt/homebrew/opt/libpq/bin/psql` 사용.

**(b) Supabase CLI**

```bash
npm i -g supabase
supabase login
supabase link --project-ref aiefwvnpmahdcsgdecca
supabase db push          # 또는 psql 방식
```

**(c) 브라우저 SQL Editor**
https://supabase.com/dashboard/project/aiefwvnpmahdcsgdecca/sql/new
편집창을 비우고 `schema.sql` 전체를 붙여넣은 뒤 Run.

---

## 5. 알아둘 것

- **구독·결제 테이블이 없다.** 삭제한 `subscriptions`·`payments`에 대응하는 게
  `schema.sql`에 없다. 결제 기능을 붙일 때 따로 설계해야 한다.
- `supabase/00-cleanup-before-schema.sql`, `01-drop-legacy-tables.sql`은
  **이미 실행 완료**했다. 다시 돌릴 필요 없다.
- `supabase/` 폴더는 `.assetsignore`에 있어 웹에 배포되지 않는다.
- 설정이 비어 있으면 `OnViDB.ready()`가 false를 반환해 화면 흐름만 돌고
  데이터는 쌓이지 않는다(데모 모드). 지금이 그 상태다.
