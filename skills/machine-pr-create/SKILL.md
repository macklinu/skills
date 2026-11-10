---
name: machine-pr-create
description: Create or reuse a machine PR and request macklinu's review.
disable-model-invocation: true
compatibility: Requires macklinu-machine and a writable same-repository PR head.
---

# Machine PR create

Invocation: `/machine-pr-create [PR context]`; context may specify purpose, base, or draft intent.

Read repository instructions and follow the current `macklinu-machine` skill for identity, authentication, runner, credential, and failure rules.

This workflow requires a writable same-repository PR head. It covers publication and review requests only. Do not merge.

Before retrying any uncertain write, inspect remote state. For uncertain PR creation, repeat the full paginated lookup below.

## 1. Publish the intended work

1. Confirm the worktree, repository, head, base, and intended commits and changes. Use the requested or established base; otherwise use the current repository default.
2. For changes or verification, load `code-style`. For production TypeScript changes, also load the relevant `effect` references.
3. Preserve unrelated work and existing user commits. Prepare only missing intended commits and verify their bot author and committer identities.
4. Push the intended head and verify that its remote ref equals local `HEAD`.

**Gate:** Verify the complete intended scope, new-commit bot attribution, and remote-head equality. Uncertain targeting or publication blocks PR writes.

## 2. Select or create the PR

Read the [PR listing guide](https://docs.github.com/en/rest/pulls/pulls#list-pull-requests) and [CLI API guide](https://cli.github.com/manual/gh_api).

1. List open PRs in the base repository. Match the intended values for all four fields, not branch labels alone.
   - `head.repo.full_name` and `head.ref`.
   - `base.repo.full_name` and `base.ref`.
2. Inspect every page before counting matches.
   - With `--paginate --jq`, collect per-page matches.
   - With `--paginate --slurp`, process collected JSON separately. Do not combine `--slurp` with `--jq` or `--template`.
3. If exactly one PR matches, reuse it. If multiple PRs match, stop for a decision; do not choose one or create another.
4. Before creation or title/body edits, load `pr-description`.
5. If no PR matches, read the [CLI creation guide](https://cli.github.com/manual/gh_pr_create), then create with the requested draft state and explicit `--head` and `--base`. Explicit `--head` prevents implicit push or fork behavior.
6. Preserve a reused PR's draft state and actual authorship. Do not create a duplicate to obtain bot authorship.

**Gate:** Verify exactly one open exact match, the published SHA, full intended commit/diff scope, accurate body, and actual author. Claim machine authorship only for a bot-authored PR.

## 3. Request review

1. Read the [review-request guide](https://docs.github.com/en/rest/pulls/review-requests) and recheck the PR's state, head, author, and pending reviewers.
2. If the PR is no longer open or its head differs from the verified publication, stop review writes and re-establish the PR gate.

- If `macklinu` authored the PR, report the self-review restriction.
- Otherwise, if `macklinu` is already pending, verify and skip the write. Never remove and re-add a pending reviewer.
- Otherwise, request the user `macklinu` and verify that the request is pending.

A completed review is not pending. An assignee or mention is not a review request.

Preserve the PR's draft or ready stage, even if it causes a refusal. Report state, permission, or API refusals separately from publication.

**Gate:** Verify that `macklinu` is pending, or record the exact reviewer blocker.

## Handoff

Report the PR URL, published SHA, actual author, and separate publication and reviewer outcomes.
