import { type InputDateInput, inputDateSchema } from "../schemas/input-date.js";
import type { BuildResult, Locale } from "../types.js";
import { buildInputText } from "./input-text.js";

export function buildInputDate(
	input: InputDateInput,
	locale: Locale,
): BuildResult {
	const params = inputDateSchema.parse(input);
	return buildInputText({ ...params, type: "date" }, locale);
}
