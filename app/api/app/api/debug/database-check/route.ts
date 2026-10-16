
import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
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
    const result = await pool.query(
      'SELECT COUNT(*)::int AS total_orders FROM public.orders'
    )

    return NextResponse.json({
      environment: 'preview',
      totalOrders: result.rows[0].total_orders,
    })
  } catch {
    return NextResponse.json(
      { error: 'Database check failed' },
      { status: 500 }
    )
  }
}
