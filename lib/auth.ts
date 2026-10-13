import { betterAuth } from 'better-auth'
import { APIError } from 'better-auth/api'
import { pool } from '@/lib/db'
import { isUserBlocked, SUSPENDED_MESSAGE } from '@/lib/user-block'

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
  autoSignIn: false,
  requireEmailVerification: true,
  sendResetPassword: async ({ user, url }) => {
    const { sendEmail } = await import("@/lib/email");

    await sendEmail({
      to: user.email,
      subject: "Reset Your BUNNY TICKET Password",
      html: `
        <h2>Password Reset</h2>
        <p>We received a request to reset your BUNNY TICKET password.</p>
        <p><a href="${url}">Reset Password</a></p>
        <p>If you didn't request this, you can ignore this email.</p>
      `,
    });
  },
},
emailVerification: {
  sendOnSignUp: true,
  autoSignInAfterVerification: true,
  sendVerificationEmail: async ({ user, url }) => {
    const { sendEmail } = await import("@/lib/email");

    await sendEmail({
      to: user.email,
      subject: "Verify Your BUNNY TICKET Email",
      html: `
        <h2>Welcome to BUNNY TICKET!</h2>
        <p>Please verify your email address to activate your account.</p>
        <p><a href="${url}">Verify Email Address</a></p>
        <p>If you didn't create this account, ignore this email.</p>
      `,
    });
  },
},

  socialProviders: {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
