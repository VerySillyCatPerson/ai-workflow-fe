---
description: Carry standards adoption or an upgrade from repository assessment and preview through an authorized install or sync, validation, and a reviewable change report. Use when asked to adopt or upgrade the installed standards.
argument-hint: [standards source path]
---

# Standards Lifecycle

Keep one record of detected stack, installed/source versions, local edits,
planned file changes, checks, and unresolved deviations.

## 1. Assess

For a new installation, follow the onboard workflow to inspect the existing
repository and choose mode, manifest, and adapters. For an upgrade, follow the
standards-sync workflow to classify version drift and local edits. Inspect the
installer's preview before writing. Preserve project policy and trusted
execution configuration.

## 2. Apply the authorized change

Use the source installer or sync command only after the planned target and
scope are established and the requested work authorizes the change. Never
discard a locally modified shared file without surfacing that conflict.
Install optional modules only when the repository needs them.

## 3. Validate

Run the installation check. Inspect the full diff and confirm manifest files,
routing entries, adapters, and lock records match the plan. Run affected
project quality commands from trusted `standards/execution.json` when
configured. Fix installer defects in the source repository rather than editing
copied shared files by hand.

## 4. Deliver

Report versions, files installed or changed, retained policy and deviations,
validation results, and anything requiring a later team decision. Produce a
reviewable PR description when requested; do not publish or merge as an
automatic consequence of this workflow.
