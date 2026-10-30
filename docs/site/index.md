---
layout: home

hero:
  name: Kern UX MCP
  text: Accessible KERN-UX HTML from your AI assistant
  tagline: An MCP server whose tools render KERN-UX components and whole pages, and check HTML against KERN's accessibility rules (BITV/WCAG).
  actions:
    - theme: brand
      text: Get started
      link: /choosing-stdio-or-http
    - theme: alt
      text: How it works
      link: /how-it-works
    - theme: alt
      text: GitHub
      link: https://github.com/leonio/kern-ux-mcp

features:
  - title: Components and pages
    details: 54 tools, from one button to a whole page with header, sections, grids, forms and multi-step forms, rendered with KERN's classes and markup.
    link: /how-it-works
  - title: Strict accessibility checks
    details: Every tool checks its own output, validate_html checks any markup, and strict mode fails instead of returning HTML that breaks a rule.
    link: /how-it-works#the-tools
  - title: Resources, prompts and skills
    details: Component cards and guides to attach, prompts for forms, pages and reviews, and a forms skill the assistant loads when it needs one.
    link: /resources
  - title: stdio or HTTP
    details: Run it as a local stdio server, as a Claude Desktop extension, or as a Streamable HTTP server in a container for a team.
    link: /choosing-stdio-or-http
---

## Pick your path

**I want to use it**

1. [Choosing stdio or HTTP](./choosing-stdio-or-http.md): which way to run the server
2. Set up your client: [VS Code Copilot](./setup-vs-code-copilot.md) · [Claude Desktop](./setup-claude-desktop.md) · [Claude Code](./setup-claude-code.md)
3. [How it works](./how-it-works.md): what the tools do and how to get good results

**I want to try it without installing anything**

A free, public instance runs at `https://kernuxmcphost.velixir.run/mcp`. See [Run the HTTP server](./http-server.md#try-it-without-installing).

**I want to host it**

- [Run the HTTP server](./http-server.md): with npx, or in a container with Docker Compose
- [Configuration](./configuration.md): every setting of the HTTP server

**I work on the project**

- [Development](./development.md): build, test and run from a checkout
- [KERN data import](./kern-data-import.md): how KERN's component knowledge gets into the server
- [Debugging and troubleshooting](./debugging-and-troubleshooting.md)

**Upgrading from 1.x?** See [Migrating from 1.x](./migrating-from-1-x.md).
