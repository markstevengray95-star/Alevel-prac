# Practical Lab · AQA A-level Physics

An interactive study app for **all 12 AQA A-level Physics 7408 required practical activities**. Open [the app](https://markstevengray95-star.github.io/Alevel-prac/) or download this repository and open `index.html`. The app runs without a sign-in; your lab-book entries and simulation readings are saved in your browser on your device.

The practical library includes animated apparatus, controls for the specified variables, repeat measurements, tables, graphs, uncertainty guidance, quizzes and method coaching. Each practical has a direct link to its corresponding **official AQA apparatus set-up guide**. The lab book provides a suggested structure for a dated, contemporaneous record: aim, equipment/set-up, variables, method, safety, raw observations, processed data, calculations, graph, conclusion, evaluation, references and reflection. It separates imported *simulation practice* from your own laboratory readings, records corrections, offers a full-record HTML/print view, and supports JSON backup and restore. Draft ticks help organise writing; they do not represent a Practical Endorsement pass.

The workbench uses a shared **sandbox animation runtime** across all 12 practicals. It targets smooth requestAnimationFrame motion, adapts the paint rate when a device is under load, preserves direct-manipulation controls while the SVG apparatus redraws, and keeps Run, Pause and Reset behaviour consistent. Students can drag/click supported apparatus, watch live readouts, record single readings or repeats, and compare how changing an independent variable affects the model.

## Experimental sandbox v4

Every required practical now has an optional experimental build workspace designed around the practical's AQA apparatus and technique coverage. It has three modes:

- **Guided** — start from a validated reference arrangement and explore the physics model.
- **Sandbox** — empty or rearrange the bench, place apparatus, make the required connections/alignments, calibrate measurement steps and test the setup.
- **Challenge** — build without the visible checklist; recording is held back until the simulated setup validation passes.

The sandbox keeps a practical-specific apparatus tray, draggable bench positions, connections/alignments, setup/calibration checks and optional hidden diagnostic faults. Practical 12 remains a simulation-only representation: the app does not provide instructions for handling an ionising-radiation source. The virtual activities support preparation and analysis; the AQA Practical Endorsement depends on real practical work and teacher assessment.

The **Lab tools** drawer adds the remaining advanced options without crowding the main workbench: virtual measurement instruments selected from the practical's AQA technique coverage, an oscilloscope/data-logger view where relevant, repeat and resolution uncertainty analysis, graph/error-bar and gradient-uncertainty tools, practical challenge/exam view, process feedback and a teacher/demonstration panel. These tools are collapsed by default and the practical action bars have been made more compact on desktop and mobile.

Three additional measurement tools support exploratory practical work:

- **Live sensor trace** — choose a numeric readout and watch it change during a run, with freeze/resume and clear controls.
- **Setup snapshots** — save and restore up to three apparatus/slider configurations for each practical and mode, useful for controlled comparisons.
- **Repeat-reading analysis** — automatically calculates the mean, range, half-range and percentage spread for the latest repeat set, while reminding students that real-lab instrument uncertainty must also be considered.

The **Completed example** view contains illustrative results for all 12 practicals, including repeated raw readings, processed tables, substituted calculations, graph interpretation, uncertainty and evaluation. Some practicals have multiple investigations (for example the three string sweeps, both SHM systems and both gas laws). These values are invented teaching examples, not student evidence.

Six Blender-rendered apparatus views complement the interactive diagrams for Practical 2 (Young double slits), Practical 4 (Young modulus twin-wire comparison), Practical 5 (resistivity wire, meter connections and micrometer), Practical 8 (Boyle syringe), Practical 10 (wire and top-pan balance) and Practical 11 (search coil and oscilloscope). Practicals 2 and 4 also import Blender-exported `.glb` geometry into an offline-ready WebGL viewer with rotate, zoom, reset and enlarged view controls. The Practical 2 apparatus view is schematic: real slit separation and projected fringes are magnified for visibility. The still image appears if WebGL is unavailable. These are illustrative geometry references; use the linked AQA guides and your school’s instructions for real equipment arrangements.

## AQA sources

- [AQA Physics 7408 practical assessment and required practical list](https://www.aqa.org.uk/subjects/physics/a-level/physics-7408/specification/practical-assessment)
- [AQA practical handbook](https://filestore.aqa.org.uk/resources/physics/AQA-7407-7408-PHBK.PDF)
- [AQA apparatus set-up guides for Practicals 1–12](https://www.aqa.org.uk/resources/science/as-and-a-level/physics-7407-7408/teach/practicals-apparatus-set-up-guides)
- [AQA measurements and their errors](https://www.aqa.org.uk/subjects/physics/a-level/physics-7408/specification/subject-content/measurements-and-their-errors)

The app supports learning and revision. School or college staff assess hands-on practical competence and set local safety procedures.

## Development and checks

The site is static HTML, CSS and JavaScript. GitHub Actions deploys the root directory to Pages and validates pull requests and pushes to `main`. The automated browser checks exercise every practical/mode, Run/Pause/Reset, readout recording, apparatus interactions, the circuit builder, Blender views, lab-book integrations, live traces, saved setups and repeat analysis.

The realistic-instruments-v6 browser regression opens and operates the new instrument controls, verifies micrometer/vernier, light-gate/logger, meter-range, oscilloscope and connector interactions, and then confirms the simulation clock and readouts remain valid.

The visuals-v5 browser regression checks every practical and investigation mode for its physics overlay, finite rendered values, preserved Run/Pause timing and duplicate UI controls.\n\nThe sandbox-v4 browser regression makes **three complete passes across all 12 practicals and every investigation mode**. It checks that the sandbox AQA apparatus-technique mapping matches each practical definition, every reference build reaches 100% validation, Challenge mode gates incomplete setups, diagnostic faults affect simulated measurements, and the uncertainty, graph, examination and teacher tools all integrate without invalid readouts or browser errors.

Run the dependency-free model checks locally with Node:

```bash
node tests/model-checks.js
node tests/audit-model-sweep.js
node tests/first-three-regression.cjs
node tests/practicals-456-regression.cjs
node tests/labbook-integrity.cjs
node tests/test-worked-examples-complete.cjs
```

Browser smoke tests in `tests/` run in the GitHub workflow. The Blender source for the optional apparatus views is in `tools/blender_apparatus.py`; the PNGs are in `assets/`.
