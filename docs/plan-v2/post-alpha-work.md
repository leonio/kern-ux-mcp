# Additional post-alpha work

Research notes and proposals that came out of the 2026-10-02 review of the context budget (finding 19, R5). Nothing here is scheduled in [roadmap.md](roadmap.md); it records what was looked at, what was decided, and what is worth doing next. Snapshot: branch `feat/v2-alpha` at `3fa134d` (R5 group C done).

## 1. Context budget: where it stands

Measured from the checked-in `tools/list` snapshot (compact JSON of name, description, `inputSchema`), plus the eval harness (Haiku 4.5, Claude Code headless).

| | Baseline `52b24fa` | Now `3fa134d` |
|---|---|---|
| Model-facing listing | 201,295 chars | 129,939 chars |
| First request (eval, includes the system prompt) | 70,676 tokens | 42,535 tokens |
| Tools carrying the full block union | 8 | 2 (`render_composition`, `render_page`: 31.3K, 24%) |
| Other 52 tools | | avg 1.9K chars, max 6.3K; 41 of them ≤ 2.5K |

- **Characters per token:** the baseline-to-now delta implies about 2.5 characters per token for the removed JSON-schema structure. Prose tokenizes better, so the listing overall is around 3. Earlier estimates of 3.5–4 were too optimistic.
- **Usage is very skewed.** In the eval, a run averages about 2 kern calls. Most calls go to `render_composition` (11), `get_button` (10), `get_badge` (10), `render_page` (6) and `get_fieldset` (5).
- **Cost is not the issue.** The listing is cached after the first request: about $0.03–0.06 per Haiku run. The cost of size is window share, cold-cache first requests, and attention on small models.
- **Conclusion (2026-10-02):** with a 200K window the current size is fine. Option B plus the English trimming reaches about 120K characters without any of the ideas below.

## 2. Ideas explored, and the verdicts

Both were suggested as ways to cut the initial tool context. Neither is needed for the full toolset today.

### 2.1 Dynamic tool discovery (search / meta-tools)

Two variants behave very differently.

- **Mutating tool list (`list_changed`): ruled out.** The HTTP host builds one server instance per request (`packages/http/src/server.ts`), `listChanged` is `false`, and `tools/list` is served `public` for an hour. There is no session to remember what was injected.
- **Gateway: viable.** `search_tools` returns schemas as text and `call_tool(name, args)` runs the tool. Stateless, works with every client.

| | |
|---|---|
| Pros | Typical task needs 17K chars (page), 22K (form) or 4.5K (single component) instead of 130K: an 83–97% cut. Client-agnostic. Schemas arrive as text, so the block union could be described once in a compact notation. Reuses the knowledge bundle (summaries, synonyms, anti-use cases) as the search index. All tools are read-only and idempotent, so nothing is lost on permissions. |
| Cons | The model must find the right tool. The [failure catalog](../../.github/skills/tool-description-quality/references/failure-catalog.md) shows an agent guessing `form-input` instead of `inputtext` and skipping `list_components_by_category`. KERN's vocabulary has false friends (`get_summary`, `get_details` vs `get_disclosure`, `get_search`, `get_label`, German names). `args` becomes an untyped object, so the client cannot validate it and the model must carry the schema in context. Extra round trips; the floor is about 8K tokens because nearly every task needs `render_page` or `render_composition`. Clients that already defer tools would run two search layers. Tool names are "stable" in the ground rules, so it is a contract decision. |

**Verdict:** works, and suits the long tail of small tools; does not fix the two heavy tools and carries a selection risk. Offer it only as an opt-in profile, not the default. The planned `KERN_TOOLSET=compact` profile (with `render_component({componentId, props})`) is already a one-key gateway.

### 2.2 Sub-agents and tool scoping

The server cannot spawn sub-agents. Scoping lives in the client or in deployment: one binary with different `KERN_TOOLSET` values per server entry (env var for stdio, URL path for HTTP), client allowlists (Claude Code subagent `tools:`, VS Code custom agents, OpenAI `allowed_tools`), and agent definitions or R7 prompts shipped with the server.

| | |
|---|---|
| Pros | Native schemas, no search step, deterministic. Good for review-and-fix loops, where `validate_html` output is noisy and only a short summary needs to go back. Server-side profiles are cheap and match the compact profile. |
| Cons | No schema gets smaller: a forms scope of `render_composition` + the form-input tools + `validate_html` is still about 55K chars. The output is the artifact, so the HTML has to return to the parent verbatim and does not compress like research results. Handoffs lose design decisions and cost latency and total tokens. Routing is the same selection problem, with worse failure when wrong. The server cannot enforce it; it depends on each user's client setup. |

**Verdict:** with about 2 calls per run and 54 tools there is little left to scope away. Not a context fix; a reasonable packaging layer alongside R7 prompts.

### 2.3 Considered and dropped: a "lazy" block union

Replace the union in `render_composition` and `render_page` with loose `kind` values and serve detail through hints or a resource. Before option B this could have saved about 90K chars. Now at most about 22K remain at stake, and these two tools are the hot path (17 of 62 calls in the option B eval), so degrading their schema has the largest blast radius. The safer version is to strip descriptions from the union: 12.3K to 7.5K per copy, about −10K in total.

### 2.4 Client behaviour (unverified)

From background knowledge, not checked in this repo: Claude Code defers MCP tools through tool search for models that support it (Haiku does not, I believe), and the Anthropic API has deferred loading. If so, the eval, which runs Haiku, measures the worst case. Check this in the R0 client matrix before relying on it.

## 3. Smaller models and complex layouts

Goal stated on 2026-10-02: be able to say the server works with smaller models, even for complex layouts. Decision: a 200K window is enough, so context size is not the limit.

- **Proven:** Haiku 4.5 completes the ten scenarios (30/30, 96/96 checks at `english-2`) at about 42K tokens of listing.
- **Not covered:** models with 32K or smaller windows. They would need the compact profile; `render_composition` + `validate_html` + `get_component_docs` + `list_components_by_category` is about 18K chars. The harness drives Claude Code with `--model`, so Haiku 4.5 is the smallest model it can test. Out of scope for now.
- **Not evidenced:** complex layouts. See below.

## 4. Proposal: nested eval scenarios

### Why

Every R5 change was judged by ten scenarios that mostly avoid the full recursive union.
- The six standalone block tools had 5 calls in 30 runs, so option B was safe. The other calls went to `render_composition` and `render_page`, which still take all 12 block kinds.
- The schema allows depth 4 and 60 nodes; no scenario comes near that.
- Part D rewrites `COMPOSITION_CHEAT_SHEET` and the error hints, which a model leans on when a nested call fails. Nothing today would catch D making nested calls worse.
- The checks are substring checks (`kern-card`, `<footer`): they show a task finished, not that the layout is right.

### Scenarios

| Scenario | Shape | Stresses |
|---|---|---|
| Dashboard | section → grid → cards, each with a button and a badge, plus a status table | Depth 3–4, a mix of containers, the card-in-card rule |
| Multi-step application | `formFlow`, 3 steps, fieldsets of fields, error summary, `renderAllSteps` | The most complex single block; the form nesting rules; error-summary collection |
| Full service page | `render_page` with header, a form section, a table, an accordion, a two-column footer | Breadth in one call; a large result |
| Edit-in-place fix | A long, nested, partly broken page to correct | The validate → fix → re-render loop on large input |

If real pages built with the server exist, they make better scenarios than invented ones.

### Scoring

- The returned HTML passes `validate_html` with `strict`.
- Structure checks, such as three cards inside a grid, not only the word "card".
- Fallback detection: runs where the model abandons the tools and hand-writes HTML.
- Result survival: whether the final answer contains the HTML or a paraphrase. Haiku already summarizes long `render_page` results.
- Record the invalid-call rate and retries on `render_composition` and `render_page` separately.

### What it gives

1. A regression net for R5 part D: run before and after the interactive and composition rewrites.
2. A defensible claim about what depth and kind of layout Haiku 4.5 builds reliably.
3. Evidence on the schema limits: if models never get near depth 4 or 60 nodes, the limits and the union can shrink further, the one remaining listing saving.
4. An early answer on whether long results need a different format (summarizing is a design question worth settling before 2.0).

Cost is small: about $0.03–0.06 per run, so four scenarios at three runs is under a dollar per comparison.

### Where it would go

`tools/eval/scenarios.ts` (scenarios and `expectHtml`), `tools/eval/transcript.ts` (the new checks), and a `validate_html` pass over the returned markup. No server changes. Record the result as a new `r5-eval/` label and compare with `npm run eval:compare`.

## 5. Open items

- Whether to build the compact profile at all, once the full set is at or under 120K (roadmap Q3).
- The R0 client matrix, to confirm which clients pass `outputSchema` and defer tools.
- The nested scenarios above, ideally before R5 part D.
