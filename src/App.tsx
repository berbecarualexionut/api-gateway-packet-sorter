import { useCallback, useEffect, useRef, useState } from 'react'
import { isMuted, playSfx, setMuted, unlockAudio } from './audio/sfx'
import { AdminPanel } from './components/AdminPanel'
import { Attract } from './components/Attract'
import { Conveyor } from './components/Conveyor'
import { Hud } from './components/Hud'
import { LeadModal, type Player } from './components/LeadModal'
import { RulesBoard } from './components/RulesBoard'
import { computeResult, Summary } from './components/Summary'
import { Zones } from './components/Zones'
import type { Dest } from './game/types'
import { useEngine, useIdle, useTripleTap } from './lib/hooks'
import { addEntry, loadLeaderboard, loadSettings, saveSettings, type LeaderboardEntry } from './lib/storage'

type Screen = 'attract' | 'register' | 'game' | 'summary'

export default function App() {
  const { engine, state } = useEngine()
  const [screen, setScreen] = useState<Screen>('attract')
  const [settings, setSettings] = useState(loadSettings)
  const [entries, setEntries] = useState<LeaderboardEntry[]>(loadLeaderboard)
  const [muted, setMutedState] = useState(isMuted())
  const [admin, setAdmin] = useState(false)
  const [hover, setHover] = useState<Dest | null>(null)
  const [pop, setPop] = useState<{ dest: Dest; n: number } | null>(null)
  const [myId, setMyId] = useState<string | undefined>()
  const [player, setPlayer] = useState<Player | null>(null)
  const savedRun = useRef(false)
  const arenaRef = useRef<HTMLDivElement>(null)
  const popN = useRef(0)

  const openAdmin = useCallback(() => setAdmin(true), [])
  const logoTap = useTripleTap(openAdmin)

  const toAttract = useCallback(() => { engine.reset(); setScreen('attract'); setMyId(undefined); setPlayer(null); setEntries(loadLeaderboard()) }, [engine])

  const start = () => { setMyId(undefined); savedRun.current = false; engine.start(); setScreen('game') }
  const begin = (p: Player) => { setPlayer(p); start() }

  const route = useCallback((d: Dest) => {
    if (engine.state.status !== 'playing') return
    engine.route(d)
    setPop({ dest: d, n: ++popN.current })
  }, [engine])

  // game over → summary after a short beat
  useEffect(() => {
    if (state.status === 'over' && screen === 'game') {
      const t = window.setTimeout(() => setScreen('summary'), 1500)
      return () => window.clearTimeout(t)
    }
  }, [state.status, screen])

  // auto-save the score the moment the run ends
  useEffect(() => {
    if (state.status !== 'over' || savedRun.current || !player) return
    savedRun.current = true
    const { acc, rank } = computeResult(state)
    const e = addEntry({
      name: player.name, company: player.company, email: player.email, initialsOnly: player.initialsOnly,
      score: state.score, rank: rank.name, accuracy: acc, inspected: state.stats.inspected,
    })
    setMyId(e.id)
    setEntries(loadLeaderboard())
  }, [state, player])

  // screen shake on mistakes
  useEffect(() => {
    if (!state.shakeId) return
    const el = arenaRef.current
    if (!el) return
    el.classList.remove('shake')
    void el.offsetWidth
    el.classList.add('shake')
    const t = window.setTimeout(() => el.classList.remove('shake'), 520)
    return () => window.clearTimeout(t)
  }, [state.shakeId])

  // keyboard (desktop testing)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') route('prod')
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') route('quar')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [route])

  // kiosk auto-reset when someone walks away
  useIdle(45000, toAttract, screen === 'summary')
  useIdle(90000, toAttract, screen === 'register' && !admin)

  const saveSet = (s: typeof settings) => { setSettings(s); saveSettings(s) }

  return (
    <>
      <div className="app" ref={arenaRef} onPointerDown={unlockAudio}>
        <Hud
          state={state}
          company={settings.companyName}
          muted={muted}
          onLogoTap={logoTap}
          onToggleMute={() => { const m = !muted; setMuted(m); setMutedState(m); if (!m) playSfx('click') }}
          onAbort={toAttract}
        />
        <main className="arena">
          <RulesBoard rules={state.rules} flashId={state.ruleFlashId} />
          <Conveyor queue={state.status === 'playing' ? state.queue : []} onRoute={route} onHover={setHover} />
          <Zones hover={hover} pop={pop} floaters={state.floaters} onTap={route} />
        </main>

        <div className="toasts">{state.toasts.map((t) => <div key={t.id} className={`toast ${t.tone === 'bad' ? 'bad' : 'warn'}`}>{t.text}</div>)}</div>
        {state.banner && (
          <div key={state.banner.id} className={`banner ${state.banner.tone}`}>
            <div className="ttl">{state.banner.title}</div>
            <div className="sub">{state.banner.sub}</div>
          </div>
        )}
        {state.shakeId > 0 && <div key={`g${state.shakeId}`} className="glitch" />}
        {state.status === 'countdown' && (
          <div className="overlay countdown">
            <div key={state.countdown} className={`num ${state.countdown === 0 ? 'go' : ''}`}>{state.countdown === 0 ? 'PROTECT!' : state.countdown}</div>
          </div>
        )}
        {state.status === 'over' && screen === 'game' && (
          <div className="overlay endcard" style={{ color: state.endReason === 'sla' ? 'var(--quar)' : 'var(--cyan)' }}>
            {state.endReason === 'sla' ? 'SLA BREACHED!' : "TIME'S UP!"}
          </div>
        )}
      </div>

      {screen === 'attract' && <Attract company={settings.companyName} entries={entries} onStart={() => setScreen('register')} onLogoTap={logoTap} />}
      {screen === 'register' && (
        <>
          <Attract company={settings.companyName} entries={entries} onStart={() => undefined} onLogoTap={logoTap} />
          <LeadModal settings={settings} initial={player} onCancel={() => setScreen('attract')} onSubmit={begin} />
        </>
      )}
      {screen === 'summary' && (
        <Summary
          state={state} pitch={settings.pitch} company={settings.companyName} playerName={player?.name ?? ''}
          entries={entries} myId={myId} onDone={toAttract} onAgain={start}
        />
      )}
      {admin && <AdminPanel settings={settings} onChange={saveSet} onClose={() => setAdmin(false)} onReset={() => setEntries(loadLeaderboard())} />}
    </>
  )
}
