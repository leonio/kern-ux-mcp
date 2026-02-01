---
description: "Use when writing or editing TypeScript in this repo. Covers Node 24.16+ runtime assumptions, TypeScript 6 strict-mode patterns, Biome-friendly code, and avoiding explicit any in production code."
applyTo: "src/**/*.ts, tools/**/*.ts, *.config.ts"
---

# TypeScript Standards

- Target the repo's current toolchain: Node 24.16+ minimum, TypeScript 6, `module: NodeNext`, and strict typechecking.
- For `.d.ts` declaration files, only add type-level constructs. Do not emit runtime code or use `import` statements that would generate JavaScript output.
- Prefer code that remains compatible with newer Node releases as well. Use stable platform APIs and avoid legacy Node patterns when a modern built-in alternative exists.
- Prefer modern TypeScript when it improves clarity: `import type`, `satisfies`, discriminated unions, `as const`, template-literal types, nullish coalescing, and optional chaining.
- Keep runtime code strict and explicit. Prefer `unknown`, precise unions, or small helper types over `any`.
- Do not introduce `any` in production code. Acceptable exceptions are: (1) wrapping an untyped third-party module with no `@types` package, or (2) an explicit type-narrowing boundary function whose return type is immediately narrowed to a specific type. In both cases, add a comment explaining why `any` is necessary.
- Let inference work when it is already precise, but add explicit types for public helpers, exported functions, boundary objects, and complex return shapes when it improves readability.
- Prefer small typed helpers over broad assertions. If casting is unavoidable, cast once at the boundary rather than leaking assertions through the file.
- In test files (`*.test.ts`, `*.spec.ts`), `any` and type assertions are permitted when needed to construct mocks or stubs, but should still be kept local to the test setup.
- Keep imports and syntax Biome-friendly. Follow the existing file style instead of reformatting unrelated code.
- Validate TypeScript edits by running the most targeted available command: prefer a single-file type check or focused unit test if one exists. If no file-scoped check is available, run `npx tsc --noEmit` or `npm run lint` before finishing.