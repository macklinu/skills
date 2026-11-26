# Visual evidence for pull requests

## Capture and label the running UI

1. Before capturing, list the requested states from the task and PR template. If neither names states, choose the states that show the visible change. Skip near-duplicates only if they are not requested and add no review value.
2. Capture each state from the running UI at the PR head. Honor the requested format. Otherwise, use a screenshot for a still state or a short recording when motion or interaction matters.
3. Put each capture next to the review context it supports. Use a visible state label and useful alt text for images. A table can group related states or show a before-and-after comparison.

## Capture a before-and-after comparison

1. Resolve the actual target branch and PR head. Use their merge-base commit for "before" and the PR head for "after". This matches GitHub's three-dot diff, including for stacked PRs. Do not substitute `main`, `HEAD^`, or the first commit of the current session.
2. Match the viewport, data, and UI state. Capture both revisions without disturbing the user's working changes, and record the commit SHAs with the captures.
3. When the PR changes, check that the evidence still matches the current comparison. Replace stale captures instead of appending a history of revisions.

If the base cannot run, explain the missing comparison instead of capturing a different revision. A new state with no counterpart does not need a "before" capture.

## Add an illustration when it helps

If a diagram or layout illustration helps explain the change, load `show-me`. Label illustrations as such. Never use them as evidence of a running UI state.

Use GitHub-supported Markdown and Mermaid. See GitHub's [code block guide](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-and-highlighting-code-blocks) and [diagram guide](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/creating-diagrams). Upload rendered images, not local HTML files, artifact paths, or renderer-specific output.

## Publish attachments

1. Prepare the selected files. Use only attachment behavior documented by the installed `gh` version, and follow the active identity rules for each operation.
2. If the PR uses machine authorship, create it through the runner first. If the installed `gh pr edit` supports uploads, use it to attach files and let GitHub replace local references with asset URLs.
3. Reopen the published PR after the write, even if the command exits nonzero. A partial upload can still change the body. Inspect the result before retrying.
4. Match the published evidence to the capture checklist. A local path, broken asset, unlabeled visual, stale capture, or illustration does not count. For any state still missing, use the PR body to name it and explain why.
