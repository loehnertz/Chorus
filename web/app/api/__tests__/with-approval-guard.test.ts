/**
 * @jest-environment node
 */

import fs from 'node:fs'
import path from 'node:path'

function listRouteFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const out: string[] = []

  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...listRouteFiles(full))
      continue
    }
    if (entry.isFile() && entry.name === 'route.ts') {
      out.push(full)
    }
  }

  return out
}

describe('API approval enforcement', () => {
  it('requires withApproval() on all non-auth routes', () => {
    const apiRoot = path.join(process.cwd(), 'app', 'api')
    const routeFiles = listRouteFiles(apiRoot)

    const offenders: string[] = []

    for (const filePath of routeFiles) {
      const rel = path.relative(process.cwd(), filePath)
      if (rel.startsWith(path.join('app', 'api', 'auth') + path.sep)) {
        continue
      }

      // Internal/cron routes are protected via secrets, not user sessions.
      if (rel.startsWith(path.join('app', 'api', 'cron') + path.sep)) {
        continue
      }

      const src = fs.readFileSync(filePath, 'utf8')
      const usesWithApproval = /\bwithApproval\b/.test(src)

      if (!usesWithApproval) {
        offenders.push(rel)
      }
    }

    expect(offenders).toEqual([])
  })
})
