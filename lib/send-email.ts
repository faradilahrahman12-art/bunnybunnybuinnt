
type SendEmailOptions = {
  to: string
  subject: string
  text: string
  html?: string
}

export async function sendEmail({
  to,
  subject,
  text,
  html,
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
      ...(html ? { html } : {}),
    }),
  })

  if (!response.ok) {
    console.error('Resend email request failed', {
      status: response.status,
    })
    throw new Error('Failed to send email')
  }
}
