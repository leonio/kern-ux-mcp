import { describe, expect, it } from "vitest";

import type { BuildResult } from "../types.js";
import { buildBadge } from "./badge.js";
import { buildBody } from "./body.js";
import { buildDescriptionList } from "./description-list.js";
import { buildGrid } from "./grid.js";
import { buildHeading } from "./heading.js";
import { buildLabel } from "./label.js";
import { buildLink } from "./link.js";
import { buildLists } from "./lists.js";
import { buildLoader } from "./loader.js";
import { buildPreline } from "./preline.js";
import { buildSubline } from "./subline.js";
import { buildTitle } from "./title.js";

const text = `<b>"A" & 'B'</b>`;
const escaped = "&lt;b&gt;&quot;A&quot; &amp; &#039;B&#039;&lt;/b&gt;";

/** Templates that put model text into the HTML, each given the same text in every field. */
describe("the model's text is escaped", () => {
	it.each<[string, () => BuildResult, number]>([
		["get_body", () => buildBody({ text }), 1],
		["get_heading", () => buildHeading({ text }), 1],
		["get_label", () => buildLabel({ text }), 1],
		["get_link (text and href)", () => buildLink({ text, href: text }), 2],
		["get_lists", () => buildLists({ text }), 2],
		["get_preline", () => buildPreline({ text }), 1],
		["get_subline", () => buildSubline({ text }), 1],
		["get_title", () => buildTitle({ text }), 1],
		[
			"get_descriptionlist",
			() => buildDescriptionList({ items: [{ key: text, value: text }] }),
			2,
		],
		["get_badge", () => buildBadge({ type: "info", text }, "de"), 1],
		["get_loader", () => buildLoader({ srText: text }, "de"), 1],
		[
			"get_grid's heading",
			() => buildGrid({ includeHeading: true, headingText: text }),
			1,
		],
	])("in %s", (_, build, count) => {
		const { html } = build();

		expect(html).not.toContain("<b>");
		expect(html.split(escaped)).toHaveLength(count + 1);
	});
});
