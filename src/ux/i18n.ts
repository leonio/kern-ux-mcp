import type { Locale } from "./types.js";

export function pickLocale(locale: unknown): Locale {
	return locale === "en" ? "en" : "de";
}

export function t(
	locale: Locale,
	messages: { en: string; de: string },
): string {
	return locale === "en" ? messages.en : messages.de;
}

/**
 * Localized default labels for KERN UX components.
 * Access via `LABELS.key[locale]`.
 */
export const LABELS = {
	// Common actions
	close: { de: "Schließen", en: "Close" },
	cancel: { de: "Abbrechen", en: "Cancel" },
	confirm: { de: "Bestätigen", en: "Confirm" },
	save: { de: "Speichern", en: "Save" },
	delete: { de: "Löschen", en: "Delete" },
	edit: { de: "Bearbeiten", en: "Edit" },
	submit: { de: "Absenden", en: "Submit" },

	// Form labels
	optional: { de: "Optional", en: "Optional" },
	required: { de: "Pflichtfeld", en: "Required" },
	error: { de: "Fehler", en: "Error" },
	hint: { de: "Hinweis", en: "Hint" },

	// Alert type titles
	alertInfo: { de: "Hinweis", en: "Note" },
	alertSuccess: { de: "Erfolg", en: "Success" },
	alertWarning: { de: "Warnung", en: "Warning" },
	alertDanger: { de: "Fehler", en: "Error" },

	// Button defaults
	button: { de: "Button", en: "Button" },

	// Dialog defaults
	dialogTitle: { de: "Dialog", en: "Dialog" },

	// Loader
	loading: { de: "Wird geladen...", en: "Loading..." },
} as const;

export type LabelKey = keyof typeof LABELS;
