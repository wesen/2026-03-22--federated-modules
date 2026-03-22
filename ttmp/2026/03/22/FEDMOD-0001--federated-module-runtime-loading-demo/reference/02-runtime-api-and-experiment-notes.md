---
Title: Runtime API and Experiment Notes
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
      Note: Primary guide this reference supports
    - Path: ttmp/2026/03/22/FEDMOD-0001--federated-module-runtime-loading-demo/scripts/inspect-remote-entry.mjs
      Note: Script for checking real remote assets and container markers
    - Path: ttmp/2026/03/22/FEDMOD-0001--federated-module-runtime-loading-demo/scripts/mock-federation-runtime.mjs
      Note: Primary runnable script for observing the runtime lifecycle
ExternalSources:
    - https://webpack.js.org/concepts/module-federation/
    - https://module-federation.io/guide/runtime/
    - https://module-federation.io/guide/basic/runtime/runtime-api.html
Summary: Reference material for runtime loader APIs, remoteEntry anatomy, and experiment scripts stored in this ticket.
LastUpdated: 2026-03-22T10:44:13.259276962-04:00
WhatFor: Quick-reference companion for the design guide, covering runtime APIs, mental models, and local experiments.
WhenToUse: Use while implementing or debugging the demo, or while onboarding a new engineer to the runtime mechanics.
---


# Runtime API and Experiment Notes

## Goal

Provide copy/paste-ready runtime concepts, API reminders, and experiment scripts that complement the main design guide.

## Context

The main design doc is intentionally narrative. This document is intentionally operational. It compresses the important runtime ideas into a shorter reference a new engineer can keep open while coding.

## Quick Reference

### Core runtime vocabulary

| Term | Meaning | Why it matters |
|---|---|---|
| Host | The app consuming a remote | Owns runtime discovery and rendering |
| Remote | The app exposing modules | Publishes entry and chunks |
| Container | Runtime surface of a remote | Exposes `get()` and `init()` |
| Shared scope | Negotiated dependency table | Prevents unnecessary duplicate libraries |
| Remote entry | Bootstrapping asset for the remote | Lets the host discover exposed modules |
| Manifest | Runtime metadata for federation | Can decouple registration from direct hardcoded URLs |

### Webpack low-level flow

```ts
await __webpack_init_sharing__("default");
await container.init(__webpack_share_scopes__.default);
const factory = await container.get("./CartPanel");
const moduleExports = factory();
```

Interpretation:

- first initialize the host-side shared scope,
- then connect the remote container to that scope,
- then request an exposed module,
- then evaluate the returned factory.

### Enhanced runtime flow

```ts
import { createInstance } from "@module-federation/enhanced/runtime";

const federation = createInstance({
  name: "host",
  remotes: [],
});

federation.registerRemotes([
  { name: "checkout", entry: "http://localhost:8080/remotes/checkout/remoteEntry.js" },
]);

const cart = await federation.loadRemote("checkout/CartPanel");
```

### Minimal registry shape

```json
{
  "checkout": "http://localhost:8080/remotes/checkout/remoteEntry.js"
}
```

For a stricter same-origin teaching version, the host can also resolve a relative path:

```json
{
  "checkout": "/remotes/checkout/remoteEntry.js"
}
```

### Remote exposes example

```ts
exposes: {
  "./CartPanel": "./src/components/CartPanel.tsx",
  "./formatPrice": "./src/utils/formatPrice.ts"
}
```

### Shared React example

```ts
shared: {
  react: { singleton: true },
  "react/": { singleton: true },
  "react-dom": { singleton: true }
}
```

### What the host should log during a remote load

```text
[host] resolving remote "checkout"
[host] remote entry: http://localhost:8080/remotes/checkout/remoteEntry.js
[host] share scope initialized
[host] container initialized
[host] exposed module requested: ./CartPanel
[host] remote module evaluated successfully
```

## Usage Examples

### Example 1: Run the teaching script before writing app code

```bash
node ./ttmp/2026/03/22/FEDMOD-0001--federated-module-runtime-loading-demo/scripts/mock-federation-runtime.mjs
```

Expected outcome:

- you see the share scope being initialized,
- the remote container announces its `init()` call,
- the host requests an exposed module,
- the module factory is evaluated,
- the script prints a small success payload.

### Example 2: Inspect a real remote entry

```bash
node ./ttmp/2026/03/22/FEDMOD-0001--federated-module-runtime-loading-demo/scripts/inspect-remote-entry.mjs http://localhost:8080/remotes/checkout/remoteEntry.js
```

Expected outcome:

- HTTP status and content type are printed,
- the script reports whether `get(` and `init(` were found,
- the script prints a short preview of the asset.

### Example 3: Map concepts across implementations

| Concept | Webpack-centric view | Enhanced runtime view |
|---|---|---|
| Register remote | `remotes` config or promise-based remote | `registerRemotes()` |
| Load module | `import("scope/module")` or `container.get()` | `loadRemote("scope/module")` |
| Share initialization | `__webpack_init_sharing__` + `container.init()` | handled by runtime instance |
| Dynamic remote URL | promise remote config | runtime registration from manifest |

## Related

- `../design-doc/01-federated-module-demo-analysis-design-and-implementation-guide.md`
- `./01-investigation-diary.md`
- `../scripts/mock-federation-runtime.mjs`
- `../scripts/inspect-remote-entry.mjs`
