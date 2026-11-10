import { fmtSize } from '../game/generator'
import type { Packet } from '../game/types'

export function PacketCard({ p }: { p: Packet }) {
  return (
    <div className="packet">
      <div className="packet-head"><span>HTTP/2 REQUEST MANIFEST</span><span>#{String(p.id).padStart(4, '0')}</span></div>
      <div className="packet-body">
        <div className="field"><span className="k">ENDPOINT</span><span className="v"><span className={`method ${p.method}`}>{p.method}</span>{p.path}</span></div>
        <div className="field"><span className="k">SOURCE</span><span className="v">{p.ip} ({p.geo})</span></div>
        <div className="field"><span className="k">AUTH</span><span className="v">{p.authLabel}</span></div>
        <div className="field"><span className="k">SIZE</span><span className="v">{fmtSize(p.sizeKB)}</span></div>
        <div className="field"><span className="k">PAYLOAD</span><span className="v payload">{p.payload}</span></div>
      </div>
    </div>
  )
}
