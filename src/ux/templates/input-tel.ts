import { type InputTelInput, inputTelSchema } from "../schemas/input-tel.js";
import type { BuildResult, Locale } from "../types.js";
import { buildInputText } from "./input-text.js";

export function buildInputTel(
	input: InputTelInput,
	locale: Locale,
): BuildResult {
	const params = inputTelSchema.parse(input);
	return buildInputText({ ...params, type: "tel" }, locale);
}
