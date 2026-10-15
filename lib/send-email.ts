type SendEmailOptions = {
  to: string
  subject: string
  text: string
}

export async function sendEmail({
  to,
  subject,
  text,
}: SendEmailOptions) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM

  if (!apiKey || !from) {
    console.error('Email service is not configured', {
      hasResendApiKey: Boolean(apiKey),
      hasEmailFrom: Boolean(from),
    })
    throw new Error('Email service is not configured')
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text,
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    console.error('Resend email request failed', {
      status: response.status,
      detail,
    })
    throw new Error('Failed to send email')
  }
}
