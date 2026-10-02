import { Bell, MessageSquare, Package, Ticket } from 'lucide-react'

const BENEFITS = [
  { icon: Package, label: 'Track Orders' },
  { icon: Bell, label: 'View Order Updates' },
  { icon: Ticket, label: 'Access Ticket Details' },
  { icon: MessageSquare, label: 'Leave Reviews' },
]

export function AccountBenefits() {
  return (
    <ul className="grid grid-cols-2 gap-2" aria-label="Your dashboard includes">
      {BENEFITS.map(({ icon: Icon, label }) => (
        <li
          key={label}
          className="flex items-center gap-2 rounded-xl bg-primary/5 px-3 py-2.5 text-xs font-medium text-foreground"
        >
          <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
          {label}
        </li>
      ))}
    </ul>
  )
}
