import { loadValidatedGuidanceOverlay } from "./guidance-overlay.js";

async function main() {
	const overlay = await loadValidatedGuidanceOverlay();
	const componentIds = Object.keys(overlay.components).sort((a, b) =>
		a.localeCompare(b),
	);

	console.log(
		`Guidance overlay is valid (${componentIds.length} component entries, overlayVersion=${overlay.overlayVersion}).`,
	);
	console.log(`Components: ${componentIds.join(", ")}`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
