import { describe, expect, it } from "vitest";
import { buildTasklist } from "./tasklist.js";

describe("buildTasklist", () => {
	it("renders tasklist with numbered items", () => {
		const result = buildTasklist(
			{
				heading: "Aufgaben",
				items: [
					{
						title: "Aufgabe 1",
						href: "#",
						status: "Erledigt",
						statusType: "success",
					},
				],
			},
			"de",
		);

		expect(result.html).toContain('class="kern-task-list"');
		expect(result.html).toContain('class="kern-number"');
		expect(result.html).toContain("Aufgabe 1");
		expect(result.html).toContain("kern-badge--success");
	});
});
