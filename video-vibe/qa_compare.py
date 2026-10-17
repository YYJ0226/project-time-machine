"""QA contact sheet of our old prototype and new film, not a film asset."""
import argparse
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

p = argparse.ArgumentParser()
p.add_argument('old', type=Path)
p.add_argument('new', type=Path)
p.add_argument('output', type=Path)
a = p.parse_args()
if a.output.exists(): raise FileExistsError('Choose a new QA output')
old = Image.open(a.old).convert('RGB').crop((8, 112, 832, 574))
new = Image.open(a.new).convert('RGB')
sheet = Image.new('RGB', (1600, 520), '#070d17')
font = ImageFont.truetype(str(Path(__file__).parent/'engine/fonts/NotoSansSC-VF.ttf'), 27)
draw = ImageDraw.Draw(sheet)
for i, (im, label) in enumerate([(old, '旧：通用卡片概念原型'), (new, '新：真实需求与引用（组织示意）')]):
    sheet.paste(im.resize((780, 439), Image.Resampling.LANCZOS), (i*800+10, 65))
    draw.text((i*800+20, 15), label, font=font, fill='#dbe9ef')
a.output.parent.mkdir(parents=True, exist_ok=True)
sheet.save(a.output, quality=93)
