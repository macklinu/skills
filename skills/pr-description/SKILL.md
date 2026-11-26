---
name: pr-description
description: Create or open GitHub pull requests, edit PR bodies, write descriptions or summaries, complete templates, or add visual evidence. Excludes internal code reviews, release notes, and summaries without a PR.
compatibility: Requires GitHub CLI (`gh`) to create or edit PRs and upload visual attachments.
---

# PR description

Give reviewers the outcome, the reason, and context they cannot get from the code. Do not narrate the diff or repeat the issue.

## 1. Prepare

Read the repository instructions and load `clear-voice`. If `macklinu-machine` is requested or required, load its current skill and follow its identity, runner, credential, and failure rules. Otherwise, use your existing `gh` login.

Read `.github/PULL_REQUEST_TEMPLATE.md` if it exists. Its requirements take precedence over the defaults below.

Read the full PR diff from the merge base of the actual target branch and PR head, including for stacked PRs. Describe the whole PR, even when updating an existing body.

## 2. Plan visual evidence

**For a visible UI change, use every state requested by the task or PR template as the capture checklist.** Capture each state from the running UI and label it with the state name.

If neither source names states, capture what reviewers need to evaluate the change. Do not use a fixed state list or substitute a mockup.

Read the [visual evidence guide](references/VISUAL_EVIDENCE.md) for capture, comparison, and upload steps. If the change has no visual effect, omit screenshots.

## 3. Draft the body

Keep the template's headings, fields, and checkboxes. Fill applicable fields and set checkboxes accurately. Without a template, use a short `## Summary` and add sections only when they help review.

Keep tradeoffs, migrations, and limitations that affect review or release. Distinguish assumptions from requirements and link longer explanations.

Report material verification gaps even when CI runs. For each missing capture, name the state and explain why.

Let CI report routine testing unless the template asks for it. If there is no CI and verification needs a note, report the outcome without command history.

## 4. Publish and verify

Check facts and Markdown and run the `clear-voice` checker. Immediately before each body write, read the applicable `gh pr create --help` or `gh pr edit --help` using normal authentication. Follow the visual evidence guide for attachments.

Reopen the published PR. Check off a requested state only when the PR shows its label and renders its capture from the current PR head. Confirm attachments resolve to uploaded assets, not local paths.

If any state is still missing, name it and explain why in the PR body. Inspect the published body before retrying a failed write.
