---
Title: Investigation Diary
Ticket: FEDMOD-0001
Status: active
Topics:
    - frontend
    - module-federation
    - demo
DocType: reference
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ttmp/2026/03/22/FEDMOD-0001--federated-module-runtime-loading-demo/design-doc/01-federated-module-demo-analysis-design-and-implementation-guide.md
      Note: Main artifact whose evolution is recorded here
    - Path: ttmp/2026/03/22/FEDMOD-0001--federated-module-runtime-loading-demo/reference/02-runtime-api-and-experiment-notes.md
      Note: Supporting reference created during the ticket
    - Path: ttmp/2026/03/22/FEDMOD-0001--federated-module-runtime-loading-demo/scripts/mock-federation-runtime.mjs
      Note: Runnable teaching experiment added as part of the ticket
ExternalSources: []
Summary: Chronological diary of ticket setup, assumptions, experiments, and delivery steps.
LastUpdated: 2026-03-22T10:44:13.254800435-04:00
WhatFor: Chronological record of the ticket setup, design decisions, evidence collection, experiments, validation, and delivery.
WhenToUse: Use when reviewing how the ticket deliverables were produced or when continuing the implementation later.
---


# Investigation Diary

## Goal

This diary captures how the federated module demo ticket was created, why the design landed where it did, what evidence shaped the recommendations, and how the ticket was validated and delivered.

## Step 1: Create the ticket and establish the current state

The first task was to determine whether this repository already contained a host app, a remote app, or any federation-specific code. It did not. The repository started as a docmgr workspace with templates and vocabulary, so the ticket had to be treated as a greenfield design rather than a retrofit onto existing code.

This mattered immediately because it changed the nature of the deliverable. Instead of documenting an implementation that already existed, the design doc needed to be explicit about what was observed in the repo versus what was proposed as future structure.

### Prompt Context

**User prompt (verbatim):** "Create a new docmgr ticket to create a federated module demo to show me how to loa modules at runtime.

Federated modules (via **Module Federation**) is a webpack/Vite feature that lets multiple independent JavaScript apps share and load code from each other *at runtime*, without bundling everything together upfront. Here's how it works:

## The Core Idea

Normally, if App A needs a component from App B, you'd install it as an npm package at build time. With Module Federation, App B *exposes* the module over HTTP, and App A *fetches and executes it at runtime* — like a dynamic `import()`, but across app boundaries.

## Key Concepts

**Host** — the app that *consumes* remote modules (the shell/container app).

**Remote** — the app that *exposes* modules for others to load.

**Shared modules** — libraries (like React) that both apps agree to share, so only one copy loads at runtime.

---

## How It Works Step by Step

### 1. The Remote exposes its modules
In `webpack.config.js` of the remote app:
```js
new ModuleFederationPlugin({
  name: \"checkout\",
  filename: \"remoteEntry.js\",   // The manifest file
  exposes: {
    \"./Cart\": \"./src/Cart.jsx\", // What it shares
  },
  shared: [\"react\", \"react-dom\"],
});
```
At build time, webpack generates a `remoteEntry.js` — a small **manifest + loader** file hosted at e.g. `https://checkout.example.com/remoteEntry.js`.

### 2. The Host declares where remotes live
```js
new ModuleFederationPlugin({
  name: \"shell\",
  remotes: {
    checkout: \"checkout@https://checkout.example.com/remoteEntry.js\",
  },
  shared: [\"react\", \"react-dom\"],
});
```

### 3. Runtime loading — what actually happens
When the host app runs and hits a dynamic import like:
```js
const Cart = React.lazy(() => import(\"checkout/Cart\"));
```
The browser:
1. **Fetches** `remoteEntry.js` from the checkout app's server
2. **Parses the manifest** to find which chunk files contain `Cart`
3. **Fetches those chunks** (e.g. `cart.abc123.js`)
4. **Negotiates shared modules** — checks if React is already loaded; if yes, reuses it; if not, fetches it
5. **Executes the module** and returns the component

This all happens lazily — only when that code path is actually reached.

---

## The `remoteEntry.js` File

This is the linchpin. It's a small JS file that acts as a **runtime registry**. It contains:
- A map of exposed module names → chunk filenames
- Version info for shared dependencies
- A `get()` function the host calls to retrieve specific modules
- An `init()` function to negotiate shared scope

---

## Shared Module Negotiation

This is one of the cleverest parts. Both apps declare `shared: [\"react\"]`. At runtime:

```
Host loads → sees React 18.2 already in shared scope
Remote loads → requests React 18.2 → already satisfied, reuses host's copy ✓
```

If versions are incompatible, each app falls back to its own bundled copy. You can configure this with `singleton: true` (force one copy, throw on mismatch) or version ranges.

---

## Dynamic Remote Loading

You can even load remotes whose URLs aren't known at build time:

```js
// Load a remote dynamically at runtime
async function loadRemote(url, scope, module) {
  await __webpack_init_sharing__(\"default\");
  const container = await import(/* webpackIgnore: true */ url);
  await container.init(__webpack_share_scopes__.default);
  const factory = await container.get(module);
  return factory();
}

const Cart = await loadRemote(
  \"https://checkout.example.com/remoteEntry.js\",
  \"checkout\",
  \"./Cart\"
);
```

This is powerful for plugin systems or micro-frontend platforms where new remotes are registered at runtime.

---

## Practical Architecture

```
┌─────────────────────────────────────┐
│           Shell App (Host)          │
│  ┌──────────┐     ┌──────────────┐  │
│  │  Header  │     │  <Suspense>  │  │
│  └──────────┘     │  import(     │  │
│                   │  \"nav/Menu\"  │──┼──► fetch remoteEntry.js
│                   │  )           │  │         │
│                   └──────────────┘  │    fetch menu.js chunk
└─────────────────────────────────────┘         │
                                           execute & return
┌─────────────────────────────────────┐         │
│         Nav App (Remote)            │◄────────┘
│  exposes: { \"./Menu\": Menu.jsx }    │
│  deployed independently             │
└─────────────────────────────────────┘
```

---

## Key Tradeoffs

| Benefit | Gotcha |
|---|---|
| Deploy remotes independently | Network latency on first load |
| Teams own their bundles | Version negotiation complexity |
| No rebuild of host needed | Harder to debug across boundaries |
| Lazy load only what's needed | Type safety requires extra tooling (e.g. `@module-federation/typescript`) |

---

## Beyond Webpack

Module Federation is now also available in:
- **Vite** via `@originjs/vite-plugin-federation`
- **Rspack** (natively, it's webpack-compatible)
- **Module Federation 2.0** — a framework-agnostic version with a runtime SDK that works independently of the bundler

The core runtime mechanism (fetch manifest → negotiate shared scope → execute chunk) is the same across all implementations.

Want me to go deeper on any part — like the shared scope internals, TypeScript integration, or setting up a working example?

Create a detailed analysis / design / implementation guide that is very detailed for a new intern, explaining all the parts of the system needed to understand what it is, with prose paragraphs and bullet point sand pseudocode and diagrams and api references and file
  references.
  It should be very clear and detailed. Store in the ticket and the nupload to remarkable.

You can use experiments if you save everything in t[he scripts/ folder of the ticket."

**Assistant interpretation:** Create a new ticket-backed documentation workspace, produce an intern-oriented greenfield design guide for a module federation runtime-loading demo, add supporting experiments inside the ticket's `scripts/` directory, and upload the resulting docs bundle to reMarkable.

**Inferred user intent:** The user wants a durable teaching artifact that can later guide implementation of a real demo, not just a short task note.

**Commit (code):** N/A

### What I did

- Inspected the repository contents with `rg --files .`
- Confirmed `docmgr` was initialized and currently had zero tickets
- Loaded the `docmgr`, `ticket-research-docmgr-remarkable`, and `diary` skill instructions
- Added missing docmgr vocabulary topics for `frontend`, `module-federation`, and `demo`
- Created ticket `FEDMOD-0001`
- Added the primary design doc and two reference docs

### Why

- I needed to know whether this was documentation for an existing codebase or a greenfield proposal
- I needed the ticket to be structurally valid before writing content or attempting reMarkable delivery

### What worked

- `docmgr status --summary-only` confirmed the workspace root and initial zero-ticket state
- `docmgr ticket create-ticket` created the expected ticket structure
- `docmgr doc add` successfully created the design and reference docs

### What didn't work

- There were no implementation files to analyze, which meant the original "analysis" request could not be satisfied as a codebase walkthrough
- This was not a hard failure, but it changed the output from "document existing implementation" to "design a new implementation"

### What I learned

- The repo is intentionally sparse and optimized for docmgr-driven ticket work
- The right deliverable is an evidence-backed proposal that clearly distinguishes observed state from proposed future files

### What was tricky to build

- The main challenge was preserving rigor without pretending there was existing application code
- The solution was to make the current-state section explicit and then treat all application files as proposed future layout

### What warrants a second pair of eyes

- The eventual bundler choice if future repo constraints emerge
- Whether the first demo should include one remote or two

### What should be done in the future

- Implement the host and remote apps described by the design doc
- Decide whether type generation belongs in phase one or a later phase

### Code review instructions

- Start with the design doc to understand the proposed architecture
- Then read the runtime reference and experiment scripts
- Validate that the diary accurately distinguishes observed state from inferred future work

### Technical details

- Ticket id: `FEDMOD-0001`
- Ticket path: `ttmp/2026/03/22/FEDMOD-0001--federated-module-runtime-loading-demo/`
- Core command sequence:

```bash
docmgr status --summary-only
docmgr vocab add --category topics --slug frontend --description 'Frontend applications, browser runtime, and UI architecture'
docmgr vocab add --category topics --slug module-federation --description 'Webpack/Vite module federation runtime loading and shared scope behavior'
docmgr vocab add --category topics --slug demo --description 'Self-contained demonstrations, prototypes, and teaching artifacts'
docmgr ticket create-ticket --ticket FEDMOD-0001 --title "Federated module runtime loading demo" --topics frontend,module-federation,demo
docmgr doc add --ticket FEDMOD-0001 --doc-type design-doc --title "Federated Module Demo Analysis, Design, and Implementation Guide"
docmgr doc add --ticket FEDMOD-0001 --doc-type reference --title "Investigation Diary"
docmgr doc add --ticket FEDMOD-0001 --doc-type reference --title "Runtime API and Experiment Notes"
```

## Step 2: Choose the technical teaching path and write the guide

The next decision was technical rather than clerical: which implementation style would best teach runtime loading to a new intern? The answer was to separate the low-level mental model from the build-tool choice. The design doc uses the webpack container `get/init` model to explain the runtime, but recommends a Vite-based demo implementation because the Vite setup is smaller and clearer for greenfield onboarding.

I also chose to add ticket-local experiments in `scripts/` so the guide would not be purely conceptual. That satisfies the user's instruction about experiments and gives the intern a way to inspect the runtime contract before scaffolding the real apps.

### Prompt Context

**User prompt (verbatim):** (same as Step 1)

**Assistant interpretation:** Produce a detailed teaching guide with prose, bullets, diagrams, pseudocode, API references, and file references.

**Inferred user intent:** The document should be clear enough that an intern can understand both the "why" and the "how" without already knowing Module Federation.

**Commit (code):** N/A

### What I did

- Checked current primary-source docs for webpack Module Federation concepts
- Checked current primary-source docs for the Module Federation Vite plugin and enhanced runtime APIs
- Wrote the main design guide
- Wrote the runtime reference document
- Added two runnable scripts in the ticket's `scripts/` folder:
  - `mock-federation-runtime.mjs`
  - `inspect-remote-entry.mjs`

### Why

- The guide needed to be current enough to avoid sending the intern toward stale package/runtime APIs
- The scripts make the abstract lifecycle concrete and inspectable

### What worked

- The official docs confirmed the continued importance of the webpack `get/init` container model
- The Module Federation runtime docs confirmed the current `createInstance`, `registerRemotes`, and `loadRemote` APIs
- The Vite plugin docs provided a concrete modern configuration shape with `manifest: true` and shared singleton React config

### What didn't work

- Initial general web search results were noisy, so I narrowed to primary-source pages instead of relying on broad search output

### What I learned

- The official Module Federation ecosystem now gives a clean story for pairing a Vite build plugin with a runtime API
- For an intern-facing demo, the clearest narrative is "webpack mental model, Vite implementation"

### What was tricky to build

- The difficult part was preventing the guide from collapsing into a generic micro-frontend essay
- I solved that by making the document file- and phase-oriented, with concrete future paths, acceptance criteria, and runtime diagrams

### What warrants a second pair of eyes

- Whether the eventual implementation should use plugin-created instances only, or explicitly use `createInstance` even in the host for consistency
- Whether to keep the registry as static JSON or graduate it to a tiny server when implementation begins

### What should be done in the future

- Turn the proposed file layout into actual `apps/host` and `apps/checkout-remote` directories
- Add automated tests once the demo code exists

### Code review instructions

- Read the design doc's "Why Vite For The Demo" and "Why Keep The Webpack Model In Mind" sections first
- Then run the scripts to confirm the runtime behavior matches the prose explanation

### Technical details

- Primary-source docs consulted:
  - `https://webpack.js.org/concepts/module-federation/`
  - `https://module-federation.io/guide/build-plugins/plugins-vite.html`
  - `https://module-federation.io/guide/runtime/`
  - `https://module-federation.io/guide/basic/runtime/runtime-api.html`

## Step 3: Bookkeeping, validation, and delivery

The final step was operational: wire the ticket metadata, update tasks and changelog, validate the ticket with `docmgr doctor`, and upload a doc bundle to reMarkable. This step turns an ad hoc markdown file into a maintainable ticket deliverable.

### Prompt Context

**User prompt (verbatim):** (same as Step 1)

**Assistant interpretation:** Finish the work end-to-end, including ticket quality checks and device delivery.

**Inferred user intent:** The output should be durable, reviewable, and available off-computer on reMarkable.

**Commit (code):** N/A

### What I did

- Updated the ticket index, tasks, and changelog
- Related the key ticket files after writing them
- Planned validation and reMarkable upload steps as part of the ticket workflow

### Why

- A ticket without bookkeeping is harder to review and resume later
- The reMarkable upload is part of the requested deliverable, not an optional extra

### What worked

- The ticket structure supported the documentation workflow cleanly

### What didn't work

- N/A at the time of authoring this step; the final validation and upload evidence should be appended after those commands run

### What I learned

- In a docmgr-first repo, ticket hygiene is part of the actual engineering output

### What was tricky to build

- The challenge here is not conceptual but procedural: forgetting to relate files or update tasks would weaken the usefulness of the ticket later

### What warrants a second pair of eyes

- The final `docmgr doctor` output
- The final reMarkable upload verification listing

### What should be done in the future

- Append exact validation and upload evidence if the ticket is further updated

### Code review instructions

- Confirm `tasks.md` and `changelog.md` match the actual deliverables
- Confirm the uploaded bundle includes the right documents and table of contents

### Technical details

Expected commands:

```bash
docmgr doc relate --doc <doc> --file-note "/abs/path:reason"
docmgr changelog update --ticket FEDMOD-0001 --entry "Authored design guide, runtime reference, and ticket-local experiments"
docmgr doctor --ticket FEDMOD-0001 --stale-after 30
remarquee status
remarquee cloud account --non-interactive
remarquee upload bundle --dry-run <docs...> --name "FEDMOD-0001 Federated Module Demo" --remote-dir "/ai/2026/03/22/FEDMOD-0001" --toc-depth 2
remarquee upload bundle <docs...> --name "FEDMOD-0001 Federated Module Demo" --remote-dir "/ai/2026/03/22/FEDMOD-0001" --toc-depth 2
remarquee cloud ls /ai/2026/03/22/FEDMOD-0001 --long --non-interactive
```

## Related

- `../design-doc/01-federated-module-demo-analysis-design-and-implementation-guide.md`
- `./02-runtime-api-and-experiment-notes.md`

## Step 4: Revise the design for one public origin and prepare implementation tasks

The design originally described separate public URLs for the host, remote, and registry. The user then proposed serving all three logical parts from a single server under different paths. That is the right simplification for this demo, so the design was updated to make one public origin the default architecture rather than a side note.

This change is important because it affects more than prose. It changes the path layout, the recommended Vite `base` values, the registry examples, the server design, the smoke tests, and the order of implementation tasks. Before writing code, the ticket needed an execution plan detailed enough to support stepwise commits and diary updates.

### Prompt Context

**User prompt (verbatim):** "could we serve all 3 parts from the same server, but under different paths? to simplify launching and managing this thing?

alright, update the document, then create a detailed list of tasks in the ticket, and work on them one by one, committing as you go, keeping a detailed diary"

**Assistant interpretation:** Revise the design to use one public origin with path-based separation for host, remote assets, and registry, then turn the ticket into an implementation plan.

**Inferred user intent:** Reduce launch and operational complexity while preserving the core runtime-loading lesson, then implement the demo in small reviewable steps.

**Commit (code):** a2c83b8 — "Initialize FEDMOD-0001 ticket docs"

### What I did

- Updated the design doc to make single-origin path-based serving the preferred architecture
- Added the server to the proposed repository layout
- Changed the public URL examples to `/host/`, `/remotes/checkout/`, and `/registry/remotes.json`
- Updated the runtime reference to use same-origin remote entry examples
- Rewrote `tasks.md` into a concrete 10-step execution checklist

### Why

- One origin is easier for an intern to run and reason about
- The task list needed to become implementation-grade before code work began

### What worked

- The existing design was modular enough that the serving model could be revised without rewriting the federation fundamentals

### What didn't work

- N/A

### What I learned

- The most important simplification here is not reducing the number of builds; it is reducing the number of public origins the intern needs to think about

### What was tricky to build

- The sharp edge was preserving the distinction between "same public server" and "same application"
- The design now makes that explicit: separate builds and separate federation containers still exist even though one server publishes them

### What warrants a second pair of eyes

- The final implementation of `base` paths for host and remote builds
- Whether the first implementation should include a proxy-based dev mode or just a build-and-serve flow

### What should be done in the future

- Execute the implementation checklist one step at a time and commit after each substantive step

### Code review instructions

- Read the new "Single-Origin Serving Strategy" section in the design doc
- Confirm the task list reflects the revised serving model

### Technical details

Revised public layout:

```text
http://localhost:8080/host/
http://localhost:8080/remotes/checkout/
http://localhost:8080/registry/remotes.json
```

## Step 5: Add the root workspace scaffolding

With the ticket plan settled, the next step was to create the shared repository-level files that every later implementation step would depend on. The repo previously had no `package.json`, no `.gitignore`, and no shared TypeScript configuration, so there was no stable foundation for host, remote, or server code.

This step stayed deliberately small. I added only the root workspace metadata, basic build/serve scripts, ignore rules, and a shared TypeScript base config. I did not run `npm install` yet because the workspace package manifests for `apps/host` and `apps/checkout-remote` do not exist until the next steps.

### Prompt Context

**User prompt (verbatim):** (same as Step 4)

**Assistant interpretation:** Start executing the implementation checklist in commit-sized steps, beginning with shared workspace scaffolding.

**Inferred user intent:** Keep the implementation incremental and reviewable instead of jumping straight into a large undifferentiated scaffold.

**Commit (code):** pending

### What I did

- Added the root `package.json` with npm workspaces for `apps/host` and `apps/checkout-remote`
- Added shared root scripts for build and serve flows
- Added a root `.gitignore`
- Added `tsconfig.base.json` for shared TypeScript defaults
- Updated the ticket tasks and changelog to mark this step complete

### Why

- The host, remote, and server need a shared workspace contract before package manifests and source files are introduced
- Deferring installation until the app manifests exist avoids unnecessary lockfile churn

### What worked

- The repo was clean enough that the shared scaffold could be added without needing any migration work

### What didn't work

- N/A

### What I learned

- In a greenfield repo, the first implementation step should establish conventions, not behavior

### What was tricky to build

- The main constraint was sequencing: if I had run package installation before the workspace packages existed, npm would have had incomplete workspace metadata to resolve against

### What warrants a second pair of eyes

- Whether the root script set is sufficient or whether a dedicated `smoke` script should also live at the root later

### What should be done in the future

- Add the remote workspace package next so the first real build target exists

### Code review instructions

- Review the root `package.json` and confirm the workspaces and scripts match the ticket plan
- Review `.gitignore` and `tsconfig.base.json` for reasonable defaults

### Technical details

Root files introduced:

```text
package.json
.gitignore
tsconfig.base.json
```
