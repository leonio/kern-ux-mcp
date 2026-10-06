# Set up VS Code Copilot

GitHub Copilot Chat in VS Code uses MCP tools in **agent mode**. You need VS Code with Copilot Chat signed in, and Node.js 24.16+ for stdio.

## stdio

1. In your project, create `.vscode/mcp.json`:

   ```json
   {
     "servers": {
       "kern-ux": {
         "type": "stdio",
         "command": "npx",
         "args": ["-y", "@leonio/kern-ux-mcp"]
       }
     }
   }
   ```

   To use the server in every workspace, run **MCP: Open User Configuration** from the Command Palette and put the same entry there instead.

2. Click **Start** above the `kern-ux` entry in the file, or run **MCP: List Servers** → `kern-ux` → **Start Server**.

   ![The mcp.json file in VS Code with the Start link above the kern-ux server](images/vscode-stdio-mcp-json.png)

3. Open Copilot Chat, switch to **Agent**, and open the tools picker. The `kern-ux` tools are listed.

   ![The Copilot Chat tools picker showing the kern-ux tools](images/vscode-tools-picker.png)

## HTTP

Start the server first, for example with [Docker](HTTP-Server-with-Docker) or `npx -y @leonio/kern-ux-mcp-http`.

1. Create `.vscode/mcp.json`:

   ```json
   {
     "servers": {
       "kern-ux": {
         "type": "http",
         "url": "http://localhost:3000/mcp"
       }
     }
   }
   ```

2. If the server has `KERN_AUTH_TOKEN` set, let VS Code ask for the token once and store it securely:

   ```json
   {
     "inputs": [
       { "type": "promptString", "id": "kern-token", "description": "Kern UX MCP token", "password": true }
     ],
     "servers": {
       "kern-ux": {
         "type": "http",
         "url": "https://mcp.example.com/mcp",
         "headers": { "Authorization": "Bearer ${input:kern-token}" }
       }
     }
   }
   ```

3. Start the server entry as above. **MCP: List Servers** shows it as running.

   ![MCP: List Servers showing kern-ux running over HTTP](images/vscode-http-server-running.png)

## Try it

In agent mode, ask: *"Using KERN, build a contact form with name, email and message, and validate it."* Copilot asks before the first tool call; allow it.

![Copilot Chat calling render_composition and showing the HTML result](images/vscode-first-tool-call.png)

## If it doesn't work

- **No tools in the picker**: the server isn't running. Run **MCP: List Servers** → `kern-ux` → **Show Output** for the log.
- **HTTP 403**: the hostname in `url` isn't in the server's `KERN_ALLOWED_HOSTS`.
- More in [Debugging and troubleshooting](Debugging-and-Troubleshooting).
