import { DEFAULT_SETTINGS, type Settings } from '../game/config'

const LB_KEY = 'agps.leaderboard.v1'
const SET_KEY = 'agps.settings.v1'

export interface LeaderboardEntry {
  id: string
  name: string
  company: string
  email: string
  score: number
  rank: string
  accuracy: number
  inspected: number
  ts: number
  /** true when only initials were posted (casual mode / skipped) */
  initialsOnly: boolean
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
function write(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)) } catch { /* storage full / blocked */ }
}

export const loadLeaderboard = (): LeaderboardEntry[] =>
  read<LeaderboardEntry[]>(LB_KEY, []).sort((a, b) => b.score - a.score || a.ts - b.ts)

export function addEntry(e: Omit<LeaderboardEntry, 'id' | 'ts'>): LeaderboardEntry {
  const entry: LeaderboardEntry = { ...e, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ts: Date.now() }
  write(LB_KEY, [...loadLeaderboard(), entry])
  return entry
}

export const resetAll = () => write(LB_KEY, [])

export const loadSettings = (): Settings => ({ ...DEFAULT_SETTINGS, ...read<Partial<Settings>>(SET_KEY, {}) })
export const saveSettings = (s: Settings) => write(SET_KEY, s)

const csvCell = (v: string | number | boolean) => `"${String(v).replace(/"/g, '""')}"`

export function toCsv(rows: LeaderboardEntry[]): string {
  const head = ['timestamp', 'name', 'company', 'email', 'score', 'rank', 'accuracy_pct', 'packets_inspected', 'initials_only']
  const lines = rows.map((r) =>
    [new Date(r.ts).toISOString(), r.name, r.company, r.email, r.score, r.rank, r.accuracy, r.inspected, r.initialsOnly]
      .map(csvCell).join(','))
  return [head.join(','), ...lines].join('\n')
}

export function downloadCsv() {
  const blob = new Blob([toCsv(loadLeaderboard())], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `packet-sorter-leads-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
