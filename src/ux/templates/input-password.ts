import {
	type InputPasswordInput,
	inputPasswordSchema,
} from "../schemas/input-password.js";
import type { BuildResult, Locale } from "../types.js";
import { buildInputText } from "./input-text.js";

export function buildInputPassword(
	input: InputPasswordInput,
	locale: Locale,
): BuildResult {
	const params = inputPasswordSchema.parse(input);
	return buildInputText({ ...params, type: "password" }, locale);
}
