'use server'

import { revalidatePath } from 'next/cache'
import { pool } from '@/lib/db'
import { isAdmin } from '@/lib/admin-auth'

export type AdminUser = {
  id: string
  name: string
  email: string
  createdAt: string
  banned: boolean
  banReason: string | null
  bannedAt: string | null
  orderCount: number
}

async function requireAdmin() {
  if (!(await isAdmin())) throw new Error('Unauthorized')
}

export async function getAllUsers(): Promise<AdminUser[]> {
  await requireAdmin()
  const { rows } = await pool.query(`
    SELECT u."id", u."name", u."email", u."createdAt", u."banned", u."banReason", u."bannedAt",
           COUNT(o.reference)::int AS "orderCount"
    FROM "user" u
    LEFT JOIN orders o ON o.user_id = u."id"
    GROUP BY u."id"
    ORDER BY u."createdAt" DESC
  `)
  return rows.map((r) => ({
    ...r,
    createdAt: new Date(r.createdAt).toISOString(),
    bannedAt: r.bannedAt ? new Date(r.bannedAt).toISOString() : null,
  }))
}

export async function blockUser(userId: string, reason: string) {
  await requireAdmin()
  const trimmed = reason.trim().slice(0, 500) || null
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await client.query(
      'UPDATE "user" SET "banned" = true, "banReason" = $2, "bannedAt" = now(), "updatedAt" = now() WHERE "id" = $1',
      [userId, trimmed],
    )
    if (result.rowCount === 0) throw new Error('User not found')
    await client.query('DELETE FROM "session" WHERE "userId" = $1', [userId])
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
  revalidatePath('/4dminstotor')
}

export async function unblockUser(userId: string) {
  await requireAdmin()
  await pool.query(
    'UPDATE "user" SET "banned" = false, "banReason" = NULL, "bannedAt" = NULL, "updatedAt" = now() WHERE "id" = $1',
    [userId],
  )
  revalidatePath('/4dminstotor')
}
