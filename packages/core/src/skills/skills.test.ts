import { SkillCatalogError } from "@modelcontextprotocol/server/ext/skills";
import { describe, expect, it } from "vitest";

import { getCatalog } from "../mcp/catalog.js";
import { loadSkills } from "../mcp/skills.js";
import { byteLength } from "../resources/definition.js";
import { guides } from "../resources/guides.js";
import { loadRegistryFromManifest } from "../ux/registry.js";
import { FIELD_TYPES } from "../ux/schemas/field.js";
import type { Registry } from "../ux/types.js";
import { type KernSkillDefinition, skillFiles } from "./definition.js";
import { kernUxForms } from "./forms.js";

const { skills, resources } = getCatalog();

/** A SKILL.md stays small enough to load whole; the references hold the detail. */
const SKILL_MD_BUDGET_BYTES = 8_000;
/** A reference file, like a guide, stays small enough to read whole. */
const REFERENCE_BUDGET_BYTES = 16_000;

/** A copy of the registry, changed without touching the shared one. */
function registryWith(change: (copy: Registry) => void): Registry {
	const registry = loadRegistryFromManifest();
	const copy = {
		...registry,
		byId: new Map(registry.byId),
		foundations: new Map(registry.foundations),
	};
	change(copy);
	return copy;
}

function skill(name: string): KernSkillDefinition {
	const found = skills.find((candidate) => candidate.name === name);
	if (!found) throw new Error(`No skill ${name}.`);
	return found;
}

describe("skills", () => {
	it("has the forms skill", () => {
		expect(skills.map((definition) => definition.name)).toEqual([
			"kern-ux-forms",
		]);
	});

	it.each(skills.map((definition) => definition.name))(
		"gives %s a name and description the Skills extension accepts, kern-ux- first",
		(name) => {
			const { description } = skill(name);

			expect(name).toMatch(/^kern-ux(?:-[a-z0-9]+)+$/);
			expect(name.length).toBeLessThanOrEqual(64);
			expect(description).toMatch(/\bUse it when\b/);
			expect([...description].length).toBeLessThanOrEqual(1024);
		},
	);

	it.each(skills.map((definition) => definition.name))(
		"keeps %s within the budgets",
		async (name) => {
			const files = await skillFiles(skill(name));

			for (const [path, text] of Object.entries(files)) {
				expect(byteLength(text), path).toBeLessThanOrEqual(
					path === "SKILL.md" ? SKILL_MD_BUDGET_BYTES : REFERENCE_BUDGET_BYTES,
				);
			}
		},
	);

	it.each(skills.map((definition) => definition.name))(
		"links only files %s has",
		async (name) => {
			const files = await skillFiles(skill(name));

			for (const [path, text] of Object.entries(files)) {
				for (const [, target] of text.matchAll(/\]\(((?!https?:)[^)]+)\)/g)) {
					expect(Object.keys(files), `${path} links ${target}`).toContain(
						target,
					);
				}
			}
		},
	);

	it("loads every skill under strict validation", async () => {
		const catalog = await loadSkills(skills);

		expect(catalog.entries.map((entry) => entry.uri)).toEqual([
			"skill://kern-ux-forms/SKILL.md",
		]);
	});

	it("fails the load for a skill the extension would skip", async () => {
		const invalid: KernSkillDefinition = {
			name: "Kern_Forms",
			description: "Not a valid name.",
			content: async () => ({ body: "# Nope\n", references: {} }),
		};

		await expect(loadSkills([invalid])).rejects.toBeInstanceOf(
			SkillCatalogError,
		);
	});
});

describe("kern-ux-forms", () => {
	const forms = skill("kern-ux-forms");

	it.each([
		"SKILL.md",
		"references/inputs.md",
		"references/steps.md",
		"references/forms-guide.md",
	])("matches the snapshot of %s", async (path) => {
		const files = await skillFiles(forms);

		expect(Object.keys(files)).toContain(path);
		await expect(files[path]).toMatchFileSnapshot(
			`__snapshots__/kern-ux-forms/${path}`,
		);
	});

	it("builds the same files every time", async () => {
		// Hosts check each file against its digest, so every server process,
		// such as each HTTP replica, has to serve the same bytes.
		const registry = loadRegistryFromManifest();
		const fresh = kernUxForms(registry, guides(registry, getCatalog().tools));

		expect(await skillFiles(fresh)).toEqual(await skillFiles(forms));
	});

	it("starts SKILL.md with frontmatter that quotes its values", async () => {
		const { "SKILL.md": skillMd } = await skillFiles(forms);

		expect(skillMd).toMatch(
			/^---\nname: "kern-ux-forms"\ndescription: ".+"\nlicense: "EUPL-1.2"\n---\n\n# Build a KERN form\n/,
		);
	});

	it("has a section for every field type in the inputs reference", async () => {
		const { "references/inputs.md": inputs } = await skillFiles(forms);

		for (const type of FIELD_TYPES) {
			expect(inputs).toMatch(new RegExp(`^## .+: \`type: "${type}"\`$`, "m"));
		}
	});

	it("names the component to use instead by its title", async () => {
		const registry = registryWith((copy) => {
			const component = copy.byId.get("inputtext");
			if (!component) throw new Error("No inputtext.");
			copy.byId.set("inputtext", {
				...component,
				knowledge: {
					...component.knowledge,
					whenNotToUse: [
						{ text: "For several lines.", useInstead: "textarea" },
						{ text: "For a date." },
					],
				},
			});
		});
		const { references } = await kernUxForms(
			registry,
			guides(registry, getCatalog().tools),
		).content();

		expect(references["references/inputs.md"]).toContain(
			"Not for:\n\n- For several lines. Use Input Textarea instead.\n- For a date.\n",
		);
	});

	it.each([
		[
			"the form-inputs-overview page",
			(copy: Registry) => copy.foundations.delete("form-inputs-overview"),
			/form-inputs-overview/,
		],
		[
			"a component it describes",
			(copy: Registry) => copy.byId.delete("progress"),
			/describes progress/,
		],
	])("fails without %s", async (_, change, message) => {
		const registry = registryWith(change);

		await expect(
			kernUxForms(registry, guides(registry, getCatalog().tools)).content(),
		).rejects.toThrow(message);
	});

	it("fails without the forms guide", async () => {
		const served = resources.find((resource) => resource.name === "guides");
		if (!served) throw new Error("No guides.");

		await expect(
			kernUxForms(loadRegistryFromManifest(), {
				...served,
				read: async () => undefined,
			}).content(),
		).rejects.toThrow(/forms guide/);
	});

	it("carries the forms guide as it's served", async () => {
		const { "references/forms-guide.md": guide } = await skillFiles(forms);
		const served = resources.find((resource) => resource.name === "guides");

		expect(guide).toBe(await served?.read("forms"));
	});
});
