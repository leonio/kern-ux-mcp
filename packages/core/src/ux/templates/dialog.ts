import { LABELS } from "../i18n.js";
import { generateId } from "../id.js";
import { type DialogInput, DialogSchema } from "../schemas/dialog.js";
import type { BuildResult, Locale } from "../types.js";

/**
 * Build HTML for a KERN UX Dialog component.
 */
export function buildDialog(input: DialogInput, locale: Locale): BuildResult {
	const warnings: string[] = [];

	// Parse input to apply defaults
	const params = DialogSchema.parse(input);

	const id = params.id ?? generateId("dialog");
	const {
		title,
		body,
		bodyIsHtml,
		confirmLabel,
		confirmId,
		cancelLabel,
		tertiaryLabel,
		triggerLabel,
		triggerVariant,
		closeButtonLabel,
	} = params;

	const headingId = `${id}-title`;
	const confirmBtnId = confirmId ?? `${id}-confirm`;
	const closeBtnLabel = closeButtonLabel ?? LABELS.close[locale];

	// Build trigger button HTML (optional)
	let triggerHtml = "";
	if (triggerLabel) {
		const variant = triggerVariant ?? "primary";
		triggerHtml = `<button data-dialog-target="${id}" class="kern-btn kern-btn--${variant}">
    <span class="kern-label">${escapeHtml(triggerLabel)}</span>
</button>

`;
	}

	// Build body content
	const bodyContent = bodyIsHtml
		? body
		: `<p class="kern-body">${escapeHtml(body)}</p>`;

	// Build tertiary button if provided
	let tertiaryBtnHtml = "";
	if (tertiaryLabel) {
		tertiaryBtnHtml = `<button class="kern-btn kern-btn--tertiary" formmethod="dialog">
            <span class="kern-label">${escapeHtml(tertiaryLabel)}</span>
        </button>
        `;
	}

	const dialogHtml = `<dialog id="${id}" class="kern-dialog" aria-modal="true" aria-labelledby="${headingId}">
    <form>
        <header class="kern-dialog__header">
            <h2 class="kern-title kern-title--large" id="${headingId}">${escapeHtml(title)}</h2>
            <button class="kern-btn kern-btn--tertiary" formmethod="dialog">
                <span class="kern-icon kern-icon--close" aria-hidden="true"></span>
                <span class="kern-sr-only">${escapeHtml(closeBtnLabel)}</span>
            </button>
        </header>
        <section class="kern-dialog__body">
            ${bodyContent}
        </section>
        <footer class="kern-dialog__footer">
            ${tertiaryBtnHtml}<button class="kern-btn kern-btn--secondary" formmethod="dialog">
                <span class="kern-label">${escapeHtml(cancelLabel)}</span>
            </button>
            <button id="${confirmBtnId}" class="kern-btn kern-btn--primary" type="submit">
                <span class="kern-label">${escapeHtml(confirmLabel)}</span>
            </button>
        </footer>
    </form>
</dialog>`;

	const html = triggerHtml + dialogHtml;

	return { html, warnings };
}

/**
 * Escape HTML special characters.
 */
function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}
