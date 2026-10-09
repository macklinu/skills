import { spawnSync } from 'node:child_process'
import { chmodSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

class SetupError extends Error {}

function fail(message: string): never {
  throw new SetupError(message)
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function main() {
  // Stdin keeps the private reference out of shell history and process arguments.
  if (process.argv.length !== 2) fail('Supply the 1Password field reference on stdin, not as an argument.')
  const reference = readFileSync(0, 'utf8').replace(/\r?\n$/, '')
  if (!/^op:\/\/[^/\x00-\x1f\x7f]+\/[^/\x00-\x1f\x7f]+\/[^/\x00-\x1f\x7f]+$/.test(reference)) {
    fail('Supply a valid op:// field reference.')
  }
  const root = spawnSync('git', ['rev-parse', '--show-toplevel'], {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  })
  if (root.error || root.status !== 0 || !root.stdout.trim()) fail('Run setup from a Git checkout.')
  if (!process.env.HOME) fail('Setup needs a home directory.')

  const directory = join(process.env.HOME, '.config', 'macklinu-machine')
  const file = join(directory, 'config.json')
  const agentsFile = join(root.stdout.trim(), 'AGENTS.md')
  const instruction = 'Before using the `gh` CLI, always read and follow the `/macklinu-machine` skill.'
  const directoryStat = lstatSync(directory, { throwIfNoEntry: false })
  const fileStat = lstatSync(file, { throwIfNoEntry: false })
  const agentsStat = lstatSync(agentsFile, { throwIfNoEntry: false })
  if (directoryStat && !directoryStat.isDirectory()) fail('The local configuration directory must be a real directory.')
  if (fileStat && !fileStat.isFile()) fail('The local configuration must be a regular file, not a symbolic link.')
  if (agentsStat && !agentsStat.isFile()) fail('The root AGENTS.md must be a regular file, not a symbolic link.')

  let config: Record<string, unknown> = {}
  if (fileStat) {
    try {
      const value: unknown = JSON.parse(readFileSync(file, 'utf8'))
      if (!isObject(value)) throw new Error()
      config = value
    } catch {
      fail('The local configuration must contain one valid JSON object.')
    }
  }
  const existingIds = config.installation_ids === undefined ? {} : config.installation_ids
  if (!isObject(existingIds)) {
    fail('The installation_ids setting must be an object.')
  }
  const installationIds = {
    macklinu: 169669532,
    'fairfield-consulting': 169669603,
    ...existingIds,
  }
  for (const id of [installationIds.macklinu, installationIds['fairfield-consulting']]) {
    if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0) fail('Installation IDs must be positive integers.')
  }
  const agents = agentsStat ? readFileSync(agentsFile, 'utf8') : ''

  process.umask(0o077)
  mkdirSync(directory, { recursive: true, mode: 0o700 })
  chmodSync(directory, 0o700)
  const temporary = mkdtempSync(join(directory, '.setup-'))
  try {
    const temporaryFile = join(temporary, 'config.json')
    writeFileSync(temporaryFile, JSON.stringify({ ...config, private_key_reference: reference, installation_ids: installationIds }, null, 2) + '\n', {
      mode: 0o600, flag: 'wx',
    })
    renameSync(temporaryFile, file)
  } finally {
    rmSync(temporary, { recursive: true, force: true })
  }
  if (!agents.split(/\r?\n/).includes(instruction)) {
    writeFileSync(agentsFile, `${agents}${agents && !agents.endsWith('\n') ? '\n' : ''}${agents ? '\n' : ''}${instruction}\n`, {
      flag: agentsStat ? 'w' : 'wx',
    })
  }
  console.log('Local configuration and the repository instruction are ready.')
}

try {
  main()
} catch (error) {
  console.error(error instanceof SetupError ? error.message : 'Cannot complete local machine setup.')
  process.exitCode = 1
}
