# KERN data import

The server doesn't read KERN's sources at runtime. Everything it knows about KERN components (names, options, documentation, accessibility notes, example HTML) comes from one file, `registry.json`, that ships inside the package. This page explains where that file comes from and how to update it.

> **Alpha:** this flow is being built in roadmap step R6 A. The `knowledge:import` command lands with R6 A2. Until then, use `registry:import` (see [Today](#today-registryimport)).

## How data flows in

```
KERN sources ──▶ knowledge packer ──▶ knowledge bundle ──▶ npm run knowledge:import ──▶ knowledge/      (checked in, dev only)
(kern-ux-plain,   (separate project)   (JSON + its schema)                         └──▶ registry.json  (shipped, read by the server)
 kern-ux.de docs,
 kern-react-kit)
```

- The **knowledge packer** is a separate project. It reads KERN's HTML/CSS implementation and the kern-ux.de docs, and writes a **knowledge bundle**: one English JSON document per component, plus foundations (icons, classes) and a report. The bundle includes its own JSON schema.
- This repo only **reads** the bundle. It never changes it.
- **`knowledge:import`** is a plain script with no AI in it. It checks the bundle, copies it into `knowledge/`, and generates `registry.json` from it.

## Import a new bundle

1. Get the new bundle directory from the packer.
2. Check it without changing anything:

   ```bash
   npm run knowledge:import -- ../path/to/bundle --dry-run
   ```

   It prints what would change, by component and section, and any problems.
3. If the checks pass, import it:

   ```bash
   npm run knowledge:import -- ../path/to/bundle
   ```

4. Run the tests and look at the snapshot changes: they show how the tools' output changed.

   ```bash
   npm test
   ```

5. Commit `knowledge/` and `packages/core/src/ux/registry.json` together, in one `feat:` or `fix:` commit that says which bundle you imported.

## What the checks reject

The import stops, and writes nothing, when:
- a file doesn't match the bundle's own schema;
- the bundle's major version isn't one this repo reads;
- a component that one of our tools renders is missing from the bundle;
- an example our tools pick by ID is missing;
- two KERN IDs map to the same ID of ours.

Fix the bundle (in the packer) or the mapping (in this repo), and run the import again.

## Today: `registry:import`

Until R6 A2 lands, `registry.json` is imported directly:

```bash
npm run registry:import -- path/to/registry.json --dry-run   # check only
npm run registry:import -- path/to/registry.json             # write
```

It checks the file against the registry contract (`npm run registry:schema` exports it) and against the component tools, prints what changes, and writes `packages/core/src/ux/registry.json`.

## Deeper reading

- [The knowledge bundle](https://github.com/leonio/kern-ux-mcp/blob/main/docs/plan-v2/knowledge-bundle.md): the design in full
- [R6 kickoff](https://github.com/leonio/kern-ux-mcp/blob/main/docs/plan-v2/r6-kickoff.md): the decisions and the steps
