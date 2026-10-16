
import type { Order } from '@/lib/db/schema'

type StatusEmailInput = {
  order: Order
  customerName: string
}

const SUPPORT_URL = 'https://wa.me/639608722635'
const ORDERS_URL = 'https://bunnyticket.store/orders'


const statusMessages: Record<string, {
  subject: string
  message: string
}> = {
  pending: {
    subject: 'BUNNY TICKET — Order Submitted',
    message: "We've received your order! Your request is currently pending review. We'll notify you when its status changes.",
  },
  verified: {
    subject: 'BUNNY TICKET — Order Confirmed!',
    message: "Great news! Your order has been confirmed. We'll keep you updated as your order progresses.",
  },
  processing: {
    subject: 'BUNNY TICKET — Order In Progress',
    message: "We're currently working on your order. We'll notify you when there are further updates.",
  },
  completed: {
    subject: 'BUNNY TICKET — Order Complete!',
    message: "Your order has been marked as complete! Please check your order dashboard for the latest details.",
  },
  cancelled: {
    subject: 'BUNNY TICKET — Order Cancelled',
    message: 'Your order has been cancelled. If you have any questions, please contact our support team.',
  },
}


function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return entities[character]
  })
}

function parseJson(value: string | null): unknown {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function formatValue(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    return value.map(formatValue).filter(Boolean).join(', ')
  }
  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([key, item]) => `${key}: ${formatValue(item)}`)
      .join(' | ')
  }
  return String(value)
}

function formatMoney(value: number | null): string {
  if (value == null) return ''
  return `PHP ${value.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function buildOrderStatusEmail({
  order,
  customerName,
}: StatusEmailInput) {
  const status = statusMessages[order.status.toLowerCase()] ?? {
    subject: 'Your BUNNY TICKET Order Status Has Changed',
    message: 'There is a new update to your order.',
  }

  const service = order.serviceType === 'help_to_buy'
    ? 'Help to Buy'
    : order.serviceType === 'resale'
      ? 'Resale'
      : order.serviceType

  const serviceLabel = order.serviceTier
    ? `${service} - ${order.serviceTier.replace(/_/g, ' ')}`
    : service

  const details: Array<[string, string]> = [
    ['Customer Name', customerName],
    ['Order Reference', order.reference],
    ['Event', order.eventTitle],
    ['Service', serviceLabel],
    ['Concert Date(s)', formatValue(parseJson(order.dates))],
    ['Tier / Section Selection', formatValue(parseJson(order.sections))],
    ['Tickets Per Date', String(order.quantityPerDate)],
    ['Order Total', formatMoney(order.totalAmount)],
    ['Amount Sent', formatMoney(order.amountSent)],
    ['Order Status', ({
  pending: 'Submitted',
  verified: 'Confirmed',
  processing: 'In Progress',
  completed: 'Complete',
  cancelled: 'Cancelled',
} as Record<string, string>)[order.status.toLowerCase()] ?? order.status],
  ].filter((entry) => Boolean(entry[1])) as Array<[string, string]>

  const rows = details.map(([label, value]) => `
    <tr>
      <td style="padding:9px 12px;color:#64748b;
        vertical-align:top;width:38%;">
        ${escapeHtml(label)}
      </td>
      <td style="padding:9px 12px;color:#111827;
        font-weight:600;overflow-wrap:anywhere;">
        ${escapeHtml(value)}
      </td>
    </tr>
  `).join('')

  const html = `
    <!doctype html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
    </head>
    <body style="margin:0;padding:24px 12px;
      background:#f5f7fb;font-family:Arial,sans-serif;
      color:#111827;">
      <div style="max-width:580px;margin:0 auto;
        background:#ffffff;border:1px solid #e5e7eb;
        border-radius:14px;overflow:hidden;">
        <div style="padding:24px;border-bottom:1px solid #e5e7eb;">
          <div style="font-size:20px;font-weight:800;">
            BUNNY TICKET
          </div>
          <div style="color:#64748b;font-size:13px;margin-top:5px;">
            Order Status Update
          </div>
        </div>

        <div style="padding:24px;">
          <p>Hi <strong>${escapeHtml(customerName)}</strong>,</p>

          <p>Your order for
            <strong>${escapeHtml(order.eventTitle)}</strong>
            has been updated.
          </p>

          <table role="presentation" style="width:100%;
            border-collapse:collapse;background:#f8fafc;
            border-radius:8px;font-size:14px;">
            ${rows}
          </table>

          <p style="line-height:1.6;margin-top:24px;">
            ${escapeHtml(status.message)}
          </p>

          <p style="line-height:1.6;">
            For questions or support, message
            <a href="${SUPPORT_URL}" style="color:#2563eb;">
              @bunnyticket.main
            </a>
            on WhatsApp — include the email address you used
            when placing your order for faster assistance.
          </p>

          <div style="text-align:center;margin:28px 0;">
            <a href="${ORDERS_URL}" style="display:inline-block;
              background:#3b82f6;color:#ffffff;
              text-decoration:none;font-weight:700;
              padding:14px 24px;border-radius:8px;">
              View My Orders
            </a>
          </div>

          <p style="color:#64748b;font-size:12px;
            border-top:1px solid #e5e7eb;
            padding-top:20px;line-height:1.6;">
            Please do not reply to this email.
            This inbox is not monitored.
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = [
    `Hi ${customerName},`,
    '',
    `Your order for ${order.eventTitle} has been updated.`,
    '',
    ...details.map(([label, value]) => `${label}: ${value}`),
    '',
    status.message,
    '',
    `For questions or support, message @bunnyticket.main on WhatsApp: ${SUPPORT_URL}`,
    'Include the email address used when placing your order.',
    '',
    `View My Orders: ${ORDERS_URL}`,
    '',
    'Please do not reply to this email. This inbox is not monitored.',
  ].join('\n')

  return {
    subject: status.subject,
    html,
    text,
  }
}
