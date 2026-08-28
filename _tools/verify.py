#!/usr/bin/env python3
# 온비 배포 전 자동 검증 — 모든 페이지를 렌더·검사·스크린샷해서 이슈를 사전에 잡는다.
# 사용법: python3 _tools/verify.py            (로컬 8099 포트로 검증 + 스크린샷)
#        python3 _tools/verify.py --live      (라이브 onvi.kr 검증)
# 종료코드: 문제 0건이면 0, 있으면 1.
import os, re, sys, subprocess, http.server, socketserver, threading, functools, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
SHOTDIR = os.path.join(ROOT, "_tools", "shots")
os.makedirs(SHOTDIR, exist_ok=True)

PAGES = ["index", "brand", "service", "pricing", "support", "contact", "login", "signup", "mypage", "welcome"]
LIVE = "--live" in sys.argv

# 페이지별 필수 조건: (검사이름, 정규식 or 함수, 기대)  — 각 페이지 렌더 DOM에 대해
def check_page(name, html):
    issues = []
    # 프레임워크 잔재 (컴파일 실패 신호)
    if "{{" in html: issues.append("미치환 템플릿 {{ }} 남음")
    if "data-dc-tpl" in html or 'class="sc-host' in html or "sc-interp" in html:
        issues.append("프레임워크 잔재(data-dc-tpl/sc-host/sc-interp)")
    if ".dc.html" in html: issues.append(".dc.html 링크 남음(→.html 이어야)")
    if re.search(r'assets/photos/[A-Za-z0-9_-]+\.png', html):
        issues.append("assets/photos .png 원본 참조(→.jpg, 라이브 404 위험)")
    # 필수 chrome
    if "onvi-nav-root" not in html: issues.append("로그인 GNB(onvi-nav-root) 없음")
    if re.search(r'nav class="pill"', html): issues.append("구 pill 네비(상담신청) 발견")
    if 'class="stack"' not in html: issues.append(".stack 래퍼 없음(섹션 붙음)")
    # 면책
    if "응급 대응 서비스가 아" not in html and "의료 진단" not in html:
        issues.append("면책 문구 없음")
    # 금지어(면책 문구의 '응급' 제외하고 본문에 나오면)
    for word in ["모니터링", "무료 체험", "고독사", "치매 예방"]:
        if word in html: issues.append(f"금지어 '{word}'")
    return issues

def render(url):
    out = subprocess.run([CHROME, "--headless", "--disable-gpu", "--no-sandbox",
        "--virtual-time-budget=9000", "--dump-dom", url],
        capture_output=True, text=True, timeout=40)
    return out.stdout

def shot(url, path):
    subprocess.run([CHROME, "--headless", "--disable-gpu", "--no-sandbox", "--hide-scrollbars",
        "--window-size=1280,3400", "--virtual-time-budget=9000", f"--screenshot={path}", url],
        capture_output=True, timeout=40)

def http_code(url):
    try:
        r = subprocess.run(["/usr/bin/curl", "-sS", "-o", "/dev/null", "-w", "%{http_code}",
            "--max-time", "8", url], capture_output=True, text=True)
        return r.stdout.strip()
    except Exception:
        return "ERR"

def start_server(port):
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
    httpd = socketserver.TCPServer(("127.0.0.1", port), handler)
    httpd.RequestHandlerClass.log_message = lambda *a, **k: None
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd

def main():
    total = 0
    if LIVE:
        base = "https://onvi.kr"
        def pageurl(p): return base + ("/" if p == "index" else "/" + p)
        def asseturl(a): return base + "/" + a
    else:
        port = 8099
        try: httpd = start_server(port); time.sleep(0.5)
        except OSError: httpd = None  # 이미 떠있음
        base = f"http://127.0.0.1:{port}"
        def pageurl(p): return f"{base}/{p}.html"
        def asseturl(a): return f"{base}/{a}"

    print(f"=== 온비 배포 검증 ({'LIVE onvi.kr' if LIVE else '로컬'}) ===")
    for p in PAGES:
        url = pageurl(p)
        html = render(url)
        issues = check_page(p, html)
        # 정적 파일 div 균형(로컬만)
        if not LIVE and os.path.exists(f"{p}.html"):
            src = open(f"{p}.html", encoding="utf-8").read()
            if src.count("<div") != src.count("</div>"):
                issues.append(f"div 불균형 {src.count('<div')}/{src.count('</div>')}")
        # 참조 이미지 로드 확인
        for img in sorted(set(re.findall(r'assets/[A-Za-z0-9/_.-]+\.(?:jpg|jpeg|png|mp4|svg)', html)))[:20]:
            if http_code(asseturl(img)) not in ("200", "206"):
                issues.append(f"자산 로드 실패: {img}")
        # 스크린샷(로컬만)
        if not LIVE:
            shot(url, os.path.join(SHOTDIR, f"{p}.png"))
        mark = "✅" if not issues else "⚠️"
        print(f"  {mark} {p}: {'OK' if not issues else '; '.join(issues)}")
        total += len(issues)

    # 서비스 편지 모달 오픈(해시) 확인
    murl = pageurl("service") + "#letter=B&act=1"
    mhtml = render(murl)
    ok = mhtml.count("ovm-dlg") > 0
    print(f"  {'✅' if ok else '⚠️'} service 편지모달 오픈(#letter=B): {'열림' if ok else '안 열림'}")
    if not ok: total += 1

    print(f"\n=== 결과: 문제 {total}건 ===" + ("  스크린샷: _tools/shots/" if not LIVE else ""))
    return 1 if total else 0

if __name__ == "__main__":
    sys.exit(main())
