import fs from "node:fs/promises";
import path from "node:path";

import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";

import type { GuidanceOverlayManifest } from "../../src/ux/types.js";

const ID_ALIASES: Record<string, string> = {
	description_list: "descriptionlist",
	input_group: "inputgroup",
	task_list: "tasklist",
};

export const DEFAULT_OVERLAY_PATH = path.resolve(
	process.cwd(),
	"docs",
	"guidance-overlay.json",
);
export const DEFAULT_OVERLAY_SCHEMA_PATH = path.resolve(
	process.cwd(),
	"docs",
	"guidance-overlay.schema.json",
);

function normalizeComponentId(id: string) {
	return ID_ALIASES[id] ?? id;
}

export function normalizeOverlayComponentId(id: string) {
	const tokenizedId = id
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "");

	return normalizeComponentId(tokenizedId).replace(/_/g, "");
}

export async function loadValidatedGuidanceOverlay(options?: {
	overlayPath?: string;
	schemaPath?: string;
}): Promise<GuidanceOverlayManifest> {
	const overlayPath = options?.overlayPath ?? DEFAULT_OVERLAY_PATH;
	const schemaPath = options?.schemaPath ?? DEFAULT_OVERLAY_SCHEMA_PATH;

	let schemaText: string;
	let overlayText: string;

	try {
		[schemaText, overlayText] = await Promise.all([
			fs.readFile(schemaPath, "utf8"),
			fs.readFile(overlayPath, "utf8"),
		]);
	} catch (error) {
		throw new Error(
			`Failed to load guidance overlay inputs at ${overlayPath} and ${schemaPath}.`,
			{ cause: error as Error },
		);
	}

	let schemaJson: object;
	let overlayJson: GuidanceOverlayManifest;

	try {
		schemaJson = JSON.parse(schemaText) as object;
	} catch (error) {
		throw new Error(
			`Invalid JSON in guidance overlay schema at ${schemaPath}.`,
			{
				cause: error as Error,
			},
		);
	}

	try {
		overlayJson = JSON.parse(overlayText) as GuidanceOverlayManifest;
	} catch (error) {
		throw new Error(
			`Invalid JSON in guidance overlay payload at ${overlayPath}.`,
			{
				cause: error as Error,
			},
		);
	}

	const ajv = new Ajv2020({ allErrors: true, strict: false });
	addFormats(ajv);

	const validate = ajv.compile(schemaJson);
	if (!validate(overlayJson)) {
		const details = (validate.errors ?? [])
			.map(
				(issue) =>
					`${issue.instancePath || "/"} ${issue.message ?? "validation error"}`,
			)
			.join("\n");

		throw new Error(
			`Guidance overlay validation failed at ${overlayPath}:\n${details}`,
		);
	}

	const normalizedComponents: GuidanceOverlayManifest["components"] = {};
	for (const [rawId, guidance] of Object.entries(overlayJson.components)) {
		const normalizedId = normalizeOverlayComponentId(rawId);
		if (normalizedComponents[normalizedId]) {
			throw new Error(
				`Guidance overlay contains duplicate component ids after normalization: ${rawId} -> ${normalizedId}.`,
			);
		}

		normalizedComponents[normalizedId] = guidance;
	}

	return {
		...overlayJson,
		components: normalizedComponents,
	};
}
