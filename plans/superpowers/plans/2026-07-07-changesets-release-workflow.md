# Changesets + Release Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Changesets-gated releases: PRs from `release/*` into `main` must carry a changeset (enforced by a required status check), and merging runs vitest, bumps the root version, writes CHANGELOG.md, tags `vX.Y.Z`, and creates a GitHub Release.

**Architecture:** Whole-site single version — the root package `ibrahimsaberi.com` is the only versioned package (added to the pnpm workspace via `.` so changesets can see it). Two workflows: `release-gate.yml` (PR checks: `test` + `changeset`) and `release.yml` (on push to main: consume changesets, commit/tag/release). Merge blocking via a new `release-gate` ruleset; the release workflow's push back to main works because the GitHub Actions app becomes a bypass actor on both rulesets.

**Tech Stack:** @changesets/cli, pnpm 10 workspaces, GitHub Actions, GitHub rulesets API (`gh api`), vitest.

**Spec:** `plans/superpowers/specs/2026-07-06-changesets-release-workflow-design.md`

## Global Constraints

- **Ibrahim handles all git operations.** Never run `git commit`, `git push`, or `git tag` from the working tree. At the end of each task, report what's ready and pause for him to commit. (The `git tag`/`git push` lines inside the workflow YAML run in CI, not locally — those are fine.)
- Node `>=22`, pnpm `>=10.26` (`packageManager: pnpm@10.27.0`).
- Workflow style must match existing workflows (`deploy-wisp.yml`): `actions/checkout@v4`, `pnpm/action-setup@v4`, `actions/setup-node@v4` with `node-version: 22` + `cache: pnpm`, `pnpm install --frozen-lockfile`, header comment documenting required secrets/behavior.
- Repo: `GeorgeIpsum/ibrahimsaberi.com` (public, admin access confirmed). Default branch `main`. Current branch `release/1.0.0`.
- Existing ruleset `protecc` (id `18571813`) restricts creation/update/deletion on main, requires PRs + signed commits, bypass for DeployKey + repo roles 2 and 5. Do not remove any of its existing rules or bypass actors.
- GitHub Actions app ID (for bypass actors and check `integration_id`): `15368`.
- Baseline verified 2026-07-07: `pnpm test` → 24 files / 286 tests pass in ~0.5s with no env vars; `__tests__` imports package sources directly (no `build:packages` needed before tests).

---

### Task 1: Changesets foundation

Make the root package versionable, install the CLI, configure changesets, and stage the 1.0.0 changeset.

**Files:**
- Modify: `pnpm-workspace.yaml` (add `.` to `packages`)
- Modify: `package.json` (devDependency; version `1.0.0` → `0.0.0`)
- Create: `.changeset/config.json`
- Create: `.changeset/README.md` (written by `changeset init`)
- Create: `.changeset/first-light.md`

**Interfaces:**
- Produces: root package `ibrahimsaberi.com` recognized by changesets; a pending `major` changeset so `changeset version` yields exactly `1.0.0`. Task 2's gate detects files matching `.changeset/*.md` (excluding `README.md`); Task 3 consumes them.

- [x] **Step 1: Add the root to the workspace**

In `pnpm-workspace.yaml`, change:

```yaml
packages:
  - packages/*
  - services/*
```

to:

```yaml
packages:
  # `.` makes the root package a workspace member so changesets can version it
  # (whole-site single version; see plans/superpowers/specs/2026-07-06-*.md).
  - .
  - packages/*
  - services/*
```

- [x] **Step 2: Install @changesets/cli and init**

```bash
pnpm add -D -w @changesets/cli
pnpm changeset init
```

Expected: `@changesets/cli` in root devDependencies; `.changeset/config.json` + `.changeset/README.md` created.

- [x] **Step 3: Configure changesets**

Overwrite `.changeset/config.json` (keep the `$schema` line `changeset init` wrote — only the fields below matter):

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.1.1/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "restricted",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": [],
  "privatePackages": { "version": true, "tag": true }
}
```

`privatePackages.version: true` is load-bearing: every package in this repo is private; without it nothing versions.

- [x] **Step 4: Reset root version to 0.0.0**

In root `package.json`, change `"version": "1.0.0"` to `"version": "0.0.0"`.

Why: the root is already at `1.0.0`, but the release hasn't happened. A `major` changeset takes `0.0.0 → 1.0.0` (verified in a fixture 2026-07-07), so the `release/1.0.0` merge releases as exactly `v1.0.0`. Leaving it at `1.0.0` would release as `2.0.0`.

- [x] **Step 5: Write the 1.0.0 changeset**

Create `.changeset/first-light.md`:

```markdown
---
"ibrahimsaberi.com": major
---

Initial public release of ibrahimsaberi.com.
```

(Ibrahim: edit the notes freely — this text becomes the `## 1.0.0` CHANGELOG entry and the GitHub Release body.)

- [x] **Step 6: Verify changesets sees the root package**

```bash
pnpm changeset status --verbose
```

Expected: lists `ibrahimsaberi.com` bumping `major` to `1.0.0`. Must NOT error with "no packages found" or offer only `@local/*` packages.

- [x] **Step 7: Verify the workspace change breaks nothing**

```bash
pnpm install
pnpm test
pnpm -F=@local/** exec node -e "console.log(require('./package.json').name)"
```

Expected: install completes without new warnings about the root; 286 tests pass; the filter prints only the four `@local/*` names (root is not matched by `@local/**`).

- [x] **Step 8: Hand off for commit**

Report changed files to Ibrahim; suggested message: `chore: add changesets (whole-site versioning, staged 1.0.0 release)`.

---

### Task 2: PR gate workflow

**Files:**
- Create: `.github/workflows/release-gate.yml`

**Interfaces:**
- Consumes: `.changeset/*.md` naming convention from Task 1.
- Produces: status check contexts `test` and `changeset` (the job names — Task 4's ruleset requires these exact strings).

- [x] **Step 1: Write the workflow**

Create `.github/workflows/release-gate.yml`:

```yaml
name: Release gate

# PR checks for main. Both jobs are required status checks (ruleset
# "release-gate", see plans/superpowers/specs/2026-07-06-changesets-release-workflow-design.md):
#   test       vitest must pass on every PR
#   changeset  PRs from release/* branches must add a changeset
#              (.changeset/*.md) or they cannot merge; other branches pass.

on:
  pull_request:
    branches: [main]

concurrency:
  group: release-gate-${{ github.head_ref }}
  cancel-in-progress: true

permissions:
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm test

  changeset:
    runs-on: ubuntu-latest
    env:
      HEAD_REF: ${{ github.head_ref }}
      BASE_REF: ${{ github.base_ref }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Require a changeset on release/* branches
        run: |
          case "$HEAD_REF" in
            release/*) ;;
            *)
              echo "::notice::'$HEAD_REF' is not a release/* branch; changeset not required."
              exit 0
              ;;
          esac
          added=$(git diff --name-only --diff-filter=A "origin/${BASE_REF}...HEAD" -- '.changeset/*.md' \
            | grep -v '^\.changeset/README\.md$' || true)
          if [ -z "$added" ]; then
            echo "::error::PRs from release/* branches must include a changeset. Run 'pnpm changeset' and push the result."
            exit 1
          fi
          printf 'Changeset(s) found:\n%s\n' "$added"
```

- [x] **Step 2: Verify the YAML parses**

```bash
pnpm dlx js-yaml .github/workflows/release-gate.yml > /dev/null && echo "yaml ok"
```

Expected: `yaml ok` (verified 2026-07-07 that `yaml`/`js-yaml` are NOT requireable from the repo root — pnpm isolates node_modules, hence `dlx`).

- [x] **Step 3: Verify the gate logic locally (both directions)**

Simulate the enforcing path on this branch (Task 1 added `.changeset/first-light.md`):

```bash
HEAD_REF=release/1.0.0 BASE_REF=main sh -c '
  added=$(git diff --name-only --diff-filter=A "origin/${BASE_REF}...HEAD" -- ".changeset/*.md" | grep -v "^\.changeset/README\.md$" || true)
  [ -n "$added" ] && echo "PASS: $added" || echo "FAIL: no changeset"
'
```

Expected: `PASS: .changeset/first-light.md`. Then confirm the skip path: the same script with `HEAD_REF=feat/whatever` should hit the `not a release/* branch` case (eyeball the `case` statement — the exit-0 branch matches anything not starting with `release/`).

Note: `origin/main...HEAD` requires local commits — if Task 1 isn't committed yet, this shows the changeset only after Ibrahim commits. Run this step after his commit.

- [x] **Step 4: Hand off for commit**

Suggested message: `ci: release gate (vitest + changeset check on PRs to main)`.

---

### Task 3: Release workflow

**Files:**
- Create: `.github/workflows/release.yml`

**Interfaces:**
- Consumes: changeset files from Task 1; `pnpm changeset version` behavior (bumps root, writes root `CHANGELOG.md`, deletes consumed changesets).
- Produces: on merge — version-bump commit on main, tag `vX.Y.Z`, GitHub Release. Requires Task 4's Actions-app bypass to push to main.

- [x] **Step 1: Write the workflow**

Create `.github/workflows/release.yml`:

```yaml
name: Release

# Consumes changesets that land on main: runs vitest, bumps the root package
# version, writes CHANGELOG.md, commits + tags vX.Y.Z, and creates a GitHub
# Release. No-ops when main has no unconsumed changesets (regular merges).
#
# The push back to main is only possible because the GitHub Actions app
# (id 15368) is a bypass actor on the "protecc" and "release-gate" rulesets.
# GITHUB_TOKEN pushes do not retrigger workflows, so this cannot loop.

on:
  workflow_dispatch:
  push:
    branches: [main]

concurrency:
  group: release
  cancel-in-progress: false

permissions:
  contents: write

jobs:
  check:
    # workflow_dispatch has no branch filter; without this guard, dispatching
    # from a non-main ref would push that ref to main past the release gate.
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    outputs:
      count: ${{ steps.count.outputs.count }}
    steps:
      - uses: actions/checkout@v4
      - name: Count unconsumed changesets
        id: count
        run: |
          count=$(find .changeset -maxdepth 1 -name '*.md' ! -name 'README.md' | wc -l | tr -d ' ')
          echo "count=$count" >> "$GITHUB_OUTPUT"
          if [ "$count" = "0" ]; then
            echo "::notice::No changesets on main; nothing to release."
          fi

  release:
    needs: check
    if: needs.check.outputs.count != '0'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm test
      - name: Version, commit, tag
        id: version
        run: |
          pnpm changeset version
          version=$(node -p "require('./package.json').version")
          echo "version=$version" >> "$GITHUB_OUTPUT"
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add -A
          git commit -m "chore(release): v${version}"
          git tag -a "v${version}" -m "v${version}"
          git push origin HEAD:main --follow-tags
      - name: Create GitHub Release
        env:
          GH_TOKEN: ${{ github.token }}
        run: |
          version="${{ steps.version.outputs.version }}"
          awk -v ver="$version" '
            $0 == "## " ver { grab = 1; next }
            /^## /          { grab = 0 }
            grab            { print }
          ' CHANGELOG.md > "$RUNNER_TEMP/notes.md"
          gh release create "v${version}" --title "v${version}" --notes-file "$RUNNER_TEMP/notes.md"
```

- [x] **Step 2: Verify the YAML parses**

```bash
pnpm dlx js-yaml .github/workflows/release.yml > /dev/null && echo "yaml ok"
```

Expected: `yaml ok`.

- [x] **Step 3: Verify the changeset counter and awk extraction against a fixture**

```bash
S=/private/tmp/claude-501/-Users-g1n-lib-ibrahimsaberi-com/5fff2da6-0fe4-4c0b-9550-6d8d3afd1d77/scratchpad/rel-check
rm -rf "$S" && mkdir -p "$S/.changeset"
printf '# ibrahimsaberi.com\n\n## 1.0.0\n\n### Major Changes\n\n- abc1234: Initial public release of ibrahimsaberi.com.\n' > "$S/CHANGELOG.md"
touch "$S/.changeset/README.md"
cd "$S"
count=$(find .changeset -maxdepth 1 -name '*.md' ! -name 'README.md' | wc -l | tr -d ' ')
echo "count with only README: $count"          # expect 0
touch .changeset/first-light.md
count=$(find .changeset -maxdepth 1 -name '*.md' ! -name 'README.md' | wc -l | tr -d ' ')
echo "count with one changeset: $count"        # expect 1
awk -v ver="1.0.0" '$0 == "## " ver { grab=1; next } /^## / { grab=0 } grab { print }' CHANGELOG.md
```

Expected: `count with only README: 0`, `count with one changeset: 1`, and the awk output is the `### Major Changes` section (without the `## 1.0.0` heading line).

- [x] **Step 4: Hand off for commit**

Suggested message: `ci: release workflow (version + tag + GitHub Release on merge to main)`.

---

### Task 4: Rulesets — merge blocking + Actions bypass

**Files:** none in the repo (GitHub API state). Scratchpad JSON at `/private/tmp/claude-501/-Users-g1n-lib-ibrahimsaberi-com/5fff2da6-0fe4-4c0b-9550-6d8d3afd1d77/scratchpad/`.

**Interfaces:**
- Consumes: check contexts `test` and `changeset` (Task 2 job names); GitHub Actions app ID `15368`.
- Produces: merges to main blocked until both checks pass; the Actions app can push the Task 3 version commit.

- [x] **Step 1: Add the Actions app as a bypass actor on `protecc`**

```bash
cd /private/tmp/claude-501/-Users-g1n-lib-ibrahimsaberi-com/5fff2da6-0fe4-4c0b-9550-6d8d3afd1d77/scratchpad
gh api repos/GeorgeIpsum/ibrahimsaberi.com/rulesets/18571813 > protecc.json
jq '{name, target, enforcement, conditions, rules, bypass_actors: (.bypass_actors + [{"actor_id": 15368, "actor_type": "Integration", "bypass_mode": "always"}])}' protecc.json > protecc-updated.json
gh api -X PUT repos/GeorgeIpsum/ibrahimsaberi.com/rulesets/18571813 --input protecc-updated.json --jq '.bypass_actors'
```

Expected output: four bypass actors — the existing DeployKey + roles 2 and 5, plus `{"actor_id":15368,"actor_type":"Integration","bypass_mode":"always"}`.

- [x] **Step 2: Create the `release-gate` ruleset**

```bash
gh api -X POST repos/GeorgeIpsum/ibrahimsaberi.com/rulesets --input - <<'EOF' --jq '{id, name, enforcement}'
{
  "name": "release-gate",
  "target": "branch",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["~DEFAULT_BRANCH"], "exclude": [] } },
  "rules": [
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": false,
        "do_not_enforce_on_create": false,
        "required_status_checks": [
          { "context": "test", "integration_id": 15368 },
          { "context": "changeset", "integration_id": 15368 }
        ]
      }
    }
  ],
  "bypass_actors": [
    { "actor_id": 15368, "actor_type": "Integration", "bypass_mode": "always" }
  ]
}
EOF
```

Expected: JSON with a new `id`, `"name": "release-gate"`, `"enforcement": "active"`.

- [x] **Step 3: Verify both rulesets**

```bash
gh api repos/GeorgeIpsum/ibrahimsaberi.com/rulesets --jq '.[] | {id, name, enforcement}'
```

Expected: `protecc` and `release-gate`, both `active`.

Fallback (per spec) if the API rejects either call: leave `protecc` untouched, and document the manual steps in the header comment of `release-gate.yml` (Settings → Rules → Rulesets: require checks `test` + `changeset` on main; add "GitHub Actions" to bypass on both rulesets). Report the failure rather than retrying variations blindly.

---

### Task 4 Amendment (2026-07-08): deploy key instead of Actions-app bypass

Task 4 Steps 1–2 as originally written FAIL on personal repos: GitHub returns
422 "Actor GitHub Actions integration must be part of the ruleset source or
owner organization" for `{"actor_id": 15368, "actor_type": "Integration"}`
(confirmed on both the `protecc` PUT and the `release-gate` POST). Revised
approach (owner-approved):

- [x] **Step A1: Provision the release deploy key** (in the scratchpad dir, never inside the repo)

```bash
ssh-keygen -t ed25519 -N "" -C "release-workflow" -f ./release_deploy_key
gh repo deploy-key add release_deploy_key.pub -R GeorgeIpsum/ibrahimsaberi.com --allow-write --title "release-workflow"
gh secret set RELEASE_DEPLOY_KEY -R GeorgeIpsum/ibrahimsaberi.com < release_deploy_key
rm -f release_deploy_key release_deploy_key.pub
```

Expected: deploy key listed by `gh repo deploy-key list` with read-write; secret listed by `gh secret list`; local key material deleted.

- [x] **Step A2: Leave `protecc` untouched** — it already has a DeployKey bypass actor.

- [x] **Step A3: Create the `release-gate` ruleset with a DeployKey bypass** (same JSON as the original Step 2, but `bypass_actors: [{ "actor_id": null, "actor_type": "DeployKey", "bypass_mode": "always" }]`).

- [x] **Step A4: Point release.yml's checkout at the deploy key** — add `ssh-key: ${{ secrets.RELEASE_DEPLOY_KEY }}` to the release job's `actions/checkout@v4` `with:` block, and rewrite the header comment's bypass paragraph to document RELEASE_DEPLOY_KEY (required repo secret, matching deploy-wisp.yml's convention) and the retrigger-then-no-op behavior (deploy-key pushes retrigger workflows; the rerun's `check` job counts zero changesets).

- [x] **Step A5: Verify** — `gh api .../rulesets` shows `protecc` (unchanged, 3 bypass actors) + `release-gate` (active, contexts `test` and `changeset`, DeployKey bypass); release.yml still parses (`pnpm dlx js-yaml`).

Task 5 Step 3's expectation gains one detail: after the release pushes, a second Release run appears and no-ops.

---

### Task 5: End-to-end verification (operator: Ibrahim)

No files. Sequenced observations once Tasks 1–4 are committed and pushed.

- [x] **Step 1: Push `release/1.0.0` and open the PR to `main`.** Expected: `test` passes (286 tests); `changeset` passes, logging `Changeset(s) found: .changeset/first-light.md`.
- [x] **Step 2 (optional negative test):** any non-changeset PR from a `release/*` branch shows `changeset` failing and GitHub blocking merge ("Required statuses must pass").
- [x] **Step 3: Merge the PR.** Expected on main: `Release` workflow runs — 286 tests, then a `chore(release): v1.0.0` commit by github-actions[bot] (root `package.json` at `1.0.0`, `CHANGELOG.md` created, `.changeset/first-light.md` deleted), tag `v1.0.0`, and a GitHub Release "v1.0.0" whose body is the changelog entry.
- [x] **Step 4:** a later trivial merge to main shows `Release` no-op-ing: `check` runs, `release` skipped, notice "No changesets on main; nothing to release."
