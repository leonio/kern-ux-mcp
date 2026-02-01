import {
	type InputNumberInput,
	inputNumberSchema,
} from "../schemas/input-number.js";
import type { BuildResult, Locale } from "../types.js";
import { buildInputText } from "./input-text.js";

export function buildInputNumber(
	input: InputNumberInput,
	locale: Locale,
): BuildResult {
	const params = inputNumberSchema.parse(input);
	return buildInputText({ ...params, type: "number" }, locale);
}
