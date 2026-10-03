/**
 * One-line hints from KERN's guidance that tool descriptions carry, only where
 * they change which tool a model picks or how it uses it. The rule and the
 * steps are in .github/skills/tool-hints/SKILL.md; that skill writes them from
 * the knowledge bundle's text. Each records its source document in the bundle
 * and the inputHash of that document's knowledge text, so knowledge:import and
 * a test can tell when the source has changed.
 */
export type ToolHint = {
	/** One sentence, at most 80 characters, appended to the description. */
	text: string;
	/** The bundle document it was written from, relative to knowledge/. */
	source: string;
	/** provenance["knowledge.summary"].inputHash of that document. */
	inputHash: string;
};

export const TOOL_HINTS: Readonly<Record<string, ToolHint>> = {
	get_accordion: {
		text: "Several collapsible topics under headings; for a single one, get_disclosure.",
		source: "components/accordion.json",
		inputHash:
			"sha256:816f423ef0832fb258b8a765d77a575ae9196ed567b8c1effb8a8920eafd7dea",
	},
	get_button: {
		text: "For actions; to navigate to another page, use get_link.",
		source: "components/button.json",
		inputHash:
			"sha256:032e401650ff0f347a0cf0e75bb4446be75844b039e74309c01ab0257154265e",
	},
	get_checkbox: {
		text: "Several independent choices; for exactly one, use get_radio.",
		source: "components/checkboxes.json",
		inputHash:
			"sha256:0989095df40f0cfbda14e5d18fd9610b3b9ee009d2f23519dc850921386ff534",
	},
	get_descriptionlist: {
		text: "Terms with descriptions; to review form entries, use get_summary.",
		source: "components/description-list.json",
		inputHash:
			"sha256:a82ff91634b3ce37b631b59bc4b37a62130f72252a9f258a95a67d06febeb5d6",
	},
	get_details: {
		text: "One region of extra info shown on demand; for your own content, get_disclosure.",
		source: "components/details.json",
		inputHash:
			"sha256:4840c7e7d3dbfa019e0d72bf466a1f69c07a16e02bbcb83ab8575b883ac037bb",
	},
	get_heading: {
		text: "Page and section headings; inside cards, dialogs or forms, use get_title.",
		source: "components/heading.json",
		inputHash:
			"sha256:5f6080b15f7475909c28ba6eab3f271a39d219ca416cee95cfd20d6f47084374",
	},
	get_inputnumber: {
		text: "Numbers like a postcode; for phone numbers, get_inputtel; dates, get_inputdate.",
		source: "components/input-number.json",
		inputHash:
			"sha256:64dddaacc4ed0dfb3a15ff85974c55bc3a81cbd6ea03e3fcf04e0853634b97cd",
	},
	get_inputtext: {
		text: "Single-line free text; for known options, use get_radio or get_checkbox.",
		source: "components/input-text.json",
		inputHash:
			"sha256:815bf8237f361ec2c2930dc8c9ed1d30eae27d517568a323d6643918db89b864",
	},
	get_layers: {
		text: "Surfaces by level (kern-layer, kern-level-*); components adapt to their level.",
		source: "foundations/layering.json",
		inputHash:
			"sha256:9ab40db3efa5c5fa9c8cf7fd05d3f8bfe1ea58be8e3cf1dcd43dce1466307274",
	},
	get_link: {
		text: "For navigation only; for an action that changes data, use get_button.",
		source: "components/link.json",
		inputHash:
			"sha256:c47d418ecf85a2c99b2b09de99c07fc820572af3ec20a8faf770ea950c46b572",
	},
	get_loader: {
		text: "An unknown wait over a second; for steps of a process, use get_progress.",
		source: "components/loader.json",
		inputHash:
			"sha256:0a170ba29578d372288466c3a1e61d510190204eb7b981ef967dc6cd2ca800d4",
	},
	get_preline: {
		text: "Short text above a title or heading; never on its own.",
		source: "components/preline.json",
		inputHash:
			"sha256:671c31fb30676c98d03c84f1fc0a92a65cef9b8cc9ae9a0e0f70e9b5b65e2bf6",
	},
	get_progress: {
		text: "Steps of a fixed process, never loading; for a wait, use get_loader.",
		source: "components/progress.json",
		inputHash:
			"sha256:6b10c75a1f70aed9b2a0fc64884c4956a4974b90009aaf942fa5a96c99b2f5c0",
	},
	get_radio: {
		text: "Exactly one of a few options; for several, get_checkbox; 5 to 15, get_select.",
		source: "components/radios.json",
		inputHash:
			"sha256:61ffa8b60de0a77a8ed826c2d103892359ef333be4cf5b0338318e88dfc86a27",
	},
	get_select: {
		text: "One of 5 to 15 options; for fewer, prefer get_radio. Never for navigation.",
		source: "components/select.json",
		inputHash:
			"sha256:248f0f4a9e476845d978959a91ffb8d51427602b5fff82f7b596ad29d221e12d",
	},
	get_subline: {
		text: "Short text below a title or heading; never on its own.",
		source: "components/subline.json",
		inputHash:
			"sha256:761c438231c82f70eb6c4354afb5c1760da550598fd11de146cb35acf04b8117",
	},
	get_textarea: {
		text: "Only for multi-line text; for a single line, use get_inputtext.",
		source: "components/textarea.json",
		inputHash:
			"sha256:e0141b592a67e7be4e32ff98a437749af6b336fe123726f815228697c592c907",
	},
	get_title: {
		text: "Headings inside cards, dialogs or forms; for page sections, use get_heading.",
		source: "components/title.json",
		inputHash:
			"sha256:ae2ac7f618e6585087e302ff2a57b10663b5f62300ec9796f23fbeada44d6411",
	},
};

/** The description with the tool's hint appended, if it has one. */
export function withToolHint(name: string, description: string): string {
	const hint = Object.hasOwn(TOOL_HINTS, name) ? TOOL_HINTS[name] : undefined;
	return hint ? `${description} ${hint.text}` : description;
}
