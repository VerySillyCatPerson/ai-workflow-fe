# ai-workflow-fe

**Read `MAINTAINING.md` first.** It is the guide for working on this repo:
the three audiences, the layering rule, versioning, and the tool-agnosticism
constraint that governs every change.

---

Entry file for tools reading `AGENTS.md` — Codex, Amp, Jules, Zed. It exists only
because those tools look for this filename; `CLAUDE.md` is its counterpart. Keep
both thin, and put every actual rule in `MAINTAINING.md`.

This is the same pattern consuming projects use: one source, per-tool entry
files. A rule written here instead of in `MAINTAINING.md` is the leak this
architecture exists to prevent.
