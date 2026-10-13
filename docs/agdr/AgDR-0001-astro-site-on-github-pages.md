---
id: AgDR-0001
timestamp: 2026-10-13T00:00:00Z
agent: platform-engineer
model: claude-opus-5-5
session: dd4f4d1a-da79-48b3-b358-38966bbd5ade
trigger: user-prompt
status: executed
category: tech-stack
projects: [agcs-site]
---

# Build agcs.dev with Astro 7 and deploy it with GitHub Pages

> In the context of the agcs.dev site, I decided to build a static Astro 7 site that renders the AGC documents from a tagged release, and to deploy it through GitHub Actions to GitHub Pages. I accepted a newer Astro major than the Agent SDLC sites use.

## Context

- The owner's plan sets the default stack: Astro, static, built with yarn, on GitHub Pages with `agcs.dev` as the custom domain.
- The Agent SDLC sites use Astro 5. Astro 5 had its last release on 2026-05-26. Astro 7 is the current line.
- Astro 7.3.8 was released on 2026-10-08, five days before this decision. Astro 7.3.4 was released on 2026-09-22.
- The site must never carry a hand-made copy of the standard. It renders `SPEC.md`, `EVIDENCE.md`, `BINDINGS.md` and parts of `README.md` from a tag of `abbaseya/agent-gate-contract`.

## Options Considered

| Option | Pros | Cons |
|--------|------|------|
| Astro 7.3.4 (chosen) | Current major. Old enough to have settled. Same content API as Astro 5. | A newer major than the Agent SDLC sites. |
| Astro 5, as the Agent SDLC sites use | Same version as the sibling sites. | No release since May 2026. |
| Astro 7.3.8 | Newest patch. | Five days old at the time of this decision. |
| Pages from a branch (`gh-pages`) | No deploy job. | Needs a built branch or a committed `dist/`. |
| Pages from GitHub Actions (chosen) | Builds from source on each push to `main`. No build output in git. | A workflow file, and the Pages environment. |

## Decision

Chosen: **Astro 7.3.4, static output, deployed by GitHub Actions to Pages**, because it is the current Astro line at a settled patch, and it builds from source without committing build output.

## Consequences

- `scripts/fetch-agc.mjs` downloads the documents for the tags in `agc.config.json` before each build. A new AGC release needs only a tag added there.
- `.github/workflows/site.yml` builds on every pull request. On a push to `main` it also uploads `dist/` and deploys it to Pages. Every action is pinned by commit SHA.
- Pages on the free plan needs a public repo. The repo becomes public when the site goes live.
- The custom domain `agcs.dev` and HTTPS are set in the repo's Pages settings, not in a `CNAME` file.

## Artifacts

- Issue: #1
