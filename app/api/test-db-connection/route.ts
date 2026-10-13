
import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Only allow this diagnostic on the email testing Preview.
  if (
    process.env.VERCEL_ENV !== 'preview' ||
    process.env.VERCEL_GIT_COMMIT_REF !== 'feature/email-preview-v2'
  ) {
    return new NextResponse('Not Found', { status: 404 })
  }

  // Keep the diagnostic disabled unless explicitly enabled.
  if (process.env.DB_CHECK_ENABLED !== 'true') {
    return new NextResponse('Not Found', { status: 404 })
  }

  try {
    const result = await pool.query(
      `SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'email_preview_connection_check'
      ) AS marker_table_exists`
    )

    if (!result.rows[0]?.marker_table_exists) {
      return NextResponse.json({
        connected: true,
        testingBranchVerified: false,
      })
    }

    const marker = await pool.query(
      `SELECT EXISTS (
        SELECT 1
        FROM email_preview_connection_check
        WHERE marker = $1
      ) AS found`,
      ['BUNNY_EMAIL_PREVIEW_TEST_2026']
    )

    return NextResponse.json({
      connected: true,
      testingBranchVerified: marker.rows[0]?.found === true,
    })
  } catch {
    return NextResponse.json(
      {
        connected: false,
        testingBranchVerified: false,
      },
      { status: 500 }
    )
  }
}
