export type TermSection = { heading: string; body: string[] }

export type PaymentMethodContent = { value: string; hint: string }

export type StepText = { title: string; subtitle: string }

// NOL Korea help-to-buy events show a two-service picker (Manual vs Premium/Bots),
// each with its own admin-editable terms + agreement label.
export type NolServiceContent = {
  value: 'manual' | 'premium_bots'
  title: string
  subtitle: string
  agreeLabel: string
  sections: { heading: string; body: string }[]
}

export type SubmitContent = {
  steps: {
    terms: StepText
    ticket: StepText
    account: StepText
    payment: StepText
    review: StepText
  }
  terms: {
    sections: TermSection[]
    scrollHint: string
    agreeLabel: string
    finalWarningTitle: string
    finalWarningBody: string
  }
  account: {
    platformBanner: string
    confirmLabel: string
    backupInfo: string
    membershipTitle: string
    membershipHint: string
  }
  payment: {
    amountDueLabel: string
    infoQuoted: string
    infoFixed: string
    methods: PaymentMethodContent[]
  }
  review: {
    footer: string
  }
  nolServices: NolServiceContent[]
}

export const DEFAULT_SUBMIT_CONTENT: SubmitContent = {
  steps: {
    terms: { title: 'Terms & Agreement', subtitle: 'Read and agree to proceed' },
    ticket: { title: 'Ticket Selection', subtitle: 'Choose your tier and concert date' },
    account: { title: 'Account Credentials', subtitle: 'Login details for queuing' },
    payment: { title: 'Payment', subtitle: 'Choose your payment method' },
    review: { title: 'Review & Submit', subtitle: 'Double-check everything before you submit' },
  },
  terms: {
    sections: [
      {
        heading: 'Terms & Conditions for Ticket Purchase Assistance Clients',
        body: [
          'By submitting an order, you agree to the following Terms & Conditions for our Ticket Purchase Assistance Service. Please read every section carefully before agreeing.',
        ],
      },
      {
        heading: '1. Service Description',
        body: [
          'Under this service, we secure and purchase the ticket(s) on your behalf. To proceed, you are required to:',
          '• Provide accurate and complete information for every field we request.',
          '• Settle the required payment in full before the ticket sale date.',
          '• Ensure that all account and personal details you submit are correct and valid.',
        ],
      },
      {
        heading: '2. Payment',
        body: [
          'All service fees and ticket payments must be settled before the official on-sale date. We only charge the service fee when we successfully secure your tickets — no success, no charge. Prices shown are all-in and already include the ticket price plus our service fee.',
        ],
      },
      {
        heading: '3. Refunds',
        body: [
          'If we are unable to secure your tickets, any eligible payments will be refunded according to the refund policy communicated to you at the time of your order. Refunds are not issued for orders that fail due to incorrect or incomplete information you provided.',
        ],
      },
      {
        heading: '4. Account Information',
        body: [
          'You are responsible for providing valid ticketing account details. Incorrect or incomplete credentials may prevent us from completing your order, and no refund will be given for failures caused by wrong credentials. We queue using the account you provide; a backup account may be drawn from our own pool where allowed.',
        ],
      },
      {
        heading: '5. Seating & Assignment',
        body: [
          'Sections and seats are assigned randomly by the ticketing platform and cannot be guaranteed. By continuing you acknowledge that specific sections, rows, or seat numbers are not promised.',
        ],
      },
      {
        heading: '6. Contact',
        body: [
          'If you have any questions about these terms, please reach us through our official channels before submitting your order. Submitting an order confirms that you have read, understood, and agreed to all of the above.',
        ],
      },
    ],
    scrollHint: 'Scroll through all the terms below to unlock the agreement checkbox.',
    agreeLabel: 'I have read and agree to ALL Terms and Conditions above.',
    finalWarningTitle: 'Do NOT submit if you are still undecided.',
    finalWarningBody:
      'All orders are FINAL after the edit window. Make sure your dates, tiers, and budget are finalized before proceeding.',
  },
  account: {
    platformBanner: 'Platform: {platform} — enter the exact login we should use',
    confirmLabel: 'The credentials below are 100% correct — NO REFUND for wrong credentials',
    backupInfo:
      "We'll queue on your account. A backup account may be provided from our pool of accounts.",
    membershipTitle: 'Weverse / Fan Membership (optional)',
    membershipHint: 'If you have a fan membership, enter it here. You can add a backup too.',
  },
  payment: {
    amountDueLabel: 'Amount Due',
    infoQuoted:
      "We'll message you the exact amount and payment details after you submit. No charge unless we secure your tickets.",
    infoFixed:
      'Payment must be settled before the on-sale date. We only charge the service fee once we successfully secure your tickets.',
    methods: [
      { value: 'GCash', hint: 'Send to our official GCash — details shown after ordering.' },
      { value: 'Maya', hint: 'Send to our official Maya — details shown after ordering.' },
      { value: 'Bank Transfer', hint: 'Bank name and account number shown after ordering.' },
    ],
  },
  review: {
    footer:
      'By submitting, you confirm all details are correct and agree to our Terms & Conditions.',
  },
  nolServices: [
    {
      value: 'manual',
      title: 'Manual Service',
      subtitle: 'Our team queues and books by hand on NOL',
      agreeLabel: 'I have read and agree to the Manual Service terms above.',
      sections: [
        {
          heading: 'How it works',
          body: 'Our team manually queues and books your tickets on NOL (Interpark) using the account and details you provide. We aim to secure the best available seats based on your selected priority.',
        },
        {
          heading: 'Success & availability',
          body: 'Manual booking depends on real-time availability and your queue position. We cannot guarantee tickets for high-demand or sold-out events.',
        },
        {
          heading: 'Your responsibilities',
          body: 'You must provide accurate account credentials and holder details, and keep the account free of active login sessions or verification blocks during the booking window.',
        },
        {
          heading: 'Refunds',
          body: 'If we are unable to secure any tickets, your service fee is refunded per our refund policy. Successfully booked tickets are non-refundable.',
        },
      ],
    },
    {
      value: 'premium_bots',
      title: 'Premium Service (Bots)',
      subtitle: 'Automated high-speed booking for high-demand on-sales',
      agreeLabel: 'I have read and agree to the Premium Service (Bots) terms above.',
      sections: [
        {
          heading: 'How it works',
          body: 'Our premium service uses automated high-speed tools (bots) to maximise your chances on extremely high-demand on-sales. This option carries a higher service fee.',
        },
        {
          heading: 'Higher success rate',
          body: 'Bots significantly increase entry speed and success probability, but results still depend on platform stock and anti-bot measures.',
        },
        {
          heading: 'Risk acknowledgement',
          body: 'Automated access may be restricted or flagged by the platform. You accept that, in rare cases, attempts may fail or the account may be temporarily limited by the platform.',
        },
        {
          heading: 'Refunds',
          body: 'If no tickets are secured, the service fee is refunded per our refund policy. Successfully booked tickets are non-refundable.',
        },
      ],
    },
  ],
}

// Deep-merge a partial (possibly stale) stored value onto the defaults so new
// fields always have a value even if the saved blob predates them.
export function mergeSubmitContent(partial: unknown): SubmitContent {
  const p = (partial ?? {}) as Partial<SubmitContent>
  const d = DEFAULT_SUBMIT_CONTENT
  return {
    steps: {
      terms: { ...d.steps.terms, ...p.steps?.terms },
      ticket: { ...d.steps.ticket, ...p.steps?.ticket },
      account: { ...d.steps.account, ...p.steps?.account },
      payment: { ...d.steps.payment, ...p.steps?.payment },
      review: { ...d.steps.review, ...p.steps?.review },
    },
    terms: {
      sections:
        Array.isArray(p.terms?.sections) && p.terms.sections.length > 0
          ? p.terms.sections.map((s) => ({
              heading: String(s?.heading ?? ''),
              body: Array.isArray(s?.body) ? s.body.map((l) => String(l)) : [],
            }))
          : d.terms.sections,
      scrollHint: p.terms?.scrollHint ?? d.terms.scrollHint,
      agreeLabel: p.terms?.agreeLabel ?? d.terms.agreeLabel,
      finalWarningTitle: p.terms?.finalWarningTitle ?? d.terms.finalWarningTitle,
      finalWarningBody: p.terms?.finalWarningBody ?? d.terms.finalWarningBody,
    },
    account: { ...d.account, ...p.account },
    payment: {
      amountDueLabel: p.payment?.amountDueLabel ?? d.payment.amountDueLabel,
      infoQuoted: p.payment?.infoQuoted ?? d.payment.infoQuoted,
      infoFixed: p.payment?.infoFixed ?? d.payment.infoFixed,
      methods:
        Array.isArray(p.payment?.methods) && p.payment.methods.length > 0
          ? p.payment.methods
              .map((m) => ({ value: String(m?.value ?? ''), hint: String(m?.hint ?? '') }))
              .filter((m) => m.value.length > 0)
          : d.payment.methods,
    },
    review: { ...d.review, ...p.review },
    nolServices: d.nolServices.map((def) => {
      const saved = Array.isArray(p.nolServices)
        ? p.nolServices.find((s) => s?.value === def.value)
        : undefined
      if (!saved) return def
      return {
        value: def.value,
        title: saved.title ?? def.title,
        subtitle: saved.subtitle ?? def.subtitle,
        agreeLabel: saved.agreeLabel ?? def.agreeLabel,
        sections:
          Array.isArray(saved.sections) && saved.sections.length > 0
            ? saved.sections.map((s) => ({
                heading: String(s?.heading ?? ''),
                body: String(s?.body ?? ''),
              }))
            : def.sections,
      }
    }),
  }
}

export const SUBMIT_CONTENT_KEY = 'submit_content'
