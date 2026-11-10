import { MALWARE_NOTE } from '../game/rules'
import type { Rule } from '../game/types'

export function RulesBoard({ rules, flashId }: { rules: Rule[]; flashId: number }) {
  return (
    <section key={`f${flashId}`} className={`panel rules ${flashId ? 'flash' : ''}`}>
      {flashId > 0 && <div className="policy-tag">⚠ POLICY UPDATE</div>}
      <div className="panel-title"><span className="dot" />ACTIVE WAF RULESBOARD</div>
      <div className="rules-list">
        {rules.map((r, i) => (
          <div key={r.id} className={`rule ${i === rules.length - 1 && i >= 2 ? 'new' : ''}`}>
            <div className="n"><span>RULE {i + 1}</span><span>{i >= 2 ? 'NEW' : 'ACTIVE'}</span></div>
            <div className="t">{r.title}</div>
            <div className="d">{r.detail}</div>
          </div>
        ))}
      </div>
      <div className="rule-always">🛡 {MALWARE_NOTE}</div>
    </section>
  )
}
