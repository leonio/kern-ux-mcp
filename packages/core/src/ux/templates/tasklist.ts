import { generateId } from "../id.js";
import { type TasklistInput, tasklistSchema } from "../schemas/tasklist.js";
import type { BuildResult, Locale } from "../types.js";

export function buildTasklist(
	input: TasklistInput,
	_locale: Locale,
): BuildResult {
	const params = tasklistSchema.parse(input);
	const warnings: string[] = [];

	const items = params.items
		.map((item, index) => {
			const titleId = generateId("task");
			const statusId = `${titleId}-status`;
			const number = params.numbered
				? `<span class="kern-number">${index + 1}</span>`
				: "";
			const titleHtml = item.href
				? `<a href="${item.href}" class="kern-link kern-link--stretched" aria-describedby="${statusId}">${item.title}</a>`
				: `<p class="kern-body">${item.title}</p>`;

			return `    <li class="kern-task-list__item">\n      ${number}\n      <div class="kern-task-list__title" id="${titleId}">\n        ${titleHtml}\n        <div class="kern-task-list__status" id="${statusId}">\n          <span class="kern-badge kern-badge--${item.statusType}">\n            <span class="kern-label kern-label--small">${item.status}</span>\n          </span>\n        </div>\n      </div>\n    </li>`;
		})
		.join("\n");

	const html = `<div class="kern-task-list">\n  <div class="kern-task-list__header">\n    <h2 class="kern-heading-medium">${params.heading}</h2>\n  </div>\n  <ul class="kern-task-list__list">\n${items}\n  </ul>\n</div>`;

	return { html, warnings };
}
