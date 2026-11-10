export type Dest = 'prod' | 'quar'

export type AuthKind = 'VALID' | 'EXPIRED' | 'NONE' | 'LEAKED'
export type PayloadKind = 'clean' | 'sqli' | 'xss' | 'path' | 'jndi'

export type ViolationKind =
  | 'AUTH'
  | 'SQLI'
  | 'XSS'
  | 'PATH'
  | 'JNDI'
  | 'DELETE'
  | 'SIZE'
  | 'GEO'
  | 'RATE'

export interface Violation {
  kind: ViolationKind
  /** Short human label, e.g. "SQL Injection" */
  label: string
}

export type RuleId = 'AUTH' | 'INJECTION' | 'NO_DELETE' | 'MAX_SIZE' | 'GEO' | 'RATE_LOGIN'

export interface Rule {
  id: RuleId
  title: string
  detail: string
  /** only for GEO rule */
  geo?: string
}

export interface Packet {
  id: number
  method: string
  path: string
  ip: string
  geo: string
  auth: AuthKind
  authLabel: string
  sizeKB: number
  payload: string
  payloadKind: PayloadKind
  /** Why this packet must be blocked under the rules active at last evaluation (null = valid) */
  violation: Violation | null
  /** "Zero-day spoofed" packet: looks clean but violates one subtle rule */
  decoy: boolean
  activatedAt: number
  timeoutMs: number
}

export interface Toast {
  id: number
  text: string
  tone: 'bad' | 'warn' | 'good'
  expires: number
}

export interface Floater {
  id: number
  text: string
  tone: 'good' | 'bad'
  dest: Dest | 'center'
  expires: number
}

export interface Stats {
  inspected: number
  correct: number
  falsePositives: number
  timeouts: number
  breaches: Partial<Record<ViolationKind, number>>
  decoysMissed: number
  decoysCaught: number
  bestStreak: number
}

export type Phase = 1 | 2 | 3
export type Status = 'idle' | 'countdown' | 'playing' | 'over'

export interface GameState {
  status: Status
  countdown: number
  timeLeft: number
  phase: Phase
  score: number
  health: number
  streak: number
  multiplier: 1 | 2 | 4
  rules: Rule[]
  queue: Packet[]
  stats: Stats
  banner: { id: number; title: string; sub: string; tone: 'warn' | 'bad' } | null
  ruleFlashId: number
  shakeId: number
  toasts: Toast[]
  floaters: Floater[]
  endReason: 'time' | 'sla' | 'abort' | null
}
