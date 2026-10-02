'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Ban, Search, ShieldCheck, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { blockUser, unblockUser, type AdminUser } from '@/app/actions/users'

type Filter = 'all' | 'active' | 'blocked'

const dateFormat = new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })

export function UsersManager({ users }: { users: AdminUser[] }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [blockingId, setBlockingId] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [pending, startTransition] = useTransition()

  const blockedCount = users.filter((u) => u.banned).length

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users.filter((u) => {
      if (filter === 'active' && u.banned) return false
      if (filter === 'blocked' && !u.banned) return false
      return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    })
  }, [users, query, filter])

  function confirmBlock(user: AdminUser) {
    startTransition(async () => {
      try {
        await blockUser(user.id, reason)
        toast.success(`${user.email} is blocked and signed out`)
        setBlockingId(null)
        setReason('')
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to block user')
      }
    })
  }

  function unblock(user: AdminUser) {
    startTransition(async () => {
      try {
        await unblockUser(user.id)
        toast.success(`${user.email} can sign in again`)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to unblock user')
      }
    })
  }

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: users.length },
    { key: 'active', label: 'Active', count: users.length - blockedCount },
    { key: 'blocked', label: 'Blocked', count: blockedCount },
  ]

  return (
    <div>
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          Block an account to sign it out right away and stop it from logging in, booking, or leaving reviews.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-fit rounded-full border border-border bg-background p-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                filter === f.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label} <span className="text-xs opacity-70">({f.count})</span>
            </button>
          ))}
        </div>
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or email"
            aria-label="Search users"
            className="pl-9"
          />
        </div>
      </div>

      <ul className="mt-5 flex flex-col gap-3">
        {visible.length === 0 && (
          <li className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            {users.length === 0 ? 'No one has signed up yet.' : 'No users match your search.'}
          </li>
        )}

        {visible.map((user) => (
          <li
            key={user.id}
            className={`rounded-xl border bg-card p-4 shadow-sm ${
              user.banned ? 'border-destructive/40' : 'border-border'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`grid size-10 shrink-0 place-items-center rounded-full ${
                  user.banned ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
                }`}
              >
                {user.banned ? <Ban className="size-4" /> : <UserRound className="size-4" />}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold">{user.name}</p>
                  {user.banned && (
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive">
                      Blocked
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Joined {dateFormat.format(new Date(user.createdAt))} · {user.orderCount} order
                  {user.orderCount === 1 ? '' : 's'}
                </p>
                {user.banned && (
                  <p className="mt-1 text-xs text-destructive">
                    Blocked {user.bannedAt ? dateFormat.format(new Date(user.bannedAt)) : ''}
                    {user.banReason ? ` · ${user.banReason}` : ''}
                  </p>
                )}
              </div>

              <div className="shrink-0">
                {user.banned ? (
                  <Button variant="outline" size="sm" className="gap-1.5" disabled={pending} onClick={() => unblock(user)}>
                    <ShieldCheck className="size-3.5" />
                    Unblock
                  </Button>
                ) : blockingId !== user.id ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-destructive hover:text-destructive"
                    onClick={() => {
                      setBlockingId(user.id)
                      setReason('')
                    }}
                  >
                    <Ban className="size-3.5" />
                    Block
                  </Button>
                ) : null}
              </div>
            </div>

            {blockingId === user.id && !user.banned && (
              <form
                className="mt-3 flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center"
                onSubmit={(e) => {
                  e.preventDefault()
                  confirmBlock(user)
                }}
              >
                <Input
                  autoFocus
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason (optional, only visible to admins)"
                  aria-label={`Reason for blocking ${user.email}`}
                  maxLength={500}
                  className="flex-1"
                />
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setBlockingId(null)} disabled={pending}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="destructive" size="sm" disabled={pending}>
                    {pending ? 'Blocking…' : 'Confirm block'}
                  </Button>
                </div>
              </form>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
