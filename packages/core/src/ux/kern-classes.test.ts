import { describe, expect, it } from "vitest";

import { isKnownKernClass } from "./kern-classes.js";

describe("isKnownKernClass", () => {
	it.each([
		["a component class", "kern-btn--primary"],
		["an element class", "kern-form-input__input"],
		["a utility", "kern-gap-lg"],
		["a responsive utility", "kern-flex-row-md"],
		["a container grid column", "kern-col-md-6"],
		["a CSS grid utility", "kern-grid-cols-3-md"],
		["a class only KERN's examples use", "kern-accordion-group"],
	])("knows %s (%s)", (_label, name) => {
		expect(isKnownKernClass(name)).toBe(true);
	});

	it.each([
		["an invented background class", "kern-bg-subtle"],
		["a component KERN doesn't implement", "kern-tabs"],
		["a breakpoint on a class that has none", "kern-btn-md"],
		["a misspelling", "kern-buton"],
	])("doesn't know %s (%s)", (_label, name) => {
		expect(isKnownKernClass(name)).toBe(false);
	});
});
