import { useState } from 'react'
import type { Settings } from '../game/config'

export interface Player {
  name: string
  company: string
  email: string
  initialsOnly: boolean
}

interface Props {
  settings: Settings
  initial?: Player | null
  onSubmit: (p: Player) => void
  onCancel: () => void
}

/** Shown before the game starts; the score is saved automatically when the run ends. */
export function LeadModal({ initial, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [tried, setTried] = useState(false)

  const submit = () => {
    setTried(true)
    if (!name.trim()) return
    onSubmit({ name: name.trim(), company: '', email: '', initialsOnly: false })
  }

  return (
    <div className="modal-wrap" style={{ zIndex: 85 }}>
      <div className="modal">
        <h2>Who’s defending the cloud?</h2>
        <p className="sub">Your score is saved to the leaderboard automatically when the game ends.</p>
        <label className="lbl">NAME / NICKNAME</label>
        <input
          className={`input ${tried && !name.trim() ? 'err' : ''}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          maxLength={24}
          autoComplete="off"
          autoFocus
          enterKeyHint="go"
          placeholder="Stackiteer"
          style={{ fontSize: '1.6rem' }}
        />
        {tried && !name.trim() && <div className="err-text">Please enter a name or nickname.</div>}
        <div className="btn-row">
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn primary" onClick={submit}>▶ Start game</button>
        </div>
      </div>
    </div>
  )
}
