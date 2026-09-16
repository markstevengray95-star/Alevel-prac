"""Render original, schematic 3D apparatus plates for AQA Physics 7408.

Usage:
  blender -b -t 4 --python tools/blender_apparatus.py -- assets

These are educational illustrations informed by AQA's set-up guides. They are
not substitute instructions for constructing or supervising the experiments.
"""

import bpy
import math
import os
import sys
from mathutils import Vector


OUT = os.path.abspath(sys.argv[sys.argv.index("--") + 1]) if "--" in sys.argv else os.path.abspath("assets")
SELECT = sys.argv[sys.argv.index("--") + 2] if "--" in sys.argv and len(sys.argv) > sys.argv.index("--") + 2 else "all"
os.makedirs(OUT, exist_ok=True)


def mat(name, color, metallic=0.0, roughness=0.45, transmission=0.0):
    material = bpy.data.materials.new(name)
    material.diffuse_color = (*color, 1)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Transmission Weight"].default_value = transmission
    return material


metal = mat("Brushed aluminium", (0.56, 0.65, 0.64), 0.68, 0.29)
dark_metal = mat("Dark anodised frame", (0.10, 0.17, 0.20), 0.52, 0.34)
plastic = mat("Slate instrument housing", (0.18, 0.27, 0.31), 0.08, 0.45)
rubber = mat("Rubber", (0.06, 0.11, 0.13), 0.0, 0.74)
copper = mat("Copper conductor", (0.67, 0.29, 0.12), 0.62, 0.24)
gold = mat("Copper winding", (0.78, 0.47, 0.18), 0.52, 0.27)
glass = mat("Syringe barrel", (0.54, 0.78, 0.81), 0.0, 0.20, 0.54)
liquid = mat("LED screen", (0.41, 0.79, 0.64), 0.0, 0.30)
white = mat("Warm white", (0.87, 0.91, 0.88), 0.02, 0.48)
blue = mat("Field coil former", (0.20, 0.42, 0.53), 0.1, 0.37)
red = mat("North pole", (0.68, 0.24, 0.20), 0.12, 0.4)
cream = mat("Bench", (0.79, 0.79, 0.73), 0, 0.75)


def material(obj, m):
    obj.data.materials.append(m)
    return obj


def bevel(obj, width=0.06, segments=3):
    mod = obj.modifiers.new("Soft manufactured edges", "BEVEL")
    mod.width = width
    mod.segments = segments
    obj.modifiers.new("Weighted normals", "WEIGHTED_NORMAL")
    return obj


def cube(name, pos, size, m, edge=0.05):
    bpy.ops.mesh.primitive_cube_add(size=1, location=pos)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    material(obj, m)
    if edge:
        bevel(obj, edge)
    return obj


def cyl(name, pos, radius, depth, m, rotation=None, vertices=48):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=pos)
    obj = bpy.context.object
    obj.name = name
    if rotation is not None:
        obj.rotation_euler = rotation
    material(obj, m)
    bevel(obj, min(radius * 0.11, 0.035), 2)
    return obj


def rod(name, a, b, radius, m, vertices=24):
    a = Vector(a)
    b = Vector(b)
    mid = (a + b) / 2
    obj = cyl(name, mid, radius, (b - a).length, m, vertices=vertices)
    obj.rotation_euler = (b - a).to_track_quat("Z", "Y").to_euler()
    return obj


def torus(name, center, major, minor, m, normal=(0, 0, 1)):
    bpy.ops.mesh.primitive_torus_add(
        major_segments=96, minor_segments=12,
        location=center, major_radius=major,
        minor_radius=minor,
    )
    obj = bpy.context.object
    obj.name = name
    obj.rotation_euler = Vector(normal).to_track_quat("Z", "Y").to_euler()
    material(obj, m)
    return obj


def line(name, points, radius, m):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.bevel_depth = radius
    curve.resolution_u = 8
    curve.bevel_resolution = 3
    spline = curve.splines.new("BEZIER")
    spline.bezier_points.add(len(points) - 1)
    for bp, coordinate in zip(spline.bezier_points, points):
        bp.co = coordinate
        bp.handle_left_type = "AUTO"
        bp.handle_right_type = "AUTO"
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    material(obj, m)
    return obj


def text_object(name, body, pos, size, m, rotation=(math.pi / 2, 0, 0), align="CENTER"):
    curve = bpy.data.curves.new(name, "FONT")
    curve.body = body
    curve.size = size
    curve.align_x = align
    curve.extrude = 0.0005
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    obj.location = pos
    obj.rotation_euler = rotation
    material(obj, m)
    return obj


def clear():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def camera(target, eye=(7, -10, 7), ortho=9.5):
    bpy.ops.object.camera_add(location=eye)
    cam = bpy.context.object
    direction = Vector(target) - cam.location
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    cam.data.type = "ORTHO"
    cam.data.ortho_scale = ortho
    bpy.context.scene.camera = cam
    return cam


def light(name, pos, energy, size):
    bpy.ops.object.light_add(type="AREA", location=pos)
    obj = bpy.context.object
    obj.name = name
    obj.data.energy = energy
    obj.data.shape = "DISK"
    obj.data.size = size
    obj.rotation_euler = (Vector((0, 0, 2)) - obj.location).to_track_quat("-Z", "Y").to_euler()


def studio(target=(0, 0, 2), eye=(7, -10, 7), scale=9.5):
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 24
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 1100
    scene.render.resolution_y = 740
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = True
    scene.world.color = (0.75, 0.79, 0.77)
    scene.view_settings.view_transform = "AgX"
    camera(target, eye, scale)
    light("Large softbox", (0, -4, 9), 1250, 7)
    light("Rim light", (4, 3, 7), 750, 5)


def bench(width=7.6, depth=4.2):
    cube("Lab bench surface", (0, 0, -0.2), (width, depth, 0.35), cream, 0.05)
    cube("Bench front face", (0, -depth / 2, -0.46), (width, 0.16, 0.34), dark_metal, 0.03)


def stand(x, y, height=5.5):
    cube("Retort stand weighted foot", (x, y, 0.08), (1.0, 0.75, 0.17), dark_metal)
    rod("Retort stand vertical rod", (x, y, 0.12), (x, y, height), 0.065, metal)


def clamp(x0, y0, z, x1, jaws=0.47):
    rod("Clamp horizontal arm", (x0, y0, z), (x1, y0, z), 0.05, metal)
    cube("Boss head", (x0, y0, z), (0.25, 0.24, 0.28), dark_metal)
    for dy in (-jaws / 2, jaws / 2):
        cube("Rubber clamp jaw", (x1, y0 + dy, z), (0.17, 0.16, 0.34), rubber, 0.02)


def save(name):
    scene = bpy.context.scene
    scene.render.filepath = os.path.join(OUT, name)
    bpy.ops.render.render(write_still=True)
    print("ASSET", scene.render.filepath)


def boyle():
    clear()
    studio(target=(0, 0, 2.3), eye=(6, -10, 7.1), scale=8.5)
    bench()
    stand(-1.65, 0.5, 5.2)
    clamp(-1.65, 0.5, 3.5, -0.25, 0.58)
    # Barrel is vertical and clipped at its upper nozzle. The plunger points down.
    cyl("Syringe transparent barrel", (-0.15, 0.5, 3.5), 0.31, 2.35, glass)
    torus("Barrel top rim", (-0.15, 0.5, 4.69), 0.32, 0.045, white)
    torus("Barrel lower rim", (-0.15, 0.5, 2.31), 0.32, 0.045, white)
    cyl("Sealed syringe nozzle", (-0.15, 0.5, 4.85), 0.075, 0.37, white)
    line("Folded sealing tube", [(-0.15, 0.5, 5.0), (-0.12, 0.5, 5.22), (0.08, 0.5, 5.3)], 0.055, rubber)
    cube("Pinch clip", (0.02, 0.5, 5.29), (0.23, 0.18, 0.13), dark_metal)
    cyl("Plunger seal", (-0.15, 0.5, 2.75), 0.26, 0.22, rubber)
    rod("Plunger shaft", (-0.15, 0.5, 2.72), (-0.15, 0.5, 1.70), 0.065, metal)
    cyl("Plunger thumb flange", (-0.15, 0.5, 1.63), 0.30, 0.11, white)
    line("String loop to mass hanger", [(-0.22, 0.5, 1.59), (-0.32, 0.5, 1.38), (-0.15, 0.5, 1.30), (0.02, 0.5, 1.38), (-0.08, 0.5, 1.59)], 0.014, dark_metal)
    rod("Mass hanger shaft", (-0.15, 0.5, 1.32), (-0.15, 0.5, 0.9), 0.025, metal)
    for z in (0.52, 0.65, 0.78):
        cyl("Slotted mass", (-0.15, 0.5, z), 0.24, 0.095, dark_metal)
    # Scale is on the front-facing wall, with whole cm3 ticks and several minor ticks.
    for i in range(17):
        z = 2.49 + i * 0.12
        major = i % 4 == 0
        rod("Syringe graduation", (0.17, 0.17, z), (0.17 + (0.14 if major else 0.065), 0.17, z), 0.008, dark_metal, 8)
    cube("Counterweight prevents tipping", (-2.3, 0.4, 0.30), (0.56, 0.55, 0.47), dark_metal)
    save("rp08-boyle-syringe.png")


def magnetic_force():
    clear()
    studio(target=(0, 0, 2.15), eye=(7.5, -11, 6.9), scale=9.1)
    bench()
    # Magnet and its mechanical supports sit on the balance pan; wire support does not.
    cube("Top-pan balance base", (0, 0.25, 0.28), (2.85, 1.8, 0.50), plastic)
    cube("Balance weighing pan", (0, 0.25, 0.56), (2.48, 1.43, 0.11), metal)
    cube("Balance digital display", (0, -0.69, 0.26), (1.08, 0.09, 0.28), liquid, 0.02)
    text_object("Balance readout", "0.00 g", (0, -0.747, 0.20), 0.15, dark_metal)
    # Twin pole pieces with a visible gap around the horizontal wire.
    cube("Magnet yoke lower bar", (0, 0.25, 0.84), (1.83, 0.46, 0.21), dark_metal)
    cube("Magnet left pole", (-0.72, 0.25, 1.38), (0.30, 0.50, 0.93), red)
    cube("Magnet right pole", (0.72, 0.25, 1.38), (0.30, 0.50, 0.93), blue)
    # Two independent stands carry a taught conducting wire through the gap.
    for x in (-2.80, 2.80):
        stand(x, 0.2, 2.45)
        clamp(x, 0.2, 1.74, -2.15 if x < 0 else 2.15, 0.12)
    rod("Current-carrying straight wire", (-2.32, 0.2, 1.74), (2.32, 0.2, 1.74), 0.033, copper)
    for x in (-2.20, 2.20):
        cube("Wire terminal block", (x, 0.2, 1.75), (0.27, 0.23, 0.21), dark_metal, 0.02)
    # Thin power leads from the wire ends to the supply, avoiding the balance.
    cube("Low-voltage DC supply", (2.35, -1.15, 0.32), (1.38, 0.62, 0.57), plastic)
    cube("Supply readout", (2.27, -1.47, 0.38), (0.65, 0.04, 0.20), liquid, 0.02)
    line("Left current lead", [(-2.20, 0.2, 1.74), (-2.55, -0.85, 1.15), (-1.7, -1.45, 0.53), (1.72, -1.43, 0.56)], 0.023, red)
    line("Right current lead", [(2.20, 0.2, 1.74), (3.05, -0.1, 1.40), (3.2, -1.0, 0.58), (2.90, -1.43, 0.56)], 0.023, rubber)
    save("rp10-wire-balance.png")


def search_coil():
    clear()
    studio(target=(0.15, 0, 2.4), eye=(8, -11, 7.2), scale=10.0)
    bench()
    # Large coil plane is vertical; its field direction is along its central axis.
    stand(-1.95, 0.66, 4.7)
    clamp(-1.95, 0.66, 2.65, -0.82, 0.25)
    cyl("Large circular coil former", (0.02, 0.40, 2.67), 1.34, 0.12, blue, rotation=(math.pi / 2, 0, 0))
    # Hollow the visible face visually with concentric copper windings and a central inset.
    cyl("Open coil center recess", (0.02, 0.325, 2.67), 1.07, 0.01, white, rotation=(math.pi / 2, 0, 0))
    for radius in (1.11, 1.17, 1.23, 1.29):
        torus("Field coil copper winding", (0.02, 0.30, 2.67), radius, 0.022, gold, normal=(0, 1, 0))
    # Search coil about a vertical axis, centered inside the field coil.
    # Tilt of its plane is visible; its induced voltage is read on the CRO.
    angle = math.radians(36)
    normal = (math.sin(angle), math.cos(angle), 0)
    for radius in (0.51, 0.56, 0.61):
        torus("Tilting search coil copper turns", (0.01, -0.05, 2.67), radius, 0.018, copper, normal=normal)
    rod("Search coil vertical pivot", (0.01, -0.05, 1.86), (0.01, -0.05, 3.46), 0.028, metal)
    cube("Search-coil clamp base", (0.01, -0.05, 1.82), (0.51, 0.43, 0.16), dark_metal)
    line("Field coil supply red lead", [(-0.13, 0.38, 1.37), (-0.48, 1.28, 0.66), (-1.55, 1.5, 0.43)], 0.025, red)
    line("Field coil supply black lead", [(0.17, 0.38, 1.37), (0.28, 1.3, 0.65), (-1.2, 1.5, 0.43)], 0.025, rubber)
    cube("AC low-voltage source", (-2.1, 1.30, 0.36), (1.1, 0.7, 0.60), plastic)
    text_object("AC source label", "AC", (-2.09, 0.90, 0.37), 0.18, white)
    # The CRO is separate and connects only to the search coil.
    cube("Oscilloscope case", (2.85, 0.25, 1.35), (2.0, 0.73, 1.62), plastic)
    cube("Oscilloscope luminous screen", (2.76, -0.145, 1.47), (1.28, 0.04, 0.92), dark_metal, 0.035)
    # Trace on the front screen: a sine-like polyline facing the camera.
    wave = []
    for i in range(33):
        x = 2.18 + 1.16 * i / 32
        z = 1.47 + 0.24 * math.sin(i * math.pi / 8)
        wave.append((x, -0.177, z))
    line("Oscilloscope AC waveform", wave, 0.014, liquid)
    for x in (3.60, 3.80):
        cyl("Oscilloscope control knob", (x, -0.18, 1.48), 0.065, 0.06, metal, rotation=(math.pi / 2, 0, 0))
    line("Search coil signal lead", [(0.02, -0.09, 2.06), (0.57, -0.83, 0.88), (1.52, -1.07, 0.71), (2.33, -0.16, 1.02)], 0.017, dark_metal)
    save("rp11-search-coil.png")


def resistivity_wire():
    """AQA RP5: series ammeter, parallel voltmeter across a selected wire length."""
    clear()
    studio(target=(0, 0, 0.55), eye=(6.4, -9.5, 6.2), scale=8.8)
    bench(width=8.3, depth=4.8)

    # The resistance wire is straight and parallel to a metre rule. The left
    # crocodile clip fixes the electrical zero; the red probe selects L = 0.60 m.
    left, right, selected = -2.75, 2.45, 0.37
    cube("Metre rule", (-0.15, 0.86, 0.24), (5.62, 0.29, 0.15), white, 0.025)
    for i in range(51):
        x = left + i * (right - left) / 50
        tick = 0.13 if i % 10 == 0 else 0.075 if i % 5 == 0 else 0.045
        rod("Ruler millimetre and centimetre graduation", (x, 0.87, 0.33), (x, 0.87 - tick, 0.33), 0.007, dark_metal, 8)
    for cm, x in ((0, left), (20, -1.71), (40, -0.67), (60, selected), (80, 1.41), (100, right)):
        text_object("Ruler numeric mark", str(cm), (x, 0.99, 0.337), 0.10, dark_metal, rotation=(0, 0, 0))
    cube("Insulating wire support", (-0.15, 0.45, 0.39), (5.62, 0.14, 0.17), dark_metal, 0.02)
    rod("Straight test wire", (left, 0.45, 0.50), (right, 0.45, 0.50), 0.022, copper)
    for x, name in ((left, "Fixed crocodile clip"), (right, "Wire end terminal")):
        cube(name, (x, 0.45, 0.56), (0.26, 0.22, 0.16), dark_metal, 0.018)
    # A movable voltmeter probe touches the wire at the 60 cm graduation.
    cube("Movable contact probe body", (selected, 0.44, 0.88), (0.18, 0.23, 0.23), red, 0.025)
    rod("Movable contact needle", (selected, 0.44, 0.76), (selected, 0.44, 0.52), 0.025, metal)
    rod("Selected length indicator", (left, 0.13, 0.45), (selected, 0.13, 0.45), 0.012, liquid, 12)

    # Three separate instruments. Their leads are physically modelled so the
    # ammeter is in the main series loop, and the voltmeter is a separate branch
    # across only the fixed clip and movable probe, not across the whole wire.
    cube("Low voltage DC supply", (-2.40, -1.25, 0.35), (1.15, 0.76, 0.56), plastic)
    cube("Supply display", (-2.42, -1.65, 0.43), (0.53, 0.03, 0.18), liquid, 0.02)
    text_object("Supply label", "DC", (-2.42, -1.68, 0.35), 0.14, dark_metal)
    cube("Series ammeter", (-0.75, -1.25, 0.35), (1.04, 0.76, 0.56), plastic)
    cube("Ammeter screen", (-0.75, -1.65, 0.43), (0.53, 0.03, 0.18), liquid, 0.02)
    text_object("Ammeter label", "A", (-0.75, -1.68, 0.35), 0.15, dark_metal)
    cube("Parallel voltmeter", (1.15, -1.25, 0.35), (1.04, 0.76, 0.56), plastic)
    cube("Voltmeter screen", (1.15, -1.65, 0.43), (0.53, 0.03, 0.18), liquid, 0.02)
    text_object("Voltmeter label", "V", (1.15, -1.68, 0.35), 0.15, dark_metal)
    # Series path: PSU+ -> A -> left clip -> resistance wire -> right end -> PSU-.
    line("Series supply to ammeter positive", [(-2.65, -1.66, 0.47), (-2.25, -2.04, 0.55), (-1.22, -2.03, 0.55), (-0.98, -1.67, 0.47)], 0.018, red)
    line("Series ammeter to fixed clip", [(-0.53, -1.67, 0.47), (-0.36, -1.91, 0.53), (-2.91, -0.12, 0.68), (left, 0.45, 0.59)], 0.018, rubber)
    line("Series wire end to supply negative", [(right, 0.45, 0.59), (2.91, 0.12, 0.58), (2.84, -2.13, 0.52), (-1.96, -2.15, 0.54), (-2.15, -1.66, 0.47)], 0.018, rubber)
    # High resistance voltmeter branches to the two selected contact points.
    line("Voltmeter negative to fixed contact", [(0.91, -1.67, 0.47), (0.65, -1.82, 0.78), (-2.92, -0.39, 0.79), (left, 0.45, 0.59)], 0.015, blue)
    line("Voltmeter positive to movable probe", [(1.38, -1.67, 0.47), (1.80, -0.58, 0.67), (selected, 0.24, 0.99), (selected, 0.44, 0.88)], 0.016, red)

    # Micrometer is shown away from the energised circuit because diameter is
    # measured separately at several points and orientations along the wire.
    line("Micrometer C frame", [(2.9, 1.31, 0.35), (3.33, 1.31, 0.45), (3.52, 1.31, 0.86), (3.45, 1.31, 1.23), (3.08, 1.31, 1.36)], 0.068, dark_metal)
    rod("Micrometer anvil", (3.04, 1.31, 1.30), (2.82, 1.31, 1.30), 0.044, metal)
    rod("Micrometer spindle", (2.18, 1.31, 1.30), (2.66, 1.31, 1.30), 0.047, metal)
    cyl("Micrometer thimble", (2.17, 1.31, 1.30), 0.17, 0.42, metal, rotation=(0, math.pi / 2, 0))
    rod("Separate sample for diameter", (2.73, 1.20, 1.19), (2.73, 1.42, 1.41), 0.013, copper)

    save("rp05-resistivity-wire.png")


def young_modulus():
    """AQA RP4: matched reference and loaded test wires with a levelled vernier."""
    clear()
    studio(target=(0, 0, 2.65), eye=(7.2, -11.4, 7.4), scale=9.7)
    bench(width=8.3, depth=4.3)

    # A single rigid overhead support carries two independent, parallel wires.
    for x in (-2.45, 2.45):
        stand(x, 0.62, 5.43)
    cube("Rigid overhead support", (0, 0.62, 5.28), (5.05, 0.42, 0.25), metal, 0.035)
    for x in (-0.92, 0.92):
        cube("Upper wire clamp", (x, 0.41, 5.06), (0.32, 0.30, 0.32), dark_metal, 0.025)
        rod("Long suspended wire", (x, 0.38, 4.91), (x, 0.38, 1.25), 0.014, copper, 12)
        cube("Lower wire grip", (x, 0.38, 1.21), (0.20, 0.18, 0.20), dark_metal, 0.018)
        rod("Mass hanger stem", (x, 0.38, 1.12), (x, 0.38, 0.48), 0.022, metal)
        cyl("Mass hanger tray", (x, 0.38, 0.48), 0.31, 0.065, metal)

    # The reference hanger stays at its initial load. Only the test hanger
    # receives extra slotted masses during a loading run.
    for z in (0.58, 0.69):
        cyl("Fixed reference preload", (-0.92, 0.38, z), 0.25, 0.082, dark_metal)
    for z in (0.58, 0.69, 0.80, 0.91, 1.02):
        cyl("Added test-wire load", (0.92, 0.38, z), 0.25, 0.082, dark_metal)

    # Travelling scale spans the two wires. A spirit level and adjusting screw
    # let the observer bring the bridge horizontal before reading the vernier.
    cube("Vernier comparison bridge", (0, 0.16, 2.17), (2.18, 0.26, 0.19), white, 0.022)
    cube("Reference-wire scale mount", (-0.92, 0.24, 2.17), (0.25, 0.28, 0.30), metal)
    cube("Test-wire sliding mount", (0.92, 0.24, 2.17), (0.25, 0.28, 0.30), dark_metal)
    for i in range(21):
        x = -0.73 + i * 0.073
        z0 = 2.275
        z1 = z0 + (0.095 if i % 5 == 0 else 0.048)
        rod("Vernier graduation", (x, 0.01, z0), (x, 0.01, z1), 0.005, dark_metal, 6)
    cube("Vernier moving cursor", (0.56, -0.035, 2.20), (0.18, 0.045, 0.30), red, 0.015)
    rod("Fine adjustment screw", (0.98, 0.05, 2.17), (1.32, 0.05, 2.17), 0.046, metal)
    cyl("Adjustment knob", (1.35, 0.05, 2.17), 0.105, 0.11, dark_metal, rotation=(0, math.pi / 2, 0))
    cube("Spirit level housing", (-0.03, -0.075, 2.56), (1.08, 0.30, 0.25), dark_metal, 0.045)
    cube("Spirit level vial", (-0.03, -0.24, 2.57), (0.80, 0.04, 0.14), liquid, 0.055)
    cube("Centred bubble", (-0.03, -0.27, 2.57), (0.18, 0.015, 0.095), white, 0.045)
    for x in (-0.19, 0.13):
        rod("Bubble centre mark", (x, -0.277, 2.49), (x, -0.277, 2.65), 0.006, dark_metal, 6)

    # Diameter is measured separately at several positions and orientations.
    line("Micrometer C frame", [(2.74, -1.03, 0.40), (3.20, -1.03, 0.49), (3.43, -1.03, 0.90), (3.34, -1.03, 1.24), (2.96, -1.03, 1.35)], 0.063, dark_metal)
    rod("Micrometer anvil", (2.92, -1.03, 1.30), (2.70, -1.03, 1.30), 0.044, metal)
    rod("Micrometer spindle", (2.09, -1.03, 1.30), (2.55, -1.03, 1.30), 0.046, metal)
    cyl("Micrometer thimble", (2.08, -1.03, 1.30), 0.17, 0.42, metal, rotation=(0, math.pi / 2, 0))
    rod("Separate wire sample", (2.64, -1.16, 1.18), (2.64, -0.91, 1.42), 0.012, copper)

    save("rp04-young-modulus.png")
    # Preserve the real geometry for the browser's orbitable WebGL view.
    bpy.ops.export_scene.gltf(
        filepath=os.path.join(OUT, "rp04-young-modulus.glb"),
        export_format="GLB",
        export_yup=False,
        export_apply=True,
        export_cameras=False,
        export_lights=False,
    )


if SELECT in ("all", "rp08"):
    boyle()
if SELECT in ("all", "rp10"):
    magnetic_force()
if SELECT in ("all", "rp11"):
    search_coil()
if SELECT in ("all", "rp05"):
    resistivity_wire()
if SELECT in ("all", "rp04"):
    young_modulus()
