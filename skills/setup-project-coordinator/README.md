# Set up a project coordinator

Manually bootstrap a coordinator alongside the native `herdr-projects` instructions. This single skill loads the shared coordination preferences and stops before task work begins.

## First use

You need Herdr, its `herdr-projects` plugin, omp, and Worktrunk for code worktrees. Follow the [Herdr documentation](https://herdr.dev/docs/) for Herdr setup. Use your installed plugin's getting-started guide for plugin setup and `herdr-projects --help` for current commands.

1. Install the skill globally for omp on each machine that runs a coordinator.

   ```sh
   pnpx skills add macklinu/skills --global --skill setup-project-coordinator --agent universal
   pnpx skills list --global --agent universal
   ```

   The `universal` target installs to shared `~/.agents/skills`, which omp discovers. Confirm that `setup-project-coordinator` is listed and make its referenced skills available to the same harness.

   Start a new session after installation. The skill stays available for manual loading but is omitted from the model's automatic skill list; discovery does not run bootstrap.

2. Create a project. Replace the example repository path and goal with your own.

   ```sh
   herdr-projects new "Example" --goal "Describe the project goal" --repo /path/to/repository --coordinator-profile omp --thread-profile omp
   ```

   Use an existing allowed omp profile if your setup uses a custom profile name. Do not change profiles or safety settings to make this example work.

3. Open its coordinator from a shell pane inside Herdr.

   ```sh
   herdr-projects open example
   ```

   The first open starts the coordinator in the project folder. Answer any trust prompt yourself. Its generated `AGENTS.md` points to the native skill and context commands; do not customize that generated file.

4. Send this prompt using omp's manual skill-command syntax.

   ```text
   /skill:setup-project-coordinator

   Load this project's native coordinator instructions, current context, PROJECT.md instructions, MEMORY.md index, and relevant linked memory files. Report the loaded constraints and ask me for the first task; do not start tasks or publish changes.
   ```

Keep project constraints in native project instructions and regular memory files, not symlinked memory or generated instruction edits. Loading the index does not load its linked files. Give a separate, bounded task request when you want work to start.
