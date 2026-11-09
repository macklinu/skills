---
name: pr-description
description: Create or open GitHub pull requests, edit PR bodies, write descriptions or summaries, complete templates, or add visual evidence. Excludes internal code reviews, release notes, and summaries without a PR.
compatibility: Requires GitHub CLI (`gh`) to create or edit PRs and upload visual attachments.
---

# PR description

Give reviewers the outcome, the reason, and context they cannot get from the code. Do not narrate the diff or repeat the issue.

## Prepare

1. Read repository instructions.
2. If `macklinu-machine` is requested or required, load its current skill and follow its operation-specific identity, runner, credential, and failure rules. Otherwise, use your existing login for `gh`.
3. Load `clear-voice` before writing or editing the body.
4. If `.github/PULL_REQUEST_TEMPLATE.md` exists, read it. Its requirements take priority over the default format below.
5. Read the full PR diff against its actual target branch, including for stacked PRs. When updating a body, describe the current PR as a whole, not the latest commit or agent session.

## Draft the body

If a template exists, keep its headings, fields, and checkboxes. Fill every applicable field briefly, and set checkboxes accurately. Do not remove fields or leave applicable fields empty.

Without a template, default to one short paragraph under `## Summary`. Bullets are optional for separate points. Add sections only when they help the reviewer.

- Keep details that affect review or release, such as tradeoffs, migrations, or known limitations.
- Distinguish material assumptions from requirements and unverified prerequisites.
- Link longer explanations instead of copying them into the body.
- Do not repeat the same explanation in prose and a visual.

### Report verification

Do not list commands, test runs, dependency installs, or routine setup.

- When CI runs, let it report testing. Add a testing section only if the template requires it.
- If no CI exists and verification needs a note, write one outcome sentence without command history.
- Always mention material verification gaps, even when CI exists.

## Choose useful visuals

For a visible UI change, include captures of the real UI. Choose the format that helps review.

- For an existing screen, use a before-and-after table when the comparison explains the result. A table is optional.
- For a new UI, show all distinct states needed to review the feature, such as loading, empty, populated, error, or success. Omit input combinations and near-identical screenshots that add no review value.
- For a focused addition, one labeled screenshot may be enough.
- When motion or interaction matters more than a still image, use a short recording.
- For a change with no visual effect, omit screenshots. Add a diagram only when it explains something the reviewer needs to understand.

### Add explanatory visuals

When an explanatory visual helps, load `show-me` and choose the smallest useful format.

- Use a flowchart for behavior or data flow.
- For a layout or concept that needs it, render a focused HTML illustration to PNG.
- Label illustrations as illustrations. They do not replace captures of the real UI.

Use GitHub-supported Markdown and Mermaid. Follow GitHub's [code block guide](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-and-highlighting-code-blocks) and [diagram guide](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams) for rendering limits.
Upload rendered images, not local HTML files, artifact paths, or renderer-specific output.

Keep visuals next to the context they support, with useful alt text and short state labels. Use a compact table or grid for related captures. Link extra detail instead of making the body a screenshot gallery.

## Capture the PR comparison

Use these steps when you choose a before-and-after comparison.

1. Resolve the current target branch and PR head commit.
2. For "before," use their merge-base commit, which defines GitHub's three-dot PR diff. For a stacked PR, use its actual target branch, not an assumed `main`.
3. Capture "before" from that merge-base commit and "after" from the PR head. Do not use the previous PR commit, `HEAD^`, or the start of the current agent session as the baseline.
4. Match the viewport, data, and UI state. Capture each revision without disturbing the user's working changes, and record the commit SHAs with the captures.
5. When the PR changes, check that attached evidence still matches its current comparison. Replace stale captures rather than appending a history of revisions.

Never fabricate evidence or present a mockup as a running UI. If the base cannot run or a capture is missing, report the gap instead of substituting another commit. New UI states do not need an invented "before."

## Check and publish

Before every PR creation or body update, check the following:

- Verify facts and Markdown.
- Run the `clear-voice` checker on the body.
- Immediately before the write, read the applicable current `gh pr create --help` or `gh pr edit --help`. Use normal authentication for help.

### Publish attachments

If the body includes captures or rendered illustrations, use this sequence:

1. Prepare the selected files for upload.
2. Use only the attachment behavior documented by the installed `gh` version. Follow the identity policy selected in preparation for each operation.
3. For a machine-authored PR, create it through the runner first. Then attach files with `gh pr edit` if it supports uploads, so GitHub can replace local references with uploaded asset URLs.
4. Re-read the resulting PR body, even if the attachment command exits non-zero. Partial uploads can still create or update the PR.
5. Confirm that every intended visual renders, has useful alt text, and links to an uploaded asset rather than a local path.
6. Report incomplete evidence. Before retrying a failed write, check the resulting PR.

## Optional default body example

```markdown
## Summary

Let users retry a failed profile request without leaving the page. Previously, recovery required a full reload.
```
