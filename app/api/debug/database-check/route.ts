
import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Only allow this diagnostic on the testing Preview branch
  if (
    process.env.VERCEL_ENV !== 'preview' ||
    process.env.VERCEL_GIT_COMMIT_REF !==
      'feature-order-status-emails'
  ) {
    return NextResponse.json(
      { error: 'Not available' },
      { status: 404 }
    )
  }

  try {
    // Read-only database check
    const result = await pool.query(
      'SELECT COUNT(*)::int AS total_orders FROM public.orders'
    )

    return NextResponse.json({
      environment: 'preview',
      branch: 'feature-order-status-emails',
      totalOrders: result.rows[0].total_orders,
    })
  } catch (error) {
    console.error('Preview database check failed')

    return NextResponse.json(
      { error: 'Database check failed' },
      { status: 500 }
    )
  }
}
