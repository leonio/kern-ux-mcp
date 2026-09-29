import { t } from "../i18n.js";
import {
	type KopfzeileRenderInput,
	kopfzeileRenderSchema,
} from "../schemas/kopfzeile.js";
import type { BuildResult, Locale } from "../types.js";
import { escapeHtml } from "./escape.js";

const DEFAULT_LABEL = {
	de: "Offizielle Website – Bundesrepublik Deutschland",
	en: "Official website – Federal Republic of Germany",
};

/** Build the KERN Kopfzeile, the CSS variant of the upstream component. */
export function buildKopfzeile(
	input: KopfzeileRenderInput,
	locale: Locale = "de",
): BuildResult {
	const params = kopfzeileRenderSchema.parse(input);
	const container = params.fluid ? "kern-container-fluid" : "kern-container";
	const label = params.label ?? t(locale, DEFAULT_LABEL);

	return {
		html: `<div class="kern-kopfzeile">
  <div class="${container}">
    <div class="kern-kopfzeile__content">
      <span class="kern-kopfzeile__flagge" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 16" style="max-width:24px">
          <path fill="#000" d="M0 .5h24v5.333H0z" />
          <path fill="red" d="M0 5.833h24v5.333H0z" />
          <path fill="#FACA2C" d="M0 11.167h24V16.5H0z" />
        </svg>
      </span>
      <span class="kern-kopfzeile__label">${escapeHtml(label)}</span>
    </div>
  </div>
</div>`,
		warnings: [],
	};
}
