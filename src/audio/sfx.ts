import type { SfxEvent } from '../game/engine'

const MUTE_KEY = 'agps.muted'

let ctx: AudioContext | null = null
let master: GainNode | null = null
let muted = false
try { muted = localStorage.getItem(MUTE_KEY) === '1' } catch { /* ignore */ }

function ensure(): AudioContext | null {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = muted ? 0 : 0.5
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

/** Call from a user gesture (iOS requires it). */
export function unlockAudio() { ensure() }

export function isMuted() { return muted }
export function setMuted(m: boolean) {
  muted = m
  try { localStorage.setItem(MUTE_KEY, m ? '1' : '0') } catch { /* ignore */ }
  if (master && ctx) master.gain.setTargetAtTime(m ? 0 : 0.5, ctx.currentTime, 0.01)
}

interface ToneOpts {
  f: number; t?: number; d: number; type?: OscillatorType; v?: number; slideTo?: number
}
function tone({ f, t = 0, d, type = 'sine', v = 0.3, slideTo }: ToneOpts) {
  const c = ensure()
  if (!c || !master || muted) return
  const o = c.createOscillator()
  const g = c.createGain()
  const t0 = c.currentTime + t
  o.type = type
  o.frequency.setValueAtTime(f, t0)
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + d)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(v, t0 + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + d)
  o.connect(g).connect(master)
  o.start(t0)
  o.stop(t0 + d + 0.02)
}

export function playSfx(e: SfxEvent | 'click' | 'whoosh') {
  switch (e) {
    case 'click':
      tone({ f: 1200, d: 0.05, type: 'square', v: 0.08 })
      break
    case 'whoosh':
      tone({ f: 300, slideTo: 900, d: 0.12, type: 'triangle', v: 0.08 })
      break
    case 'correct':
      tone({ f: 880, d: 0.1, type: 'triangle', v: 0.25 })
      tone({ f: 1320, t: 0.07, d: 0.18, type: 'triangle', v: 0.25 })
      break
    case 'streak':
      ;[660, 880, 1100, 1480].forEach((f, i) => tone({ f, t: i * 0.06, d: 0.14, type: 'sine', v: 0.22 }))
      break
    case 'breach':
      tone({ f: 140, d: 0.45, type: 'sawtooth', v: 0.3, slideTo: 70 })
      tone({ f: 150, t: 0.12, d: 0.35, type: 'square', v: 0.18, slideTo: 60 })
      break
    case 'falsePositive':
      tone({ f: 320, d: 0.18, type: 'square', v: 0.2, slideTo: 200 })
      tone({ f: 240, t: 0.14, d: 0.22, type: 'square', v: 0.2, slideTo: 150 })
      break
    case 'timeout':
      tone({ f: 200, d: 0.5, type: 'sawtooth', v: 0.22, slideTo: 90 })
      break
    case 'policy':
      for (let i = 0; i < 3; i++) {
        tone({ f: 700, t: i * 0.36, d: 0.18, type: 'sawtooth', v: 0.18, slideTo: 1100 })
        tone({ f: 1100, t: i * 0.36 + 0.18, d: 0.18, type: 'sawtooth', v: 0.18, slideTo: 700 })
      }
      break
    case 'tick':
      tone({ f: 520, d: 0.12, type: 'square', v: 0.15 })
      break
    case 'lowTime':
      tone({ f: 980, d: 0.06, type: 'square', v: 0.1 })
      break
    case 'go':
      ;[523, 659, 784, 1046].forEach((f, i) => tone({ f, t: i * 0.07, d: 0.25, type: 'triangle', v: 0.25 }))
      break
    case 'gameover':
      ;[784, 659, 523, 392].forEach((f, i) => tone({ f, t: i * 0.16, d: 0.3, type: 'triangle', v: 0.25 }))
      break
  }
}
