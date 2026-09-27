import { z } from "zod";

/**
 * The validation contract returned by validate_html and embedded in every
 * HTML-producing tool's output. The TS types are derived from these schemas.
 */
export const ValidationIssueSchema = z.object({
	ruleId: z.string(),
	severity: z.enum(["error", "warning"]),
	message: z.object({ en: z.string(), de: z.string() }),
	selectorHint: z.string().optional(),
});

export const ValidationResultSchema = z.object({
	ok: z.boolean(),
	issues: z.array(ValidationIssueSchema).default([]),
});

export type ValidationIssue = z.infer<typeof ValidationIssueSchema>;
export type ValidationResult = z.infer<typeof ValidationResultSchema>;
