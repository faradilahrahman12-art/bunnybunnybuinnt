import { pool } from '@/lib/db'
import { ensureReviewsTable } from '@/lib/reviews'

const DATA_URI = /^data:([^;,]+)?(;base64)?,([\s\S]*)$/

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; index: string }> }) {
  const { id, index } = await params
  const reviewId = Number(id)
  const imageIndex = Number(index)
  if (!Number.isInteger(reviewId) || !Number.isInteger(imageIndex) || imageIndex < 0) {
    return new Response('Not found', { status: 404 })
  }

  await ensureReviewsTable()
  const { rows } = await pool.query<{ img: string | null }>(
    'SELECT images->>($2::int) AS img FROM reviews WHERE id = $1 AND hidden = false',
    [reviewId, imageIndex],
  )
  const img = rows[0]?.img
  if (!img) return new Response('Not found', { status: 404 })

  if (/^https?:\/\//.test(img)) return Response.redirect(img, 302)

  const match = DATA_URI.exec(img)
  if (!match) return new Response('Not found', { status: 404 })
  const [, mime = 'application/octet-stream', isBase64, payload] = match
  if (!mime.startsWith('image/')) return new Response('Not found', { status: 404 })

  const body = isBase64 ? Buffer.from(payload, 'base64') : Buffer.from(decodeURIComponent(payload))

  return new Response(body, {
    headers: {
      'Content-Type': mime,
      'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
      'Content-Disposition': 'inline',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
