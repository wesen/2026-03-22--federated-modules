# Changelog

## 2026-03-22

- Initial workspace created
- Added an intern-facing design and implementation guide for a greenfield module federation demo
- Added runtime reference notes and ticket-local experiment scripts
- Prepared ticket bookkeeping for validation and reMarkable upload
- Revised the design for single-origin path-based serving and expanded the ticket into an implementation checklist
- Added the root workspace scaffolding for the implementation phase
- Added the `checkout` remote workspace with exposed `CartPanel` and `formatPrice` modules
- Added the host workspace with static and registry-driven remote loading scaffolding
- Added the same-origin runtime registry file for remote resolution
- Added the single-origin Express server for `/host/`, `/remotes/checkout/`, and `/registry/`
- Refined the host UI so both loading modes show their path and request details explicitly
- Installed dependencies, verified successful production builds, and added a smoke script for same-origin serving
- Fixed the remote export shape for `React.lazy` and verified both static and registry-driven loading paths in a real browser session

## 2026-03-22

Authored the intern-facing guide, runtime reference, diary, and ticket-local federation experiments

### Related Files

- /home/manuel/code/wesen/2026-03-22--federated-modules/ttmp/2026/03/22/FEDMOD-0001--federated-module-runtime-loading-demo/design-doc/01-federated-module-demo-analysis-design-and-implementation-guide.md — Primary design deliverable added to the ticket
- /home/manuel/code/wesen/2026-03-22--federated-modules/ttmp/2026/03/22/FEDMOD-0001--federated-module-runtime-loading-demo/reference/02-runtime-api-and-experiment-notes.md — Supporting runtime API reference
- /home/manuel/code/wesen/2026-03-22--federated-modules/ttmp/2026/03/22/FEDMOD-0001--federated-module-runtime-loading-demo/scripts/mock-federation-runtime.mjs — Runnable lifecycle demonstration script
