"""סרטון מעבר: מהרחבה, דרך הבידוק והרוטונדה, אל האולם הגדול ועד הגלריה.
python video.py [PERCENT] [SAMPLES] [STEP]  ->  ../renders/frames/####.png, ואז ffmpeg
"""
import bpy, sys, os
from mathutils import Vector
HERE = os.path.dirname(os.path.abspath(__file__))
args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
pct = int(args[0]) if args else 60; spp = int(args[1]) if len(args) > 1 else 12; step = int(args[2]) if len(args) > 2 else 1
bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, "courthouse.blend"))
sc = bpy.context.scene
bpy.data.collections["zone_floors"].hide_render = True
for n in ("ent_door_frame", "ent_door_recess"):  # the doors are "open" in the walkthrough
    bpy.data.objects[n].hide_render = True
KEYS = [  # frame, camera, look-at
    (1,   (0, -95, 16),   (0, 0, 8)),
    (60,  (0, -45, 4),    (0, -27, 3)),
    (90,  (0, -31, 2.0),  (0, -20, 1.8)),
    (120, (0, -22.5, 1.8), (-2, -17, 1.5)),
    (150, (0, -16, 1.8),  (0, -8, 3)),
    (175, (-2.5, -11, 1.8), (2, -4, 5)),
    (200, (0, -6, 1.8),   (0, 5, 2)),
    (225, (0, 1, 1.8),    (0, 17, 2.5)),
    (255, (0, 5, 2.0),    (0, 18, 3)),
    (300, (0, -0.5, 6.3), (0, 16, 2.5)),
]
cam_d = bpy.data.cameras.new("cam"); cam_d.lens = 16; cam_d.clip_start = 0.05; cam_d.clip_end = 1000
cam = bpy.data.objects.new("cam", cam_d); sc.collection.objects.link(cam); sc.camera = cam
tgt = bpy.data.objects.new("target", None); sc.collection.objects.link(tgt)
c = cam.constraints.new('TRACK_TO'); c.target = tgt; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'
for f, p, t in KEYS:
    cam.location = p; cam.keyframe_insert("location", frame=f)
    tgt.location = t; tgt.keyframe_insert("location", frame=f)
sc.frame_start, sc.frame_end, sc.frame_step = 1, KEYS[-1][0], step
r = sc.render; r.resolution_x, r.resolution_y, r.resolution_percentage = 1600, 900, pct; r.fps = 24
sc.cycles.samples = spp; sc.cycles.use_denoising = True
sc.view_settings.view_transform = 'AgX'; sc.view_settings.exposure = -0.3
os.makedirs(os.path.join(HERE, "..", "renders", "frames"), exist_ok=True)
r.filepath = os.path.join(HERE, "..", "renders", "frames", "")
bpy.ops.render.render(animation=True)
print("frames done")
