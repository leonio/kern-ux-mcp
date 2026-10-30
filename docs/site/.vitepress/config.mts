import { defineConfig } from "vitepress";

const REPO = "https://github.com/leonio/kern-ux-mcp";

/**
 * The documentation site, published to https://leonio.github.io/kern-ux-mcp/
 * by .github/workflows/pages.yml. The build fails on a dead link between
 * pages. Search is VitePress's local index: no external service.
 */
export default defineConfig({
	lang: "en",
	title: "Kern UX MCP",
	description:
		"An MCP server that lets AI assistants build accessible HTML with the KERN-UX design system.",
	base: "/kern-ux-mcp/",
	cleanUrls: true,
	themeConfig: {
		nav: [
			{ text: "Guide", link: "/how-it-works" },
			{ text: "Reference", link: "/resources" },
			{ text: "Releases", link: `${REPO}/releases` },
		],
		sidebar: [
			{
				text: "Start",
				items: [
					{ text: "Introduction", link: "/" },
					{ text: "How it works", link: "/how-it-works" },
					{ text: "stdio or HTTP?", link: "/choosing-stdio-or-http" },
				],
			},
			{
				text: "Set up a client",
				items: [
					{ text: "VS Code Copilot", link: "/setup-vs-code-copilot" },
					{ text: "Claude Desktop", link: "/setup-claude-desktop" },
					{ text: "Claude Code", link: "/setup-claude-code" },
				],
			},
			{
				text: "Run",
				items: [
					{ text: "Run the HTTP server", link: "/http-server" },
					{ text: "Configuration", link: "/configuration" },
				],
			},
			{
				text: "Reference",
				items: [
					{ text: "Resources", link: "/resources" },
					{ text: "Prompts", link: "/prompts" },
					{ text: "Skills", link: "/skills" },
					{ text: "Protocol and errors", link: "/protocol-and-errors" },
				],
			},
			{
				text: "Develop",
				items: [
					{ text: "Development", link: "/development" },
					{ text: "KERN data import", link: "/kern-data-import" },
					{ text: "Debugging", link: "/debugging-and-troubleshooting" },
					{ text: "Migrating from 1.x", link: "/migrating-from-1-x" },
				],
			},
		],
		socialLinks: [{ icon: "github", link: REPO }],
		search: { provider: "local" },
		editLink: {
			pattern: `${REPO}/edit/main/docs/site/:path`,
			text: "Edit this page on GitHub",
		},
		footer: {
			message: `Licence EUPL-1.2 · Built from <a href="${REPO}/tree/main/docs/site"><code>docs/site/</code></a>`,
		},
	},
});
