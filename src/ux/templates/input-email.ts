import {
	type InputEmailInput,
	inputEmailSchema,
} from "../schemas/input-email.js";
import type { BuildResult, Locale } from "../types.js";
import { buildInputText } from "./input-text.js";

export function buildInputEmail(
	input: InputEmailInput,
	locale: Locale,
): BuildResult {
	const params = inputEmailSchema.parse(input);
	return buildInputText({ ...params, type: "email" }, locale);
}
