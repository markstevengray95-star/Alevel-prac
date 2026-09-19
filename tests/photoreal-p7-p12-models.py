import os, sys, re, trimesh

ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else "assets")

SPECS = {
    "rp07-pendulum.glb": {
        "min_geom": 20,
        "must": ["pendulum string", "pendulum bob", "fiducial marker", "metre rule", "stop clock"],
    },
    "rp07-spring.glb": {
        "min_geom": 20,
        "must": ["spring", "mass hanger", "fiducial marker", "metre rule", "stop clock"],
    },
    "rp08-boyle-syringe.glb": {
        "min_geom": 24,
        "must": ["gas syringe", "syringe plunger", "mass hanger", "micrometer", "stand"],
    },
    "rp08-charles-law.glb": {
        "min_geom": 20,
        "must": ["beaker", "capillary tube", "thermometer", "vertical ruler", "trapped air"],
    },
    "rp09-capacitor.glb": {
        "min_geom": 26,
        "must": ["capacitor", "resistor", "two-position switch", "voltmeter", "stop clock"],
    },
    "rp10-wire-balance.glb": {
        "min_geom": 30,
        "must": ["top-pan balance", "magnet", "current-carrying straight wire", "ammeter", "variable resistor"],
    },
    "rp11-search-coil.glb": {
        "min_geom": 35,
        "must": ["large circular coil", "search coil", "protractor", "oscilloscope", "ac low-voltage source"],
    },
    "rp12-inverse-square.glb": {
        "min_geom": 22,
        "must": ["virtual gm tube", "virtual scaler", "metre rule", "simulation source holder", "simulation source marker"],
        "must_not": ["real source handling", "radioactive source handling"],
    },
}

def norm(value):
    return re.sub(r"[^a-z0-9]+", "", str(value).lower())

def names(scene):
    out = []
    out.extend(norm(x) for x in scene.geometry.keys())
    try:
        out.extend(norm(x) for x in scene.graph.nodes_geometry)
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
        wanted = norm(term)
        if not any(wanted in n for n in ns):
            raise SystemExit(f"{filename}: missing expected apparatus name containing {term!r}")
    for term in spec.get("must_not", []):
        wanted = norm(term)
        if any(wanted in n for n in ns):
            raise SystemExit(f"{filename}: unsafe/incorrect apparatus naming present: {term!r}")
    material_names = set()
    for geom in scene.geometry.values():
        mat = getattr(getattr(geom, "visual", None), "material", None)
        if mat is not None:
            material_names.add(str(getattr(mat, "name", "")))
    if len(material_names) < 5:
        raise SystemExit(f"{filename}: expected >=5 distinct materials, got {len(material_names)}")
    print(f"PASS {filename}: {geometry_count} parts, {len(material_names)} materials")

print("Photoreal Practicals 7-12 model audit passed.")
