# Agent Guide

This repo builds the Live Miracles website (<https://live-miracles.github.io/>):
project pages rendered from other repos' READMEs and `docs/`, plus the blog in
`blog/`. See [README.md](README.md) for how projects are listed and
[blog/README.md](blog/README.md) for the blog conventions.

## Skills

Skills live in `skills/` and are shared with Claude Code and Codex through the
symlinks `.claude/skills` and `.agents/skills`; add new ones there.

- `write-blog-post` - write, illustrate (header image, diagrams, size budget) and
  preview a blog post, and republish it on Dev.to.

## Before committing

Run `npx prettier --check .` and `npm test`, and `npm run build` for any change to
`scripts/` or `ui/`. Never push unless the user asks.
