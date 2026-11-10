import type { LeaderboardEntry } from '../lib/storage'

interface Props { entries: LeaderboardEntry[]; limit?: number; highlightId?: string; title?: string }

export function Leaderboard({ entries, limit = 5, highlightId, title = 'TOP DEFENDERS · LIVE' }: Props) {
  const top = entries.slice(0, limit)
  const meIdx = highlightId ? entries.findIndex((e) => e.id === highlightId) : -1
  const meOutside = meIdx >= limit
  const row = (e: LeaderboardEntry, i: number) => (
    <div key={e.id} className={`lb-row ${e.id === highlightId ? 'me' : ''}`}>
      <span className="pos">#{i + 1}</span>
      <div style={{ minWidth: 0 }}>
        <div className="nm">{e.name}</div>
        {!e.initialsOnly && e.company && <div className="co">{e.company}</div>}
        {e.initialsOnly && <div className="co">{e.rank}</div>}
      </div>
      <span className="sc">{e.score.toLocaleString()}</span>
    </div>
  )
  return (
    <div className="lb">
      <div className="lb-title">🏆 {title}</div>
      {top.length === 0 && <div className="lb-empty">NO SCORES YET — BE THE FIRST!</div>}
      {top.map(row)}
      {meOutside && (<><div className="lb-gap">···</div>{row(entries[meIdx], meIdx)}</>)}
    </div>
  )
}
