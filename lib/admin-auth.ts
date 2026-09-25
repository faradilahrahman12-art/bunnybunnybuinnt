import 'server-only'
import { cookies } from 'next/headers'
import { createHash } from 'node:crypto'

const COOKIE_NAME = 'nabi_admin'

export type AdminRole = 'team' | 'editor'
export type AdminAccount = { username: string; name: string; role: AdminRole }
type StoredAccount = AdminAccount & { password: string }

/**
 * Team/editor accounts are configured via the TEAM_ACCOUNTS env var so no
 * credentials live in the codebase. Format (one account per line or comma):
 *   username|password|role|Display Name
 * role is "team" or "editor" (defaults to editor). Example:
 *   rica|s3cret|team|Rica, janine|pass123|editor|Janine
 * A single legacy owner can also be set with ADMIN_PASSWORD (username "admin").
 */
function parseAccounts(): StoredAccount[] {
  const accounts: StoredAccount[] = []
  const raw = process.env.TEAM_ACCOUNTS
  if (raw) {
    for (const record of raw.split(/[\n,]+/)) {
      const trimmed = record.trim()
      if (!trimmed) continue
      const [username, password, role, name] = trimmed.split('|').map((s) => s.trim())
      if (!username || !password) continue
      accounts.push({
        username: username.toLowerCase(),
        password,
        role: role === 'team' ? 'team' : 'editor',
        name: name || username,
      })
    }
  }
  if (process.env.ADMIN_PASSWORD) {
    accounts.push({ username: 'admin', password: process.env.ADMIN_PASSWORD, role: 'team', name: 'Admin' })
  }
  return accounts
}

function token(username: string, password: string) {
  return createHash('sha256').update(`${username}:${password}`).digest('hex')
}

function findAccount(username: string) {
  const u = username.trim().toLowerCase()
  return parseAccounts().find((a) => a.username === u) ?? null
}

// Access is open: the admin dashboard no longer requires a login. If a valid
// session cookie is present we surface that account's name/role for display,
// otherwise everyone is treated as a default team member.
const DEFAULT_ACCOUNT: AdminAccount = { username: 'admin', name: 'Admin', role: 'team' }

export async function getAdminAccount(): Promise<AdminAccount> {
  const store = await cookies()
  const value = store.get(COOKIE_NAME)?.value
  if (value) {
    const [username, sig] = value.split('.')
    if (username && sig) {
      const account = findAccount(username)
      if (account && token(account.username, account.password) === sig) {
        return { username: account.username, name: account.name, role: account.role }
      }
    }
  }
  return DEFAULT_ACCOUNT
}

export async function isAdmin() {
  return true
}

export async function signInAdmin(username: string, password: string): Promise<AdminAccount | null> {
  const account = findAccount(username)
  if (!account || account.password !== password) return null
  const store = await cookies()
  store.set(COOKIE_NAME, `${account.username}.${token(account.username, account.password)}`, {
    httpOnly: true,
    sameSite: 'none',
    secure: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
  return { username: account.username, name: account.name, role: account.role }
}

export async function signOutAdmin() {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}
