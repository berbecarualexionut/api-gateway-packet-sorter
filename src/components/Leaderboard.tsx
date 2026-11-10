import type { LeaderboardEntry } from '../lib/storage'

interface Props { entries: LeaderboardEntry[]; limit?: number; highlightId?: string; title?: string }

export function Leaderboard({ entries, limit = 5, highlightId, title = 'Top defenders · live' }: Props) {
  const top = entries.slice(0, limit)
  const meIdx = highlightId ? entries.findIndex((e) => e.id === highlightId) : -1
  const meOutside = meIdx >= limit
  const row = (e: LeaderboardEntry, i: number) => (
    <tr key={e.id} className={e.id === highlightId ? 'me' : ''}>
      <td className="pos">{i + 1}</td>
      <td>
        <div className="nm">{e.name}</div>
        <div className="co">{e.initialsOnly ? e.rank : e.company}</div>
      </td>
      <td className="sc">{e.score.toLocaleString()}</td>
    </tr>
  )
  return (
    <div className="lb">
      <h3 className="table-title">{title}</h3>
      <table className="s-table">
        <thead>
          <tr><th className="pos">#</th><th>Defender</th><th className="sc">Score</th></tr>
        </thead>
        <tbody>
          {top.length === 0 && <tr><td colSpan={3} className="lb-empty">No scores yet — be the first!</td></tr>}
          {top.map(row)}
          {meOutside && (<><tr><td colSpan={3} className="lb-gap">···</td></tr>{row(entries[meIdx], meIdx)}</>)}
        </tbody>
      </table>
    </div>
  )
}
