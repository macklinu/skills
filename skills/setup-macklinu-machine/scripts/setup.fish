#!/usr/bin/env fish

set --global fish_trace

function setup_fail
    printf '%s\n' "$argv[1]" >&2
    exit 1
end

if test (count $argv) -ne 1
    setup_fail 'Setup needs exactly one 1Password field reference.'
end

if not string match --quiet --regex '^op://[^/[:cntrl:]]+/[^/[:cntrl:]]+/[^/[:cntrl:]]+$' -- "$argv[1]"
    setup_fail 'Supply a valid op:// field reference.'
end

for dependency in git jq
    if not command --search $dependency >/dev/null 2>&1
        setup_fail 'Setup needs Git and jq.'
    end
end

set -l repo_root (command git rev-parse --show-toplevel 2>/dev/null)
if test $status -ne 0; or test (count $repo_root) -ne 1; or not test -d "$repo_root"
    setup_fail 'Run setup from a Git checkout.'
end

if not set --query HOME; or test -z "$HOME"
    setup_fail 'Setup needs a home directory.'
end

set -l config_dir "$HOME/.config/macklinu-machine"
set -l config_file "$config_dir/config.json"
set -l config_source /dev/null
set -l agents_file "$repo_root/AGENTS.md"
set -l instruction 'Before using the `gh` CLI, always read and follow the `/macklinu-machine` skill.'
set -l needs_instruction 1
set -l agents_exists 0

if test -L "$config_dir"; or test -L "$config_file"
    setup_fail 'The local configuration must not use symbolic links.'
end

if test -e "$config_dir"; and not test -d "$config_dir"
    setup_fail 'The local configuration directory is not a directory.'
end

if test -e "$config_file"
    if not test -f "$config_file"
        setup_fail 'The local configuration is not a regular file.'
    end
    if not command jq --exit-status --slurp 'length == 1 and (.[0] | type == "object")' "$config_file" >/dev/null 2>&1
        setup_fail 'The local configuration must contain one valid JSON object.'
    end
    set config_source "$config_file"
end

if test -L "$agents_file"
    setup_fail 'The root AGENTS.md must not be a symbolic link.'
end

if test -e "$agents_file"
    if not test -f "$agents_file"
        setup_fail 'The root AGENTS.md is not a regular file.'
    end
    set agents_exists 1
    command grep --fixed-strings --line-regexp --quiet -- "$instruction" "$agents_file" 2>/dev/null
    switch $status
        case 0
            set needs_instruction 0
        case 1
        case '*'
            setup_fail 'Cannot read the root AGENTS.md.'
    end
end

umask 077
if not command mkdir -p -- "$config_dir" 2>/dev/null
    setup_fail 'Cannot create the local configuration directory.'
end
if not command chmod 700 "$config_dir" 2>/dev/null
    setup_fail 'Cannot secure the local configuration directory.'
end

set -g setup_config_tmp (command mktemp "$config_dir/.config.json.XXXXXXXX" 2>/dev/null)
if test $status -ne 0; or test (count $setup_config_tmp) -ne 1
    setup_fail 'Cannot create a temporary configuration file.'
end

function setup_cleanup --on-event fish_exit
    if set --query setup_config_tmp[1]
        command rm -f -- "$setup_config_tmp" 2>/dev/null
    end
end

if not command jq --slurp --arg reference "$argv[1]" 'if length == 0 then {} elif length == 1 and (.[0] | type == "object") then .[0] else error("Invalid configuration") end | .private_key_reference = $reference' "$config_source" >"$setup_config_tmp" 2>/dev/null
    setup_fail 'Cannot write the local configuration.'
end
if not command chmod 600 "$setup_config_tmp" 2>/dev/null
    setup_fail 'Cannot secure the local configuration file.'
end
if not command mv -f -- "$setup_config_tmp" "$config_file" 2>/dev/null
    setup_fail 'Cannot replace the local configuration file.'
end
set --erase setup_config_tmp

if test $needs_instruction -eq 1
    if test $agents_exists -eq 1
        if not printf '\n%s\n' "$instruction" 2>/dev/null >>"$agents_file"
            setup_fail 'Cannot update the root AGENTS.md.'
        end
    else
        if not printf '%s\n' "$instruction" 2>/dev/null >"$agents_file"
            setup_fail 'Cannot create the root AGENTS.md.'
        end
    end
end

printf '%s\n' 'Local configuration and the repository instruction are ready.'
