import {
  BASE_POINTS, BREACH_PENALTY, FALSE_POSITIVE_PENALTY, GAME_SECONDS, MAX_QUEUE, SPAWN_INTERVAL, TIMEOUT_PENALTY,
} from './config'
import { generatePacket } from './generator'
import { BASE_RULES, breachMessage, evaluate, pickPhase2Rule, RULE_RATE_LOGIN } from './rules'
import type { Dest, Floater, GameState, Packet, Phase, Stats, Toast } from './types'

export type SfxEvent =
  | 'correct' | 'breach' | 'falsePositive' | 'timeout' | 'policy' | 'tick' | 'go' | 'gameover' | 'streak' | 'lowTime'

const emptyStats = (): Stats => ({
  inspected: 0, correct: 0, falsePositives: 0, timeouts: 0, breaches: {}, decoysMissed: 0, decoysCaught: 0, bestStreak: 0,
})

export const initialState = (): GameState => ({
  status: 'idle', countdown: 3, timeLeft: GAME_SECONDS, phase: 1, score: 0, health: 100, streak: 0, multiplier: 1,
  rules: BASE_RULES, queue: [], stats: emptyStats(), banner: null, ruleFlashId: 0, shakeId: 0, toasts: [], floaters: [],
  endReason: null,
})

const multFor = (streak: number): 1 | 2 | 4 => (streak >= 6 ? 4 : streak >= 3 ? 2 : 1)

/** Pure-TS game engine. The React layer subscribes and drives `update` from rAF. */
export class GameEngine {
  state: GameState = initialState()
  private startAt = 0
  private nextSpawnAt = 0
  private uid = 1
  private lastNotify = 0
  private lastSecondBeep = -1
  private listeners = new Set<() => void>()
  private sfxListeners = new Set<(e: SfxEvent) => void>()
  private cdTimer: number | null = null

  subscribe(fn: () => void) { this.listeners.add(fn); return () => { this.listeners.delete(fn) } }
  onSfx(fn: (e: SfxEvent) => void) { this.sfxListeners.add(fn); return () => { this.sfxListeners.delete(fn) } }
  private sfx(e: SfxEvent) { this.sfxListeners.forEach((f) => f(e)) }
  private emit() {
    this.state = { ...this.state }
    this.lastNotify = performance.now()
    this.listeners.forEach((f) => f())
  }

  reset() {
    if (this.cdTimer) window.clearTimeout(this.cdTimer)
    this.cdTimer = null
    this.state = initialState()
    this.emit()
  }

  /** 3… 2… 1… PROTECT! then play. */
  start() {
    this.reset()
    this.state.status = 'countdown'
    this.state.countdown = 3
    this.emit()
    this.sfx('tick')
    const step = () => {
      if (this.state.status !== 'countdown') return
      const c = this.state.countdown - 1
      if (c > 0) {
        this.state.countdown = c
        this.emit()
        this.sfx('tick')
        this.cdTimer = window.setTimeout(step, 800)
      } else if (c === 0) {
        this.state.countdown = 0 // "PROTECT!"
        this.emit()
        this.sfx('go')
        this.cdTimer = window.setTimeout(step, 700)
      } else {
        this.begin()
      }
    }
    this.cdTimer = window.setTimeout(step, 800)
  }

  private begin() {
    const now = performance.now()
    this.startAt = now
    this.state.status = 'playing'
    this.state.rules = BASE_RULES
    this.nextSpawnAt = now
    this.lastSecondBeep = -1
    this.spawn(now)
    this.spawn(now)
    this.nextSpawnAt = now + SPAWN_INTERVAL[1]
    this.activateHead(now)
    this.emit()
  }

  abort() {
    if (this.cdTimer) window.clearTimeout(this.cdTimer)
    this.cdTimer = null
    this.state = { ...initialState() }
    this.emit()
  }

  private phaseFor(elapsedS: number): Phase {
    return elapsedS < 20 ? 1 : elapsedS < 40 ? 2 : 3
  }

  private spawn(now: number) {
    const p = generatePacket(this.state.rules, this.state.phase)
    this.state.queue = [...this.state.queue, p]
    this.nextSpawnAt = now + SPAWN_INTERVAL[this.state.phase] * (0.85 + Math.random() * 0.3)
  }

  private activateHead(now: number) {
    const head = this.state.queue[0]
    if (head && !head.activatedAt) head.activatedAt = now
  }

  private pushToast(text: string, tone: Toast['tone'], ms = 2600) {
    const t: Toast = { id: this.uid++, text, tone, expires: performance.now() + ms }
    this.state.toasts = [...this.state.toasts.slice(-2), t]
  }
  private pushFloat(text: string, tone: Floater['tone'], dest: Floater['dest']) {
    const f: Floater = { id: this.uid++, text, tone, dest, expires: performance.now() + 1100 }
    this.state.floaters = [...this.state.floaters, f]
  }

  private setBanner(title: string, sub: string, tone: 'warn' | 'bad') {
    this.state.banner = { id: this.uid++, title, sub, tone }
    window.setTimeout(() => {
      if (this.state.banner && this.state.banner.title === title) {
        this.state.banner = null
        this.emit()
      }
    }, 2200)
  }

  private addRule(rule: typeof RULE_RATE_LOGIN) {
    this.state.rules = [...this.state.rules, rule]
    this.state.ruleFlashId = this.uid++
    // re-evaluate waiting packets against the new policy
    this.state.queue.forEach((p) => { p.violation = evaluate(p, this.state.rules) })
    this.sfx('policy')
  }

  private damage(amount: number) {
    this.state.health = Math.max(0, this.state.health - amount)
    this.state.streak = 0
    this.state.multiplier = 1
    this.state.shakeId = this.uid++
  }

  route(dest: Dest) {
    const s = this.state
    if (s.status !== 'playing') return
    const p = s.queue[0]
    if (!p) return
    const now = performance.now()
    const v = evaluate(p, s.rules)
    p.violation = v
    const shouldBlock = v !== null
    const blocked = dest === 'quar'
    s.queue = s.queue.slice(1)
    s.stats.inspected++
    if (shouldBlock === blocked) {
      const mult = s.multiplier
      const pts = BASE_POINTS * mult
      s.score += pts
      s.stats.correct++
      if (p.decoy) s.stats.decoysCaught++
      s.streak++
      s.stats.bestStreak = Math.max(s.stats.bestStreak, s.streak)
      const newMult = multFor(s.streak)
      if (newMult > s.multiplier) this.sfx('streak')
      s.multiplier = newMult
      this.pushFloat(blocked ? `+${pts}! 403 DROP` : `+${pts}! 200 OK`, 'good', dest)
      this.sfx('correct')
    } else if (shouldBlock && !blocked && v) {
      // false negative: attack let into Production
      this.damage(BREACH_PENALTY)
      s.stats.breaches[v.kind] = (s.stats.breaches[v.kind] ?? 0) + 1
      if (p.decoy) s.stats.decoysMissed++
      this.pushToast(breachMessage(v), 'bad')
      this.pushFloat(`-${BREACH_PENALTY}% SLA`, 'bad', dest)
      this.sfx('breach')
    } else {
      // false positive: blocked a legit customer
      this.damage(FALSE_POSITIVE_PENALTY)
      s.stats.falsePositives++
      this.pushToast('SLA DROP! Blocked legitimate customer traffic!', 'warn')
      this.pushFloat(`-${FALSE_POSITIVE_PENALTY}% SLA`, 'bad', dest)
      this.sfx('falsePositive')
    }
    // next packet
    this.activateHead(now)
    if (s.health <= 0) this.finish('sla')
    this.emit()
  }

  private timeoutHead(now: number) {
    const s = this.state
    const p = s.queue[0]
    if (!p) return
    s.queue = s.queue.slice(1)
    s.stats.inspected++
    s.stats.timeouts++
    this.damage(TIMEOUT_PENALTY)
    this.pushToast('504 GATEWAY TIMEOUT! Packet expired unsorted!', 'warn')
    this.pushFloat(`-${TIMEOUT_PENALTY}% SLA`, 'bad', 'center')
    this.sfx('timeout')
    this.activateHead(now)
    if (s.health <= 0) this.finish('sla')
  }

  private finish(reason: 'time' | 'sla') {
    this.state.status = 'over'
    this.state.endReason = reason
    this.state.queue = []
    this.state.banner = null
    this.sfx('gameover')
  }

  /** Called from rAF while playing. */
  update(now: number) {
    const s = this.state
    if (s.status !== 'playing') return
    let dirty = false
    const elapsed = (now - this.startAt) / 1000
    const timeLeft = Math.max(0, GAME_SECONDS - elapsed)

    const phase = this.phaseFor(elapsed)
    if (phase !== s.phase) {
      s.phase = phase
      if (phase === 2) {
        this.addRule(pickPhase2Rule())
        this.setBanner('THREAT INTEL UPDATE!', 'New policy rule deployed — traffic spike incoming', 'warn')
      } else {
        this.addRule(RULE_RATE_LOGIN)
        this.setBanner('DDoS SURGE!', 'Rate limit enabled — beware of spoofed zero-day packets', 'bad')
      }
      dirty = true
    }

    // spawn
    if (s.queue.length < MAX_QUEUE && now >= this.nextSpawnAt) {
      this.spawn(now)
      dirty = true
    } else if (now >= this.nextSpawnAt) {
      this.nextSpawnAt = now + 300
    }
    this.activateHead(now)

    // timeout
    const head = s.queue[0]
    if (head && head.activatedAt && now - head.activatedAt >= head.timeoutMs) {
      this.timeoutHead(now)
      dirty = true
    }

    // timer beeps under 10s
    const secs = Math.ceil(timeLeft)
    if (timeLeft <= 10 && secs !== this.lastSecondBeep && s.status === 'playing') {
      this.lastSecondBeep = secs
      this.sfx('lowTime')
    }

    // prune toasts / floaters
    if (s.toasts.some((t) => t.expires < now)) { s.toasts = s.toasts.filter((t) => t.expires >= now); dirty = true }
    if (s.floaters.some((f) => f.expires < now)) { s.floaters = s.floaters.filter((f) => f.expires >= now); dirty = true }

    s.timeLeft = timeLeft
    if (s.status === 'playing' && timeLeft <= 0) {
      this.finish('time')
      dirty = true
    }
    // throttle timer-only repaints to ~10 Hz
    if (dirty || now - this.lastNotify > 100) this.emit()
  }

  /** Helper for UI */
  activePacket(): Packet | undefined {
    return this.state.queue[0]
  }
}
