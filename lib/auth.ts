import { betterAuth } from 'better-auth'
import { APIError } from 'better-auth/api'
import { pool } from '@/lib/db'
import { isUserBlocked, SUSPENDED_MESSAGE } from '@/lib/user-block'
import { sendEmail } from '@/lib/send-email'

export const auth = betterAuth({
  database: pool,
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.V0_RUNTIME_URL),

emailAndPassword: {
  enabled: true,
  autoSignIn: true,
  requireEmailVerification: false,
},
emailVerification: {
  sendOnSignUp: true,
  expiresIn: 3600,
  sendVerificationEmail: async ({ user, url }) => {
    await sendEmail({
      to: user.email,
      subject: 'Verify your BUNNY TICKET account',
      text: `Welcome to BUNNY TICKET!

Thank you for creating your account.

Please verify your email address by clicking the link below:

${url}

This verification link will expire in 1 hour.

If you did not create this account, you can safely ignore this email.

Best regards,
BUNNY TICKET Team
https://www.bunnyticket.store`,
    })
  },
},

  trustedOrigins: [
    ...(process.env.NODE_ENV === 'development'
      ? [
          'http://localhost:3000',
          ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
          ...(process.env.V0_DEV_APP_URL ? [process.env.V0_DEV_APP_URL] : []),
          ...(process.env.V0_BUILD_URL ? [process.env.V0_BUILD_URL] : []),
          ...(process.env.V0_SANDBOX_URL ? [process.env.V0_SANDBOX_URL] : []),
        ]
      : []),
    ...(process.env.NODE_ENV === 'production'
      ? [
          ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
          ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
            ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
            : []),
        ]
      : []),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          if (await isUserBlocked(session.userId)) {
            throw new APIError('FORBIDDEN', { message: SUSPENDED_MESSAGE, code: 'ACCOUNT_SUSPENDED' })
          }
        },
      },
    },
  },
  ...(process.env.NODE_ENV === 'development'
    ? {
        advanced: {
          // Required by the cross-site v0 preview iframe. Without these
          // attributes, login succeeds but the next request appears signed out.
          defaultCookieAttributes: {
            sameSite: 'none' as const,
            secure: true,
          },
        },
      }
    : {}),
})

/** Only allow same-site relative paths so the redirect param can't send users off-site. */
export function safeRedirect(value: string | undefined | null, fallback = '/') {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback
  return value
}
