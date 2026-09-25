'use server'

import { generateText } from 'ai'

// Uses a vision model (via AI Gateway) to read a payment receipt screenshot and
// pull out the transaction reference number. Returns null when it can't find one.
export async function extractReferenceFromImage(
  dataUrl: string,
): Promise<{ reference: string | null }> {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    return { reference: null }
  }

  try {
    const { text } = await generateText({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text:
                'This is a screenshot of a payment / e-wallet / bank transfer receipt. ' +
                'Find the transaction reference number (also labeled Reference No, Ref No, ' +
                'Transaction ID, Reference ID, or similar). ' +
                'Respond with ONLY the reference value, digits/letters exactly as shown, no spaces or labels. ' +
                'If there is no reference number visible, respond with exactly NONE.',
            },
            { type: 'file', mediaType: 'image', data: dataUrl },
          ],
        },
      ],
    })

    const raw = text.trim()
    // Model may wrap the answer or add punctuation — keep the reference-like token.
    const cleaned = raw.replace(/[^A-Za-z0-9/-]/g, '')
    if (!cleaned || /^none$/i.test(raw) || cleaned.length < 4) {
      return { reference: null }
    }
    return { reference: cleaned }
  } catch (err) {
    console.log('[v0] extractReferenceFromImage failed:', (err as Error).message)
    return { reference: null }
  }
}
