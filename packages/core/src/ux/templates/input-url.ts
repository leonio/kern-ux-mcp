import { type InputUrlInput, inputUrlSchema } from "../schemas/input-url.js";
import type { BuildResult, Locale } from "../types.js";
import { buildInputText } from "./input-text.js";

export function buildInputUrl(
	input: InputUrlInput,
	locale: Locale,
): BuildResult {
	const params = inputUrlSchema.parse(input);
	return buildInputText({ ...params, type: "url" }, locale);
}
