# Practical Lab · AQA A-level Physics

An interactive study app for **all 12 AQA A-level Physics 7408 required practical activities**. Open [the app](https://markstevengray95-star.github.io/Alevel-prac/) or download this repository and open `index.html`. The app runs without a sign-in; your lab-book entries and simulation readings are saved in your browser on your device.

The practical library includes animated apparatus, controls for the specified variables, repeat measurements, tables, graphs, uncertainty guidance, quizzes and method coaching. Each practical has a direct link to its corresponding **official AQA apparatus set-up guide**. The lab book provides a suggested structure for a dated, contemporaneous record: aim, equipment/set-up, variables, method, safety, raw observations, processed data, calculations, graph, conclusion, evaluation, references and reflection. It separates imported *simulation practice* from your own laboratory readings, records corrections, offers a full-record HTML/print view, and supports JSON backup and restore. Draft ticks help organise writing; they do not represent a Practical Endorsement pass.

The **Completed example** view contains illustrative results for all 12 practicals, including repeated raw readings, processed tables, substituted calculations, graph interpretation, uncertainty and evaluation. Some practicals have multiple investigations (for example the three string sweeps, both SHM systems and both gas laws). These values are invented teaching examples, not student evidence.

Three optional Blender-rendered apparatus views complement the interactive diagrams for Practical 8 (Boyle syringe), Practical 10 (wire and top-pan balance) and Practical 11 (search coil and oscilloscope). They are illustrative geometry references; use the linked AQA guides and your school’s instructions for real equipment arrangements.

## AQA sources

- [AQA Physics 7408 practical assessment and required practical list](https://www.aqa.org.uk/subjects/physics/a-level/physics-7408/specification/practical-assessment)
- [AQA practical handbook](https://filestore.aqa.org.uk/resources/physics/AQA-7407-7408-PHBK.PDF)
- [AQA apparatus set-up guides for Practicals 1–12](https://www.aqa.org.uk/resources/science/as-and-a-level/physics-7407-7408/teach/practicals-apparatus-set-up-guides)
- [AQA measurements and their errors](https://www.aqa.org.uk/subjects/physics/a-level/physics-7408/specification/subject-content/measurements-and-their-errors)

The app supports learning and revision. School or college staff assess hands-on practical competence and set local safety procedures.

## Development and checks

The site is static HTML, CSS and JavaScript. GitHub Actions deploys the root directory to Pages and runs model and browser checks. Run the dependency-free checks locally with Node:

```bash
node tests/model-checks.js
node tests/audit-model-sweep.js
node tests/labbook-integrity.cjs
node tests/test-worked-examples-complete.cjs
```

Browser smoke tests in `tests/` run in the GitHub workflow. The Blender source for the optional apparatus views is in `tools/blender_apparatus.py`; the PNGs are in `assets/`.
