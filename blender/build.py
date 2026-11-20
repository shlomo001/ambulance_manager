"""בונה blockout של היכל המשפט בתוך מצפה הכוכבים.
מידות משוערות לפי Griffith Observatory. צריך לאמת מול המדידה ב-CodeWalker.
יחידות: מטרים. ראשית הצירים: מרכז הבניין, רצפת קומת הקרקע z=0.
+y = אחורה (הכיפה הגדולה), -y = החזית. "שמאל" = -x כשעומדים מול הכניסה.
הרצה: python build.py  ->  courthouse.blend + props.json + labels.json
"""
import bpy, bmesh, math, json, os
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# ---------- collections ----------
def coll(name, parent=None):
    c = bpy.data.collections.new(name)
    (parent or scene.collection).children.link(c)
    return c
C_EXT = coll("exterior"); C_ROOF = coll("roofs"); C_G = coll("ground_floor")
C_UP = coll("upper_floor"); C_B = coll("basement"); C_FURN = coll("furniture")
C_PROPS = coll("gta_props"); C_ZONE = coll("zone_floors"); C_SITE = coll("site")
CUR = [C_EXT]

# ---------- materials ----------
MATS = {}
def mat(name, color, rough=0.5, metal=0.0, emit=None, strength=0.0, alpha=1.0):
    if name in MATS: return MATS[name]
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if emit:
        b.inputs["Emission Color"].default_value = (*emit, 1)
        b.inputs["Emission Strength"].default_value = strength
    if alpha < 1:
        b.inputs["Alpha"].default_value = alpha
        b.inputs["Transmission Weight"].default_value = 0.9
    MATS[name] = m; return m

M = dict(
    stone=mat("stone", (0.36, 0.36, 0.35), 0.8),
    stone_dark=mat("stone_dark", (0.30, 0.30, 0.30), 0.8),
    jeru=mat("jerusalem_stone", (0.80, 0.70, 0.52), 0.75),
    copper=mat("copper_dome", (0.16, 0.10, 0.07), 0.4, 0.8),
    verdigris=mat("verdigris", (0.20, 0.42, 0.36), 0.5, 0.3),
    marble=mat("marble_white", (0.85, 0.84, 0.80), 0.15),
    marble_r=mat("marble_siena", (0.55, 0.30, 0.20), 0.2),
    walnut=mat("walnut", (0.22, 0.12, 0.06), 0.4),
    mahog=mat("mahogany", (0.30, 0.09, 0.05), 0.35),
    oak=mat("oak", (0.45, 0.30, 0.15), 0.5),
    parquet=mat("parquet", (0.40, 0.24, 0.11), 0.35),
    bronze=mat("bronze", (0.55, 0.38, 0.18), 0.3, 1.0),
    brass=mat("brass", (0.85, 0.65, 0.28), 0.25, 1.0),
    gold=mat("gold", (1.0, 0.75, 0.30), 0.2, 1.0),
    velvet=mat("velvet_blue", (0.03, 0.06, 0.22), 0.9),
    carpet=mat("carpet_blue", (0.04, 0.07, 0.20), 0.95),
    leather=mat("leather_burgundy", (0.25, 0.03, 0.04), 0.5),
    glass=mat("glass", (0.8, 0.9, 1.0), 0.05, 0.0, alpha=0.2),
    light=mat("chandelier_glow", (1, 0.9, 0.7), 0.3, 0, (1.0, 0.82, 0.55), 25),
    sky_glass=mat("stained_glass", (0.3, 0.5, 1), 0.2, 0, (0.45, 0.65, 1.0), 6),
    white=mat("plaster_white", (0.62, 0.59, 0.53), 0.7),
    grass=mat("grass", (0.10, 0.25, 0.06), 0.9),
    paving=mat("paving", (0.33, 0.32, 0.30), 0.9),
    asphalt=mat("asphalt", (0.08, 0.08, 0.08), 0.9),
    steel=mat("steel_grey", (0.55, 0.57, 0.6), 0.35, 0.8),
    black=mat("black", (0.02, 0.02, 0.02), 0.5),
    flag_white=mat("flag_white", (0.95, 0.95, 0.95), 0.8),
    flag_blue=mat("flag_blue", (0.0, 0.15, 0.6), 0.8),
    plant=mat("plant", (0.08, 0.3, 0.08), 0.8),
    prop_ph=mat("gta_prop_placeholder", (0.9, 0.45, 0.05), 0.6),
)
ZONE = dict(
    public=mat("z_public", (0.95, 0.85, 0.55), 0.9),
    security=mat("z_security", (0.95, 0.55, 0.25), 0.9),
    court=mat("z_court", (0.60, 0.75, 0.95), 0.9),
    judges=mat("z_judges", (0.75, 0.35, 0.40), 0.9),
    bar=mat("z_bar", (0.45, 0.75, 0.45), 0.9),
    secure=mat("z_secure", (0.55, 0.55, 0.60), 0.9),
    corridor=mat("z_corridor", (0.90, 0.90, 0.88), 0.9),
)

# ---------- geometry helpers ----------
def link(ob, c=None):
    (c or CUR[0]).objects.link(ob); return ob

def mesh_obj(name, bm, m, c=None):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); me.materials.append(m)
    return link(ob, c)

def box(name, x0, y0, z0, x1, y1, z1, m, c=None):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts:
        v.co = Vector(((x0 + x1) / 2 + v.co.x * abs(x1 - x0), (y0 + y1) / 2 + v.co.y * abs(y1 - y0), (z0 + z1) / 2 + v.co.z * abs(z1 - z0)))
    return mesh_obj(name, bm, m, c)

def obox(name, cx, cy, z0, w, d, h, ang, m, c=None):
    """box centered at cx,cy rotated by ang (rad) around z"""
    ob = box(name, -w / 2, -d / 2, z0, w / 2, d / 2, z0 + h, m, c)
    ob.location = (cx, cy, 0); ob.rotation_euler = (0, 0, ang); return ob

def cyl(name, cx, cy, r, z0, z1, m, n=64, c=None, r2=None):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=n, radius1=r, radius2=r if r2 is None else r2, depth=z1 - z0)
    for v in bm.verts: v.co += Vector((cx, cy, (z0 + z1) / 2))
    return mesh_obj(name, bm, m, c)

def dome(name, cx, cy, z, r, m, c=None, sz=1.0):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=48, v_segments=24, radius=r)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < -1e-4], context='VERTS')
    for v in bm.verts: v.co = Vector((cx + v.co.x, cy + v.co.y, z + v.co.z * sz))
    return mesh_obj(name, bm, m, c)

def ring(name, cx, cy, r_in, r_out, z0, z1, m, a0=0, a1=360, doors=(), n=96, c=None):
    """ring wall from angle a0..a1 (deg). doors: list of (angle_deg, width_m, height_m)"""
    obs = []
    step = (a1 - a0) / n
    rm = (r_in + r_out) / 2
    for i in range(n):
        a = a0 + step * (i + 0.5)
        zb = z0
        for (da, dw, dh) in doors:
            half = math.degrees(dw / 2 / rm)
            if abs((a - da + 180) % 360 - 180) < half:
                zb = max(zb, z0 + dh)
        if zb >= z1: continue
        ar = math.radians(a)
        seg_w = 2 * r_out * math.sin(math.radians(abs(step)) / 2) * 1.02
        obs.append(obox(f"{name}_{i}", cx + rm * math.cos(ar), cy + rm * math.sin(ar), zb, r_out - r_in, seg_w, z1 - zb, ar, m, c))
    return obs

def wall(name, x0, y0, x1, y1, z0, z1, m, t=0.3, doors=(), c=None):
    """axis-aligned wall; doors = list of (pos_along_from_start, width, height)"""
    horiz = abs(y1 - y0) < 1e-6
    L = abs(x1 - x0) if horiz else abs(y1 - y0)
    s = min(x0, x1) if horiz else min(y0, y1)
    cuts = sorted(doors)
    segs, cur = [], 0.0
    for (p, w, h) in cuts:
        segs.append((cur, p - w / 2, z0, z1)); segs.append((p - w / 2, p + w / 2, z0 + h, z1)); cur = p + w / 2
    segs.append((cur, L, z0, z1))
    for i, (a, b, za, zb) in enumerate(segs):
        if b - a < 1e-3 or zb - za < 1e-3: continue
        if horiz: box(f"{name}_{i}", s + a, y0 - t / 2, za, s + b, y0 + t / 2, zb, m, c)
        else: box(f"{name}_{i}", x0 - t / 2, s + a, za, x0 + t / 2, s + b, zb, m, c)

PROPS, LABELS = [], []
def prop(gta_name, x, y, z, heading_deg, shape):
    """placeholder for an existing GTA prop. shape builds the visual stand-in."""
    PROPS.append(dict(model=gta_name, x=round(x, 3), y=round(y, 3), z=round(z, 3), heading=heading_deg))
    shape(x, y, z, math.radians(heading_deg))

def label(text, x, y, z=0.2, plan="g"):
    LABELS.append(dict(text=text, x=x, y=y, z=z, plan=plan))

def zone(name, x0, y0, x1, y1, z, kind, text=None, plan="g"):
    box(f"zone_{name}", x0, y0, z + 0.02, x1, y1, z + 0.05, ZONE[kind], C_ZONE)
    if text: label(text, (x0 + x1) / 2, (y0 + y1) / 2, z + 0.1, plan)

# ======================================================================
# SITE
# ======================================================================
CUR[0] = C_SITE
box("plaza", -60, -75, -1.25, 60, 40, -1.2, M["paving"])
box("lawn_l", -48, -70, -1.2, -12, -40, -1.15, M["grass"])
box("lawn_r", 12, -70, -1.2, 48, -40, -1.15, M["grass"])
box("lawn_c", -8, -70, -1.2, 8, -48, -1.15, M["grass"])
box("podium", -40, -30, -1.2, 40, 30, 0, M["stone"])
for i in range(6):  # front steps
    box(f"front_step_{i}", -7, -36 + i * 1.0, -1.2, 7, -30 + 0, -1.2 + (i + 1) * 0.2, M["stone"])
box("road_r", 44, -75, -1.24, 52, 40, -1.2, M["asphalt"])
box("judges_parking", 40, -10, -1.24, 52, 20, -1.19, M["asphalt"])
box("bar_parking", -56, -30, -1.24, -42, -2, -1.19, M["asphalt"])
for i, x in enumerate((-14, -11, 11)):  # flagpoles at the sides of the plaza
    cyl(f"flagpole_{i}", x, -45, 0.08, -1.2, 9, M["steel"])
    box(f"flag_{i}_w", x + 0.08, -45.02, 7, x + 2.6, -44.98, 8.8, M["flag_white"])
    box(f"flag_{i}_b1", x + 0.08, -45.03, 8.45, x + 2.6, -44.97, 8.6, M["flag_blue"])
    box(f"flag_{i}_b2", x + 0.08, -45.03, 7.2, x + 2.6, -44.97, 7.35, M["flag_blue"])
PROPS.append(dict(model="prop_flagpole_2a", x=-14, y=-45, z=-1.2, heading=0, note="3 flagpoles, Israeli flag = custom texture"))
# fence segments around judges' and bar areas
for (x0, y0, x1, y1) in ((38, -12, 54, -12), (38, -12, 38, 30), (-58, -32, -40, -32), (-40, -32, -40, 0)):
    wall("fence", x0, y0, x1, y1, -1.2, 0.6, M["black"], t=0.08)

# ======================================================================
# EXTERIOR SHELL
# ======================================================================
CUR[0] = C_EXT
H_WING, H_ENT, H_REAR = 8.0, 9.5, 9.0
# entrance block (front, center)
wall("ent_front", -9, -27, 9, -27, 0, H_ENT, M["stone"], 0.8, doors=[(9, 3.6, 5.0)])
wall("ent_l", -9, -27, -9, -17, 0, H_ENT, M["stone"], 0.8)
wall("ent_r", 9, -27, 9, -17, 0, H_ENT, M["stone"], 0.8)
box("ent_door_frame", -2.4, -27.6, 0, 2.4, -27.3, 5.6, M["bronze"])
box("ent_door_recess", -1.8, -27.5, 0, 1.8, -27.2, 5.0, M["stone_dark"])
box("ent_text_band", -6, -27.45, 6.6, 6, -27.35, 7.4, M["stone_dark"])
box("ent_emblem", -0.9, -27.5, 5.7, 0.9, -27.4, 6.5, M["gold"])
box("ent_roof", -9.4, -27.4, H_ENT, 9.4, -16.6, H_ENT + 0.5, M["stone"], C_ROOF)
# wings
for s, nm in ((-1, "left"), (1, "right")):
    xa, xb = sorted((s * 9, s * 26))
    wall(f"wing_{nm}_front", xa, -22, xb, -22, 0, H_WING, M["stone"], 0.8)
    wall(f"wing_{nm}_back", xa, -2, xb, -2, 0, H_WING, M["stone"], 0.8)
    for k in range(5):  # tall windows
        x = xa + 2 + k * 3.3
        box(f"wing_{nm}_win{k}", x, -22.45, 1.5, x + 1.3, -22.35, 6.5, M["black"])
    box(f"wing_{nm}_roof", xa - 0.4, -22.4, H_WING, xb + 0.4, -1.6, H_WING + 0.4, M["stone"], C_ROOF)
    box(f"wing_{nm}_cornice", xa - 0.5, -22.6, H_WING - 0.6, xb + 0.5, -22.3, H_WING, M["stone_dark"])
# side domes (left = bar, right = judges)
for s, nm in ((-1, "bar"), (1, "judges")):
    cx, cy = s * 31.5, -12
    door_a = 180 if s < 0 else 0
    ring(f"drum_{nm}_low", cx, cy, 5.6, 6.2, 0, 6, M["white"], doors=[(door_a, 2.4, 3.2), (0 if s < 0 else 180, 2.4, 3.2)])
    ring(f"drum_{nm}_band", cx, cy, 5.6, 6.3, 6, 10, M["copper"])
    dome(f"dome_{nm}", cx, cy, 10, 6.3, M["copper"], C_ROOF)
    cyl(f"dome_{nm}_cap", cx, cy, 1.4, 16.0, 16.6, M["copper"], c=C_ROOF)
# rotunda (octagon with verdigris roof)
ring("rotunda_wall", 0, -10, 7.4, 8.0, 0, 10, M["stone"], n=8 * 12,
     doors=[(270, 4.0, 5.0), (180, 3.0, 3.6), (0, 3.0, 3.6), (90, 3.0, 3.6), (90, 2.5, 7.5)])
cyl("rotunda_roof", 0, -10, 8.4, 10, 13.5, M["verdigris"], n=8, c=C_ROOF, r2=3.5)
cyl("rotunda_lantern", 0, -10, 3.5, 13.5, 14.5, M["verdigris"], n=8, c=C_ROOF)
# rear block + main dome (courtroom)
wall("rear_l", -15, -4, -15, 28, 0, H_REAR, M["stone"], 0.8)
wall("rear_r", 15, -4, 15, 28, 0, H_REAR, M["stone"], 0.8, doors=[(30.5, 2.4, 3.0)])  # service door (police)
wall("rear_back", -15, 28, 15, 28, 0, H_REAR, M["stone"], 0.8)
box("rear_roof", -15.4, -4, H_REAR, 15.4, 28.4, H_REAR + 0.4, M["stone"], C_ROOF)
ring("court_drum", 0, 9, 12.1, 12.6, 0, 12, M["jeru"],
     doors=[(270, 3.0, 3.5), (270, 4.0, 7.5), (90, 1.6, 2.6), (45, 1.4, 2.6)])
dome("court_dome", 0, 9, 12, 12.6, M["copper"], C_ROOF)
dome("court_dome_inner", 0, 9, 11.95, 12.05, M["white"], C_ROOF)
cyl("court_oculus", 0, 9, 1.6, 23.7, 23.9, M["sky_glass"], c=C_ROOF)

# ======================================================================
# GROUND FLOOR INTERIOR
# ======================================================================
CUR[0] = C_G
box("floor_ground", -37.5, -27, -0.05, 37.5, 28, 0, M["marble"])
# --- security hall (entrance block) ---
wall("vestibule_screen", -8.6, -24, 8.6, -24, 0, 4.5, M["bronze"], 0.15, doors=[(8.6, 4.0, 3.2)])
zone("vest", -8.6, -26.6, 8.6, -24, 0, "security", "פרוזדור כניסה")
zone("sec", -8.6, -24, 8.6, -17.6, 0, "security", "אולם בידוק")

def md_shape(x, y, z, a):  # walk-through metal detector stand-in
    obox("md_l", x - 0.45 * math.cos(a), y - 0.45 * math.sin(a), z, 0.12, 0.6, 2.1, a, M["prop_ph"], C_PROPS)
    obox("md_r", x + 0.45 * math.cos(a), y + 0.45 * math.sin(a), z, 0.12, 0.6, 2.1, a, M["prop_ph"], C_PROPS)
    obox("md_t", x, y, z + 2.1, 1.05, 0.6, 0.15, a, M["prop_ph"], C_PROPS)
def xr_shape(x, y, z, a):  # baggage x-ray scanner stand-in
    obox("xr_body", x, y, z, 1.0, 2.0, 1.4, a, M["prop_ph"], C_PROPS)
    obox("xr_belt", x, y, z, 0.8, 3.6, 0.8, a, M["black"], C_PROPS)
def blk(w, d, h, mm=None):
    return lambda x, y, z, a: obox("ph", x, y, z, w, d, h, a, mm or M["prop_ph"], C_PROPS)

for i, x in enumerate((-4.5, 0.0)):
    prop("ch_prop_ch_metal_detector_01a", x, -20.8, 0, 0, md_shape)
    prop("ch_prop_baggage_scanner_01a", x - 2.0, -21.0, 0, 0, xr_shape)
prop("ch_prop_ch_metal_detector_01a", 4.6, -20.8, 0, 0, md_shape)  # lawyers' fast lane
label("מסלול עו״ד", 4.6, -22.6)
box("guard_desk", 6.2, -20.5, 0, 8.3, -18.6, 1.1, M["walnut"])
box("guard_desk_top", 6.1, -20.6, 1.1, 8.4, -18.5, 1.15, M["marble"])
prop("ch_prop_ch_security_monitor_01a", 7.2, -19.6, 1.15, 180, blk(0.6, 0.2, 0.4, M["black"]))
for k in range(6):
    prop("ch_prop_ch_service_locker_01a", 8.2, -23.6 + k * 0.6, 0, 90, blk(0.5, 0.55, 1.9, M["steel"]))
for k in range(5):
    prop("vw_prop_vw_barrier_rope_01a", -6.5 + k * 2.2, -22.8, 0, 0, blk(0.25, 0.25, 1.0, M["brass"]))

# --- rotunda (lobby) ---
zone("rot", -7.3, -17.3, 7.3, -2.8, 0, "public")
label("רוטונדה – לובי", 0, -13.5)
cyl("rot_floor_inlay", 0, -10, 2.2, 0, 0.02, M["marble_r"])
cyl("rot_emblem", 0, -10, 0.9, 0.02, 0.04, M["brass"])
box("info_desk", -5.4, -13.5, 0, -3.6, -9.5, 1.1, M["walnut"])
label("מודיעין", -4.5, -11.5)
# imperial (horseshoe) staircase: two curved flights hugging the wall, meeting at a rear landing at z=4.5
N_ST, RISE = 24, 4.5 / 24
for side in (-1, 1):
    for k in range(N_ST):
        a = math.radians(180 - (k + 0.5) * (90 - 8) / N_ST) if side < 0 else math.radians((k + 0.5) * (90 - 8) / N_ST)
        r = 6.4
        obox(f"stair_{side}_{k}", r * math.cos(a), -10 + r * math.sin(a), 0, 1.6, 0.42, (k + 1) * RISE, a + math.pi / 2, M["marble"])
        obox(f"stair_rail_{side}_{k}", 5.55 * math.cos(a), -10 + 5.55 * math.sin(a), (k + 1) * RISE, 0.06, 0.44, 1.0, a + math.pi / 2, M["bronze"])
box("stair_landing", -2.2, -4.4, 4.3, 2.2, -2.6, 4.5, M["marble"])
box("landing_rail", -1.5, -4.45, 4.5, 1.5, -4.35, 5.5, M["bronze"])
box("rot_flag", -1.3, -2.85, 5.8, 1.3, -2.8, 7.6, M["flag_white"])
box("rot_flag_b", -1.3, -2.87, 7.25, 1.3, -2.78, 7.4, M["flag_blue"])
box("rot_flag_b2", -1.3, -2.87, 6.0, 1.3, -2.78, 6.15, M["flag_blue"])
label("מדרגות כפולות ליציע", 0, -6.0)
prop("m24_1_prop_m41_chandelier_01a", 0, -10, 9.0, 0, lambda x, y, z, a: (cyl("chand_rot", x, y, 1.4, z - 1.2, z, M["light"], 24, C_PROPS)))

# --- passages rotunda -> wings ---
box("pass_l_floor", -9, -11.5, 0, -7.3, -8.5, 0.01, M["marble"])
box("pass_r_floor", 7.3, -11.5, 0, 9, -8.5, 0.01, M["marble"])
wall("pass_l_s", -9.2, -11.5, -7.2, -11.5, 0, 6, M["white"], 0.3)
wall("pass_l_n", -9.2, -8.5, -7.2, -8.5, 0, 6, M["white"], 0.3)
wall("pass_r_s", 7.2, -11.5, 9.2, -11.5, 0, 6, M["white"], 0.3)
wall("pass_r_n", 7.2, -8.5, 9.2, -8.5, 0, 6, M["white"], 0.3)

# --- left wing: public ---
WZ = 7.6
wall("lw_corr_s", -26, -11.5, -9, -11.5, 0, WZ, M["white"], 0.3, doors=[(2.5, 1.2, 2.4), (6.5, 1.0, 2.2), (10.5, 1.0, 2.2), (14.5, 1.2, 2.2)])
wall("lw_corr_n", -26, -8.5, -9, -8.5, 0, WZ, M["white"], 0.3, doors=[(2.5, 1.0, 2.2), (7.0, 1.0, 2.2), (12.0, 1.0, 2.2)])
wall("lw_end", -9, -22, -9, -11.5, 0, WZ, M["white"], 0.3)
wall("lw_end_n", -9, -8.5, -9, -2, 0, WZ, M["white"], 0.3)
for x in (-23, -19, -15):
    wall("lw_div_s", x, -22, x, -11.5, 0, WZ, M["white"], 0.25)
for x in (-22, -16.5, -12):
    wall("lw_div_n", x, -8.5, x, -2, 0, WZ, M["white"], 0.25)
wall("lw_endwall", -26, -22, -26, -2, 0, WZ, M["stone"], 0.8)
zone("lw_c", -26, -11.5, -9, -8.5, 0, "corridor", "מסדרון ציבורי")
zone("lw_s1", -26, -22, -23, -11.5, 0, "public", "שירו-|תים")
zone("lw_s2", -23, -22, -19, -11.5, 0, "public", "התייעצות|2")
zone("lw_s3", -19, -22, -15, -11.5, 0, "public", "התייעצות|1")
zone("lw_s4", -15, -22, -9, -11.5, 0, "public", "מזכירות")
zone("lw_n1", -26, -8.5, -22, -2, 0, "public", "עדי|הגנה")
zone("lw_n2", -22, -8.5, -16.5, -2, 0, "public", "עדי|תביעה")
zone("lw_n3", -16.5, -8.5, -12, -2, 0, "public", "התייעצות|3")
zone("lw_n4", -12, -8.5, -9, -2, 0, "public", "מחסן")
for x in (-21, -17):
    box("consult_table", x - 0.8, -17.5, 0, x + 0.8, -16.5, 0.75, M["walnut"], C_FURN)

# --- right wing: judges (secure) ---
wall("rw_corr_s", 9, -11.5, 26, -11.5, 0, WZ, M["white"], 0.3, doors=[(2.5, 1.0, 2.2), (7.5, 1.0, 2.2), (13.5, 1.0, 2.2)])
wall("rw_corr_n", 9, -8.5, 26, -8.5, 0, WZ, M["white"], 0.3, doors=[(4.85, 1.8, 2.6), (8.5, 1.0, 2.2), (14.0, 1.0, 2.2)])
wall("rw_end_s", 9, -22, 9, -11.5, 0, WZ, M["white"], 0.3)
wall("rw_end_n", 9, -8.5, 9, -2, 0, WZ, M["white"], 0.3)
for x in (14, 19):
    wall("rw_div_s", x, -22, x, -11.5, 0, WZ, M["white"], 0.25)
for x in (15, 20.5):
    wall("rw_div_n", x, -8.5, x, -2, 0, WZ, M["white"], 0.25)
box("judges_lock_door", 8.95, -11.4, 0, 9.05, -8.6, 2.6, M["mahog"])
label("דלת|נעולה", 7.6, -13.2)
zone("rw_c", 9, -11.5, 26, -8.5, 0, "judges", "מסדרון שופטים")
zone("rw_s1", 9, -22, 14, -11.5, 0, "judges", "לשכת|שופטים")
zone("rw_s2", 14, -22, 19, -11.5, 0, "judges", "לשכת|שופטים")
zone("rw_s3", 19, -22, 26, -11.5, 0, "secure", "חדר|משמר")
zone("rw_n1", 15, -8.5, 20.5, -2, 0, "judges", "לשכת|שופטים")
zone("rw_n2", 20.5, -8.5, 26, -2, 0, "judges", "לשכת|שופטים")
zone("rw_n0", 9, -8.5, 15, -2, 0, "judges")
# judges corridor running behind the courtroom
wall("jc_e_in", 12.9, -2, 12.9, 22.5, 0, H_REAR - 0.5, M["white"], 0.25)
zone("jc_e", 12.9, -8.5, 14.6, 22.5, 0, "judges")
zone("jc_n", -14.6, 22.5, 14.6, 24.4, 0, "judges", "מסדרון שופטים – מאחורי האולם")
wall("jc_n_wall", -14.6, 24.4, 14.6, 24.4, 0, H_REAR - 0.5, M["white"], 0.25, doors=[(7.6, 1.0, 2.2), (14.6, 1.0, 2.2), (22.6, 1.0, 2.2)])
wall("jc_n_s", -14.6, 22.5, 12.9, 22.5, 0, H_REAR - 0.5, M["white"], 0.25, doors=[(14.6, 1.2, 2.4)])
for x in (-3.5, 4.0):
    wall("rear_div", x, 24.4, x, 28, 0, H_REAR - 0.5, M["white"], 0.25)
zone("rear_1", -14.6, 24.4, -3.5, 27.6, 0, "judges", "ארכיון ומדרגות")
zone("rear_2", -3.5, 24.4, 4.0, 27.6, 0, "judges", "חדר גלימות")
zone("rear_3", 4.0, 24.4, 14.6, 27.6, 0, "judges", "ספריית שופטים")
box("bench_passage", -0.8, 21.4, 0, 0.8, 22.5, 0.6, M["mahog"])

# ======================================================================
# MAIN COURTROOM (under the big dome)
# ======================================================================
CX, CY, R = 0, 9, 12.1
zone("court", -8, 0, 8, 18, 0, "court", None)
cyl("court_floor", CX, CY, R, 0.0, 0.03, M["parquet"])
ring("court_wood", CX, CY, 11.9, 12.1, 0, 3.5, M["walnut"], doors=[(270, 3.0, 3.5), (90, 1.6, 2.6), (45, 1.4, 2.6)])
for k in range(16):  # pilasters
    a = math.radians(k * 22.5 + 11.25)
    obox(f"pilaster_{k}", CX + 11.8 * math.cos(a), CY + 11.8 * math.sin(a), 3.5, 0.3, 0.7, 7.5, a, M["jeru"])
    obox(f"capital_{k}", CX + 11.75 * math.cos(a), CY + 11.75 * math.sin(a), 10.8, 0.4, 0.9, 0.4, a, M["gold"])
label("האולם הגדול", 0, 3.0)
# dais + winged bench (3 judges)
ring("dais", CX, CY, 7.6, 11.9, 0, 0.6, M["mahog"], a0=52, a1=128, n=40)
ring("bench_desk", CX, CY, 8.4, 9.0, 0.6, 1.85, M["mahog"], a0=60, a1=120, n=36, c=C_FURN)
ring("bench_top", CX, CY, 8.35, 9.05, 1.85, 1.92, M["walnut"], a0=60, a1=120, n=36, c=C_FURN)
for i, a in enumerate((78, 90, 102)):
    ar = math.radians(a); hb = 1.9 if a == 90 else 1.5
    obox(f"judge_chair_{i}", CX + 9.8 * math.cos(ar), CY + 9.8 * math.sin(ar), 0.6, 0.75, 0.7, hb, ar, M["leather"], C_FURN)
    prop("ch_prop_ch_desk_lamp", CX + 8.7 * math.cos(ar + 0.05), CY + 8.7 * math.sin(ar + 0.05), 1.92, a, blk(0.2, 0.3, 0.45, M["brass"]))
box("bench_emblem_front", -0.5, CY + 8.3, 0.9, 0.5, CY + 8.35, 1.6, M["brass"])
# wall behind bench: drape, emblem, inscription, flag
ring("drape", CX, CY, 11.6, 11.75, 0.6, 5.5, M["velvet"], a0=72, a1=108, n=24)
box("emblem", -1.3, CY + 11.5, 6.2, 1.3, CY + 11.65, 8.8, M["gold"])
box("inscription", -4.5, CY + 11.55, 9.3, 4.5, CY + 11.75, 9.9, M["gold"])
cyl("court_flagpole", CX + 10.5 * math.cos(math.radians(62)), CY + 10.5 * math.sin(math.radians(62)), 0.04, 0.6, 3.8, M["brass"], 12, C_FURN)
fx, fy = CX + 10.5 * math.cos(math.radians(62)), CY + 10.5 * math.sin(math.radians(62))
box("court_flag", fx - 0.02, fy - 1.0, 2.4, fx + 0.02, fy, 3.6, M["flag_white"], C_FURN)
box("court_flag_b", fx - 0.03, fy - 1.0, 3.35, fx + 0.03, fy, 3.45, M["flag_blue"], C_FURN)
box("court_flag_b2", fx - 0.03, fy - 1.0, 2.55, fx + 0.03, fy, 2.65, M["flag_blue"], C_FURN)
PROPS.append(dict(model="prop_flag_us (custom Israel texture)", x=round(fx, 2), y=round(fy, 2), z=0.6, heading=0))
label("כס שופטים", 0, CY + 8.0)
# clerk desk
ring("clerk_desk", CX, CY, 6.6, 7.2, 0.0, 1.0, M["walnut"], a0=80, a1=100, n=12, c=C_FURN)
label("מזכירת אולם", 0, CY + 5.6)
# witness stand (angled, raised 0.3)
wa = math.radians(138); wx, wy = CX + 8.0 * math.cos(wa), CY + 8.0 * math.sin(wa)
obox("witness_base", wx, wy, 0, 1.6, 1.6, 0.3, wa, M["mahog"], C_FURN)
obox("witness_front", wx - 0.75 * math.cos(wa), wy - 0.75 * math.sin(wa), 0.3, 0.1, 1.6, 1.05, wa, M["mahog"], C_FURN)
obox("witness_rail", wx - 0.75 * math.cos(wa), wy - 0.75 * math.sin(wa), 1.35, 0.12, 1.6, 0.06, wa, M["brass"], C_FURN)
prop("prop_table_mic_01", wx - 0.6 * math.cos(wa), wy - 0.6 * math.sin(wa), 1.41, 138, blk(0.1, 0.1, 0.25, M["black"]))
label("דוכן העדים", wx - 1.5, wy - 1.3)
# dock (glass), stairs from basement
da = math.radians(35); dx, dy = CX + 9.0 * math.cos(da), CY + 9.0 * math.sin(da)
obox("dock_base", dx, dy, 0, 3.0, 1.8, 1.0, da + math.pi / 2, M["mahog"], C_FURN)
obox("dock_glass", dx, dy, 1.0, 3.0, 1.8, 1.4, da + math.pi / 2, M["glass"], C_FURN)
label("ספסל הנאשמים", dx - 1.2, dy - 1.8)
# counsel tables + lectern
for sx, t in ((-1, "הגנה"), (1, "תביעה")):
    box(f"counsel_{t}", sx * 3.4 - 1.5, CY - 1.0, 0, sx * 3.4 + 1.5, CY + 0.1, 0.76, M["walnut"], C_FURN)
    for k in range(3):
        obox(f"counsel_chair_{t}_{k}", sx * 3.4 - 1.0 + k, CY - 1.6, 0, 0.55, 0.55, 1.0, 0, M["leather"], C_FURN)
    prop("ch_prop_ch_desk_lamp", sx * 3.4, CY - 0.4, 0.76, 0, blk(0.2, 0.3, 0.45, M["brass"]))
    label(f"שולחן {t}", sx * 3.4, CY - 2.5)
prop("xm_prop_x17_lectern_01", 0, CY + 1.6, 0, 180, blk(0.7, 0.55, 1.2, M["walnut"]))
# bar rail with central gate gap
box("bar_rail_l", -9.0, CY - 3.6, 0, -0.9, CY - 3.45, 1.0, M["walnut"], C_FURN)
box("bar_rail_r", 0.9, CY - 3.6, 0, 9.0, CY - 3.45, 1.0, M["walnut"], C_FURN)
box("bar_gate", -0.9, CY - 3.58, 0.1, 0.9, CY - 3.47, 0.95, M["brass"], C_FURN)
# public pews in arcs (south half), central aisle
for row, r in enumerate((5.6, 6.7, 7.8, 8.9, 10.0)):
    for (a0, a1) in ((206, 263), (277, 334)):
        ring(f"pew_{row}_{a0}", CX, CY, r - 0.25, r + 0.25, 0, 0.45, M["oak"], a0, a1, n=18, c=C_FURN)
        ring(f"pewback_{row}_{a0}", CX, CY, r + 0.25, r + 0.35, 0, 1.0, M["oak"], a0, a1, n=18, c=C_FURN)
label("ספסלי קהל", 0, CY - 7.6)
# gallery balcony at z=4.5 (south half)
ring("gallery_slab", CX, CY, 9.6, 12.0, 4.3, 4.5, M["walnut"], 200, 340, n=40)
ring("gallery_rail", CX, CY, 9.55, 9.7, 4.5, 5.5, M["bronze"], 200, 340, n=40)
for row, r in enumerate((10.3, 11.2)):
    ring(f"gal_pew_{row}", CX, CY, r - 0.2, r + 0.2, 4.5, 4.95, M["oak"], 205, 335, n=30, c=C_FURN)
# chandeliers + interior lights
prop("m24_1_prop_m41_chandelier_01a", CX, CY, 14.0, 0, lambda x, y, z, a: cyl("chand_main", x, y, 2.0, z - 1.8, z, M["light"], 32, C_PROPS))
for k in range(4):
    a = math.radians(45 + k * 90)
    prop("m24_1_prop_m41_chandelier_01a", CX + 6.5 * math.cos(a), CY + 6.5 * math.sin(a), 10.0, 0,
         lambda x, y, z, aa: cyl("chand_s", x, y, 0.9, z - 1.0, z, M["light"], 20, C_PROPS))
for k in range(16):
    a = math.radians(k * 22.5)
    box(f"sconce_{k}", CX + 11.6 * math.cos(a) - 0.12, CY + 11.6 * math.sin(a) - 0.12, 4.6, CX + 11.6 * math.cos(a) + 0.12, CY + 11.6 * math.sin(a) + 0.12, 5.0, M["light"], C_FURN)

# ======================================================================
# SIDE DOMES
# ======================================================================
# bar (left dome): spiral stair around bronze elevator, 3 levels (-4.5, 0, +5)
BX, BY = -31.5, -12
zone("bar_lobby", BX - 5.5, BY - 5.5, BX + 5.5, BY + 5.5, 0, "bar")
label("לשכת עורכי הדין|כניסה", BX, BY - 3.6)
cyl("bar_elev_glass", BX, BY, 1.1, -4.5, 9.0, M["glass"], 24)
for k in range(4):
    a = math.radians(45 + k * 90)
    cyl(f"bar_elev_post_{k}", BX + 1.1 * math.cos(a), BY + 1.1 * math.sin(a), 0.07, -4.5, 9.0, M["bronze"], 8)
ST = 40
for k in range(ST * 2):
    a = math.radians(-90 + k * 360 / ST)
    z = -4.5 + (k + 1) * (9.5 / (ST * 2))
    obox(f"spiral_{k}", BX + 2.15 * math.cos(a), BY + 2.15 * math.sin(a), z - 0.15, 1.7, 0.38, 0.15, a, M["marble"])
    obox(f"spiral_rail_{k}", BX + 3.0 * math.cos(a), BY + 3.0 * math.sin(a), z, 0.05, 0.4, 1.0, a, M["bronze"])
CUR[0] = C_UP
ring("bar_upper_floor", BX, BY, 3.1, 5.6, 4.85, 5.0, M["marble"], n=48)
zone("bar_cere", BX - 5.5, BY + 3.1, BX + 5.5, BY + 5.5, 5.0, "bar", "אולם השבעה", plan="u")
for row in range(4):
    ring(f"cere_chairs_{row}", BX, BY, 3.4 + row * 0.55, 3.8 + row * 0.55, 5.0, 5.45, M["leather"], 200, 340, n=16, c=C_FURN)
CUR[0] = C_G
# judges (right dome)
JX, JY = 31.5, -12
zone("j_lobby", JX - 5.5, JY - 5.5, JX + 5.5, JY + 5.5, 0, "judges")
label("כניסת שופטים", JX, JY - 2.0)
box("j_guard", JX - 1.5, JY + 2.0, 0, JX + 1.5, JY + 3.0, 1.1, M["walnut"])
cyl("j_elev", JX + 3.4, JY - 2.4, 0.9, 0, 5.0, M["bronze"], 16)
CUR[0] = C_UP
ring("j_upper_floor", JX, JY, 0, 5.6, 4.85, 5.0, M["walnut"], n=48)
zone("j_lib", JX - 4, JY - 4, JX + 4, JY + 4, 5.0, "judges", "ספרייה וחדר ישיבות", plan="u")
cyl("j_round_table", JX, JY, 1.6, 5.0, 5.78, M["walnut"], 32, C_FURN)
label("גלריית הקהל", 0, -1.0, 4.6, plan="u")
zone("gal", -8, -2.5, 8, 0.5, 4.5, "court", None, plan="u")

# ======================================================================
# BASEMENT (z = -4.5)
# ======================================================================
CUR[0] = C_B
BZ, BH = -4.5, 3.8
box("basement_slab", -37, -22.5, BZ - 0.2, 15, 28, BZ, M["stone_dark"])
# bar basement under left wing
wall("bb_corr_s", -31.5, -11.5, -9, -11.5, BZ, BZ + BH, M["white"], 0.3, doors=[(4, 1.0, 2.2), (9.5, 1.0, 2.2), (14.5, 1.0, 2.2), (19.5, 1.0, 2.2)])
wall("bb_corr_n", -26, -8.5, -9, -8.5, BZ, BZ + BH, M["white"], 0.3, doors=[(3, 1.0, 2.2), (8, 1.0, 2.2), (13, 1.0, 2.2)])
for x in (-24, -19, -14):
    wall("bb_div_s", x, -22, x, -11.5, BZ, BZ + BH, M["white"], 0.25)
for x in (-20.5, -15):
    wall("bb_div_n", x, -8.5, x, -2, BZ, BZ + BH, M["white"], 0.25)
zone("bb_c", -31.5, -11.5, -9, -8.5, BZ, "corridor", "מסדרון הלשכה", plan="b")
zone("bb_s1", -26, -22, -24, -11.5, BZ, "bar", "שירותים", plan="b")
zone("bb_s2", -24, -22, -19, -11.5, BZ, "bar", "חדר מבחנים", plan="b")
zone("bb_s3", -19, -22, -14, -11.5, BZ, "bar", "ראש הלשכה", plan="b")
zone("bb_s4", -14, -22, -9, -11.5, BZ, "bar", "ועדת אתיקה", plan="b")
zone("bb_n1", -26, -8.5, -20.5, -2, BZ, "bar", "ספרייה ומועדון", plan="b")
zone("bb_n2", -20.5, -8.5, -15, -2, BZ, "bar", "משרדים|1-2", plan="b")
zone("bb_n3", -15, -8.5, -9, -2, BZ, "bar", "משרד 3", plan="b")
zone("bb_spiral", BX - 4, BY - 4, BX + 4, BY + 4, BZ, "bar", "ספירלה ומעלית", plan="b")
# secure basement: service door (rear right) -> stair -> corridor -> stairs up into the dock
wall("sb_w1", 10.5, 9, 10.5, 26, BZ, BZ + BH, M["white"], 0.3)
wall("sb_w2", 13.0, 12, 13.0, 26, BZ, BZ + BH, M["white"], 0.3)
zone("sb_c", 10.5, 12, 13.0, 26, BZ, "secure", "מסדרון מאובטח", plan="b")
zone("sb_d", 6.0, 12, 10.5, 15.5, BZ, "secure", "מדרגות לספסל הנאשמים", plan="b")
zone("sb_e", 10.5, 24, 15, 27.6, BZ, "secure", "דלת שירות – משטרה", plan="b")
for k in range(14):  # stair up to the dock
    box(f"dock_stair_{k}", 7.0 + k * 0.0, 12.4 + k * 0.22, BZ, 9.6, 12.4 + (k + 1) * 0.22, BZ + (k + 1) * (4.5 / 14), M["stone_dark"])

# ---------- world / lights ----------
world = bpy.data.worlds.new("World"); scene.world = world; world.use_nodes = True
nt = world.node_tree; bg = nt.nodes["Background"]
sky = nt.nodes.new("ShaderNodeTexSky")
try:
    sky.sky_type = 'MULTIPLE_SCATTERING'
except Exception:
    pass
try:
    sky.sun_elevation = math.radians(28); sky.sun_rotation = math.radians(200)
except Exception:
    pass
nt.links.new(sky.outputs[0], bg.inputs[0]); bg.inputs[1].default_value = 0.25
sun = bpy.data.lights.new("sun", 'SUN'); sun.energy = 2.2; sun.angle = math.radians(1.5)
so = bpy.data.objects.new("sun", sun); so.rotation_euler = (math.radians(55), 0, math.radians(200)); scene.collection.objects.link(so)
def plight(name, x, y, z, w, size=1.0, color=(1, 0.85, 0.65), c=None):
    l = bpy.data.lights.new(name, 'POINT'); l.energy = w; l.shadow_soft_size = size; l.color = color
    o = bpy.data.objects.new(name, l); o.location = (x, y, z); (c or C_FURN).objects.link(o); return o
plight("L_court_main", 0, 9, 13.5, 9000, 2.0)
for k in range(4):
    a = math.radians(45 + k * 90); plight(f"L_court_{k}", 6.5 * math.cos(a), 9 + 6.5 * math.sin(a), 9.0, 2500, 1.0)
plight("L_court_bench", 0, 14, 5, 2500, 3.0)
plight("L_rot", 0, -10, 8.0, 6000, 1.5)
plight("L_rot_low", 0, -10, 3.0, 2000, 3.0)
plight("L_sec_1", -3, -21, 5.5, 2500, 2.0); plight("L_sec_2", 4, -21, 5.5, 2500, 2.0)
plight("L_bar", BX, BY, 8.0, 2500, 1.5); plight("L_bar_b", BX, BY, -1.0, 1200, 1.5)
plight("L_judg", JX, JY, 4.0, 1500, 1.5)
for x in (-20, -14):
    plight("L_lw", x, -10, 6.5, 700, 1.0)

scene.render.engine = 'CYCLES'
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, "courthouse.blend"))
json.dump(PROPS, open(os.path.join(HERE, "props.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
json.dump(LABELS, open(os.path.join(HERE, "labels.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("objects:", len(bpy.data.objects), "props:", len(PROPS), "labels:", len(LABELS))
