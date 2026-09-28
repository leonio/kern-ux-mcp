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
 * Interactive strategy tooling (parameterized + fallback routing).
 */

export const INTERACTIVE_PARAMETERIZED_IDS = new Set([
	"button",
	"alert",
	"checkbox",
	"dialog",
	"radio",
	"select",
	"inputtext",
	"inputdate",
	"inputemail",
	"inputfile",
	"inputgroup",
	"inputnumber",
	"inputpassword",
	"inputtel",
	"inputurl",
	"loader",
	"badge",
	"textarea",
	"progress",
	"accordion",
	"card",
	"icon",
	"table",
	"summary",
	"dropdown",
	"tasklist",
]);

type ComponentFallbackBuilder = (component: ComponentInfo) => ToolDef;

function buildButtonTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<ButtonInput>(
		component,
		"KERN UX: HTML für Button erzeugen (primary/secondary/tertiary, mit Icon-Optionen). " +
			"Pflichtfeld: label. Varianten: primary|secondary|tertiary. Beispiel: { label: 'More Info', variant: 'primary' }.",
		ButtonSchema,
		buildButton,
	);
}

function buildAlertTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<AlertInput>(
		component,
		"KERN UX: HTML für Alert erzeugen. Pflichtfeld: title. " +
			"Varianten via type: info (Standard) | success | warning | danger (höchste Schwere, kein separater 'high-contrast'-Modus). " +
			"Optionaler body mit text, links und listItems. " +
			"Beispiel: { type: 'danger', title: 'Serverstörung', body: { text: 'Unsere Server sind nicht erreichbar.' } }.",
		AlertSchema,
		buildAlert,
	);
}

function buildCheckboxTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<CheckboxInput>(
		component,
		`KERN UX: HTML für Checkbox erzeugen (Einzel- oder Listen-Modus).`,
		CheckboxSchema,
		buildCheckbox,
	);
}

function buildDialogTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<DialogInput>(
		component,
		"KERN UX: HTML für Dialog erzeugen (mit optionalem Trigger-Button). " +
			"Known-good payload: { title: 'Bestätigen', body: 'Möchten Sie fortfahren?', confirmLabel: 'Ja', cancelLabel: 'Nein', triggerLabel: 'Dialog öffnen', triggerVariant: 'primary' }. " +
			"Legacy payload mit actions.confirm/cancel wird ebenfalls akzeptiert.",
		DialogSchema,
		buildDialog,
	);
}

function buildRadioTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<RadioInput>(
		component,
		`KERN UX: HTML für Radio erzeugen (Einzel- oder Listen-Modus mit optionalem Error/Hint).`,
		radioSchema,
		buildRadio,
	);
}

function buildSelectTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<SelectInput>(
		component,
		"KERN UX: HTML für Select erzeugen. " +
			"Pflichtfelder: name, label, options (Array von { value, text }). " +
			"Optional: hint, error, disabled: true, optional: true. " +
			"Jede Option kann selected: true oder disabled: true haben. " +
			"Der Wrapper kern-form-input__select-wrapper ist Pflicht und wird automatisch erzeugt. " +
			"Beispiel: { name: 'lang', label: 'Sprache', options: [{ value: 'de', text: 'Deutsch', selected: true }, { value: 'en', text: 'English' }] }.",
		selectSchema,
		buildSelect,
	);
}

function buildInputTextTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<InputTextInput>(
		component,
		"KERN UX: HTML für Text-Input erzeugen (mit optionalem Error/Hint, readonly, disabled). " +
			"Empfohlen fuer Barrierefreiheit: hint mit Pflichtformat setzen. Pflichtfelder: name, label (werden bei leeren Calls mit sinnvollen Defaults befuellt).",
		inputTextSchema,
		buildInputText,
	);
}

function buildInputDateTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<InputDateInput>(
		component,
		`KERN UX: HTML für Datum-Input erzeugen (mit optionalem Error/Hint, readonly, disabled).`,
		inputDateSchema,
		buildInputDate,
	);
}

function buildInputEmailTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<InputEmailInput>(
		component,
		`KERN UX: HTML für E-Mail-Input erzeugen (mit optionalem Error/Hint, readonly, disabled).`,
		inputEmailSchema,
		buildInputEmail,
	);
}

function buildInputFileTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<InputFileInput>(
		component,
		"KERN UX: HTML für File-Input erzeugen (mit optionalem Error/Hint). " +
			"Empfohlen fuer Barrierefreiheit: hint mit Dateiformat und Groessenlimit setzen. Pflichtfelder: name, label (werden bei leeren Calls mit sinnvollen Defaults befuellt).",
		inputFileSchema,
		buildInputFile,
	);
}

function buildInputGroupTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<InputGroupInput>(
		component,
		`KERN UX: HTML für InputGroup erzeugen (Prefix/Suffix mit Input).`,
		inputGroupSchema,
		buildInputGroup,
	);
}

function buildInputNumberTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<InputNumberInput>(
		component,
		"KERN UX: HTML für Number-Input erzeugen (mit optionalem Error/Hint, readonly, disabled). " +
			"Empfohlen fuer Barrierefreiheit: hint mit Zahlenformat setzen. Pflichtfelder: name, label (werden bei leeren Calls mit sinnvollen Defaults befuellt).",
		inputNumberSchema,
		buildInputNumber,
	);
}

function buildInputPasswordTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<InputPasswordInput>(
		component,
		`KERN UX: HTML für Passwort-Input erzeugen (mit optionalem Error/Hint, readonly, disabled).`,
		inputPasswordSchema,
		buildInputPassword,
	);
}

function buildInputTelTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<InputTelInput>(
		component,
		`KERN UX: HTML für Telefon-Input erzeugen (mit optionalem Error/Hint, readonly, disabled).`,
		inputTelSchema,
		buildInputTel,
	);
}

function buildInputUrlTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<InputUrlInput>(
		component,
		`KERN UX: HTML für URL-Input erzeugen (mit optionalem Error/Hint, readonly, disabled).`,
		inputUrlSchema,
		buildInputUrl,
	);
}

function buildTasklistTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<TasklistInput>(
		component,
		"KERN UX: HTML fuer Tasklist erzeugen (Aufgabenliste mit Status). " +
			"items erwartet Objekte mit title, optional href, status und statusType. " +
			"numbered (Standard: true) erzeugt eine nummerierte Liste (ol). " +
			"Setze numbered: false für eine unnummerierte Checkliste (ul) — ideal für Feature-Listen oder Vergleichs-Checklisten mit Häkchen-Icons. " +
			"Beispiel nummeriert: { heading: 'Schritte', items: [{ title: 'Unterlagen hochladen', status: 'Offen', statusType: 'info' }] }. " +
			"Beispiel Checkliste: { heading: 'Leistungen', numbered: false, items: [{ title: 'Inklusive', status: 'Ja', statusType: 'success' }] }.",
		tasklistSchema,
		buildTasklist,
	);
}

function buildLoaderTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<LoaderInput>(
		component,
		`KERN UX: HTML für Loader (Lade-Indikator) erzeugen.`,
		loaderSchema,
		buildLoader,
	);
}

function buildBadgeTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<BadgeInput>(
		component,
		"KERN UX: HTML für Badge erzeugen. Pflichtfelder: type und text. " +
			"type: info | success | warning | danger. " +
			"Beispiel: { type: 'success', text: 'Online' }. Optional: showIcon: true.",
		badgeSchema,
		buildBadge,
	);
}

function buildTextareaTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<TextareaInput>(
		component,
		`KERN UX: HTML für Textarea (mehrzeiliges Textfeld) erzeugen.`,
		textareaSchema,
		buildTextarea,
	);
}

function buildProgressTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<ProgressInput>(
		component,
		`KERN UX: HTML für Progress (Fortschrittsbalken) erzeugen.`,
		progressSchema,
		buildProgress,
	);
}

function buildAccordionTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<AccordionInput>(
		component,
		`KERN UX: HTML für Accordion (aufklappbare Abschnitte) erzeugen.`,
		accordionSchema,
		buildAccordion,
	);
}

function buildCardTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<CardInput>(
		component,
		`KERN UX: HTML für Card (Karten-Container) erzeugen.`,
		cardSchema,
		buildCard,
	);
}

function buildIconTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<IconInput>(
		component,
		"KERN UX: HTML für Icon erzeugen. Pflichtfeld: name (siehe list_icons). " +
			"Beispiel: { name: 'download', decorative: false, ariaLabel: 'Download PDF' }.",
		iconSchema,
		buildIcon,
	);
}

function buildTableTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<TableInput>(
		component,
		`KERN UX: HTML für Table (Datentabelle) erzeugen.`,
		tableSchema,
		buildTable,
	);
}

function buildSummaryTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<SummaryInput>(
		component,
		`KERN UX: HTML für Summary (Zusammenfassung) erzeugen.`,
		summarySchema,
		buildSummary,
	);
}

function buildDropdownTool(component: ComponentInfo): ToolDef {
	return buildParameterizedComponentTool<DropdownInput>(
		component,
		`KERN UX: HTML für Dropdown erzeugen (experimentell).`,
		dropdownSchema,
		buildDropdown,
	);
}

export function buildPriorityComponentTool(component: ComponentInfo): ToolDef {
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
			throw new Error(`Unknown priority component: ${component.id}`);
	}
}

export function buildInteractiveTool(
	component: ComponentInfo,
	fallbackBuilder: ComponentFallbackBuilder,
): ToolDef {
	if (INTERACTIVE_PARAMETERIZED_IDS.has(component.id)) {
		return buildPriorityComponentTool(component);
	}
	return fallbackBuilder(component);
}
