"""מוסיף שמות חדרים בעברית ומקרא צבעים על רנדר: python labels.py VIEW [TITLE]"""
import sys, os, json
from PIL import Image, ImageDraw, ImageFont, features
HERE = os.path.dirname(os.path.abspath(__file__))
view = sys.argv[1]; title = sys.argv[2] if len(sys.argv) > 2 else ""
base = os.path.join(HERE, "..", "renders", view)
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
RAQM = features.check("raqm")
def rtl(s):  # PIL without raqm draws left-to-right: reverse Hebrew runs, keep digits/latin in order
    if RAQM: return s
    import re
    parts = re.split(r'([0-9A-Za-z\-\.]+)', s)
    return "".join(p if re.match(r'^[0-9A-Za-z\-\.]+$', p) else p[::-1] for p in reversed(parts))
def text(d, xy, s, f, fill="black", anchor="mm", stroke=3):
    kw = dict(direction="rtl") if RAQM else {}
    d.text(xy, rtl(s), font=f, fill=fill, anchor=anchor, stroke_width=stroke, stroke_fill="white", **kw)
im = Image.open(base + ".png").convert("RGB"); d = ImageDraw.Draw(im)
W = im.width; f = ImageFont.truetype(FONT, max(12, W // 95)); fb = ImageFont.truetype(FONT, max(18, W // 45))
if os.path.exists(base + ".labels.json"):
    for L in json.load(open(base + ".labels.json", encoding="utf-8")):
        lines = L["text"].split("|")
        for i, ln in enumerate(lines):
            text(d, (L["px"], L["py"] + (i - (len(lines) - 1) / 2) * f.size * 1.15), ln, f)
if title:
    text(d, (W // 2, fb.size), title, fb, stroke=4)
if view.startswith("plan") or view == "aerial":
    legend = [("ציבור", (242, 217, 140)), ("בידוק", (242, 140, 64)), ("אולם דיונים", (153, 191, 242)),
              ("שופטים", (191, 89, 102)), ("לשכת עורכי הדין", (115, 191, 115)), ("מאובטח / משמר", (140, 140, 153)),
              ("פריט קיים במשחק", (230, 115, 13))]
    y = im.height - 30 * len(legend) - 10
    for name, col in legend:
        d.rectangle((W - 40, y, W - 16, y + 22), fill=col, outline="black")
        text(d, (W - 50, y + 11), name, f, anchor="rm"); y += 30
im.save(base + ".png"); print("labeled", base + ".png")
