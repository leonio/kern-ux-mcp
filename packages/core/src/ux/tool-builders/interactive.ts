import { type AccordionInput, accordionSchema } from "../schemas/accordion.js";
import { type AlertInput, AlertSchema } from "../schemas/alert.js";
import { type BadgeInput, badgeSchema } from "../schemas/badge.js";
import { type ButtonInput, ButtonSchema } from "../schemas/button.js";
import { type CardInput, cardSchema } from "../schemas/card.js";
import { type CheckboxInput, CheckboxSchema } from "../schemas/checkbox.js";
import { type DialogInput, DialogSchema } from "../schemas/dialog.js";
import { type DropdownInput, dropdownSchema } from "../schemas/dropdown.js";
import { type IconInput, iconSchema } from "../schemas/icon.js";
import { type InputDateInput, inputDateSchema } from "../schemas/input-date.js";
import {
	type InputEmailInput,
	inputEmailSchema,
} from "../schemas/input-email.js";
import { type InputFileInput, inputFileSchema } from "../schemas/input-file.js";
import {
	type InputGroupInput,
	inputGroupSchema,
} from "../schemas/input-group.js";
import {
	type InputNumberInput,
	inputNumberSchema,
} from "../schemas/input-number.js";
import {
	type InputPasswordInput,
	inputPasswordSchema,
} from "../schemas/input-password.js";
import { type InputTelInput, inputTelSchema } from "../schemas/input-tel.js";
import { type InputTextInput, inputTextSchema } from "../schemas/input-text.js";
import { type InputUrlInput, inputUrlSchema } from "../schemas/input-url.js";
import { type LoaderInput, loaderSchema } from "../schemas/loader.js";
import { type ProgressInput, progressSchema } from "../schemas/progress.js";
import { type RadioInput, radioSchema } from "../schemas/radio.js";
import { type SelectInput, selectSchema } from "../schemas/select.js";
import { type SummaryInput, summarySchema } from "../schemas/summary.js";
import { type TableInput, tableSchema } from "../schemas/table.js";
import { type TasklistInput, tasklistSchema } from "../schemas/tasklist.js";
import { type TextareaInput, textareaSchema } from "../schemas/textarea.js";
import { buildAccordion } from "../templates/accordion.js";
import { buildAlert } from "../templates/alert.js";
import { buildBadge } from "../templates/badge.js";
import { buildButton } from "../templates/button.js";
import { buildCard } from "../templates/card.js";
import { buildCheckbox } from "../templates/checkbox.js";
import { buildDialog } from "../templates/dialog.js";
import { buildDropdown } from "../templates/dropdown.js";
import { buildIcon } from "../templates/icon.js";
import { buildInputDate } from "../templates/input-date.js";
import { buildInputEmail } from "../templates/input-email.js";
import { buildInputFile } from "../templates/input-file.js";
import { buildInputGroup } from "../templates/input-group.js";
import { buildInputNumber } from "../templates/input-number.js";
import { buildInputPassword } from "../templates/input-password.js";
import { buildInputTel } from "../templates/input-tel.js";
import { buildInputText } from "../templates/input-text.js";
import { buildInputUrl } from "../templates/input-url.js";
import { buildLoader } from "../templates/loader.js";
import { buildProgress } from "../templates/progress.js";
import { buildRadio } from "../templates/radio.js";
import { buildSelect } from "../templates/select.js";
import { buildSummary } from "../templates/summary.js";
import { buildTable } from "../templates/table.js";
import { buildTasklist } from "../templates/tasklist.js";
import { buildTextarea } from "../templates/textarea.js";
import type { ComponentInfo } from "../types.js";
import { buildParameterizedComponentTool, type ToolDef } from "./shared.js";

/**
 * Interactive strategy tooling: one parameterized tool per component.
 */

function buildButtonTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<ButtonInput>(
		component,
		"KERN UX: HTML for a button. Required: label. variant primary (default), secondary or tertiary; five sizes; an optional icon. " +
			"labelVisibility 'sr-only' makes an icon-only button that keeps an accessible name.",
		ButtonSchema,
		buildButton,
	);
}

function buildAlertTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<AlertInput>(
		component,
		'KERN UX: HTML for an alert with role="alert": a heading with a decorative status icon, and optional body text, links and a list. Required: title. ' +
			"type info (default), success, warning or danger; danger is the most severe, and there is no separate high-contrast variant.",
		AlertSchema,
		buildAlert,
	);
}

function buildCheckboxTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<CheckboxInput>(
		component,
		"KERN UX: HTML for checkboxes. mode 'single' (default): one checkbox, e.g. a consent. " +
			"mode 'list': a fieldset of independent options under a legend.",
		CheckboxSchema,
		buildCheckbox,
	);
}

function buildDialogTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<DialogInput>(
		component,
		'KERN UX: HTML for a modal <dialog> with header, body and footer buttons; cancel and close use formmethod="dialog". ' +
			"Required: title, body, confirmLabel, cancelLabel. triggerLabel adds the button that opens it.",
		DialogSchema,
		buildDialog,
	);
}

function buildRadioTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<RadioInput>(
		component,
		"KERN UX: HTML for radio buttons. mode 'list': a fieldset of options under a legend, one of which can be selected, with optional hint and error. " +
			"mode 'single': one radio button on its own.",
		radioSchema,
		buildRadio,
	);
}

function buildSelectTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<SelectInput>(
		component,
		"KERN UX: HTML for a select with label, optional hint and error, inside the kern-form-input__select-wrapper KERN requires. " +
			"Required: name, label and options, each { value, text }; an option can be selected or disabled.",
		selectSchema,
		buildSelect,
	);
}

function buildInputTextTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<InputTextInput>(
		component,
		"KERN UX: HTML for a text input with label, optional hint and error. Required: name, label. " +
			"Set hint to the expected format; without one, a generic format hint is added.",
		inputTextSchema,
		buildInputText,
	);
}

function buildInputDateTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<InputDateInput>(
		component,
		"KERN UX: HTML for a date input: one native type=date field with label, optional hint and error. " +
			"KERN's own date pattern, a fieldset with separate day, month and year inputs, isn't rendered by this tool.",
		inputDateSchema,
		buildInputDate,
	);
}

function buildInputEmailTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<InputEmailInput>(
		component,
		"KERN UX: HTML for an email input (type=email) with label, optional hint and error. " +
			"autocomplete defaults to email.",
		inputEmailSchema,
		buildInputEmail,
	);
}

function buildInputFileTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<InputFileInput>(
		component,
		"KERN UX: HTML for a file input for one file, with label, optional hint and error. Required: name, label. " +
			"Name the allowed formats and size limit in hint.",
		inputFileSchema,
		buildInputFile,
	);
}

function buildInputGroupTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<InputGroupInput>(
		component,
		"KERN UX: HTML for a text input with a visual prefix or suffix, e.g. '€' or '.de'. " +
			"Only the plain text-field variant: no buttons or error state inside the group.",
		inputGroupSchema,
		buildInputGroup,
	);
}

function buildInputNumberTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<InputNumberInput>(
		component,
		"KERN UX: HTML for a number input with label, optional hint and error. Required: name, label. " +
			'Like KERN, it renders type="text" with inputmode="numeric" and pattern="[0-9]*", not type="number".',
		inputNumberSchema,
		buildInputNumber,
	);
}

function buildInputPasswordTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<InputPasswordInput>(
		component,
		"KERN UX: HTML for a password input (type=password) with label, optional hint and error. " +
			"Only the field: no show-password toggle, no forgot-password link.",
		inputPasswordSchema,
		buildInputPassword,
	);
}

function buildInputTelTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<InputTelInput>(
		component,
		"KERN UX: HTML for a phone number input (type=tel) with label, optional hint and error. " +
			"autocomplete defaults to tel. Name the expected format, e.g. with area code, in hint.",
		inputTelSchema,
		buildInputTel,
	);
}

function buildInputUrlTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<InputUrlInput>(
		component,
		"KERN UX: HTML for a URL input (type=url) with label, optional hint and error. " +
			"It expects a full address with https://; say so in hint.",
		inputUrlSchema,
		buildInputUrl,
	);
}

function buildTasklistTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<TasklistInput>(
		component,
		"KERN UX: HTML for a task list: tasks with a title, an optional link and a status badge. " +
			"numbered (default true) numbers them; numbered: false gives an unnumbered checklist.",
		tasklistSchema,
		buildTasklist,
	);
}

function buildLoaderTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<LoaderInput>(
		component,
		'KERN UX: HTML for a loading spinner with role="status" and hidden screen-reader text.',
		loaderSchema,
		buildLoader,
	);
}

function buildBadgeTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<BadgeInput>(
		component,
		"KERN UX: HTML for a badge: a short, non-interactive status or category label. " +
			"Required: type (info, success, warning or danger) and text. showIcon: true adds the status icon.",
		badgeSchema,
		buildBadge,
	);
}

function buildTextareaTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<TextareaInput>(
		component,
		"KERN UX: HTML for a multi-line text field (textarea) with label, optional hint and error. Required: name, label.",
		textareaSchema,
		buildTextarea,
	);
}

function buildProgressTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<ProgressInput>(
		component,
		"KERN UX: HTML for a progress bar: a native <progress> in kern-progress, with an optional linked label.",
		progressSchema,
		buildProgress,
	);
}

function buildAccordionTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<AccordionInput>(
		component,
		"KERN UX: HTML for accordions, built on <details> and <summary>. mode 'single' (default) takes title and content; " +
			"mode 'group' takes items, each with title and content. Sending items without content selects group.",
		accordionSchema,
		buildAccordion,
	);
}

function buildCardTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<CardInput>(
		component,
		"KERN UX: HTML for a card: an optional image, a header (preline, title, subline, optional link), " +
			"body text or simple blocks, and up to two footer buttons.",
		cardSchema,
		buildCard,
	);
}

function buildIconTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<IconInput>(
		component,
		"KERN UX: HTML for an icon, decorative by default. Required: name (see list_icons). " +
			"A meaningful icon needs decorative: false and an ariaLabel.",
		iconSchema,
		buildIcon,
	);
}

function buildTableTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<TableInput>(
		component,
		"KERN UX: HTML for a data table: column headings, optional row headings, caption and footer row, in a scrolling container. " +
			"Mark numeric and currency columns numeric to right-align them. KERN's action-column pattern isn't offered.",
		tableSchema,
		buildTable,
	);
}

function buildSummaryTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<SummaryInput>(
		component,
		"KERN UX: HTML for a summary: a title, answers as term and value pairs, and an optional edit link. " +
			"mode 'single' or 'group'. Unlike a task list, it shows no status.",
		summarySchema,
		buildSummary,
	);
}

function buildDropdownTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<DropdownInput>(
		component,
		"KERN UX: HTML for a dropdown (experimental): a <details>/<summary> with radio or checkbox options inside. " +
			"Not a menu or a select.",
		dropdownSchema,
		buildDropdown,
	);
}

/** The interactive tools, by component ID (see COMPONENT_TOOLS). */
export function buildInteractiveTool(component: ComponentInfo): ToolDef {
	switch (component.id) {
		case "button":
			return buildButtonTool(component);
		case "alert":
			return buildAlertTool(component);
		case "checkbox":
			return buildCheckboxTool(component);
		case "dialog":
			return buildDialogTool(component);
		case "radio":
			return buildRadioTool(component);
		case "select":
			return buildSelectTool(component);
		case "inputtext":
			return buildInputTextTool(component);
		case "inputdate":
			return buildInputDateTool(component);
		case "inputemail":
			return buildInputEmailTool(component);
		case "inputfile":
			return buildInputFileTool(component);
		case "inputgroup":
			return buildInputGroupTool(component);
		case "inputnumber":
			return buildInputNumberTool(component);
		case "inputpassword":
			return buildInputPasswordTool(component);
		case "inputtel":
			return buildInputTelTool(component);
		case "inputurl":
			return buildInputUrlTool(component);
		case "tasklist":
			return buildTasklistTool(component);
		case "loader":
			return buildLoaderTool(component);
		case "badge":
			return buildBadgeTool(component);
		case "textarea":
			return buildTextareaTool(component);
		case "progress":
			return buildProgressTool(component);
		case "accordion":
			return buildAccordionTool(component);
		case "card":
			return buildCardTool(component);
		case "icon":
			return buildIconTool(component);
		case "table":
			return buildTableTool(component);
		case "summary":
			return buildSummaryTool(component);
		case "dropdown":
			return buildDropdownTool(component);
		default:
			throw new Error(`No interactive tool for component: ${component.id}`);
	}
}
