---
Title: Federated module runtime loading demo
Ticket: FEDMOD-0001
Status: active
Topics:
    - frontend
    - module-federation
    - demo
DocType: index
Intent: long-term
Owners: []
RelatedFiles:
    - Path: ttmp/2026/03/22/FEDMOD-0001--federated-module-runtime-loading-demo/design-doc/01-federated-module-demo-analysis-design-and-implementation-guide.md
      Note: Primary intern-facing architecture and implementation guide
    - Path: ttmp/2026/03/22/FEDMOD-0001--federated-module-runtime-loading-demo/reference/01-investigation-diary.md
      Note: Chronological delivery and decision log
    - Path: ttmp/2026/03/22/FEDMOD-0001--federated-module-runtime-loading-demo/reference/02-runtime-api-and-experiment-notes.md
      Note: Quick-reference companion for runtime APIs and commands
    - Path: ttmp/2026/03/22/FEDMOD-0001--federated-module-runtime-loading-demo/scripts/inspect-remote-entry.mjs
      Note: Utility for inspecting a real remote entry or manifest asset
    - Path: ttmp/2026/03/22/FEDMOD-0001--federated-module-runtime-loading-demo/scripts/mock-federation-runtime.mjs
      Note: Self-contained script demonstrating share scope and container lifecycle
ExternalSources: []
Summary: Ticket workspace for an intern-facing design and implementation guide for a greenfield module federation demo.
LastUpdated: 2026-03-22T10:44:13.146660183-04:00
WhatFor: Organize the design, reference materials, experiments, and delivery artifacts for the federated module demo.
WhenToUse: Use as the landing page for reviewing or continuing the demo design and implementation work.
---


# Federated module runtime loading demo

## Overview

This ticket contains the design and support material for a greenfield demo that teaches how Module Federation loads remote modules at runtime. The repository does not yet contain host or remote application code, so the main deliverable in this ticket is a detailed implementation guide, runtime reference, diary, and ticket-local experiments that an intern can use before building the actual demo.

The design chooses a Vite-based implementation path for the future demo while keeping the underlying webpack container model explicit for debugging and conceptual clarity.

## Key Links

- **Related Files**: See frontmatter RelatedFiles field
- **External Sources**: See frontmatter ExternalSources field
- **Primary Guide**: `./design-doc/01-federated-module-demo-analysis-design-and-implementation-guide.md`
- **Diary**: `./reference/01-investigation-diary.md`
- **Runtime Notes**: `./reference/02-runtime-api-and-experiment-notes.md`

## Status

Current status: **active**

## Topics

- frontend
- module-federation
- demo

## Tasks

See [tasks.md](./tasks.md) for the current task list.

## Changelog

See [changelog.md](./changelog.md) for recent changes and decisions.

## Structure

- design/ - Architecture and design documents
- reference/ - Prompt packs, API contracts, context summaries
- playbooks/ - Command sequences and test procedures
- scripts/ - Temporary code and tooling
- various/ - Working notes and research
- archive/ - Deprecated or reference-only artifacts
