# -*- coding: utf-8 -*-
"""逐帧 seek → 截图 → 管道进 ffmpeg。画面是 t 的纯函数，所以可以只渲一段、只截几帧、乱序截。

  python render.py <工程>                       全片 → <工程>/renders/raw.mp4（无声）
  上游 --jobs 并行覆盖／清理流程在本项目禁用；只接受显式片段输出。
  python render.py <工程> --stills 2.5 8.5 21   只截几帧 → <工程>/review/s_0002.50.png
  python render.py <工程> --sheet 16            全片均匀取 16 帧拼一张 → review/sheet.jpg（开工后先看这个，再渲染）
  python render.py <工程> --sheet 3.5 9 21.5    指定时刻拼一张
  python render.py <工程> --motion 8.2 10.6     一段时间里均匀取 12 帧拼一张 → review/motion_8.2-10.6.jpg（看转场、看动作；后面可以再跟帧数）
  python render.py <工程> --clip 0 12 [名字]    只渲一段 → renders/<名字或_clip>.mp4
  python render.py <工程> --events              导出音效事件表 → audio/events.json（给 audio.py）
  python render.py <工程> --det                 确定性自检：同一批时刻乱序再截一遍，逐字节比
  python render.py <工程> --serve               起本地预览：浏览器开 http://127.0.0.1:8765/?play（←/→ 无，改完刷新）

工程目录里只需要 index.html + film.js。引擎（vk.js、vk-kit.js、fonts/）留在本文件所在目录，
由内置的小服务器挂到 /engine/ 下 —— 不用往每个工程里拷 40MB 字体，也没有 file:// 的跨目录字体限制。
"""
import base64, hashlib, http.server, io, json, math, os, random, subprocess, sys, threading
from pathlib import Path
from urllib.parse import unquote, urlsplit

ENGINE = Path(__file__).resolve().parent

class Handler(http.server.SimpleHTTPRequestHandler):
    proj = None
    def translate_path(self, path):
        p = unquote(urlsplit(path).path)
        root = ENGINE if p.startswith("/engine/") else self.proj
        relative = p[len("/engine/"):] if root == ENGINE else p.lstrip("/") or "index.html"
        target = (root / relative).resolve()
        allowed = {".html", ".js", ".ttf", ".txt", ".png", ".jpg", ".json", ".mp4"}
        if not target.is_relative_to(root.resolve()) or target.suffix.lower() not in allowed:
            return str(root / "__not_served__")
        return str(target)
    def do_GET(self):
        if self.path.startswith("/favicon"): self.send_response(204); self.end_headers(); return
        super().do_GET()
    def end_headers(self):
        self.send_header("Cache-Control", "no-store"); super().end_headers()
    def log_message(self, *a): pass

def serve(proj, port=0):
    h = type("H", (Handler,), {"proj": proj})
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", port), h)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, f"http://127.0.0.1:{srv.server_address[1]}/"

def open_page(p, url):
    # 关掉 LCD 次像素抗锯齿（跳着 seek 字边不抖）；每帧等合成器跑完再截；固定 sRGB
    chrome = os.environ.get("VIBE_CHROME")
    launch = {"executable_path": chrome} if chrome else {"channel": "chrome"}
    b = p.chromium.launch(**launch, args=["--disable-gpu", "--disable-accelerated-2d-canvas", "--disable-lcd-text", "--run-all-compositor-stages-before-draw", "--force-color-profile=srgb"])
    pg = b.new_page(viewport={"width": 1920, "height": 1080}, device_scale_factor=1)
    pg.on("console", lambda m: m.type in ("error", "warning") and print("[page]", m.text))
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(url)
    pg.wait_for_function("window.READY === true", timeout=180000)
    if errors: raise RuntimeError("; ".join(errors))
    return b, pg

def shot(pg, t):
    # Export the authored Canvas directly, avoiding browser chrome/compositor timing.
    encoded = pg.evaluate("""t => { seek(t); return document.getElementById('stage')
        .toDataURL('image/png').split(',')[1]; }""", t)
    return base64.b64decode(encoded)

def with_page(proj, fn):
    from playwright.sync_api import sync_playwright
    srv, url = serve(proj)
    try:
        with sync_playwright() as p:
            b, pg = open_page(p, url)
            try: return fn(pg)
            finally: b.close()
    finally: srv.shutdown()

def stills(proj, ts):
    review_dir(proj).mkdir(parents=True, exist_ok=True)
    def go(pg):
        for t in ts: (review_dir(proj) / f"s_{t:07.2f}.png").write_bytes(shot(pg, t))
    with_page(proj, go); print("stills:", len(ts))

def sheet(proj, args, name="sheet"):
    from PIL import Image, ImageDraw, ImageFont
    review_dir(proj).mkdir(parents=True, exist_ok=True)
    def go(pg):
        end = pg.evaluate("END")
        ts = [float(x) for x in args] if len(args) > 1 else [round((i + .5) * end / int(args[0] if args else 16), 2) for i in range(int(args[0] if args else 16))]
        cols = 4 if len(ts) > 6 else 2 if len(ts) > 1 else 1; tw = 1920 // cols; th = tw * 9 // 16
        out = Image.new("RGB", (cols * tw, -(-len(ts) // cols) * th), (20, 20, 20)); d = ImageDraw.Draw(out)
        try: font = ImageFont.truetype(str(ENGINE / "fonts/JetBrainsMono.ttf"), 18)
        except Exception: font = ImageFont.load_default()
        for i, t in enumerate(ts):
            im = Image.open(io.BytesIO(shot(pg, t))).convert("RGB").resize((tw, th), Image.LANCZOS)
            x, y = (i % cols) * tw, (i // cols) * th; out.paste(im, (x, y))
            d.rectangle([x, y + th - 24, x + 78, y + th], fill=(0, 0, 0)); d.text((x + 5, y + th - 22), f"{t:.2f}", font=font, fill=(255, 230, 0))   # 时间标在左下角，不挡左上的年份 / 章节标
        out.save(review_dir(proj) / f"{name}.jpg", quality=90); print("sheet:", review_dir(proj) / f"{name}.jpg", len(ts))
    with_page(proj, go)

def frames(proj, out, a=0.0, b=None):
    if out.exists(): raise FileExistsError(f"Refusing to overwrite {out}")
    def go(pg):
        end, fps = pg.evaluate("END"), pg.evaluate("FPS")
        bb = end if b is None else min(b, end)
        if not math.isfinite(a) or not math.isfinite(bb) or not 0 <= a < bb:
            raise ValueError("Invalid clip interval")
        ff = subprocess.Popen(["ffmpeg", "-v", "error", "-n", "-f", "image2pipe", "-c:v", "png", "-framerate", str(fps), "-i", "-",
                               "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "14", "-preset", "medium", "-movflags", "+faststart", str(out)], stdin=subprocess.PIPE)
        n0, n1 = round(a * fps), round(bb * fps)
        for i in range(n0, n1):
            ff.stdin.write(shot(pg, i / fps))
            if (i - n0) % 150 == 0: print(f"  {i - n0}/{n1 - n0}", flush=True)
        ff.stdin.close()
        if ff.wait() != 0: raise RuntimeError("ffmpeg encoding failed")
        print("done", out, f"{bb - a:.2f}s")
    with_page(proj, go)

def events(proj):
    (proj / "audio").mkdir(exist_ok=True)
    def go(pg):
        ev = pg.evaluate("events()"); m = pg.evaluate("({end: END, fps: FPS, meta: META})")
        json.dump({"end": m["end"], "fps": m["fps"], "meta": m["meta"], "events": ev}, open(proj / "audio/events.json", "w", encoding="utf-8"), ensure_ascii=False)
        print("events:", len(ev))
    with_page(proj, go)

def det(proj, n=12):
    def go(pg):
        end = pg.evaluate("END"); r = random.Random(7); ts = [round(r.uniform(0, end), 3) for _ in range(n)]
        h1 = {t: hashlib.md5(shot(pg, t)).hexdigest() for t in ts}
        order = ts[:]; r.shuffle(order)
        bad = [t for t in order if hashlib.md5(shot(pg, t)).hexdigest() != h1[t]]
        print("deterministic" if not bad else f"NOT deterministic at {bad} —— 有东西在跨帧存状态或用了 Math.random()")
        if bad: raise RuntimeError(f"Non-deterministic frames: {bad}")
    with_page(proj, go)

def review_dir(proj):
    label = os.environ.get("VIBE_REVIEW", "review")
    if not label.replace("-", "").replace("_", "").isalnum(): raise ValueError("Invalid review label")
    return proj / label

if __name__ == "__main__":
    a = sys.argv[1:]
    if not a: sys.exit(__doc__)
    proj = Path(a[0]).resolve()
    if not (proj / "film.js").exists(): sys.exit(f"{proj} 里没有 film.js")
    (proj / "renders").mkdir(exist_ok=True)
    if "--serve" in a:
        srv, url = serve(proj, 8765); print("预览:", url + "?play", "（Ctrl+C 结束）")
        try: threading.Event().wait()
        except KeyboardInterrupt: pass
    elif "--stills" in a: stills(proj, [float(x) for x in a[a.index("--stills") + 1:]])
    elif "--sheet" in a: sheet(proj, a[a.index("--sheet") + 1:])
    elif "--motion" in a:
        i = a.index("--motion"); t0, t1 = float(a[i + 1]), float(a[i + 2]); n = int(a[i + 3]) if len(a) > i + 3 else 12
        sheet(proj, [repr(round(t0 + (t1 - t0) * k / (n - 1), 3)) for k in range(n)], f"motion_{t0:g}-{t1:g}")
    elif "--clip" in a:
        i = a.index("--clip"); name = a[i + 3] if len(a) > i + 3 else "_clip"
        if not name.replace("-", "").replace("_", "").isalnum(): sys.exit("Invalid clip filename")
        frames(proj, proj / f"renders/{name}.mp4", float(a[i + 1]), float(a[i + 2]))
    elif "--events" in a: events(proj)
    elif "--det" in a: det(proj)
    elif "--jobs" in a: sys.exit("Parallel overwrite workflow disabled; use uniquely named clips.")
    else: frames(proj, proj / "renders/raw.mp4")
