import type { ReactNode } from 'react'

/* Thin-line, single-colour icons drawn on a 24px grid and shown at 96px in brand teal —
   the same treatment as the icon row on stackit.com (1px strokes, square ends, no tile behind). */
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg className="step-icon" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="0.7" strokeLinecap="square" strokeLinejoin="miter" aria-hidden="true">
      {children}
    </svg>
  )
}

export const InspectIcon = () => (
  <Icon>
    <path d="M13.5 2.5H4v19h8" />
    <path d="M13.5 2.5 17 6v3" />
    <path d="M13.5 2.5V6H17" />
    <path d="M6.5 7h5M6.5 10h3.5M6.5 13h2.5" />
    <circle cx="15.5" cy="14.5" r="4" />
    <path d="m18.4 17.4 3.6 3.6" />
  </Icon>
)

export const RulesIcon = () => (
  <Icon>
    <path d="M15.5 2.5h-12v19h16V6.5l-4-4Z" />
    <path d="M15.5 2.5v4h4" />
    <path d="m6 8 1 1 2-2M6 12.5l1 1 2-2M6 17l1 1 2-2" />
    <path d="M11.5 8h5M11.5 12.5h5M11.5 17h5" />
  </Icon>
)

export const SwipeIcon = () => (
  <Icon>
    <rect x="6" y="5" width="12" height="14" />
    <path d="M9 9h6M9 12h6M9 15h3.5" />
    <path d="M3.5 12H1.5m0 0 2-2m-2 2 2 2" />
    <path d="M20.5 12h2m0 0-2-2m2 2-2 2" />
  </Icon>
)
