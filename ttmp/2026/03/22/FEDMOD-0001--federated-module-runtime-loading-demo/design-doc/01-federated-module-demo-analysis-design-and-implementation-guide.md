---
Title: Federated Module Demo Analysis, Design, and Implementation Guide
Ticket: FEDMOD-0001
Status: active
Topics:
    - frontend
    - module-federation
    - demo
DocType: design-doc
Intent: long-term
Owners: []
RelatedFiles:
    - Path: apps/checkout-remote/vite.config.ts
      Note: Remote exposes and shared dependency configuration
    - Path: apps/host/src/runtime/federation.ts
      Note: Runtime remote registration and loadRemote usage
    - Path: apps/host/vite.config.ts
      Note: Static remote configuration and host base path
    - Path: registry/remotes.json
      Note: Concrete registry payload for runtime discovery
    - Path: server/serve-demo.mjs
      Note: Single-origin serving model implemented in code
    - Path: ttmp/2026/03/22/FEDMOD-0001--federated-module-runtime-loading-demo/reference/02-runtime-api-and-experiment-notes.md
      Note: Companion reference for API lookups and copy-paste snippets
    - Path: ttmp/2026/03/22/FEDMOD-0001--federated-module-runtime-loading-demo/scripts/inspect-remote-entry.mjs
      Note: Used to inspect real remote entry and manifest assets during implementation
    - Path: ttmp/2026/03/22/FEDMOD-0001--federated-module-runtime-loading-demo/scripts/mock-federation-runtime.mjs
      Note: Demonstrates the init/get/factory lifecycle discussed in the guide
ExternalSources:
    - https://webpack.js.org/concepts/module-federation/
    - https://module-federation.io/guide/build-plugins/plugins-vite.html
    - https://module-federation.io/guide/runtime/
    - https://module-federation.io/guide/basic/runtime/runtime-api.html
Summary: Detailed intern-facing guide for building a module federation demo that loads remote modules at runtime.
LastUpdated: 2026-03-22T10:44:13.199920379-04:00
WhatFor: Intern-facing analysis, design, and implementation guide for a greenfield module federation runtime-loading demo.
WhenToUse: Use when building or reviewing the proposed federated module demo in this ticket workspace.
---



# Federated Module Demo Analysis, Design, and Implementation Guide

## Executive Summary

This ticket proposes a greenfield demo whose job is not merely to "use Module Federation", but to teach a new engineer what runtime module loading actually means. The demo should make the loading boundary visible: one application exposes a remote module, one host application discovers and loads that module at runtime, and both sides share React so the host and remote can prove that shared dependency negotiation is working.

The repository is currently documentation-first. At the time of writing, the only material in the repository is the docmgr workspace under `ttmp/` plus the new ticket workspace created for this task. There is no pre-existing `package.json`, no `apps/` directory, no `src/` tree, and no existing webpack or Vite configuration in the repo. That means this document is a design for a new demo, not a post-hoc description of an existing implementation.

The recommended implementation path is:

1. Build a minimal remote application that exposes one React component and one plain utility function.
2. Build a host application that loads the remote component from a known URL.
3. Serve the host, remote assets, and runtime registry from one public origin under different paths.
4. Add a runtime registry so the host can discover remote URLs without rebuilding.
5. Keep two ticket-local scripts in `scripts/` so an intern can understand the runtime before touching app code.

The concrete proposal below uses Vite with `@module-federation/vite` for the demo implementation because it gives a small, modern, developer-friendly setup, while the document keeps the webpack mental model explicit because webpack's container `get/init` model is still the clearest way to explain what happens at runtime.

## Problem Statement And Scope

The user asked for a detailed analysis, design, and implementation guide for a new intern, stored in a docmgr ticket and uploaded to reMarkable, showing how federated modules are loaded at runtime. The useful deliverable is therefore not just a task note. It needs to be a teaching document that explains:

- what a host is,
- what a remote is,
- what `remoteEntry.js` or a federation manifest does,
- how shared dependencies are negotiated,
- how runtime remote discovery differs from build-time remotes,
- how to structure a small demo repo so the moving parts stay legible.

This guide is intentionally scoped to a browser-based frontend demo. It is not a production architecture review for a large micro-frontend platform, and it is not trying to solve SSR, server-side composition, or multi-team governance. The goal is narrower and more practical: create a demo that a new engineer can run locally, inspect with browser devtools, and extend safely.

## Current-State Analysis

### Observed repository state

The repository currently contains only documentation scaffolding and the ticket workspace. Evidence in-repo:

- The docmgr workspace exists at `ttmp/` and contains templates and vocabulary.
- The new ticket workspace exists at `ttmp/2026/03/22/FEDMOD-0001--federated-module-runtime-loading-demo/`.
- The ticket contains `index.md`, `tasks.md`, `changelog.md`, this design doc, and the supporting reference docs.

Observed implication: there is no existing application code that constrains the demo design. That gives us freedom to optimize for teaching clarity instead of compatibility with a legacy codebase.

### Key consequence of the current state

Because there is no existing source tree, every recommendation in this document is a proposal. Whenever a section says "create `apps/host/...`" or "add `registry/remotes.json`", that is a proposed future file layout, not a description of files that already exist.

## Learning Goals For The Intern

Before the intern writes any application code, they need to understand the following ideas in plain language:

### 1. Build-time import vs runtime import

With a normal npm package, the host knows the dependency during build. With Module Federation, the host can defer that decision until runtime. That is the entire point of the demo.

### 2. Container contract

Webpack's official documentation makes the contract explicit: a remote container exposes `get()` and `init()`, and loading is asynchronous while evaluation is synchronous. Even if the implementation uses a higher-level Vite plugin or runtime SDK, that `get/init` mental model is still the right one for debugging.

### 3. Shared dependency negotiation

The remote may expose React components, but the host and remote should not silently ship two incompatible React singletons if the demo intends to show shared scope behavior. The demo must explicitly configure `react` and `react-dom` as shared singleton dependencies so the intern can see what "share negotiation" means in practice.

### 4. Static remote wiring vs dynamic remote registration

There are two distinct stories:

- Static remote wiring: the host already knows the remote URL in config.
- Dynamic remote registration: the host discovers the remote URL at runtime from configuration or a registry.

The demo should show both, because the user explicitly asked about loading modules at runtime.

## Definitions

### Host

The application that requests and renders remote modules. It owns the page shell, navigation, and the logic that decides which remote to load.

### Remote

The application that exposes code to other applications. It publishes a federation entry and the chunks that back the exposed modules.

### Exposed module

The public module path the remote chooses to export, such as `./CartPanel` or `./price-utils`.

### Shared module

A dependency that host and remote agree can be reused across boundaries, such as `react`, `react-dom`, or a design-token package.

### Remote entry / manifest

The runtime metadata layer that tells the host how to locate and initialize remote code. In webpack this is usually `remoteEntry.js`. In the Module Federation enhanced runtime ecosystem you may also work with a manifest such as `mf-manifest.json`.

## Proposed Demo Outcome

When the demo is complete, a new engineer should be able to launch one public demo server and see all three of these behaviors:

1. The host renders a local component immediately.
2. The host lazily loads a remote React component from a known remote URL.
3. The host loads a different remote module from a URL discovered at runtime via a JSON registry.

The demo should also expose one non-UI function from the remote so the intern sees that federation is not limited to components.

The public serving model should be:

```text
http://localhost:8080/host/
http://localhost:8080/remotes/checkout/
http://localhost:8080/registry/remotes.json
```

This keeps the system easy to launch and reason about while preserving the important architectural fact that the host and remote are still separate builds and separate federation containers.

## Proposed Repository Layout

The following layout does not exist yet; it is the recommended structure for the actual implementation:

```text
.
├── apps/
│   ├── host/
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── src/
│   │       ├── bootstrap.tsx
│   │       ├── main.tsx
│   │       ├── runtime/
│   │       │   ├── federation.ts
│   │       │   └── registry.ts
│   │       ├── components/
│   │       │   ├── LocalStatusCard.tsx
│   │       │   └── RemoteBoundary.tsx
│   │       └── pages/
│   │           └── HomePage.tsx
│   └── checkout-remote/
│       ├── package.json
│       ├── vite.config.ts
│       └── src/
│           ├── bootstrap.tsx
│           ├── main.tsx
│           ├── components/
│           │   └── CartPanel.tsx
│           └── utils/
│               └── formatPrice.ts
├── server/
│   └── serve-demo.mjs
├── registry/
│   └── remotes.json
└── ttmp/
    └── 2026/03/22/FEDMOD-0001--federated-module-runtime-loading-demo/
```

Why this layout:

- `apps/host` and `apps/checkout-remote` keep the container boundary obvious.
- `src/runtime/` in the host gives the dynamic loading logic a visible home.
- `server/serve-demo.mjs` gives the demo one public origin and one launch command.
- `registry/remotes.json` makes the dynamic discovery story concrete.
- The ticket remains the place for architecture docs, experiments, and review notes.

## Single-Origin Serving Strategy

The user asked whether all three parts could be served from the same server under different paths. For this demo, the answer is yes, and it is the preferred design.

The key architectural distinction is:

- separate applications and separate federation containers still exist,
- but a single HTTP server publishes their built assets under different URL prefixes.

That means the demo keeps the runtime-loading lesson while reducing launch complexity. This is especially useful for an intern because it removes distracting issues such as multiple terminal windows, extra ports, and accidental CORS misconfiguration.

### Recommended public path layout

```text
/host/                       -> host app assets
/remotes/checkout/           -> checkout remote build output
/registry/remotes.json       -> runtime registry consumed by the host
```

### Why this is simpler

- one browser origin,
- no CORS setup,
- one server process for the public demo,
- easier copy-pasteable URLs in the guide,
- closer to how many real deployments work behind an ingress or gateway.

## Architecture Overview

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Demo Server                                                        │
│                                                                     │
│  /host/                    -> host app build output                 │
│  /remotes/checkout/        -> checkout remote build output          │
│  /registry/remotes.json    -> runtime registry                      │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     │ same-origin HTTP requests
                     ▼
┌──────────────────────────────────────────────────────────┐
│ Host App                                                │
│                                                          │
│  HomePage                                               │
│   ├── LocalStatusCard                                   │
│   ├── RemoteBoundary                                    │
│   │    └── loadRemoteComponent("checkout", "./CartPanel")│
│   └── RegistryLoader                                    │
│        └── fetch /registry/remotes.json                 │
│                                                          │
│  Shared scope: react, react-dom                         │
└───────────────┬──────────────────────────────────────────┘
                │
                │ fetch /remotes/checkout/remoteEntry.js
                ▼
┌──────────────────────────────────────────────────────────┐
│ Checkout Remote                                         │
│                                                          │
│  exposes:                                               │
│   - ./CartPanel                                         │
│   - ./formatPrice                                       │
│                                                          │
│  shared: react, react-dom                               │
└──────────────────────────────────────────────────────────┘
```

## Runtime Flow Explained Slowly

This is the flow the demo should make visible:

1. The host bootstraps normally and renders only local code.
2. The user opens the part of the page that needs the remote module.
3. The host loads the remote entry or manifest over HTTP.
4. The host initializes the share scope.
5. The remote initializes against that share scope and decides whether it can reuse the host's shared modules.
6. The host requests a specific exposed module.
7. The remote returns a factory.
8. The host evaluates the factory and receives the actual module exports.
9. React renders the remote component inside a local suspense or error boundary.

The critical learning point is that "loading the remote" and "executing the remote module" are distinct operations.

## Why Vite For The Demo

The official Module Federation Vite plugin documentation states that Vite can both build modules that meet Module Federation loading specifications and consume remotes through aliases, while also supporting shared dependencies and remote type consumption. It also shows a concrete setup using `@module-federation/vite` with `manifest: true`, `remotes`, `exposes`, and shared singleton React configuration.

That makes Vite a good fit for this particular demo because:

- the config is smaller than an equivalent hand-written webpack setup,
- the intern can focus on runtime behavior instead of webpack boilerplate,
- the runtime concepts still map directly to webpack's container model.

This is an inference from the official docs, not a direct quote: Vite is the better teaching choice here because it reduces scaffolding while preserving the federation concepts we need to demonstrate.

## Why Keep The Webpack Model In Mind

Webpack's official Module Federation documentation is still the clearest explanation of the low-level runtime contract:

- remote loading is asynchronous,
- module evaluation is synchronous,
- the remote container surface is `get()` plus `init()`,
- dynamic remotes can be resolved from a runtime promise,
- the host must initialize sharing before asking a container for modules.

That model should guide debugging even if the code uses a higher-level runtime API such as `loadRemote()` or `createInstance()`.

## Proposed Technology Choices

### Bundler and federation layer

- Host and remote bundler: Vite
- Federation plugin: `@module-federation/vite`
- Runtime API for dynamic loading: `@module-federation/enhanced/runtime`

### UI framework

- React for both host and remote
- `React.lazy` and `Suspense` for the main teaching path

### Public URL layout

- Demo server: `http://localhost:8080`
- Host page: `http://localhost:8080/host/`
- Remote assets: `http://localhost:8080/remotes/checkout/`
- Registry file: `http://localhost:8080/registry/remotes.json`

### Internal development ports

If a later development mode uses path-based proxying with hot reload, the internal servers can still run on separate ports behind the single public origin. That would be an implementation convenience, not the public architecture the intern sees.

### Exposed modules

- `./CartPanel` for UI rendering
- `./formatPrice` for a simple non-UI utility

## Proposed Config Sketches

### Remote `vite.config.ts`

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { federation } from "@module-federation/vite";

export default defineConfig({
  server: {
    port: 5174,
    origin: "http://localhost:5174",
  },
  base: "/remotes/checkout/",
  plugins: [
    react(),
    federation({
      name: "checkout",
      filename: "remoteEntry.js",
      manifest: true,
      exposes: {
        "./CartPanel": "./src/components/CartPanel.tsx",
        "./formatPrice": "./src/utils/formatPrice.ts",
      },
      shared: {
        react: { singleton: true },
        "react/": { singleton: true },
        "react-dom": { singleton: true },
      },
    }),
  ],
  build: {
    target: "chrome89",
  },
});
```

### Host `vite.config.ts`

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { federation } from "@module-federation/vite";

export default defineConfig({
  server: {
    port: 5173,
    origin: "http://localhost:5173",
  },
  base: "/host/",
  plugins: [
    react(),
    federation({
      name: "host",
      remotes: {
        checkout: {
          type: "module",
          name: "checkout",
          entry: "http://localhost:8080/remotes/checkout/remoteEntry.js",
        },
      },
      shared: {
        react: { singleton: true },
        "react/": { singleton: true },
        "react-dom": { singleton: true },
      },
    }),
  ],
  build: {
    target: "chrome89",
  },
});
```

### Host runtime loader for dynamic registration

```ts
import { createInstance } from "@module-federation/enhanced/runtime";

export const federation = createInstance({
  name: "host",
  remotes: [],
});

export async function registerRemoteFromRegistry(remoteName: string) {
  const registry = await fetch("/registry/remotes.json").then((r) => r.json());
  const entry = registry[remoteName];
  if (!entry) {
    throw new Error(`Unknown remote: ${remoteName}`);
  }
  federation.registerRemotes([{ name: remoteName, entry }], { force: true });
}

export async function loadRemoteModule<T>(id: string): Promise<T> {
  return federation.loadRemote<T>(id);
}
```

### Host React usage

```tsx
import React from "react";
import { loadRemoteModule, registerRemoteFromRegistry } from "./runtime/federation";

export function DynamicCartPanel() {
  const RemoteCart = React.lazy(async () => {
    await registerRemoteFromRegistry("checkout");
    const mod = await loadRemoteModule<{ default: React.ComponentType }>("checkout/CartPanel");
    return { default: mod.default };
  });

  return (
    <React.Suspense fallback={<p>Loading remote cart...</p>}>
      <RemoteCart />
    </React.Suspense>
  );
}
```

## API Reference Cheat Sheet

### Webpack low-level runtime concepts

- `__webpack_init_sharing__("default")`
  Initializes the shared scope before consuming remotes.
- `container.init(__webpack_share_scopes__.default)`
  Gives the remote container access to the host's shared modules.
- `container.get("./CartPanel")`
  Requests an exposed module factory from the remote.
- `factory()`
  Evaluates the factory to obtain the actual module exports.

### Module Federation enhanced runtime concepts

- `createInstance(...)`
  Creates an explicit federation runtime instance when you are using pure runtime registration or need more control.
- `registerRemotes(...)`
  Adds remotes to a runtime instance after startup.
- `loadRemote("checkout/CartPanel")`
  Loads an exposed module through the federation runtime API.
- `getInstance()`
  Retrieves the instance created implicitly by the build plugin when using plugin-managed runtime wiring.

## Detailed Sequence Diagram

```text
Browser            Demo server          Host runtime         Remote entry/chunks
   |                    |                    |                       |
   | GET /host/         |                    |                       |
   |------------------->|                    |                       |
   | render host page   |                    |                       |
   |---------------------------------------->|                       |
   | click "Load cart"  |                    |                       |
   |---------------------------------------->|                       |
   |                    |                    | GET /registry/remotes.json
   |                    |<-------------------------------------------|
   |                    |                    | GET /remotes/checkout/remoteEntry.js
   |                    |<-------------------------------------------|
   |                    |                    | init shared scope      |
   |                    |                    | request ./CartPanel    |
   |                    |                    |----------------------->|
   |                    |                    | receive factory        |
   |                    |                    |<-----------------------|
   |                    |                    | render component       |
   |<----------------------------------------|                       |
```

## Proposed Demo Screens

The host UI should make the runtime boundary obvious. A simple screen structure is enough:

### Screen 1: "Local vs remote"

- Show a local status card rendered synchronously.
- Show a remote cart panel behind a "Load remote cart" button.
- Display the remote URL currently in use.

### Screen 2: "Dynamic registry"

- Load a remote name from `registry/remotes.json`.
- Print the remote name, entry URL, and load timestamp.
- Let the user switch between two remote URLs by editing a query param or registry entry.

### Screen 3: "Shared dependency proof"

- Render a line showing whether host React and remote React resolved to the same runtime identity.
- Display a warning if the remote fell back to its own React copy.

## Pseudocode For The Core Runtime Mechanics

### A. Low-level conceptual loader

```text
function loadRemote(scope, exposedModule):
  await initializeHostShareScope("default")
  container = await ensureRemoteContainerIsLoaded(scope)
  await container.init(hostShareScope.default)
  factory = await container.get(exposedModule)
  moduleExports = factory()
  return moduleExports
```

### B. Dynamic registry flow

```text
function loadRemoteFromRegistry(remoteName, exposedModule):
  registry = fetch("/registry/remotes.json")
  entryUrl = registry[remoteName]
  if entryUrl is missing:
    throw "unknown remote"
  register remoteName -> entryUrl in federation runtime
  return loadRemote(remoteName + "/" + exposedModule)
```

### C. Shared singleton negotiation

```text
host provides:
  react 18.x singleton
  react-dom 18.x singleton

remote requests:
  react singleton
  react-dom singleton

if compatible version exists in host share scope:
  remote reuses host copy
else:
  remote uses bundled fallback or errors, depending on configuration
```

## File-Level Implementation Plan

### Phase 0: Learn the mechanics before building the apps

Create and run ticket-local scripts:

- `scripts/mock-federation-runtime.mjs`
- `scripts/inspect-remote-entry.mjs`

This phase should happen before app scaffolding, because it lets the intern observe the container lifecycle in a controlled environment.

### Phase 1: Scaffold the remote app

Create these future files:

- `apps/checkout-remote/package.json`
- `apps/checkout-remote/vite.config.ts`
- `apps/checkout-remote/src/components/CartPanel.tsx`
- `apps/checkout-remote/src/utils/formatPrice.ts`
- `apps/checkout-remote/src/main.tsx`

Acceptance criteria:

1. The remote builds and serves a `remoteEntry.js`.
2. The remote exposes one component and one utility function.
3. The remote declares React shared singletons.

### Phase 2: Scaffold the host app with a static remote

Create these future files:

- `apps/host/package.json`
- `apps/host/vite.config.ts`
- `apps/host/src/runtime/federation.ts`
- `apps/host/src/components/RemoteBoundary.tsx`
- `apps/host/src/pages/HomePage.tsx`

Acceptance criteria:

1. The host renders local content without the remote.
2. The host can load `checkout/CartPanel` from a fixed remote URL.
3. Loading happens lazily behind `Suspense` and an error boundary.

### Phase 3: Add the single-origin server and path layout

Create these future files:

- `server/serve-demo.mjs`
- `registry/remotes.json`

Acceptance criteria:

1. One server publishes `/host/`, `/remotes/checkout/`, and `/registry/remotes.json`.
2. The server can redirect `/` to `/host/`.
3. The remote entry is reachable under `/remotes/checkout/remoteEntry.js`.

### Phase 4: Add runtime registry-based loading

Create these future files:

- `apps/host/src/runtime/registry.ts`

Acceptance criteria:

1. The host can discover a remote entry URL at runtime.
2. The host can re-register a remote without rebuilding.
3. The UI clearly shows which remote URL was loaded.

### Phase 5: Add observability and failure modes

Add:

- visible logging for load start, load success, and load failure,
- a timeout or retry wrapper around registry fetch and remote load,
- a version mismatch experiment so the intern can see how shared fallback behaves.

Acceptance criteria:

1. A missing remote produces a readable error.
2. A missing exposed module produces a readable error.
3. Shared dependency behavior is visible in the UI or logs.

## Server Sketch

The demo server does not need application logic. It only needs predictable static routing.

```js
import express from "express";
import path from "node:path";

const app = express();

app.use("/host", express.static(path.resolve("apps/host/dist")));
app.use("/remotes/checkout", express.static(path.resolve("apps/checkout-remote/dist")));
app.use("/registry", express.static(path.resolve("registry")));

app.get("/", (_req, res) => {
  res.redirect("/host/");
});

app.listen(8080);
```

This is intentionally boring. Boring is correct here because the lesson is Module Federation, not server cleverness.

## Testing And Validation Strategy

### Manual checks

1. Start remote and host separately.
2. Verify the host initial page renders with no remote traffic.
3. Trigger the remote load and confirm the browser fetches the federation entry only on demand.
4. Verify the remote component renders.
5. Verify a remote utility function can also be loaded.
6. Verify all network traffic stays on the same origin but different path prefixes.
7. Edit the runtime registry and verify the host can load from the new remote without rebuild.

### Browser devtools checks

Use the network tab to confirm:

- the remote entry request occurs only when needed,
- subsequent chunk requests come from the same origin under `/remotes/checkout/`,
- shared modules are not redundantly downloaded if negotiation succeeds.

Use the console to inspect the federation runtime instance if using the enhanced runtime. The official runtime docs note that created instances can be observed through `__FEDERATION__.__INSTANCES__`.

### Suggested automated tests

When the demo exists, add:

- a unit test for `registry.ts`,
- a unit test for host-side load wrapper error handling,
- an end-to-end smoke test that verifies remote content appears after a lazy load,
- an end-to-end failure case where the remote entry URL is invalid,
- a smoke test that verifies `/`, `/host/`, `/remotes/checkout/remoteEntry.js`, and `/registry/remotes.json` are all served by the same server.

## Risks And Failure Modes

### Risk 1: The demo becomes too magical

If the host simply imports `checkout/CartPanel` with no visible runtime instrumentation, the intern may conclude that Module Federation is just another import alias. That would fail the teaching goal.

Mitigation:

- print the remote URL and load lifecycle in the UI,
- keep the ticket-local scripts as pre-code learning tools,
- include one plain function expose in addition to a React component.

### Risk 2: React sharing hides duplicate-runtime problems

If the demo only works in the happy path, the intern may not understand why singleton configuration matters.

Mitigation:

- show the shared configuration explicitly,
- include a deliberate mismatch experiment later,
- explain the fallback behavior in both docs and UI logs.

### Risk 3: Dynamic registry flow becomes more complex than the lesson

Runtime discovery can easily pull the demo toward platform design.

Mitigation:

- keep the registry format tiny,
- use one JSON file instead of a service,
- defer auth, rollout, and environment promotion concerns.

## Alternatives Considered

### Alternative A: Webpack-first demo

Pros:

- most canonical low-level Module Federation explanation,
- direct access to `ModuleFederationPlugin`,
- lines up exactly with many older tutorials.

Cons:

- more config weight,
- more likely to teach webpack mechanics instead of federation mechanics,
- slower onboarding for an intern whose real question is runtime loading.

Decision:

Keep webpack as the conceptual reference, but use Vite for the actual demo implementation.

### Alternative B: Use `originjs/vite-plugin-federation`

Pros:

- established Vite federation option with dynamic and static examples,
- supports direct remote entry URLs and promise-based remote URL resolution.

Cons:

- the Module Federation core ecosystem now also provides an official Vite plugin and enhanced runtime with first-class runtime APIs,
- using the official ecosystem keeps the conceptual model and runtime APIs closer together for this demo.

Decision:

Prefer `@module-federation/vite` plus `@module-federation/enhanced/runtime` for the design in this ticket. `originjs/vite-plugin-federation` remains a credible alternative if project constraints later require it.

### Alternative C: Pure runtime demo with no build plugin

Pros:

- makes runtime registration explicit,
- reduces "plugin magic".

Cons:

- less realistic for interns who will likely encounter build-plugin-assisted federation,
- more custom wiring to explain immediately.

Decision:

Use the build plugin for the main path, and add pure runtime registration only for the dynamic registry portion.

## Open Questions

1. Should the eventual demo include a second remote so the registry story feels more realistic, or is one remote enough for the first teaching version?
2. Should the registry be a static JSON file committed to the repo, or a tiny local server that can simulate environment-specific remote resolution?
3. Does the future implementation need TypeScript remote type generation, or is that intentionally out of scope for the first intern-facing version?

## Recommended Next Implementation Step

Do not start by scaffolding the host UI. Start by running and reading the two scripts in this ticket's `scripts/` directory. Once the intern can explain the difference between:

- loading a container,
- initializing share scope,
- requesting a module factory,
- evaluating that factory,

they will make fewer mistakes when they move into the real host and remote app code.

## References

### Ticket-local references

- `../reference/01-investigation-diary.md`
- `../reference/02-runtime-api-and-experiment-notes.md`
- `../scripts/mock-federation-runtime.mjs`
- `../scripts/inspect-remote-entry.mjs`

### External references

- Webpack Module Federation concepts: `https://webpack.js.org/concepts/module-federation/`
- Module Federation Vite plugin: `https://module-federation.io/guide/build-plugins/plugins-vite.html`
- Module Federation runtime overview: `https://module-federation.io/guide/runtime/`
- Module Federation runtime API: `https://module-federation.io/guide/basic/runtime/runtime-api.html`
