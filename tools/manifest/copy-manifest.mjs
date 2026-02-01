import fs from "node:fs";
import path from "node:path";

const source = path.resolve(process.cwd(), "src", "ux", "registry.json");
const destination = path.resolve(process.cwd(), "dist", "ux", "registry.json");

if (!fs.existsSync(source)) {
	throw new Error(
		`Manifest not found at ${source}. Run "npm run generate-manifest" first.`,
	);
}

fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.copyFileSync(source, destination);

console.log(`Copied manifest to ${destination}`);
