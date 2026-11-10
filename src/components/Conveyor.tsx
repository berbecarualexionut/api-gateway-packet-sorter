import { useRef } from 'react'
import { playSfx } from '../audio/sfx'
import type { Dest, Packet } from '../game/types'
import { PacketCard } from './PacketCard'

interface Props {
  queue: Packet[]
  center?: { id: number; text: string } | null
  onRoute: (d: Dest) => void
  onHover: (d: Dest | null) => void
}

/** Generous hit-testing: pointer inside an inflated zones column → nearest zone. */
function zoneAt(x: number, y: number): Dest | null {
  const col = document.querySelector('[data-zones]')?.getBoundingClientRect()
  if (!col) return null
  const pad = 70
  if (x < col.left - pad || x > col.right + pad || y < col.top - pad || y > col.bottom + pad) return null
  let best: Dest | null = null
  let bd = Infinity
  document.querySelectorAll<HTMLElement>('[data-zone]').forEach((el) => {
    const r = el.getBoundingClientRect()
    const d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2))
    if (d < bd) { bd = d; best = el.dataset.zone as Dest }
  })
  return best
}

interface Sample { t: number; x: number; y: number }

function ActiveCard({ packet, onRoute, onHover }: { packet: Packet; onRoute: Props['onRoute']; onHover: Props['onHover'] }) {
  const el = useRef<HTMLDivElement>(null)
  const drag = useRef<{ sx: number; sy: number; samples: Sample[]; id: number } | null>(null)
  const hovered = useRef<Dest | null>(null)

  const setHover = (d: Dest | null) => {
    if (hovered.current !== d) { hovered.current = d; onHover(d) }
  }
  const springBack = () => {
    const n = el.current
    if (!n) return
    n.style.transition = 'transform .28s cubic-bezier(.2,1.5,.4,1)'
    n.style.transform = ''
    n.classList.remove('dragging')
  }

  const down = (e: React.PointerEvent) => {
    if (drag.current || !el.current) return
    el.current.setPointerCapture(e.pointerId)
    el.current.style.transition = 'none'
    el.current.classList.add('dragging')
    drag.current = { sx: e.clientX, sy: e.clientY, id: e.pointerId, samples: [{ t: performance.now(), x: e.clientX, y: e.clientY }] }
    playSfx('click')
  }
  const move = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId || !el.current) return
    const dx = e.clientX - d.sx
    const dy = e.clientY - d.sy
    el.current.style.transform = `translate3d(${dx}px, ${dy}px, 0) rotate(${Math.max(-12, Math.min(12, dx * 0.03))}deg) scale(.94)`
    const now = performance.now()
    d.samples.push({ t: now, x: e.clientX, y: e.clientY })
    while (d.samples.length > 2 && now - d.samples[0].t > 140) d.samples.shift()
    setHover(zoneAt(e.clientX, e.clientY))
  }
  const up = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    drag.current = null
    const zone = zoneAt(e.clientX, e.clientY)
    setHover(null)
    if (zone) { playSfx('whoosh'); onRoute(zone); return }
    // flick detection: speed over the last ~100ms
    const first = d.samples[0]
    const last = d.samples[d.samples.length - 1]
    const dt = Math.max(1, last.t - first.t)
    const vx = (last.x - first.x) / dt
    const vy = (last.y - first.y) / dt
    const speed = Math.hypot(vx, vy)
    const dist = Math.hypot(e.clientX - d.sx, e.clientY - d.sy)
    if (speed > 0.7 && dist > 40) {
      // up/right → Production, down/left → Quarantine
      const dest: Dest = Math.abs(vy) > 0.35 * Math.abs(vx) ? (vy < 0 ? 'prod' : 'quar') : vx > 0 ? 'prod' : 'quar'
      playSfx('whoosh')
      onRoute(dest)
      return
    }
    springBack()
  }
  const cancel = (e: React.PointerEvent) => {
    if (drag.current?.id !== e.pointerId) return
    drag.current = null
    setHover(null)
    springBack()
  }

  return (
    <div className="drift" style={{ animationDuration: `${packet.timeoutMs}ms` }}>
      <div ref={el} className="packet-wrap" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel}>
        <PacketCard p={packet} />
      </div>
    </div>
  )
}

export function Conveyor({ queue, onRoute, onHover }: Props) {
  const active = queue[0]
  const waiting = queue.slice(1, 4).reverse()
  return (
    <section className="panel conveyor">
      <div className="panel-title"><span className="dot" />INSPECTION CONVEYOR · {queue.length} IN QUEUE</div>
      <div className="conv-body">
        <div className="pipe-bg" />
        <div className="queue">
          {waiting.map((p) => (
            <div key={p.id} className="mini"><span>{p.method} {p.path}</span><span>{p.geo}</span></div>
          ))}
        </div>
        <div className="stage">
          {active ? <ActiveCard key={active.id} packet={active} onRoute={onRoute} onHover={onHover} /> : <div className="waiting">AWAITING TRAFFIC…</div>}
        </div>
        <div className="timeout-line">
          <div className="label"><span>▼ SLA TIMEOUT LINE (504)</span><span>DRAG · FLICK · OR TAP A ZONE</span></div>
          <div className="timeout-bar">{active && <i key={active.id} style={{ animationDuration: `${active.timeoutMs}ms` }} />}</div>
        </div>
      </div>
    </section>
  )
}
