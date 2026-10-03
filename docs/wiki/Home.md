# Kern UX MCP Server

An [MCP](https://modelcontextprotocol.io/) server that lets AI assistants build accessible HTML with the [KERN-UX](https://www.kern-ux.de/) design system. It offers tools that render KERN components and whole pages, and a validator that checks HTML against KERN's accessibility rules (BITV/WCAG).

> **2.0 is in alpha.** The pages in this wiki describe the `feat/v2-alpha` line (`2.0.0-alpha.*` packages and the `alpha` container tag). Things can still change before 2.0.0.

## Pick your path

**I want to use it**
1. [Choosing stdio or HTTP](Choosing-stdio-or-HTTP): which way to run the server
2. Set up your client: [VS Code Copilot](Setup-VS-Code-Copilot) · [Claude Desktop](Setup-Claude-Desktop) · [Claude Code](Setup-Claude-Code)
3. [How it works](How-It-Works): what the tools do and how to get good results

**I want to host it**
- [HTTP server with Docker](HTTP-Server-with-Docker): run it locally over HTTP with Docker Compose
- [Configuration](Configuration): every setting of the HTTP server

**I work on the project**
- [KERN data import](KERN-Data-Import): how KERN's component knowledge gets into the server
- [Development](Development): build, test and run from a checkout
- [Debugging and troubleshooting](Debugging-and-Troubleshooting)

**Upgrading from 1.x?** See [Migrating from 1.x](Migrating-from-1.x).
