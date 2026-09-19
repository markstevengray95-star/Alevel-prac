import os, sys, trimesh

ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else "assets")

SPECS = {
    "rp01-standing-waves.glb": {
        "min_geom": 24,
        "must": ["signal generator", "vibration generator", "pulley", "mass hanger", "metre rule"],
    },
    "rp02-double-slit.glb": {
        "min_geom": 22,
        "must": ["laser", "double slit", "projection screen", "metre rule"],
    },
    "rp02-diffraction-grating.glb": {
        "min_geom": 26,
        "must": ["laser", "diffraction grating", "screen", "metre rule"],
    },
    "rp03-free-fall.glb": {
        "min_geom": 24,
        "must": ["release mechanism", "ball bearing", "light gate", "data logger", "metre rule"],
    },
    "rp03-free-fall-impact.glb": {
        "min_geom": 20,
        "must": ["mechanical release", "ball bearing", "impact", "data logger", "metre rule"],
    },
    "rp04-young-modulus.glb": {
        "min_geom": 50,
        "must": ["long suspended wire", "vernier comparison", "spirit level", "micrometer", "mass hanger"],
    },
    "rp05-resistivity-wire.glb": {
        "min_geom": 30,
        "must": ["ammeter", "voltmeter", "resistance wire", "sliding contact", "micrometer", "metre rule"],
    },
    "rp06-iv-characteristics.glb": {
        "min_geom": 30,
        "must": ["ammeter", "voltmeter", "variable resistor", "cell", "switch"],
        "must_not": ["filament lamp", "lamp bulb"],
    },
}

def names(scene):
    out = []
    out.extend(str(x).lower() for x in scene.geometry.keys())
    try:
        out.extend(str(x).lower() for x in scene.graph.nodes_geometry)
    except Exception:
        pass
    return out

for filename, spec in SPECS.items():
    path = os.path.join(ROOT, filename)
    if not os.path.exists(path):
        raise SystemExit(f"Missing photoreal model: {filename}")
    scene = trimesh.load(path, force="scene")
    geometry_count = len(scene.geometry)
    if geometry_count < spec["min_geom"]:
        raise SystemExit(f"{filename}: expected >= {spec['min_geom']} geometry parts, got {geometry_count}")
    ns = names(scene)
    for term in spec["must"]:
        if not any(term in n for n in ns):
            raise SystemExit(f"{filename}: missing expected apparatus name containing {term!r}")
    for term in spec.get("must_not", []):
        if any(term in n for n in ns):
            raise SystemExit(f"{filename}: obsolete/wrong apparatus still present: {term!r}")
    material_names = set()
    for geom in scene.geometry.values():
        mat = getattr(getattr(geom, "visual", None), "material", None)
        if mat is not None:
            material_names.add(str(getattr(mat, "name", "")))
    if len(material_names) < 5:
        raise SystemExit(f"{filename}: expected >=5 distinct materials, got {len(material_names)}")
    print(f"PASS {filename}: {geometry_count} parts, {len(material_names)} materials")

print("Photoreal Practicals 1-6 model audit passed.")
