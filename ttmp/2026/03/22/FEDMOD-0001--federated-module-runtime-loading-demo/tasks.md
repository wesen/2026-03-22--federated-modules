# Tasks

## TODO

- [ ] Step 7: Wire the host UI to show both static and registry-driven remote loading flows
- [ ] Step 8: Add verification scripts or smoke tests for build output and same-origin serving
- [ ] Step 9: Run the end-to-end demo, capture evidence, and update the diary/changelog/task status
- [ ] Step 10: Re-run `docmgr doctor` and upload the revised bundle to reMarkable

## Completed

- [x] Create ticket `FEDMOD-0001`
- [x] Write the main design and implementation guide
- [x] Write the runtime API and experiment reference
- [x] Create the investigation diary
- [x] Add ticket-local experiment scripts under `scripts/`
- [x] Prepare the ticket for validation and reMarkable delivery
- [x] Step 1: Update the ticket docs for single-origin path-based serving and expand the implementation checklist
- [x] Step 2: Create the root workspace files (`package.json`, `.gitignore`, shared scripts, and any shared config)
- [x] Step 3: Scaffold `apps/checkout-remote` with Vite, React, and Module Federation exposes
- [x] Step 4: Scaffold `apps/host` with Vite, React, local UI, and runtime loading utilities
- [x] Step 5: Add `registry/remotes.json` with same-origin remote paths
- [x] Step 6: Implement `server/serve-demo.mjs` so `/host/`, `/remotes/checkout/`, and `/registry/remotes.json` are served from one origin
