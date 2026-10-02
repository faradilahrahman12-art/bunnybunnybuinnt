import 'server-only'
import { pool } from '@/lib/db'

export const SUSPENDED_MESSAGE = 'Your account has been suspended. Please contact support if you think this is a mistake.'

export async function isUserBlocked(userId: string) {
  const { rows } = await pool.query<{ banned: boolean }>('SELECT "banned" FROM "user" WHERE "id" = $1', [userId])
  return rows[0]?.banned === true
}
