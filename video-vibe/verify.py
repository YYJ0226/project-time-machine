"""Offline artifact checks only; never opens a user website or authenticated app."""
import importlib.util
from pathlib import Path
import re

root = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("film_renderer", root / "engine/render.py")
renderer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(renderer)
handler = object.__new__(renderer.Handler)
handler.proj = root
for url in ["/../.env.local", "/%2e%2e/package.json", "/engine/../../package.json", "/.gitignore", "/engine/render.py"]:
    assert Path(handler.translate_path(url)).name == "__not_served__", url
assert Path(handler.translate_path("/")).name == "index.html"
assert Path(handler.translate_path("/film.js")).name == "film.js"

def inspect(pg):
    assert pg.evaluate("END === 300 && FPS === 30 && document.getElementById('stage').width === 1920 && document.getElementById('stage').height === 1080")
    subs = pg.evaluate("PTM_SUBTITLES")
    last = 0
    for sub in subs:
        sentence = re.sub(r"[{}!]", "", sub["zh"])
        assert 0 <= last <= sub["a"] < sub["b"] <= 294
        assert sub["b"]-sub["a"] >= 3
        assert len(sentence) <= 28
        width = pg.evaluate("""s => { const x=document.createElement('canvas').getContext('2d');
          x.font='400 41px "VK Serif"'; x.letterSpacing='4.92px'; return x.measureText(s).width; }""", sentence)
        assert width <= 1400, (sentence, width)
        last = sub["b"]
    for font in ['400 41px "VK Serif"', '400 32px "VK Sans"', '400 62px "VK Mono"']:
        assert pg.evaluate("font => document.fonts.check(font, '开发A3')", font), font
    assert len(subs) >= 50
    print("PASS:", len(subs), "subtitles, reading windows, widths, fonts, 1080p/30fps canvas contract")

renderer.with_page(root, inspect)
print("PASS: local server traversal and source-file boundaries")
