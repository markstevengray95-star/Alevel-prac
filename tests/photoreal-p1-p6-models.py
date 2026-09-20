import os, sys, re, trimesh

ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else "assets")

SPECS = {
    "rp01-standing-waves.glb": {
        "min_geom": 24,
        "must": ["signal generator", "vibration generator", "pulley", "mass hanger", "metre rule"],
        "rounded": ["signal generator", "vibration generator black body", "pulley black fork"],
    },
    "rp02-double-slit.glb": {
        "min_geom": 22,
        "must": ["laser", "double slit", "projection screen", "metre rule"],
        "rounded": ["laser mounting cradle", "double slit holder", "screen cast base"],
    },
    "rp02-diffraction-grating.glb": {
        "min_geom": 26,
        "must": ["laser", "diffraction grating", "screen", "metre rule"],
        "rounded": ["laser mounting cradle", "diffraction grating holder", "screen cast base"],
    },
    "rp03-free-fall.glb": {
        "min_geom": 24,
        "must": ["release mechanism", "ball bearing", "light gate", "data logger", "metre rule"],
        "rounded": ["release mechanism green housing", "light gate 1 weighted base", "data logger cream case"],
    },
    "rp03-free-fall-impact.glb": {
        "min_geom": 20,
        "must": ["mechanical release", "ball bearing", "impact", "data logger", "metre rule"],
        "rounded": ["mechanical release green housing", "impact pressure pad", "data logger cream case"],
    },
    "rp04-young-modulus.glb": {
        "min_geom": 50,
        "must": ["long suspended wire", "vernier comparison", "spirit level", "micrometer", "mass hanger"],
        "rounded": ["young modulus support left blue base", "vernier comparison bridge", "vernier moving cursor"],
    },
    "rp05-resistivity-wire.glb": {
        "min_geom": 30,
        "must": ["ammeter", "voltmeter", "resistance wire", "sliding contact", "micrometer", "metre rule"],
        "rounded": ["ammeter yellow case", "voltmeter yellow case", "sliding contact insulated body"],
    },
    "rp06-iv-characteristics.glb": {
        "min_geom": 30,
        "must": ["ammeter", "voltmeter", "variable resistor", "cell", "switch"],
        "rounded": ["ammeter yellow case", "variable resistor bakelite base", "cell holder white base", "switch black base"],
        "must_not": ["filament lamp", "lamp bulb"],
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
            raise SystemExit(f"{filename}: obsolete/wrong apparatus still present: {term!r}")
    # Guard against the old "everything is a box" regression.  A trimesh box has
    # only 8 vertices; the new smooth-front instrument cases have many curved
    # perimeter vertices.  For each key housing, require at least one matching
    # geometry with substantially more than cuboid complexity.
    geom_by_name = {norm(name): geom for name, geom in scene.geometry.items()}
    for term in spec.get("rounded", []):
        wanted = norm(term)
        matches = [geom for name, geom in geom_by_name.items() if wanted in name]
        if not matches:
            raise SystemExit(f"{filename}: missing rounded apparatus geometry containing {term!r}")
        max_vertices = max(len(getattr(geom, "vertices", [])) for geom in matches)
        if max_vertices < 24:
            raise SystemExit(
                f"{filename}: {term!r} regressed to primitive geometry "
                f"({max_vertices} vertices; expected >=24 for a rounded housing)"
            )
    material_names = set()
    for geom in scene.geometry.values():
        mat = getattr(getattr(geom, "visual", None), "material", None)
        if mat is not None:
            material_names.add(str(getattr(mat, "name", "")))
    if len(material_names) < 5:
        raise SystemExit(f"{filename}: expected >=5 distinct materials, got {len(material_names)}")
    print(f"PASS {filename}: {geometry_count} parts, {len(material_names)} materials")

print("Photoreal Practicals 1-6 model audit passed.")
