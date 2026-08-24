# 온비 배포 워크플로 (버전 올릴 때마다 이대로)

디자인 도구(`온비_vX.Y.Z/`)는 **index·brand만 완성 .html**로 뽑고, 나머지는 `.dc.html`(React 템플릿)만 준다.
아래 순서 + 검증 스크립트로 매번 동일하게 처리한다. **배포 전 `verify.py`가 0건이어야 배포.**

## 0. 새 소스 받으면 먼저
```
diff -rq 온비_v<이전>/ 온비_v<신규>/ | grep -v 'screenshots\|uploads\|.thumbnail'
```
→ 실제로 바뀐 `.dc.html`/데이터만 파악한다. (대부분 소수 파일만 바뀜)

## 1. 페이지별 반영 규칙
- **index·brand**: 도구 컴파일본을 승격하되 반드시 치환 —
  `_ds/on-vi-design-system-3a95f1fd…/`→`shared/ds`, `*.dc.html`→소문자 `*.html`,
  `assets/photos/*.png`→`.jpg`(없으면 `sips -Z 1600 -s format jpeg -s formatOptions 74 src.png --out out.jpg`).
  단 **컴파일본은 소스보다 stale할 수 있음** → `Home.dc.html`/`Brand.dc.html` 소스와 대조(특히 KV·2번째 섹션).
- **service·pricing·기타(.dc만)**: 헤드리스 렌더 → 잔재 제거 → index chrome 이식.
  헤드리스: `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --no-sandbox --virtual-time-budget=10000 --dump-dom http://127.0.0.1:PORT/X.dc.html`
  (로컬 서버는 `온비_vX/`에서 띄워 `_ds`·support.js 해석되게)
- **편지 모달(service)**: 카드에 `data-letter-seg="B/C/E/G"` + `<div id="letterModalRoot"></div>` + `shared/letters-v6.js`·`shared/letter-ui.js` include. 데이터(greeting/ps 등)는 `LetterCard.dc.html` 변경 시 `letters-v6.js` 교체 + `letter-ui.js` renderCard 갱신.
- **KV 영상(index)**: `assets/video/*.mp4` ffmpeg 최적화(`-crf 30 -an -movflags +faststart`), cut2는 편지읽기까지만(8.4s) 트림. 크로스페이드는 `ended` 이벤트 기반 무한 루프(도착→읽기→도착…), `loop` 속성 금지(ended 안 뜸).

## 2. 필수 패치 체크리스트 (verify.py가 자동 검사)
- `{{ }}`·`data-dc-tpl`·`sc-host`·`sc-interp` 잔재 0
- `.dc.html` 링크 0, `assets/photos/*.png` 참조 0(.jpg만)
- 로그인 GNB(`onvi-nav-root`) O, 구 pill 네비 X
- `.stack` 래퍼 O(히어로는 밖), `<section class="ov-rv">` **하드코딩 금지**(리빌 스크립트가 추가) — 있으면 위쪽 섹션이 영원히 투명
- 메인 `<style>`에 `[hidden]{ display:none !important; }`
- 푸터 면책 문구, div 균형, 참조 이미지 200

## 3. 배포
```
python3 _tools/verify.py            # 로컬 검증(0건 확인) + _tools/shots/ 스크린샷 육안 확인
git add -A && git commit -m "..." && git push
npx wrangler deploy
python3 _tools/verify.py --live     # 라이브 재검증
```
- `.assetsignore`: 한글 아카이브 폴더는 **ASCII 글롭 `*v3.4*`**로 제외(NFD/NFC 때문에 한글 리터럴 매칭 실패).
- 배포는 `assets.directory="."`라 루트 전체 스캔 → 아카이브 폴더 제외 안 하면 정지/누출.

자세한 배경은 메모리 `onbi-homepage-deploy.md` 참고.
