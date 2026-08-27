# RESUME — v3.4.4 운영배포 (진행 중)

> (이 파일은 `_tools/`라 git엔 남고 wrangler 배포엔 제외됨)

## ★ 진행: 전체 빌드 중 (fork)
- 툴 컴파일본(OnVi-Signup.html)은 **26MB 런타임 번들**이라 사용 불가로 판명 → signup은 **수작업**(사용자 승인).
- service·login: 검증된 파이프라인으로 빌드 완료(`scratchpad/service_new.html`·`login_new.html`).
- 나머지(pricing/contact 조건부 패널, signup 10화면 수작업, chrome 통일, verify)는 fork가 빌드 중.
- signup 화면 흐름: 일반 `[login,terms,family,parent,confirm,consent,schedule,done,invite]`, 초대 `[login,terms,joined]`. 완료 시 `onvi.onboarded='1'` 세팅(nav 게이트 연동).
- 완료 후 verify 0건 + 스크린샷 검수 → 사용자 확인 → 배포.

## (참고) 초기 대기 메모
파이프라인은 검증됨(아래). 페이지별 상황:
- **service, login**: 헤드리스 렌더로 완전 캡처 가능 → 내가 빌드. (login은 카카오버튼 단일)
- **pricing, contact, signup**: 조건부/다단계(sc-if 상태) 화면이라 렌더로 불가 → **툴 컴파일본 필요**.
  특히 **signup은 ~14개 상태머신**(isWelcome/isTerms/isConsent/isSchedule/isConfirm/isDone…), compile.py의 expand_signup(구 step1/step2)도 stale라 불가.
- 사용자 결정: **툴 컴파일본 export**(index/brand처럼) + **한 번에 모아서 배포**(부분배포 X).

### 사용자가 할 일 (디자인툴에서)
`signup`(가능하면 `pricing`, `contact`도) 을 index/brand처럼 **완성 .html로 컴파일 export** 해서 `온비_v3.4.4/` 안에 `signup.html`·`pricing.html`·`contact.html`(소문자)로 저장.

### 컴파일본 도착 후 내가 할 일
1. 각 컴파일본 승격: `_ds/on-vi-…/`→`shared/ds/`, `*.dc.html`→소문자, `assets/photos/*.png`→`.jpg`(pattern-* 제외). 잔재(`{{`,`data-dc-tpl`,`sc-host`,`sc-interp`,`ov-rv`/`ov-on` 하드코딩) 0 확인.
2. service·login: 검증된 렌더 파이프라인(`scratchpad/build344.py`)으로 빌드.
3. **전 페이지 chrome 통일 pass**(아래 chrome 2건) — 컴파일본의 툴 chrome을 배포 chrome으로 교체 + 자문 + nav 온보딩 게이트. 푸터 드리프트(2종)를 최신(index계열)으로 통일.
4. `python3 _tools/verify.py` 0건 + 스크린샷 육안 → 사용자 확인 → git push + wrangler deploy + `--live` 재검증.

### 검증된 렌더 파이프라인 (scratchpad/build344.py) — service/login용
헤드리스 렌더 → sc-host[Nav]끝~sc-host[Footer]앞 content 추출(sc-host[ConsultBanner] 제거) → 잔재제거(data-dc-tpl/data-sc-name/hint-*/sc-host/sc-interp, **ov-rv·ov-on 제거**) → 경로치환(png→jpg 전체, pattern-* 제외) → stack 인라인div→`class="stack"` → service 편지카드 `data-letter-seg=B,E,C,G`+`data-mode="preview"` → 배포 shell(nav_end~`<footer` 사이)에 splice. **v3.4.3 service 정확 재현 확인함.** login은 `.stack` 래퍼 수동 삽입 필요(렌더에 없음).

---
## (이하 기존 배경 정보)

## 현재 상태
- **배포 대상 파일(루트 `*.html`, `shared/`, `_tools/parts`)은 아무것도 안 바뀐 깨끗한 baseline.** 되돌릴 것 없음.
- `온비_v3.4.4/{index,brand,service}.html` 은 조사 중 compile.py 테스트로 생긴 부산물(소스 폴더 안, 배포 무관, 무시/삭제 가능).
- 백그라운드 빌드(fork)는 중단됨. 빌드 스크립트는 디스크에 안 남음 → 아래 계획대로 다시 빌드.

## 사용자 결정
- 범위: **전체 반영** (chrome 2건 + service/pricing/contact/login/signup 재빌드).
- 푸터: **`자문`만** (원민재 한국엔젤투자협회 → 원민재 자문). "멀리 있어도, 매일 곁에" 태그라인·도트색 변경은 **미반영**.
- 제외: `온비_v3.4.4/supabase/schema.sql`(백엔드 DB, 별도 적용), `Signup P1.dc.html`(시안).

## v3.4.4 실제 변경분 (v3.4.3 대비)
- **Nav.dc**: `onvi.onboarded` 플래그 없으면 회원 UI 숨김(가입 완료 전엔 로그아웃 취급). Signup이 이 플래그 세팅.
- **Footer.dc**: 원민재 → `자문` (+ 소스엔 태그라인·흰 도트도 있으나 **미반영 결정**).
- **콘텐츠 개편**: Service(81줄), Pricing(196줄), Contact(26줄), Login(74줄), **Signup(750줄, 카카오싱크 대개편)**.
- **Home.dc / Brand.dc / Support.dc / MyPage.dc: 변경 없음** → chrome만.

## ⚠️ 핵심 툴체인 사실 (반드시 기억)
- `_tools/compile.py` + `_tools/parts/` 는 **STALE**. 그대로 쓰면 **구 chrome으로 회귀**
  (parts: `nav-user`/`onvi-nav-hidden`, 배포본: `nav-avatar`/`nav-hide`). 새 pricing에서 크래시(`{{ included }}` vs 소스 `{{ inclShown }}`). **빌드에 compile.py 쓰지 말 것.**
- **배포본 = 헤드리스 렌더 + 잔재 제거 + 수기 chrome 이식.** 증거: 배포 service.html 인라인 `style=` ~310개(렌더 307개와 일치), `data-dc-tpl`/`sc-host` 0.
- 배포 푸터가 두 종류로 **드리프트**됨: index/service/pricing(md5 ca396de7) vs contact/login/signup(a6228945). 재빌드로 **최신(index계열)으로 통일** + 자문.

## 빌드 방법 — "배포 shell 재사용 + content만 교체" (최저 리스크)
각 콘텐츠 변경 페이지(service, pricing, contact, login, signup):
1. `온비_v3.4.4/`에 로컬 서버 띄우고(그래야 `_ds`·support.js·shared 해석) 헤드리스 렌더:
   `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --no-sandbox --virtual-time-budget=10000 --dump-dom http://127.0.0.1:PORT/<Page>.dc.html`
2. 렌더 DOM 구조: `<div id="dc-root"><div class="sc-host" data-sc-name="PAGE">` 안에 순서대로
   `sc-host[Nav]` → 콘텐츠(중간에 `sc-host[ConsultBanner]`) → `sc-host[Footer]`(footer 포함) → (service만)`sc-host[LetterModal]`.
3. content 추출 = `sc-host[Nav]` 끝 ~ `sc-host[Footer]` 시작 사이, `sc-host[ConsultBanner]` 블록 제거(균형 div 매칭).
4. 잔재 제거: `data-dc-tpl`, `data-sc-name`, `class="sc-host"`(언랩), `hint-*`, `data-screen-label`, `data-dc-*`/`data-sc-*`. 결과에 `{{`·`data-dc-tpl`·`sc-host`·`sc-interp` 0.
5. 경로 치환(= compile.py의 맵): `_ds/on-vi-design-system-3a95f1fd-6070-4b3f-8f35-51e5e83a250f/`→`shared/ds/`; `*.dc.html`→소문자 `*.html`; `assets/photos/<n>.png`→`.jpg`(없으면 `sips -Z 1600 -s format jpeg -s formatOptions 74 src.png --out out.jpg`). compile.py의 깨진 앵커 교정도.
6. 구조: 히어로 섹션은 `.stack` **밖**, 나머지는 `<div class="stack">` 안. **배포 현행 페이지와 대조**해 어떤 섹션 id가 어디 가는지·`ov-rv` 위치 맞춤. `<section class="ov-rv">` 하드코딩 금지(reveal.js가 추가).
7. **splice**: 현행 배포 `<Page>.html`을 shell로, nav 뒤~`<footer` 앞 content만 교체. head는 배포 shell 유지하되, 새 렌더의 페이지 고유 `<style>`이 바뀌었으면 그 부분 포팅.
8. service 편지모달: 카드에 `data-letter-seg="B/C/E/G"` + `letters-v6.js`·`letter-ui.js` + `#letterModalRoot`. LetterCard.dc는 v3.4.4에서 변경 없음 → 현행 유지.

## 검증 게이트 (파이프라인 신뢰 전 필수)
- 같은 파이프라인을 **`온비_v3.4.3/<Page>.dc.html`에 먼저 돌려** 현행 배포 content와 대조. 근접 일치해야 함(배포는 v3.4.2/3 산). 일치 후에야 v3.4.4를 루트에 씀.
- fork 마지막 힌트: **login/signup은 대개편이라 새 렌더의 `.stack` 될 컨테이너 div를 다시 찾아야 함.**

## chrome 2건 (9개 루트 페이지 전역, content와 별도로)
- 푸터: `원민재</b> 한국엔젤투자협회` → `원민재</b> 자문`. 두 푸터 변종을 최신(index계열)으로 통일 후 적용.
- Nav: 각 페이지 인라인 `<script>`의 paint 로직(`localStorage.getItem('onvi.user.name')`로 로그인/회원 토글)에 `onvi.onboarded` 체크 추가 — falsy면 `name=''`로 로그아웃 취급. `Nav.dc` v3.4.3↔v3.4.4 diff 참고.

## 배포 (verify 0건 후)
```
python3 _tools/verify.py          # 로컬 9페이지 렌더·검사·스크린샷, 문제 0건이어야
# 스크린샷 _tools/shots/ 육안 확인
git add -A && git commit -m "Deploy v3.4.4 (...)" && git push
npx wrangler deploy
python3 _tools/verify.py --live   # 라이브 재검증
```
- `.assetsignore`: 한글 아카이브는 ASCII 글롭 `*v3.4*`로 제외(NFD 이슈).
- **운영 push는 되돌리기 어려움 → 사용자에게 최종 확인 후 진행.**
