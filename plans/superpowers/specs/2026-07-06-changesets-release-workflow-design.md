# Changesets + Release Workflow Design

**Date:** 2026-07-06
**Status:** Approved

## Goal

Add changesets to the repo in preparation for release 1.0.0. PRs from `release/*`
branches into `main` must contain a changeset before they can merge. Merging a
release branch triggers a release: vitest runs, the root package version is
bumped, a CHANGELOG entry is written, and a `vX.Y.Z` tag + GitHub Release are
created.

## Versioning model

Whole-site, single version. The root package `ibrahimsaberi.com` (currently
`1.0.0`) is the only versioned package. The `@local/*` packages under
`packages/` and the services under `services/` stay unversioned internals —
changesets always target the root package.

- One version number (root `package.json`).
- One `CHANGELOG.md` at the repo root.
- One `vX.Y.Z` git tag + GitHub Release per release.

## Changesets setup

- `@changesets/cli` as a root devDependency.
- `.changeset/config.json`:
  - `baseBranch: "main"`
  - `privatePackages: { "version": true, "tag": true }` (every package here is
    private; without this nothing versions or tags)
- Add `.` to the `packages` list in `pnpm-workspace.yaml` so changesets (via
  `@manypkg/get-packages`) recognizes the root as a versionable package. This
  is the standard workaround for root-package versioning in a monorepo.
  **Verify locally** that `pnpm changeset status` lists `ibrahimsaberi.com`
  and that `pnpm install` / existing workspace commands still behave before
  committing.

## Workflow 1: PR gate — `.github/workflows/release-gate.yml`

Trigger: `pull_request` targeting `main`.

Two jobs (both become required status checks):

1. **`test`** — runs on every PR to main. `pnpm install --frozen-lockfile`,
   then `pnpm test` (root vitest).
2. **`changeset`** — runs on every PR to main (required checks must report on
   all PRs), but only *enforces* when the head branch matches `release/*`:
   - Head branch matches `release/*`: fail unless the branch adds at least one
     `.changeset/*.md` file (excluding `README.md`) relative to `main`
     (checked via `git diff --name-only origin/main...HEAD`).
   - Any other head branch: pass immediately with a notice.

Style matches existing workflows: `actions/checkout@v4`, `pnpm/action-setup@v4`,
`actions/setup-node@v4` with node 22 + pnpm cache, frozen lockfile.

## Workflow 2: Release — `.github/workflows/release.yml`

Trigger: `push` to `main` (plus `workflow_dispatch` as a manual escape hatch).

Steps:

1. Checkout with full history (`fetch-depth: 0`, needed for tagging and for
   changesets to compute status).
2. Skip silently (job succeeds, no-op) if there are no unconsumed changeset
   files (`.changeset/*.md` excluding `README.md`).
3. `pnpm install --frozen-lockfile`, then `pnpm test` — vitest gates the
   release.
4. `pnpm changeset version` — consumes changesets, bumps root `package.json`,
   writes `CHANGELOG.md`.
5. Commit `chore(release): vX.Y.Z` to `main` and push (as github-actions bot).
6. Tag `vX.Y.Z` and push the tag.
7. Create a GitHub Release for the tag with the new CHANGELOG entry as its
   body (`gh release create`).

Permissions: `contents: write`. Concurrency group `release`,
`cancel-in-progress: false`.

## Merge blocking (branch protection)

A ruleset on `main` (created via `gh api`) requiring both status checks
(`test`, `changeset`) to pass before merging.

**Amended 2026-07-08:** the original design used a bypass actor for the
GitHub Actions app, but GitHub rejects that on personal repos (422: "Actor
GitHub Actions integration must be part of the ruleset source or owner
organization" — confirmed on both PUT and POST). The release workflow's push
to `main` instead authenticates with a dedicated **write deploy key**
(`release-workflow`): public half as a repo deploy key, private half as the
`RELEASE_DEPLOY_KEY` Actions secret, consumed by `actions/checkout`'s
`ssh-key` input. The existing `protecc` ruleset already lists DeployKey as a
bypass actor and stays untouched; the new `release-gate` ruleset gets the
same DeployKey bypass. Side effect: deploy-key pushes retrigger workflows
(GITHUB_TOKEN pushes don't), so each release causes one extra no-op run of
the Release workflow.

## Accepted trade-off

The version bump lands on `main` *after* merge as a bot commit. The
alternative (consuming the changeset on the release branch pre-merge, with the
gate accepting "changeset present OR version already bumped") was offered and
declined in favor of the simpler direct flow.

## Out of scope

- npm publishing (nothing in the repo publishes to a registry).
- Per-package versioning or changelogs for `@local/*` / services.
- Changeset requirements on non-`release/*` PRs.

## Testing

- Local: `pnpm changeset status` recognizes the root package; `pnpm install`
  and workspace filters (`pnpm -F=@local/** build`) still work after the
  `pnpm-workspace.yaml` change.
- Workflows: validated on this branch (`release/1.0.0`) — the gate should fail
  before a changeset is added and pass after; the release workflow's no-op
  path exercised by pushes to main without changesets.
