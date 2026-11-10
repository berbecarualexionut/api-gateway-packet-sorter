import { fmtSize } from '../game/generator'
import type { Packet } from '../game/types'

export function PacketCard({ p }: { p: Packet }) {
  return (
    <div className="packet">
      <div className="packet-head"><span>HTTP/2 request manifest</span><span>#{String(p.id).padStart(4, '0')}</span></div>
      <table className="s-table packet-table">
        <tbody>
          <tr><th scope="row">Endpoint</th><td><span className={`method ${p.method}`}>{p.method}</span>{p.path}</td></tr>
          <tr><th scope="row">Source</th><td>{p.ip} ({p.geo})</td></tr>
          <tr><th scope="row">Auth</th><td>{p.authLabel}</td></tr>
          <tr><th scope="row">Size</th><td>{fmtSize(p.sizeKB)}</td></tr>
          <tr><th scope="row">Payload</th><td className="payload">{p.payload}</td></tr>
        </tbody>
      </table>
    </div>
  )
}
