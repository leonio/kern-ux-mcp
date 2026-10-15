<!-- message 1: text -->
Build this screen in Figma from the KERN 2 Design-Kit's components: Sperrmüll anmelden, Schritt 2.

The Figma file: https://www.figma.com/design/AbC123/Musterstadt

Our kern tools plan the screen; Figma's MCP server draws it. Work in this order:

1. **HTML:** the screen's KERN HTML is the html of the last `render_page` or `render_composition` result for it. If there is none, build the screen first: `render_page` for a page, `render_composition` for a part of one, with `locale: "de"` and `strict: true`.
2. **Plan:** call `plan_figma_design` with that html, and `device: "mobile"`. It returns `components`, `scripts`, `steps`, `unmapped` and `warnings`. A big page comes in several scripts.
3. **Keys:** one `search_design_system` call on the Figma file, with one component query per name in `components`. For each name, take the KERN 2 Design-Kit result with exactly that name and put its key into `KEYS` at the top of each script. Don't guess a key: a name left empty is drawn as a red placeholder.
4. **Build:** load Figma's `figma-use` skill, then run each script with `use_figma` on the file, in order, changed only in `KEYS`. The first builds the screen on the current page and replaces a frame of the same name, so they can run again.
5. **Check:** a script returns `screenId`, `slotsId`, `missing`, `warnings` and `errors`. After the last, take `get_screenshot` of `screenId` and compare it with the HTML. Fix what differs with small `use_figma` edits. The content of cards, fieldsets, accordions and grid columns is in the slot components on the slots frame, `slotsId`.

Answer in German with the frame's name and a link to it, then what needs the designer: components without a key, `unmapped` markup drawn as placeholders, and the warnings.
