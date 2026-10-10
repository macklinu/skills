import { spawnSync } from 'node:child_process'
import { createPrivateKey, sign } from 'node:crypto'
import { lstatSync, readFileSync } from 'node:fs'
import { dirname, isAbsolute, join } from 'node:path'

class WorkflowError extends Error {}

function fail(message: string): never {
  throw new WorkflowError(message)
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// Do not forward personal tokens or debug settings to credential-sensitive children.
const environment = { ...process.env }
for (const name of Object.keys(environment)) {
  if (/^(GH_|GITHUB_).*TOKEN$/.test(name) || name === 'GH_DEBUG' || name === 'DEBUG' ||
      name.startsWith('GIT_TRACE') || name === 'GIT_CURL_VERBOSE') {
    delete environment[name]
  }
}
environment.GH_HOST = 'github.com'

function gitConfigNames(pattern: string): string[] {
  const result = spawnSync('git', ['config', '--name-only', '--get-regexp', pattern], {
    env: environment, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  })
  if (result.error || (result.status !== 0 && result.status !== 1)) {
    fail('Cannot inspect Git authentication settings.')
  }
  return result.stdout.trim().split('\n').filter(Boolean)
}

async function main() {
  const [repository, operation, ...args] = process.argv.slice(2)
  if (!repository || !operation || !args[0]) {
    fail('Usage: run.ts OWNER/REPO gh|commit|push ARGS...')
  }
  if (!/^(macklinu|fairfield-consulting)\/(?!\.{1,2}$)[A-Za-z0-9_.-]+$/.test(repository)) {
    fail('Unsupported target repository.')
  }
  if (!['gh', 'commit', 'push'].includes(operation)) fail('Unsupported operation.')

  if (operation === 'commit') {
    if (args.some(arg => /^--(?:a|au|aut|auth|autho|author)(?:=|$)/.test(arg))) {
      fail('Author overrides are not allowed. Use --reset-author when amending.')
    }
    const result = spawnSync('git', ['commit', ...args], {
      stdio: 'inherit', env: {
        ...environment,
        GIT_AUTHOR_NAME: 'macklinu-machine[bot]',
        GIT_AUTHOR_EMAIL: '340227694+macklinu-machine[bot]@users.noreply.github.com',
        GIT_COMMITTER_NAME: 'macklinu-machine[bot]',
        GIT_COMMITTER_EMAIL: '340227694+macklinu-machine[bot]@users.noreply.github.com',
      },
    })
    process.exitCode = result.status ?? 1
    return
  }

  if (args.some(arg => /^(-R.*|--repo(?:=|$)|--hostname(?:=|$))/.test(arg))) {
    fail('Repository and host overrides are not allowed.')
  }
  const [owner, name] = repository.split('/')
  const gitOptions: string[] = []
  if (operation === 'gh') {
    // Auth, extensions and aliases can print or pass the token to arbitrary programs.
    if (!['pr', 'api'].includes(args[0])) fail('Only gh pr and repository API commands are allowed.')
    if (args.some(arg => /^--verbose(?:=|$)/.test(arg))) {
      fail('HTTP request logging is not allowed.')
    }
    if (args.some(arg => /^(?:(?:-H|--header=))?(?:authorization|proxy-authorization|host)\s*:/i.test(arg))) {
      fail('Authentication and host headers cannot be replaced.')
    }
    if (args.some(arg => /^https?:\/\//i.test(arg) && !arg.startsWith(`https://github.com/${repository}/`))) {
      fail('Cross-repository URLs are not allowed.')
    }
    if (args[0] === 'api') {
      const endpoint = args[1]?.replaceAll('{owner}', owner).replaceAll('{repo}', name)
      if (!endpoint || !/^\/?repos\//.test(endpoint)) fail('Put the target repository API endpoint immediately after api.')
      const url = new URL(endpoint, 'https://api.github.com/')
      const path = decodeURIComponent(url.pathname)
      if (!(path === `/repos/${repository}` || path.startsWith(`/repos/${repository}/`)) ||
          path.split('/').some(part => part === '.' || part === '..') || path.includes('\\')) {
        fail('API endpoints must stay in the target repository.')
      }
    }
  } else {
    if (args.some(arg => /^--(?:r|re|rep|repo|rec[^=]*|e|ex|exe|exec)(?:=|$)/.test(arg))) {
      fail('Push destination, transport and submodule overrides are not allowed.')
    }
    if (gitConfigNames('^url\\..*\\.(insteadof|pushinsteadof)$').length) {
      fail('Remove Git URL rewrites before a machine push.')
    }
    // URL-specific helpers and headers can override the generic Git settings.
    for (const key of new Set(['credential.helper', ...gitConfigNames('^credential(\\..*)?\\.helper$')])) {
      gitOptions.push('-c', `${key}=`, '-c', `${key}=!gh auth git-credential`)
    }
    for (const key of new Set(['http.extraheader', ...gitConfigNames('^http(\\..*)?\\.extraheader$')])) {
      gitOptions.push('-c', `${key}=`)
    }
    gitOptions.push('-c', 'push.recurseSubmodules=no')
  }
  if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') fail('TLS certificate verification must be enabled.')

  let installationId: number
  let keyPath: string
  try {
    if (!environment.HOME) throw new Error()
    const directory = join(environment.HOME, '.config', 'macklinu-machine')
    const file = join(directory, 'config.json')
    const directoryStat = lstatSync(directory)
    const fileStat = lstatSync(file)
    if (!directoryStat.isDirectory() || !fileStat.isFile() ||
        (directoryStat.mode & 0o077) || (fileStat.mode & 0o077)) {
      throw new Error()
    }
    const config: unknown = JSON.parse(readFileSync(file, 'utf8'))
    if (!isObject(config) || !isObject(config.installation_ids) ||
        Object.values(config.installation_ids).some(id => typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0)) {
      throw new Error()
    }
    const id = config.installation_ids[owner]
    const path = config.private_key_path
    if (typeof id !== 'number' || !Number.isSafeInteger(id) || id <= 0 ||
        typeof path !== 'string' || !isAbsolute(path) || /[\x00-\x1f\x7f]/.test(path)) {
      throw new Error()
    }
    installationId = id
    keyPath = path
  } catch {
    fail('Machine configuration is missing, invalid or insecure. Run /setup-macklinu-machine.')
  }

  let pem: Buffer
  try {
    const directoryStat = lstatSync(dirname(keyPath))
    const keyStat = lstatSync(keyPath)
    if (!directoryStat.isDirectory() || (directoryStat.mode & 0o022) ||
        !keyStat.isFile() || (keyStat.mode & 0o077) || !(keyStat.mode & 0o400)) {
      throw new Error()
    }
    pem = readFileSync(keyPath)
  } catch {
    fail('Cannot read a private, regular App PEM file. Check the local key path and permissions.')
  }
  let jwt: string
  try {
    const key = createPrivateKey({ key: pem, format: 'pem' })
    if (key.asymmetricKeyType !== 'rsa') throw new Error()
    const now = Math.floor(Date.now() / 1000)
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
    const payload = Buffer.from(JSON.stringify({ iat: now - 60, exp: now + 540, iss: '5252838' })).toString('base64url')
    const input = `${header}.${payload}`
    jwt = `${input}.${sign('RSA-SHA256', Buffer.from(input), key).toString('base64url')}`
  } catch {
    fail('Cannot sign the GitHub App token.')
  } finally {
    pem.fill(0)
  }

  let token: string
  try {
    const response = await fetch(`https://api.github.com/app/installations/${installationId}/access_tokens`, {
      method: 'POST', redirect: 'error',
      headers: {
        Accept: 'application/vnd.github+json', Authorization: `Bearer ${jwt}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json', 'User-Agent': 'macklinu-machine',
      },
      // Keep the app's granted permissions, but never grant other repositories.
      body: JSON.stringify({ repositories: [name] }),
    })
    if (!response.ok) throw new Error()
    const body: unknown = await response.json()
    const generatedToken = isObject(body) ? body.token : undefined
    if (typeof generatedToken !== 'string' || !/^[^\s\x00-\x1f\x7f]+$/.test(generatedToken)) throw new Error()
    token = generatedToken
  } catch {
    fail('Cannot generate a valid machine installation token.')
  }

  const childEnvironment = { ...environment, GH_TOKEN: token, GH_REPO: repository }
  const result = operation === 'gh'
    ? spawnSync('gh', args, { env: childEnvironment, stdio: 'inherit' })
    : spawnSync('git', [...gitOptions, 'push', `https://github.com/${repository}.git`, ...args], {
        env: { ...childEnvironment, GIT_TERMINAL_PROMPT: '0', GIT_ASKPASS: '', SSH_ASKPASS: '', GIT_TRACE_REDACT: '1' },
        stdio: 'inherit',
      })
  process.exitCode = result.status ?? 1
}

main().catch(error => {
  console.error(error instanceof WorkflowError ? error.message : 'Machine command failed.')
  process.exitCode = 1
})
