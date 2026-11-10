import type { Dest, Floater } from '../game/types'

interface Props {
  hover: Dest | null
  pop: { dest: Dest; n: number } | null
  floaters: Floater[]
  onTap: (d: Dest) => void
}

export function Zones({ hover, pop, floaters, onTap }: Props) {
  const zone = (d: Dest, cls: string, ico: string, ttl: string, code: string, sub: string) => (
    <button
      key={d + (pop && pop.dest === d ? pop.n : '')}
      data-zone={d}
      className={`zone ${cls} ${hover === d ? 'hover' : ''} ${pop && pop.dest === d ? 'pop' : ''}`}
      onClick={() => onTap(d)}
    >
      {floaters.filter((f) => f.dest === d).map((f) => <span key={f.id} className={`floater ${f.tone}`}>{f.text}</span>)}
      <span className="ico">{ico}</span>
      <span className="ttl">{ttl}</span>
      <span className="code">{code}</span>
      <span className="sub">{sub}</span>
    </button>
  )
  return (
    <section className="zones" data-zones>
      {zone('prod', 'prod', '☁️', 'PRODUCTION CLUSTER', '200 OK', 'Route VALID packets here')}
      {zone('quar', 'quar', '🛡️', 'QUARANTINE SANDBOX', '403 DROP', 'Route MALICIOUS packets here')}
    </section>
  )
}
