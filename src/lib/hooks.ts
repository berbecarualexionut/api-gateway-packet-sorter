import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import { playSfx } from '../audio/sfx'
import { GameEngine } from '../game/engine'

export function useEngine() {
  const engine = useMemo(() => new GameEngine(), [])
  const state = useSyncExternalStore(
    useCallback((fn: () => void) => engine.subscribe(fn), [engine]),
    () => engine.state,
  )
  useEffect(() => {
    if (import.meta.env.DEV) (window as unknown as { __engine?: GameEngine }).__engine = engine
  }, [engine])
  useEffect(() => engine.onSfx((e) => playSfx(e)), [engine])
  useEffect(() => {
    let raf = 0
    const loop = () => {
      engine.update(performance.now())
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [engine])
  return { engine, state }
}

/** Fires cb on three quick taps. */
export function useTripleTap(cb: () => void, windowMs = 700) {
  const taps = useRef<number[]>([])
  return useCallback(() => {
    const now = performance.now()
    taps.current = [...taps.current.filter((t) => now - t < windowMs), now]
    if (taps.current.length >= 3) {
      taps.current = []
      cb()
    }
  }, [cb, windowMs])
}

/** Calls cb after `ms` without any pointer/key activity (kiosk auto-reset). */
export function useIdle(ms: number, cb: () => void, active = true) {
  const cbRef = useRef(cb)
  cbRef.current = cb
  useEffect(() => {
    if (!active) return
    let t = window.setTimeout(() => cbRef.current(), ms)
    const bump = () => {
      window.clearTimeout(t)
      t = window.setTimeout(() => cbRef.current(), ms)
    }
    const evs = ['pointerdown', 'keydown', 'input'] as const
    evs.forEach((e) => window.addEventListener(e, bump, true))
    return () => {
      window.clearTimeout(t)
      evs.forEach((e) => window.removeEventListener(e, bump, true))
    }
  }, [ms, active])
}
