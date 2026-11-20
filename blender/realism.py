# שלב ריאליזם: טקסטורות PBR, שמיים, נברשות ועציצים מ-Poly Haven (CC0), דגלי ישראל, והכיתוב "צדק צדק תרדוף".
# מורץ מתוך build.py (exec), ומשתמש באובייקטים ובפונקציות שמוגדרים שם. אם assets/ חסרה, מדלגים בשקט.
import os, math
ASSETS = os.path.join(HERE, "assets")
HAVE = os.path.isdir(ASSETS)

def _img(path, color=True):
    im = bpy.data.images.load(path, check_existing=True)
    if not color: im.colorspace_settings.name = 'Non-Color'
    return im

def texture(mat_name, folder, scale=1.0, tint=None, rough=None, bump=1.0):
    """box-projected (triplanar) PBR texture in world space, so the blockout boxes need no UVs"""
    d = os.path.join(ASSETS, "tex", folder)
    if not os.path.isdir(d) or mat_name not in MATS: return
    m = MATS[mat_name]; nt = m.node_tree; N = nt.nodes; Lk = nt.links
    bsdf = N["Principled BSDF"]
    geo = N.new("ShaderNodeNewGeometry"); mp = N.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (1 / scale, 1 / scale, 1 / scale)
    Lk.new(geo.outputs["Position"], mp.inputs["Vector"])
    def tex(fn, color=True):
        t = N.new("ShaderNodeTexImage"); t.image = _img(os.path.join(d, fn), color)
        t.projection = 'BOX'; t.projection_blend = 0.25
        Lk.new(mp.outputs["Vector"], t.inputs["Vector"]); return t
    diff = tex("diff.jpg")
    if tint:
        mix = N.new("ShaderNodeMix"); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'
        mix.inputs["Factor"].default_value = 1.0
        Lk.new(diff.outputs["Color"], mix.inputs["A"]); mix.inputs["B"].default_value = (*tint, 1)
        Lk.new(mix.outputs["Result"], bsdf.inputs["Base Color"])
    else:
        Lk.new(diff.outputs["Color"], bsdf.inputs["Base Color"])
    if os.path.exists(os.path.join(d, "rough.jpg")) and rough is None:
        Lk.new(tex("rough.jpg", False).outputs["Color"], bsdf.inputs["Roughness"])
    elif rough is not None:
        bsdf.inputs["Roughness"].default_value = rough
    if os.path.exists(os.path.join(d, "nor.jpg")):
        nm = N.new("ShaderNodeNormalMap"); nm.inputs["Strength"].default_value = bump
        Lk.new(tex("nor.jpg", False).outputs["Color"], nm.inputs["Color"]); Lk.new(nm.outputs["Normal"], bsdf.inputs["Normal"])

if HAVE:
    texture("marble_white", "marble_01", 2.0, rough=0.12)
    texture("marble_siena", "marble_01", 2.0, tint=(0.75, 0.42, 0.28), rough=0.15)
    texture("parquet", "herringbone_parquet", 1.6, tint=(0.75, 0.55, 0.38))
    texture("walnut", "dark_wood", 1.5)
    texture("mahogany", "lacquered_cherry_wood", 1.2, tint=(0.75, 0.45, 0.35))
    texture("oak", "lacquered_cherry_wood", 1.2)
    texture("plaster_white", "painted_plaster_wall", 3.0, tint=(0.95, 0.92, 0.86), bump=0.4)
    texture("jerusalem_stone", "brushed_concrete", 2.5, tint=(1.0, 0.86, 0.66))
    texture("stone", "brushed_concrete", 3.0, tint=(0.62, 0.62, 0.60), bump=0.5)
    texture("stone_dark", "brushed_concrete", 3.0, tint=(0.32, 0.32, 0.32), bump=0.5)
    texture("paving", "concrete_floor_01", 3.0)
    texture("leather_black", "fabric_leather_02", 0.6, tint=(0.12, 0.12, 0.13), rough=0.35)
    texture("leather_burgundy", "fabric_leather_02", 0.6, tint=(0.5, 0.08, 0.08), rough=0.35)
    texture("velvet_blue", "velour_velvet", 0.8, tint=(0.12, 0.18, 0.55))
    texture("carpet_blue", "velour_velvet", 0.8, tint=(0.1, 0.14, 0.42))

# ---- Israeli flag + inscription textures (drawn with PIL, saved under assets/gen) ----
def _gen_images():
    from PIL import Image, ImageDraw, ImageFont
    gen = os.path.join(HERE, "assets", "gen"); os.makedirs(gen, exist_ok=True)
    W, H = 1100, 800  # flag ratio 11:8
    im = Image.new("RGB", (W, H), "white"); d = ImageDraw.Draw(im); blue = (0, 56, 184)
    d.rectangle((0, 75, W, 75 + 125), fill=blue); d.rectangle((0, H - 200, W, H - 75), fill=blue)
    cx, cy, R = W // 2, H // 2, 165
    for rot in (90, 270):
        pts = [(cx + R * math.cos(math.radians(rot + k * 120)), cy - R * math.sin(math.radians(rot + k * 120))) for k in range(3)]
        d.polygon(pts, outline=blue, width=26)
    im.save(os.path.join(gen, "flag_il.png"))
    font = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    ins = Image.new("RGB", (2400, 220), (200, 175, 130)); d = ImageDraw.Draw(ins)
    try:
        d.text((1200, 110), "צדק צדק תרדוף", font=ImageFont.truetype(font, 170), fill=(150, 105, 25), anchor="mm", direction="rtl")
    except Exception:
        d.text((1200, 110), "ףודרת קדצ קדצ", font=ImageFont.truetype(font, 170), fill=(150, 105, 25), anchor="mm")
    ins.save(os.path.join(gen, "inscription.png"))
    return os.path.join(gen, "flag_il.png"), os.path.join(gen, "inscription.png")

def _img_mat(name, path, emit=0.0, metal=0.0, rough=0.6):
    m = bpy.data.materials.new(name); m.use_nodes = True; N = m.node_tree.nodes; b = N["Principled BSDF"]
    t = N.new("ShaderNodeTexImage"); t.image = _img(path); m.node_tree.links.new(t.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Metallic"].default_value = metal; b.inputs["Roughness"].default_value = rough
    if emit:
        m.node_tree.links.new(t.outputs["Color"], b.inputs["Emission Color"]); b.inputs["Emission Strength"].default_value = emit
    return m

def uv_quad(name, cx, cy, z0, w, h, ang, mat, c=None, drape=0.0):
    """vertical textured quad (flag/inscription); drape adds a gentle wave"""
    bm = bmesh.new(); uv = bm.loops.layers.uv.new(); nx, segs = 8, 8
    verts = []
    for j in range(segs + 1):
        row = []
        for i in range(nx + 1):
            u, v = i / nx, j / segs
            off = drape * math.sin(u * math.pi * 2.0) * u
            row.append(bm.verts.new((u * w - w / 2, off, z0 + v * h)))
        verts.append(row)
    for j in range(segs):
        for i in range(nx):
            f = bm.faces.new((verts[j][i], verts[j][i + 1], verts[j + 1][i + 1], verts[j + 1][i]))
            for lp, (ii, jj) in zip(f.loops, ((i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1))):
                lp[uv].uv = (ii / nx, jj / segs)
    ob = mesh_obj(name, bm, mat, c); ob.location = (cx, cy, 0); ob.rotation_euler = (0, 0, ang)
    return ob

try:
    FLAG_PNG, INS_PNG = _gen_images()
    m_flag = _img_mat("flag_israel", FLAG_PNG, rough=0.8)
    m_ins = _img_mat("inscription_gold", INS_PNG, metal=0.6, rough=0.3)
    for n in [o.name for o in bpy.data.objects if o.name.startswith(("flag_0", "flag_1", "flag_2", "court_flag", "rot_flag", "inscription"))]:
        bpy.data.objects.remove(bpy.data.objects[n], do_unlink=True)
    for i, x in enumerate((-14, -11, 11)):  # plaza flags
        uv_quad(f"flag_il_{i}", x + 1.4, -45, 7.0, 2.6, 1.9, 0, m_flag, C_SITE, drape=0.12)
    uv_quad("rot_flag_il", 0, -2.82, 5.6, 2.8, 2.04, math.pi, m_flag, C_G)
    uv_quad("court_flag_il", fx, fy - 0.55, 2.35, 1.1, 0.8, math.pi / 2, m_flag, C_PROPS, drape=0.05)
    uv_quad("inscription_il", 0, CY + 11.6, 9.25, 9.0, 0.82, math.pi, m_ins, C_G)
    uv_quad("ent_inscription_il", 0, -27.5, 6.6, 9.0, 0.82, 0, m_ins, C_EXT)
except Exception as e:
    print("flag/inscription skipped:", e)

# ---- CC0 models: chandeliers and plants ----
def import_model(name):
    path = os.path.join(ASSETS, "models", name, name + ".gltf")
    if not os.path.exists(path): return None
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    root = bpy.data.objects.new(name + "_root", None); C_PROPS.objects.link(root)
    for o in new:
        for c in o.users_collection: c.objects.unlink(o)
        C_PROPS.objects.link(o)
        if o.parent is None: o.parent = root
    root.hide_render = True; root.hide_viewport = True
    for o in new: o.hide_render = True
    return root, new

def place(src, x, y, z, s=1.0, rot=0.0):
    root, objs = src
    nr = bpy.data.objects.new(root.name + "_inst", None); C_PROPS.objects.link(nr)
    nr.location = (x, y, z); nr.scale = (s, s, s); nr.rotation_euler = (0, 0, rot)
    mapping = {}
    for o in objs:
        c = o.copy(); C_PROPS.objects.link(c); c.hide_render = False; mapping[o] = c
    for o, c in mapping.items():
        c.parent = mapping.get(o.parent, nr)
    return nr

if HAVE:
    try:
        ch3 = import_model("Chandelier_03"); ch1 = import_model("Chandelier_01")
        p2 = import_model("potted_plant_02"); p4 = import_model("potted_plant_04")
        for n in [o.name for o in bpy.data.objects if o.name.startswith(("chand_main", "chand_s", "chand_rot"))]:
            bpy.data.objects.remove(bpy.data.objects[n], do_unlink=True)
        # chandelier models hang down from their origin (~1 m tall at scale 1)
        if ch3:
            place(ch3, 0, 9, 15.5, 3.2)            # courtroom centre
            place(ch3, 0, -10, 10.0, 2.4)          # rotunda
        if ch1:
            for k in range(4):
                a = math.radians(45 + k * 90); place(ch1, 6.5 * math.cos(a), 9 + 6.5 * math.sin(a), 11.0, 1.7)
            for x in (-3.5, 3.5): place(ch1, x, -21, 6.0, 1.5)   # security hall
        for (x, y, src) in ((-6.2, -15.5, p2), (6.2, -15.5, p2), (-8.0, -25.8, p4), (8.0, -25.8, p4),
                            (-11.8, -7.6, p2), (11.0, -3.0, p2), (-6.4, 1.2, p4), (6.4, 1.2, p4)):
            if src: place(src, x, y, 0, 1.6)
    except Exception as e:
        print("model import skipped:", e)
