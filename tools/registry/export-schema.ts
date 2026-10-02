/**
 * Writes the registry contract as JSON Schema to docs/registry.schema.json, for
 * the external generator to validate its output against. A core test fails when
 * the file is out of date.
 *
 *   npm run registry:schema
 */
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { buildRegistryJsonSchema } from "../../packages/core/src/ux/registry.schema.js";

const OUTPUT = fileURLToPath(
	new URL("../../docs/registry.schema.json", import.meta.url),
);

await fs.writeFile(
	OUTPUT,
	`${JSON.stringify(buildRegistryJsonSchema(), null, "\t")}\n`,
	"utf8",
);
console.log(`Wrote ${OUTPUT}`);
