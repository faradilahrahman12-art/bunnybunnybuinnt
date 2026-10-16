import { sendEmail } from '@/lib/send-email'
import { betterAuth } from 'better-auth'
import { APIError } from 'better-auth/api'
import { pool } from '@/lib/db'
import { isUserBlocked, SUSPENDED_MESSAGE } from '@/lib/user-block'

export const auth = betterAuth({
  database: pool,
  

baseURL:
  process.env.VERCEL_ENV === 'preview' &&
  process.env.VERCEL_GIT_COMMIT_REF === 'feature-order-status-emails' &&
  process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.BETTER_AUTH_URL ??
      (process.env.VERCEL_ENV === 'preview' &&
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.VERCEL_PROJECT_PRODUCTION_URL
          ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
          : process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : process.env.V0_RUNTIME_URL),

 
emailAndPassword: {
  enabled: true,
  autoSignIn: true,
  requireEmailVerification: true,
},
emailVerification: {
  sendOnSignUp: true,
  sendOnSignIn: true,
  autoSignInAfterVerification: true,
  sendVerificationEmail: async ({ user, url }) => {
  const verificationUrl = new URL(url)
  verificationUrl.searchParams.set(
    'callbackURL',
    '/verification-success'
  )

  await sendEmail({
      to: user.email,
      subject: 'Verify Your BUNNY TICKET Account',
      text: [
        `Hello ${user.name || 'there'}!`,
        '',
        'Thank you for registering with BUNNY TICKET.',
        '',
        'Please verify your email address using the link below:',
        '',
        verificationUrl.toString(),
        '',
        'If you did not create this account, you can ignore this email.',
        '',
        'Thank you for choosing BUNNY TICKET!',
      ].join('\n'),
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
