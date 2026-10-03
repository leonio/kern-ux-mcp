/**
 * Reads a knowledge bundle from disk and checks it against the schema the
 * packer ships inside it (schema/knowledge-bundle.schema.json). The packer owns
 * that schema; this only applies it.
 */
import fs from "node:fs/promises";
import path from "node:path";

import ajv2020Module from "ajv/dist/2020.js";
import ajvFormatsModule from "ajv-formats";

const Ajv2020 = ajv2020Module.default;
const addFormats = ajvFormatsModule.default;

/** Where the packer puts its output schema inside the bundle. */
export const PACKER_SCHEMA_FILE = "schema/knowledge-bundle.schema.json";

export type BundleDir = {
	/** Every .json file, parsed, by its path relative to the bundle root (forward slashes). */
	json: Map<string, unknown>;
	/** Every file as it is, to copy without reformatting. */
	bytes: Map<string, Buffer>;
};

export async function readBundleDir(dir: string): Promise<BundleDir> {
	const json = new Map<string, unknown>();
	const bytes = new Map<string, Buffer>();
	const entries = await fs.readdir(dir, {
		recursive: true,
		withFileTypes: true,
	});

	for (const entry of entries) {
		if (!entry.isFile()) continue;
		const absolute = path.join(entry.parentPath, entry.name);
		const relative = path.relative(dir, absolute).split(path.sep).join("/");
		const content = await fs.readFile(absolute);
		bytes.set(relative, content);
		if (relative.endsWith(".json")) {
			try {
				json.set(relative, JSON.parse(content.toString("utf8")));
			} catch (error) {
				throw new Error(
					`${relative} isn't valid JSON: ${(error as Error).message}`,
				);
			}
		}
	}

	return {
		json: new Map([...json].sort(([a], [b]) => a.localeCompare(b))),
		bytes: new Map([...bytes].sort(([a], [b]) => a.localeCompare(b))),
	};
}

/**
 * The $defs entry of the packer's schema a file validates against, as its
 * schema describes, or undefined for files it doesn't cover (its schema copies).
 */
export function packerSchemaDef(relativePath: string): string | undefined {
	if (relativePath === "index.json") return "index";
	if (relativePath === "report.json") return "report";
	if (/^components\/[^/]+\.examples\.json$/.test(relativePath)) {
		return "examplesFile";
	}
	if (/^components\/[^/]+\.json$/.test(relativePath)) return "component";
	if (/^patterns\/[^/]+\.json$/.test(relativePath)) return "pattern";
	const foundation = /^foundations\/([^/]+)\.json$/.exec(relativePath)?.[1];
	if (foundation === undefined) return undefined;
	return ["icons", "classes", "utilities"].includes(foundation)
		? foundation
		: "foundation";
}

/** Problems as "file/path: message", at most three per file. */
export function checkAgainstPackerSchema(
	json: ReadonlyMap<string, unknown>,
): string[] {
	const schema = json.get(PACKER_SCHEMA_FILE);
	if (!schema) {
		return [
			`${PACKER_SCHEMA_FILE} is missing: a bundle carries the schema it was written against.`,
		];
	}

	const ajv = new Ajv2020({ allErrors: true, strict: false });
	addFormats(ajv);
	ajv.addSchema(schema as object, "bundle");

	const problems: string[] = [];
	for (const [file, document] of json) {
		const def = packerSchemaDef(file);
		if (!def) continue;
		const validate = ajv.getSchema(`bundle#/$defs/${def}`);
		if (!validate) {
			problems.push(`${file}: the packer's schema has no $defs/${def}.`);
			continue;
		}
		if (!validate(document)) {
			for (const error of (validate.errors ?? []).slice(0, 3)) {
				problems.push(`${file}${error.instancePath}: ${error.message}`);
			}
		}
	}
	return problems;
}
