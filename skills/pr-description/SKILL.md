---
name: pr-description
description: Create, open, or update a GitHub pull request with a concise, review-ready description. Use when a request is to create or open a PR or pull request, edit a PR body, write a PR description or summary, complete a pull request template, or add visual evidence to a PR. Do not use for an internal code review, release notes, or a generic change summary that does not accompany a PR.
compatibility: Requires GitHub CLI (`gh`) to create or edit PRs and upload visual attachments.
---

# PR description

Load `clear-voice` before writing or editing a PR body, and use its checker before publishing. Give reviewers the outcome, the reason, and context they cannot get from reading the code. Do not narrate the diff or repeat the issue.

Keep details only when they affect review or release, such as a tradeoff, migration, or known limitation. Distinguish material assumptions from requirements and unverified prerequisites. Link longer explanations instead of copying them into the body.

## Workflow

Before any GitHub command, including help, read repository instructions and select the requested or required publishing identity. When `macklinu-machine` is requested or required, load that skill and use its runner for GitHub commands, including its verified personal-user `gh stack` path. Only its image-upload exception permits direct user-authenticated commands.

1. Read `.github/PULL_REQUEST_TEMPLATE.md` if it exists.
   - Keep its headings, fields, and checkboxes.
   - Fill each applicable field briefly and set checkboxes accurately. Do not remove template fields or leave applicable fields empty.
   - Template requirements take priority over the default format.
1. Read the full PR diff against its actual target branch, including for stacked PRs. When updating a body, describe the current PR as a whole, not the latest commit or agent session.
1. Without a template, default to one short paragraph under `## Summary`. Use bullets for separate points, not as a requirement. Add sections only when they help the reviewer.
1. Choose visuals using the guidance below. Do not repeat the same explanation in prose and a visual.
1. Do not list commands, test runs, dependency installs, or routine setup.
   - When CI runs, let it report testing. Do not add a testing section unless the template requires it.
   - If no CI exists and verification needs a note, write one outcome sentence without command history.
   - Mention a material verification gap even when CI exists.
1. Before creating or updating the PR, verify facts and Markdown, and run the `clear-voice` checker on the body.

## Choose useful visuals

For a visible UI change, include captured evidence in the format that helps review. Before-and-after tables are a useful option, not a requirement.

- For a change to an existing screen, use a before-and-after table when the comparison explains the result.
- For a new UI, show its meaningful states, such as loading, empty, populated, error, or success. Include all distinct states needed to review the feature, not every combination of inputs or near-identical screenshots.
- For a focused addition, one labeled screenshot may be enough. Use a short recording when motion or interaction matters more than a still image.
- For a change with no visual effect, omit screenshots. Add a diagram only when it explains something the reviewer needs to understand.

When an explanatory visual helps, load `show-me` and choose the smallest useful format. Use a flowchart for behavior or data flow, or render a focused HTML illustration to PNG for a layout or concept that needs it. Label illustrations as illustrations; they do not replace captures of the real UI.

Use GitHub-supported Markdown and Mermaid. Follow GitHub's [code block guide](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-and-highlighting-code-blocks) and [diagram guide](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams) for rendering limits. Upload rendered images rather than relying on local HTML files, artifact paths, or renderer-specific output.

Keep visuals next to the context they support, with useful alt text and short state labels. Use a compact table or grid for related captures, and link extra detail rather than making the body a screenshot gallery.

## Capture the PR comparison

Use these steps when you choose a before-and-after comparison.

1. Resolve the current target branch and PR head commit. For "before," use their merge-base commit, which defines GitHub's three-dot PR diff. For a stacked PR, use its actual target branch, not an assumed `main`.
1. Capture "before" from that base commit and "after" from the PR head. Do not use the previous PR commit, `HEAD^`, or the start of the current agent session as the baseline.
1. Match the viewport, data, and UI state when comparing images. Capture each revision without disturbing the user's working changes, and record the commit SHAs with the captures.
1. When the PR changes, check that attached evidence still matches its current comparison. Replace stale captures rather than appending a history of revisions.

Never fabricate evidence or present a mockup as a running UI. If the base cannot run or a capture is missing, report the gap instead of substituting another commit. New UI states do not need an invented "before."

## Publish attachments

1. Prepare the selected captures or rendered illustrations for upload.
1. Immediately before creating or editing the PR, read the applicable current `gh pr create --help` or `gh pr edit --help` through the selected identity's workflow.
1. Use only the attachment behavior documented by that `gh` version. For machine publication, follow `macklinu-machine`'s image-upload policy and operation order. Otherwise, attach files in the same `gh pr create` or `gh pr edit` command when it supports uploads, so GitHub can replace local references with uploaded asset URLs.
1. Re-read the created or updated PR body even if the attachment command exits non-zero, since partial uploads can still create or update the PR. Confirm that every intended visual renders, has useful alt text, and links to an uploaded asset instead of a local path.
1. Report incomplete evidence. Do not repeat a failed command without checking the resulting PR.

## Default body example

```markdown
## Summary

Let users retry a failed profile request without leaving the page. Previously, recovery required a full reload.
```
