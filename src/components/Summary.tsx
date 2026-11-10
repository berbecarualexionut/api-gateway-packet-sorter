import { rankFor } from '../game/config'
import { VIOLATION_NAMES } from '../game/rules'
import type { GameState, ViolationKind } from '../game/types'
import type { LeaderboardEntry } from '../lib/storage'
import { Leaderboard } from './Leaderboard'

export function computeResult(s: GameState) {
  const acc = s.stats.inspected ? Math.round((s.stats.correct / s.stats.inspected) * 100) : 0
  return { acc, rank: rankFor(s.score, acc) }
}

function breakdown(s: GameState): string[] {
  const out: string[] = []
  for (const [k, n] of Object.entries(s.stats.breaches) as [ViolationKind, number][]) {
    if (!n) continue
    const [one, many] = VIOLATION_NAMES[k]
    out.push(`You let ${n} ${n === 1 ? one : many} into Production`)
  }
  const fp = s.stats.falsePositives
  if (fp) out.push(`You blocked ${fp} valid customer${fp === 1 ? '' : 's'}`)
  if (s.stats.timeouts) out.push(`${s.stats.timeouts} packet${s.stats.timeouts === 1 ? '' : 's'} hit a 504 Gateway Timeout`)
  if (s.stats.decoysMissed) out.push(`${s.stats.decoysMissed} zero-day spoofed packet${s.stats.decoysMissed === 1 ? '' : 's'} slipped through`)
  return out
}

interface Props {
  state: GameState; pitch: string; company: string; playerName: string
  entries: LeaderboardEntry[]; myId?: string; onDone: () => void; onAgain: () => void
}

export function Summary({ state, pitch, company, playerName, entries, myId, onDone, onAgain }: Props) {
  const { acc, rank } = computeResult(state)
  const issues = breakdown(state)
  const sla = state.endReason === 'sla'
  return (
    <div className="screen">
      <div className="summary">
        <div className="sum-card">
          <div className="eyebrow">{sla ? '// SLA BREACHED — GATEWAY DOWN' : '// DIAGNOSTIC REPORT'}</div>
          <div className="big-score">{state.score.toLocaleString()}</div>
          <div className="rank-name">{rank.name}</div>
          <div style={{ color: 'var(--dim)', marginTop: '.3rem' }}>{rank.blurb}</div>
          <div className="stats3">
            <div className="stat"><b>{acc}%</b><span>ACCURACY</span></div>
            <div className="stat"><b>{state.stats.inspected}</b><span>PACKETS</span></div>
            <div className="stat"><b>{state.stats.bestStreak}</b><span>BEST STREAK</span></div>
          </div>
          <div style={{ marginTop: '1rem' }}><Leaderboard entries={entries} limit={5} highlightId={myId} title={`SAVED · ${playerName}`} /></div>
        </div>
        <div className="sum-card report">
          <h3>WHAT SLIPPED THROUGH</h3>
          {issues.length === 0
            ? <p style={{ fontSize: '1.15rem', margin: 0 }}>✅ Flawless run — zero breaches, zero false positives.</p>
            : <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>{issues.map((t) => <li key={t}>{t}</li>)}</ul>}
          <div className="pitch">{pitch.replace(/\[Company Name\]/gi, company)}</div>
          <div className="btn-row">
            <button className="btn" onClick={onDone}>Done</button>
            <button className="btn primary" onClick={onAgain}>↻ Play again</button>
          </div>
        </div>
      </div>
    </div>
  )
}
