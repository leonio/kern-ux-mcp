/**
 * A family of resources under one URI template with one variable, such as
 * kern://components/{id}. The server lists every value, completes the
 * variable and reads one value at a time. The content only changes with a
 * release, so a definition may build it once and keep it.
 */
export type KernResourceDefinition = {
	/** The registration name. */
	name: string;
	/** A URI template with exactly one variable, `variable`. */
	uriTemplate: string;
	variable: string;
	title: string;
	description: string;
	mimeType: string;
	/** Every resource of the family, for resources/list and completion. */
	entries(): Promise<readonly KernResourceEntry[]>;
	/** The text for one value of the variable; undefined for a value it doesn't serve. */
	read(value: string): Promise<string | undefined>;
};

export type KernResourceEntry = {
	uri: string;
	/** The variable's value in the URI. */
	value: string;
	title: string;
	description: string;
	/** The text's size in bytes, for the clients' pickers. */
	size: number;
};

/** The URI for one value of a definition's variable. */
export function resourceUri(
	definition: Pick<KernResourceDefinition, "uriTemplate" | "variable">,
	value: string,
): string {
	return definition.uriTemplate.replace(`{${definition.variable}}`, value);
}

export function byteLength(text: string): number {
	return new TextEncoder().encode(text).length;
}
