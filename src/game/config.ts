export const GAME_SECONDS = 60
export const BREACH_PENALTY = 25
export const FALSE_POSITIVE_PENALTY = 15
export const TIMEOUT_PENALTY = 15
export const BASE_POINTS = 100
export const MAX_QUEUE = 4

/** Spawn interval (ms) per phase. Phase 2 is 30% faster than phase 1. */
export const SPAWN_INTERVAL: Record<1 | 2 | 3, number> = { 1: 2600, 2: 2600 / 1.3, 3: 1500 }
export const PACKET_TIMEOUT: Record<1 | 2 | 3, number> = { 1: 6000, 2: 6000, 3: 5500 }

export const VALID_RATIO = 0.45

export interface RankDef {
  min: number
  name: string
  blurb: string
}

export const RANKS: RankDef[] = [
  { min: 0, name: 'Unpatched Intern', blurb: 'Your firewall is basically a screen door.' },
  { min: 1500, name: 'SOC Analyst', blurb: 'Solid triage instincts. Coffee is working.' },
  { min: 4000, name: 'Principal Cloud Architect', blurb: 'Zero-trust is in your blood.' },
  { min: 7000, name: 'Zero-Trust God', blurb: 'Nothing gets past you. Nothing.' },
]

export function rankFor(score: number, accuracy: number): RankDef {
  let r = RANKS[0]
  for (const rank of RANKS) if (score >= rank.min) r = rank
  // top rank also requires near-perfect accuracy
  if (r === RANKS[RANKS.length - 1] && accuracy < 90) r = RANKS[RANKS.length - 2]
  return r
}

export interface Settings {
  companyName: string
  pitch: string
  strictMode: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  companyName: 'STACKIT',
  pitch:
    'Manual triage doesn’t scale. Ask our team how [Company Name] automates API security with zero latency.',
  strictMode: true,
}
