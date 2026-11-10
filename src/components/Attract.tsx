import { useEffect, useRef } from 'react'
import { playSfx, unlockAudio } from '../audio/sfx'
import type { LeaderboardEntry } from '../lib/storage'
import { Leaderboard } from './Leaderboard'
import { Logo } from './Logo'

function MeshCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current!
    const ctx = cv.getContext('2d')!
    let w = 0, h = 0, raf = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => {
      w = cv.clientWidth; h = cv.clientHeight
      cv.width = w * dpr; cv.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)
    const nodes = Array.from({ length: 34 }, () => ({
      x: Math.random(), y: Math.random(), vx: (Math.random() - 0.5) * 0.00008, vy: (Math.random() - 0.5) * 0.00008,
    }))
    type Pk = { a: number; b: number; t: number; s: number; bad: boolean }
    const pk: Pk[] = []
    let last = performance.now()
    let spawn = 0
    const draw = (now: number) => {
      const dt = Math.min(50, now - last); last = now
      ctx.clearRect(0, 0, w, h)
      for (const n of nodes) {
        n.x += n.vx * dt; n.y += n.vy * dt
        if (n.x < 0 || n.x > 1) n.vx *= -1
        if (n.y < 0 || n.y > 1) n.vy *= -1
      }
      const links: [number, number][] = []
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
        const d = Math.hypot((nodes[i].x - nodes[j].x) * w, (nodes[i].y - nodes[j].y) * h)
        if (d < Math.min(w, h) * 0.26) {
          links.push([i, j])
          ctx.strokeStyle = `rgba(0,195,205,${0.22 * (1 - d / (Math.min(w, h) * 0.26))})`
          ctx.lineWidth = 1
          ctx.beginPath(); ctx.moveTo(nodes[i].x * w, nodes[i].y * h); ctx.lineTo(nodes[j].x * w, nodes[j].y * h); ctx.stroke()
        }
      }
      for (const n of nodes) {
        ctx.fillStyle = 'rgba(0,240,255,.55)'
        ctx.beginPath(); ctx.arc(n.x * w, n.y * h, 2.5, 0, 7); ctx.fill()
      }
      spawn -= dt
      if (spawn <= 0 && links.length) {
        spawn = 140
        const [a, b] = links[Math.floor(Math.random() * links.length)]
        pk.push({ a, b, t: 0, s: 0.0004 + Math.random() * 0.0006, bad: Math.random() < 0.35 })
      }
      for (let i = pk.length - 1; i >= 0; i--) {
        const p = pk[i]
        p.t += p.s * dt
        if (p.t >= 1) { pk.splice(i, 1); continue }
        const x = (nodes[p.a].x + (nodes[p.b].x - nodes[p.a].x) * p.t) * w
        const y = (nodes[p.a].y + (nodes[p.b].y - nodes[p.a].y) * p.t) * h
        ctx.fillStyle = p.bad ? '#ef4444' : '#10b981'
        ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 14
        ctx.fillRect(x - 5, y - 3.5, 10, 7)
        ctx.shadowBlur = 0
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={ref} className="attract-canvas" />
}

interface Props { company: string; entries: LeaderboardEntry[]; onStart: () => void; onLogoTap: () => void }

export function Attract({ company, entries, onStart, onLogoTap }: Props) {
  return (
    <div className="screen">
      <MeshCanvas />
      <div style={{ position: 'relative', zIndex: 2, padding: '1rem 2rem 0', display: 'flex' }}><Logo name={company} onTap={onLogoTap} /></div>
      <div className="attract">
        <div className="attract-main">
          <div className="eyebrow">// CLOUD SECOPS · LIVE TRAFFIC</div>
          <h1 className="title">API Gateway:<br /><span>Packet Sorter</span></h1>
          <button className="cta" onClick={() => { unlockAudio(); playSfx('click'); onStart() }}>Tap to defend the cloud</button>
          <div className="how">
            <div className="how-step"><div className="ic">🔍</div><b>1 · INSPECT</b><span>Read the packet header & payload</span></div>
            <div className="how-step"><div className="ic">📋</div><b>2 · CHECK RULES</b><span>Rules change mid-game!</span></div>
            <div className="how-step"><div className="ic">👉</div><b>3 · SWIPE</b><span>Right = Prod · Left = Quarantine</span></div>
          </div>
        </div>
        <Leaderboard entries={entries} limit={5} />
      </div>
    </div>
  )
}
