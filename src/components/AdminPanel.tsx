import { useState } from 'react'
import type { Settings } from '../game/config'
import { downloadCsv, loadLeaderboard, resetAll } from '../lib/storage'

interface Props { settings: Settings; onChange: (s: Settings) => void; onClose: () => void; onReset: () => void }

export function AdminPanel({ settings, onChange, onClose, onReset }: Props) {
  const [armed, setArmed] = useState(false)
  const count = loadLeaderboard().length
  return (
    <div className="modal-wrap" style={{ zIndex: 100 }}>
      <div className="modal">
        <h2>Booth Admin</h2>
        <p className="sub">{count} lead{count === 1 ? '' : 's'} stored on this device.</p>

        <label className="lbl" style={{ marginTop: '.9rem' }}>COMPANY NAME</label>
        <input className="input" value={settings.companyName} maxLength={24} onChange={(e) => onChange({ ...settings, companyName: e.target.value })} />
        <label className="lbl">BOOTH PITCH (use [Company Name])</label>
        <textarea className="input" rows={3} value={settings.pitch} onChange={(e) => onChange({ ...settings, pitch: e.target.value })} />

        <div className="btn-row">
          <button className="btn" onClick={downloadCsv} disabled={count === 0}>⬇ Export CSV</button>
          <button
            className="btn"
            style={armed ? { background: 'var(--quar)' } : undefined}
            onClick={() => { if (armed) { resetAll(); onReset(); setArmed(false) } else setArmed(true) }}
          >
            {armed ? 'Tap again: wipe all' : 'Reset data'}
          </button>
        </div>
        <div className="btn-row"><button className="btn primary" onClick={onClose}>Done</button></div>
      </div>
    </div>
  )
}
