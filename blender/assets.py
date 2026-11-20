"""מוריד נכסים חופשיים (CC0) מ-Poly Haven אל blender/assets/: טקסטורות PBR, נברשות, עציצים ושמיים (HDRI).
python assets.py   (התיקייה לא נשמרת ב-git, ואפשר להוריד אותה מחדש בכל רגע)
"""
import json, os, urllib.request
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, "assets")
TEX = ["marble_01", "herringbone_parquet", "dark_wood", "lacquered_cherry_wood", "painted_plaster_wall",
       "concrete", "concrete_floor_01", "fabric_leather_02", "velour_velvet", "brushed_concrete"]
MODELS = ["Chandelier_01", "Chandelier_03", "potted_plant_02", "potted_plant_04", "book_encyclopedia_set_01"]
HDRI = "kloofendal_48d_partly_cloudy_puresky"
def get(url, path):
    if os.path.exists(path): return
    os.makedirs(os.path.dirname(path), exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": "courthouse-blockout/1.0"})
    with urllib.request.urlopen(req, timeout=120) as r, open(path, "wb") as f: f.write(r.read())
def files(aid):
    req = urllib.request.Request(f"https://api.polyhaven.com/files/{aid}", headers={"User-Agent": "courthouse-blockout/1.0"})
    return json.load(urllib.request.urlopen(req, timeout=60))
for t in TEX:
    f = files(t)
    for key, name in (("Diffuse", "diff"), ("Rough", "rough"), ("nor_gl", "nor")):
        if key in f: get(f[key]["1k"]["jpg"]["url"], os.path.join(OUT, "tex", t, name + ".jpg"))
    print("tex", t)
for m in MODELS:
    g = files(m)["gltf"]["1k"]["gltf"]; d = os.path.join(OUT, "models", m)
    get(g["url"], os.path.join(d, m + ".gltf"))
    for rel, inc in g.get("include", {}).items(): get(inc["url"], os.path.join(d, rel))
    print("model", m)
get(files(HDRI)["hdri"]["2k"]["hdr"]["url"], os.path.join(OUT, "sky.hdr")); print("hdri", HDRI)
