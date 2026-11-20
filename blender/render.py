"""מרנדר מבטים מ-courthouse.blend.
python render.py VIEW [PERCENT] [SAMPLES]
VIEW: front, aerial, plan0, planB, plan1, court, court_bench, security, rotunda, bar
הפלט: ../renders/VIEW.png  (+ VIEW.labels.json במבטים עם שמות חדרים)
"""
import bpy, sys, os, math, json
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

HERE = os.path.dirname(os.path.abspath(__file__))
args = [a for a in sys.argv[sys.argv.index("--") + 1:]] if "--" in sys.argv else sys.argv[1:]
view = args[0]; pct = int(args[1]) if len(args) > 1 else 100; spp = int(args[2]) if len(args) > 2 else 32
bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, "courthouse.blend"))
sc = bpy.context.scene
C = bpy.data.collections

def show(**kw):
    for k, v in kw.items():
        C[k].hide_render = not v

# name: (location, target, lens|ortho_scale, ortho?, collections, labelplan)
VIEWS = {
    "front":       ((0, -88, 14), (0, 0, 8), 32, False, dict(zone_floors=False), None),
    "aerial":      ((-62, -78, 70), (0, -2, -2), 30, False, dict(roofs=False, upper_floor=False), "g"),
    "plan0":       ((0, 0.5, 80), (0, 0.5, 0), 104, True, dict(roofs=False, upper_floor=False, site=False), "g"),
    "plan1":       ((0, 0.5, 80), (0, 0.5, 0), 104, True, dict(roofs=False, site=False), "u"),
    "planB":       ((-11, 3, 80), (-11, 3, -5), 70, True, dict(roofs=False, upper_floor=False, ground_floor=False, furniture=False, gta_props=False, exterior=False, site=False), "b"),
    "court":       ((0, -1.5, 6.4), (0, 16, 2.4), 18, False, dict(zone_floors=False), None),
    "court_bench": ((-6.5, 2.5, 1.7), (2.5, 16, 1.6), 20, False, dict(zone_floors=False), None),
    "security":    ((0, -26.2, 3.0), (-1.5, -17, 1.2), 16, False, dict(zone_floors=False), None),
    "rotunda":     ((0, -16.8, 1.8), (0, -4, 4.0), 14, False, dict(zone_floors=False), None),
    "bar":         ((-31.5 + 4.6, -12 - 3.0, 1.6), (-31.5, -12, 3.5), 14, False, dict(zone_floors=False), None),
}
loc, tgt, lens, ortho, cols, lplan = VIEWS[view]
show(**cols)
cam_d = bpy.data.cameras.new("cam"); cam = bpy.data.objects.new("cam", cam_d); sc.collection.objects.link(cam)
cam.location = loc
d = Vector(tgt) - Vector(loc); cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
if ortho: cam_d.type = 'ORTHO'; cam_d.ortho_scale = lens
else: cam_d.lens = lens
cam_d.clip_end = 1000; sc.camera = cam
if view in ("plan0", "aerial"):  # hide high objects (chandeliers, gallery) so the floor is readable
    for ob in sc.objects:
        if ob.type == 'MESH' and ob.users_collection[0].name in ("ground_floor", "furniture", "gta_props"):
            zmin = min((ob.matrix_world @ Vector(v)).z for v in ob.bound_box)
            if zmin > 3.0: ob.hide_render = True
if view.startswith("plan"):
    sc.world.node_tree.nodes["Background"].inputs[1].default_value = 0.6
r = sc.render; r.resolution_x, r.resolution_y = 1600, 900; r.resolution_percentage = pct
sc.cycles.samples = spp; sc.cycles.use_denoising = True; sc.cycles.device = 'CPU'
sc.view_settings.view_transform = 'AgX'; sc.view_settings.exposure = {'front': -1.6, 'aerial': -1.2}.get(view, 0.0 if view.startswith('plan') else -0.3)
out = os.path.join(HERE, "..", "renders", view + ".png"); r.filepath = out
bpy.ops.render.render(write_still=True)
if lplan:
    W, H = r.resolution_x * pct // 100, r.resolution_y * pct // 100
    labs = []
    for L in json.load(open(os.path.join(HERE, "labels.json"), encoding="utf-8")):
        if L["plan"] != lplan: continue
        p = world_to_camera_view(sc, cam, Vector((L["x"], L["y"], L["z"])))
        if 0 <= p.x <= 1 and 0 <= p.y <= 1 and p.z > 0:
            labs.append(dict(text=L["text"].strip(), px=p.x * W, py=(1 - p.y) * H))
    json.dump(labs, open(out.replace(".png", ".labels.json"), "w", encoding="utf-8"), ensure_ascii=False)
print("done", out)
