/**
 * Prints the model-facing size of every tool in tools/list, largest first, with
 * the totals and the context budget (packages/core/src/ux/listing-budget.ts).
 *
 *   pnpm listing:sizes
 */
import {
	formatListingSizes,
	measureListing,
} from "../../packages/core/src/ux/listing-budget.js";
import { loadRegistryFromManifest } from "../../packages/core/src/ux/registry.js";
import { createTools } from "../../packages/core/src/ux/tools.js";

console.log(
	formatListingSizes(
		measureListing(createTools(loadRegistryFromManifest()).listTools()),
	),
);
