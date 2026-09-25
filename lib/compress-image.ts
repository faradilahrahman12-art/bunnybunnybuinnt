// Client-side helper: read an image File, downscale it on a canvas, and return
// a compressed data URL. Used for QRPH QR uploads and payment-proof screenshots
// so we can store them directly in the database without external blob storage.
export async function fileToCompressedDataUrl(
  file: File,
  opts: { maxSize?: number; quality?: number; mime?: string } = {},
): Promise<string> {
  const { maxSize = 1400, quality = 0.6, mime = 'image/jpeg' } = opts

  const sourceUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new window.Image()
    el.crossOrigin = 'anonymous'
    el.onload = () => resolve(el)
    el.onerror = () => reject(new Error('Failed to load image'))
    el.src = sourceUrl
  })

  let width = img.naturalWidth || img.width
  let height = img.naturalHeight || img.height
  const longest = Math.max(width, height)
  if (longest > maxSize) {
    const scale = maxSize / longest
    width = Math.round(width * scale)
    height = Math.round(height * scale)
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return sourceUrl
  ctx.drawImage(img, 0, 0, width, height)
  return canvas.toDataURL(mime, quality)
}
