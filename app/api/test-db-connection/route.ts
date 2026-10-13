
import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Never expose this diagnostic on Production.
  if (
    process.env.VERCEL_ENV !== 'preview' ||
    process.env.VERCEL_GIT_COMMIT_REF !== 'feature/email-preview-v2'
  ) {
    return new NextResponse('Not Found', { status: 404 })
  }

  // Require a secret token, stored in Vercel Preview only.
  const expectedToken = process.env.DB_CHECK_TOKEN
  if (!expectedToken) {
    return new NextResponse('Not Found', { status: 404 })
  }

  // We will add token authentication before enabling this endpoint.
  return NextResponse.json({
    status: 'Diagnostic not yet enabled',
  })
}
