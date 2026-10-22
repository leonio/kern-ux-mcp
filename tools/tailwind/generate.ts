/**
 * Writes packages/tailwind/src/tokens.css and remap.css from the installed
 * @kern-ux/native and tailwindcss. Run it after updating either; the
 * tailwind tests fail until the checked-in files match.
 *
 *   npm run tailwind:tokens
 */
import { writeFileSync } from "node:fs";
import path from "node:path";

import { generateFiles, installedSources, PACKAGE_SRC } from "./tokens.js";

const sources = installedSources();
for (const [file, content] of Object.entries(generateFiles(sources))) {
	writeFileSync(path.join(PACKAGE_SRC, file), content);
	console.log(
		`Wrote packages/tailwind/src/${file} from @kern-ux/native ${sources.kernVersion}`,
	);
}
