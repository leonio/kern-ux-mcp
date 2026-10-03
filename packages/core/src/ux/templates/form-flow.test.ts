import { parse } from "node-html-parser";
import { describe, expect, it } from "vitest";

import {
	callHandler,
	createRegistry,
	type RenderedToolResult,
} from "../../test-support/tools.js";
import { createTools } from "../tools.js";
import { validateHtmlStrict } from "../validate.js";
import { buildFormFlow } from "./form-flow.js";

const FOUR_STEPS = [
	{
		label: "Persönliche Daten",
		contentBlocks: [{ kind: "text" as const, text: "Vorname, Nachname" }],
	},
	{
		label: "Einkommensnachweise",
		contentBlocks: [
			{ kind: "text" as const, text: "Gehaltsnachweise hochladen" },
		],
	},
	{
		label: "Wohnsituation",
		contentBlocks: [{ kind: "text" as const, text: "Aktuelle Adresse" }],
	},
	{
		label: "Zusammenfassung",
		contentBlocks: [
			{ kind: "text" as const, text: "Bitte prüfen Sie Ihre Angaben" },
		],
	},
];

describe("buildFormFlow", () => {
	it("renders step 1 of 4 with 25% progress", () => {
		const result = buildFormFlow(
			{ currentStep: 1, steps: FOUR_STEPS, showProgress: true },
			"de",
		);

		// Progress value should be 25
		expect(result.html).toContain('value="25"');
		expect(result.html).toContain("Schritt 1 von 4");

		// Only step 1 content rendered
		expect(result.html).toContain("Vorname, Nachname");
		expect(result.html).not.toContain("Gehaltsnachweise hochladen");
		expect(result.html).not.toContain("Aktuelle Adresse");
		expect(result.html).not.toContain("Bitte prüfen Sie Ihre Angaben");

		// Tasklist status badges: step 1 = info/Aktuell, steps 2-4 = warning/Offen
		expect(result.html).toContain("kern-badge--info");
		expect(result.html).toContain("Aktuell");

		// data-step attribute
		expect(result.html).toContain('data-step="1"');
		expect(result.warnings).toHaveLength(0);
	});

	it("renders step 3 of 4 with correct status derivation", () => {
		const result = buildFormFlow(
			{ currentStep: 3, steps: FOUR_STEPS, showProgress: true },
			"de",
		);

		// Progress value should be 75
		expect(result.html).toContain('value="75"');
		expect(result.html).toContain("Schritt 3 von 4");

		// Only step 3 content rendered
		expect(result.html).toContain("Aktuelle Adresse");
		expect(result.html).not.toContain("Vorname, Nachname");

		// Steps 1-2 should be success/Erledigt, step 3 = info/Aktuell, step 4 = warning/Offen
		expect(result.html).toContain("kern-badge--success");
		expect(result.html).toContain("Erledigt");
		expect(result.html).toContain("kern-badge--info");
		expect(result.html).toContain("kern-badge--warning");
		expect(result.html).toContain("Offen");

		expect(result.html).toContain('data-step="3"');
	});

	it("clamps currentStep exceeding steps.length to last step", () => {
		const result = buildFormFlow(
			{ currentStep: 99, steps: FOUR_STEPS, showProgress: true },
			"de",
		);

		// Should clamp to step 4
		expect(result.html).toContain('value="100"');
		expect(result.html).toContain("Schritt 4 von 4");
		expect(result.html).toContain("Bitte prüfen Sie Ihre Angaben");
		expect(result.html).toContain('data-step="4"');

		// Warning about clamping
		expect(result.warnings).toContainEqual(
			expect.stringContaining("clamped to 4"),
		);
	});

	it("propagates headingLevel to tasklist heading", () => {
		const result = buildFormFlow(
			{ currentStep: 1, steps: FOUR_STEPS, headingLevel: 3 },
			"de",
		);

		// Tasklist heading should be h3, not the default h2
		expect(result.html).toContain("<h3 ");
		expect(result.html).not.toContain("<h2 ");
	});

	it("hides progress bar when showProgress is false", () => {
		const result = buildFormFlow(
			{ currentStep: 1, steps: FOUR_STEPS, showProgress: false },
			"de",
		);

		// No progress element
		expect(result.html).not.toContain("<progress");
		expect(result.html).not.toContain("kern-progress");

		// Tasklist and step content still present
		expect(result.html).toContain("kern-task-list");
		expect(result.html).toContain("Vorname, Nachname");
	});

	it("renders navigation buttons with correct placement", () => {
		// Step 1: only next button (no back)
		const step1 = buildFormFlow(
			{
				currentStep: 1,
				steps: FOUR_STEPS,
				navigation: {
					backLabel: "Zurück",
					nextLabel: "Weiter",
					submitLabel: "Absenden",
				},
			},
			"de",
		);
		expect(step1.html).toContain("Weiter");
		expect(step1.html).not.toContain("Zurück");
		expect(step1.html).not.toContain("Absenden");

		// Step 2: back + next
		const step2 = buildFormFlow(
			{
				currentStep: 2,
				steps: FOUR_STEPS,
				navigation: {
					backLabel: "Zurück",
					nextLabel: "Weiter",
					submitLabel: "Absenden",
				},
			},
			"de",
		);
		expect(step2.html).toContain("Zurück");
		expect(step2.html).toContain("Weiter");
		expect(step2.html).not.toContain("Absenden");

		// Last step: back + submit (no next)
		const lastStep = buildFormFlow(
			{
				currentStep: 4,
				steps: FOUR_STEPS,
				navigation: {
					backLabel: "Zurück",
					nextLabel: "Weiter",
					submitLabel: "Absenden",
				},
			},
			"de",
		);
		expect(lastStep.html).toContain("Zurück");
		expect(lastStep.html).toContain("Absenden");
		expect(lastStep.html).not.toContain("Weiter");
		// Submit button uses type="submit"
		expect(lastStep.html).toContain('type="submit"');
	});

	it("omits navigation section entirely when navigation is undefined", () => {
		const result = buildFormFlow({ currentStep: 1, steps: FOUR_STEPS }, "de");

		expect(result.html).not.toContain("data-step-navigation");
	});

	it("uses English labels when locale is en", () => {
		const result = buildFormFlow(
			{ currentStep: 2, steps: FOUR_STEPS, showProgress: true },
			"en",
		);

		expect(result.html).toContain("Completed");
		expect(result.html).toContain("Current");
		expect(result.html).toContain("Pending");
		expect(result.html).toContain("Step 2 of 4");
		expect(result.html).toContain("Progress");
	});

	it("allows statusText override per step", () => {
		const steps = [
			{ label: "Schritt A", statusText: "Geprüft" },
			{ label: "Schritt B", statusText: "In Bearbeitung" },
		];

		const result = buildFormFlow({ currentStep: 2, steps }, "de");

		expect(result.html).toContain("Geprüft");
		expect(result.html).toContain("In Bearbeitung");
		// Default labels should NOT appear
		expect(result.html).not.toContain("Erledigt");
		expect(result.html).not.toContain("Aktuell");
	});
});

describe("buildFormFlow: form, buttons, headings, all steps", () => {
	const NAVIGATION = {
		backLabel: "Zurück",
		nextLabel: "Weiter",
		submitLabel: "Absenden",
	};

	it("puts the steps and navigation in a form, and the step list and progress outside it", () => {
		const html = buildFormFlow(
			{
				currentStep: 2,
				steps: FOUR_STEPS,
				navigation: NAVIGATION,
				action: "/antrag",
			},
			"de",
		).html;
		const flow = parse(html).querySelector("[data-form-flow]");
		const form = flow?.querySelector("form");

		expect(form?.getAttribute("action")).toBe("/antrag");
		expect(form?.getAttribute("method")).toBe("post");
		expect(form?.hasAttribute("novalidate")).toBe(true);
		expect(form?.querySelector("[data-step]")).not.toBeNull();
		expect(form?.querySelector("[data-step-navigation]")).not.toBeNull();
		expect(form?.querySelector(".kern-task-list")).toBeNull();
		expect(form?.querySelector("progress")).toBeNull();
		expect(flow?.querySelector(".kern-task-list")).not.toBeNull();
	});

	it("renders KERN buttons, and next submits the step", () => {
		const html = buildFormFlow(
			{ currentStep: 2, steps: FOUR_STEPS, navigation: NAVIGATION },
			"de",
		).html;
		const buttons = parse(html).querySelectorAll("button");

		expect(html).not.toContain("kern-button");
		expect(
			buttons.map((button) => [
				button.getAttribute("type"),
				button.getAttribute("class"),
				button.querySelector(".kern-label")?.text,
			]),
		).toEqual([
			["button", "kern-btn kern-btn--secondary", "Zurück"],
			["submit", "kern-btn kern-btn--primary", "Weiter"],
		]);
	});

	it("keeps the form heading apart from the step list heading", () => {
		const root = parse(
			buildFormFlow(
				{ currentStep: 1, steps: FOUR_STEPS, heading: "Wohngeldantrag" },
				"de",
			).html,
		);

		expect(root.querySelector("h2")?.text).toBe("Wohngeldantrag");
		expect(root.querySelector(".kern-task-list h3")?.text).toBe("Fortschritt");
	});

	it("uses the given step list heading", () => {
		const root = parse(
			buildFormFlow(
				{ currentStep: 1, steps: FOUR_STEPS, tasklistHeading: "Ihre Schritte" },
				"de",
			).html,
		);

		expect(root.querySelector(".kern-task-list h2")?.text).toBe(
			"Ihre Schritte",
		);
	});

	it("renders every step with renderAllSteps, the inactive ones hidden", () => {
		const html = buildFormFlow(
			{
				currentStep: 2,
				steps: FOUR_STEPS,
				navigation: NAVIGATION,
				renderAllSteps: true,
			},
			"de",
		).html;
		const steps = parse(html).querySelectorAll("[data-step]");

		expect(steps.map((step) => step.getAttribute("data-step"))).toEqual([
			"1",
			"2",
			"3",
			"4",
		]);
		expect(steps.map((step) => step.hasAttribute("hidden"))).toEqual([
			true,
			false,
			true,
			true,
		]);
		expect(
			steps[0]?.querySelectorAll("button").map((b) => b.text.trim()),
		).toEqual(["Weiter"]);
		expect(
			steps[1]?.querySelectorAll("button").map((b) => b.getAttribute("type")),
		).toEqual(["button", "button"]);
		expect(
			steps[3]?.querySelectorAll("button").map((b) => b.getAttribute("type")),
		).toEqual(["button", "submit"]);
		expect(parse(html).querySelectorAll("form")).toHaveLength(1);
		// A flex class on the step itself would override hidden; the stack is inside.
		expect(steps.map((step) => step.getAttribute("class"))).toEqual(
			Array(4).fill(undefined),
		);
		expect(steps[0]?.firstElementChild?.getAttribute("class")).toBe(
			"kern-flex kern-flex-col kern-gap-lg",
		);
	});

	it("summarises only the active step's field errors", () => {
		const errorStep = (name: string) => ({
			label: name,
			contentBlocks: [
				{
					kind: "field" as const,
					field: {
						type: "text" as const,
						name,
						label: name,
						error: "Pflichtfeld",
					},
				},
			],
		});
		const html = buildFormFlow(
			{
				currentStep: 2,
				steps: [errorStep("eins"), errorStep("zwei")],
				renderAllSteps: true,
				errorSummary: {},
			},
			"de",
		).html;
		const links = parse(html).querySelectorAll(".kern-alert a");

		expect(links.map((link) => link.text)).toEqual(["zwei: Pflichtfeld"]);
		expect(validateHtmlStrict(html).issues).toEqual([]);
	});

	it("escapes step labels, status texts and headings", () => {
		const text = `<b>"A" & 'B'</b>`;
		const html = buildFormFlow(
			{
				currentStep: 1,
				heading: text,
				tasklistHeading: text,
				steps: [{ label: text, statusText: text }, { label: "Zwei" }],
			},
			"de",
		).html;

		expect(html).not.toContain("<b>");
	});
});

describe("formFlow via render_composition", () => {
	it("renders formFlow as a content block kind", async () => {
		const tools = createTools(createRegistry());

		const tool = tools.getTool("render_composition");
		expect(tool).toBeDefined();

		const result = await callHandler<RenderedToolResult>(tool, {
			locale: "de",
			contentBlocks: [
				{
					kind: "formFlow",
					formFlow: {
						currentStep: 1,
						steps: [
							{
								label: "Schritt 1",
								contentBlocks: [{ kind: "text", text: "Erster Inhalt" }],
							},
							{
								label: "Schritt 2",
								contentBlocks: [{ kind: "text", text: "Zweiter Inhalt" }],
							},
						],
					},
				},
			],
		});

		expect(result.html).toContain("data-form-flow");
		expect(result.html).toContain("kern-task-list");
		expect(result.html).toContain("Erster Inhalt");
		expect(result.html).not.toContain("Zweiter Inhalt");
		expect(result.html).toContain('value="50"');
		expect(result.validation.ok).toBe(true);
	});
});
