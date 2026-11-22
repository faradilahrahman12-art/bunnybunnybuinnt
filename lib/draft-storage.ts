// The full draft stays in sessionStorage (this tab only). A copy without secrets goes to
// localStorage so the draft survives the tab or browser being closed.
const SECRET_FIELDS = ['password', 'confirmPassword'] as const
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7

type StoredDraft = { form?: Record<string, unknown>; savedAt?: number; [key: string]: unknown }

export function readDraft(key: string): string | null {
  try {
    const session = window.sessionStorage.getItem(key)
    if (session) return session
    const persisted = window.localStorage.getItem(key)
    if (!persisted) return null
    const parsed = JSON.parse(persisted) as StoredDraft
    if (typeof parsed.savedAt === 'number' && Date.now() - parsed.savedAt > MAX_AGE_MS) {
      window.localStorage.removeItem(key)
      return null
    }
    return persisted
  } catch {
    return null
  }
}

export function writeDraft(key: string, draft: StoredDraft) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(draft))
  } catch {}
  try {
    const form = draft.form ? { ...draft.form } : undefined
    if (form) for (const field of SECRET_FIELDS) delete form[field]
    window.localStorage.setItem(key, JSON.stringify({ ...draft, form, savedAt: Date.now() }))
  } catch {}
}

export function removeDraft(key: string) {
  try {
    window.sessionStorage.removeItem(key)
  } catch {}
  try {
    window.localStorage.removeItem(key)
  } catch {}
}
