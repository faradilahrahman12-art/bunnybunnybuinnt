
import Link from 'next/link'

export const metadata = {
  robots: { index: false, follow: false },
}

export default function VerificationSuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-9 w-9 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4"
            />
            <circle cx="12" cy="12" r="10" />
          </svg>
        </div>

        <h1 className="mb-3 text-2xl font-bold">
          Account Verified Successfully!
        </h1>

        <p className="mb-6 text-sm text-muted-foreground">
          Your email address has been successfully verified.
          Welcome to BUNNY TICKET!
        </p>

        <Link
          href="/orders"
          className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground"
        >
          Continue to Dashboard
        </Link>
      </div>
    </main>
  )
}
