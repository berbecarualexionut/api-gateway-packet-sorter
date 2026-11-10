import { MALWARE_NOTE } from '../game/rules'
import type { Rule } from '../game/types'

export function RulesBoard({ rules, flashId }: { rules: Rule[]; flashId: number }) {
  return (
    <section key={`f${flashId}`} className={`panel rules ${flashId ? 'flash' : ''}`}>
      {flashId > 0 && <div className="policy-tag">Policy update</div>}
      <div className="panel-title"><span className="dot" />Active WAF rules</div>
      <div className="rules-list">
        <table className="s-table">
          <thead><tr><th className="pos">#</th><th>Rule</th><th className="st">Status</th></tr></thead>
          <tbody>
            {rules.map((r, i) => (
              <tr key={r.id} className={i === rules.length - 1 && i >= 2 ? 'new' : ''}>
                <td className="pos">{i + 1}</td>
                <td><div className="nm">{r.title}</div><div className="co">{r.detail}</div></td>
                <td className="st">{i >= 2 ? 'New' : 'Active'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="rule-always">{MALWARE_NOTE}</div>
    </section>
  )
}
