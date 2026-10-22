# Tailwind CSS v4 with KERN-UX

A page built with [`@leonio/kern-ux-tailwind`](../../packages/tailwind), the KERN-UX theme for Tailwind CSS v4. Each row shows a component three ways: KERN's markup, Tailwind utilities on KERN's tokens, and generic Tailwind markup with Tailwind's palette classes, remapped. A switch sets the light or dark theme, and the last section is dark in either.

The sample installs the package from this repo, which resolves `@kern-ux/native` from the repo root, so install there first:

```bash
npm install                 # at the repo root
cd samples/tailwind-v4
npm install
npm run build               # or: npm run watch
```

Then open `index.html`. The setup is all in [src/app.css](src/app.css):

```css
@import "tailwindcss" source("../");
@import "@leonio/kern-ux-tailwind";
@import "@leonio/kern-ux-tailwind/remap.css";
```

What the theme provides, why it's built the way it is and its limits are in the [package README](../../packages/tailwind/README.md).
