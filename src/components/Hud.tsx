import { useEffect, useState } from 'react'
import type { GameState } from '../game/types'
import { Logo } from './Logo'

interface Props {
  state: GameState
  company: string
  muted: boolean
  onLogoTap: () => void
  onToggleMute: () => void
  onAbort: () => void
}

const PHASES = ['', 'WARMUP', 'TRAFFIC SPIKE', 'DDoS SURGE']

export function Hud({ state, company, muted, onLogoTap, onToggleMute, onAbort }: Props) {
  const [confirm, setConfirm] = useState(false)
  useEffect(() => {
    if (!confirm) return
    const t = window.setTimeout(() => setConfirm(false), 2200)
    return () => window.clearTimeout(t)
  }, [confirm])

  const h = Math.round(state.health)
  const col = h > 60 ? 'var(--prod)' : h > 30 ? 'var(--amber)' : 'var(--quar)'
  const pips = state.multiplier === 4 ? 3 : state.streak % 3
  const low = state.status === 'playing' && state.timeLeft <= 10

  return (
    <header className="hud">
      <div className="hud-left">
        <Logo name={company} onTap={onLogoTap} />
        <div className="sla">
          <div className="sla-label"><span>SLA UPTIME</span><b>{h}%</b></div>
          <div className="sla-bar"><div className="sla-fill" style={{ width: `${h}%`, background: col, color: col }} /></div>
        </div>
        <div className={`streak ${state.multiplier > 1 ? 'hot' : ''}`}>
          <div className="mult" style={{ color: state.multiplier > 1 ? 'var(--orange)' : 'var(--ice)' }}>{state.multiplier}x</div>
          <div className="pips">{[0, 1, 2].map((i) => <span key={i} className={`pip ${i < pips ? 'on' : ''}`} />)}</div>
        </div>
      </div>

      <div className={`timer ${low ? 'low' : ''}`}>
        <div className="t">{state.timeLeft.toFixed(1)}s</div>
        <div className="phase">PHASE {state.phase} · {PHASES[state.phase]}</div>
      </div>

      <div className="hud-right">
        <div className="score">
          <div className="lbl">SCORE</div>
          <div className="val">{state.score.toLocaleString()}</div>
        </div>
        <button className="icon-btn" onClick={onToggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>{muted ? '🔇' : '🔊'}</button>
        <button
          className={`abort-btn ${confirm ? 'confirm' : ''}`}
          onClick={() => (confirm ? onAbort() : setConfirm(true))}
        >
          {confirm ? 'TAP AGAIN' : 'ABORT'}
        </button>
      </div>
    </header>
  )
}
