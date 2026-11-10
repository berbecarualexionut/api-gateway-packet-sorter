import type { Packet, Rule, Violation } from './types'

export const GEO_POOL = ['RU', 'CN', 'KP', 'IR']

export const RULE_AUTH: Rule = {
  id: 'AUTH',
  title: 'AUTH REQUIRED',
  detail: 'Block Auth: None, EXPIRED or LEAKED key',
}
export const RULE_INJECTION: Rule = {
  id: 'INJECTION',
  title: 'NO INJECTION',
  detail: 'Block SQLi or XSS payloads',
}
export const RULE_NO_DELETE: Rule = {
  id: 'NO_DELETE',
  title: 'READ-ONLY MODE',
  detail: 'Block all DELETE requests',
}
export const RULE_MAX_SIZE: Rule = {
  id: 'MAX_SIZE',
  title: 'PAYLOAD CAP',
  detail: 'Block Payload Size > 5 MB',
}
export const ruleGeo = (geo: string): Rule => ({
  id: 'GEO',
  title: 'GEO-BLOCK',
  detail: `Block all traffic from ${geo}`,
  geo,
})
export const RULE_RATE_LOGIN: Rule = {
  id: 'RATE_LOGIN',
  title: 'RATE LIMIT',
  detail: 'Block /api/v1/login from external IPs',
}

export const BASE_RULES: Rule[] = [RULE_AUTH, RULE_INJECTION]

export function pickPhase2Rule(): Rule {
  const pool: Rule[] = [RULE_NO_DELETE, RULE_MAX_SIZE, ruleGeo(GEO_POOL[Math.floor(Math.random() * GEO_POOL.length)])]
  return pool[Math.floor(Math.random() * pool.length)]
}

export const MAX_SIZE_KB = 5 * 1024
export const MALWARE_NOTE = 'Always block: path traversal, JNDI/Log4Shell & other exploit payloads'

const V = (kind: Violation['kind'], label: string): Violation => ({ kind, label })

/** Returns the first rule the packet violates, or null if it is valid. */
export function evaluate(p: Packet, rules: Rule[]): Violation | null {
  for (const r of rules) {
    switch (r.id) {
      case 'AUTH':
        if (p.auth === 'NONE') return V('AUTH', 'unauthenticated request')
        if (p.auth === 'EXPIRED') return V('AUTH', 'expired token')
        if (p.auth === 'LEAKED') return V('AUTH', 'leaked API key')
        break
      case 'INJECTION':
        if (p.payloadKind === 'sqli') return V('SQLI', 'SQL Injection')
        if (p.payloadKind === 'xss') return V('XSS', 'XSS payload')
        break
      case 'NO_DELETE':
        if (p.method === 'DELETE') return V('DELETE', 'DELETE request')
        break
      case 'MAX_SIZE':
        if (p.sizeKB > MAX_SIZE_KB) return V('SIZE', 'Payload > 5MB')
        break
      case 'GEO':
        if (p.geo === r.geo) return V('GEO', `traffic from ${r.geo}`)
        break
      case 'RATE_LOGIN':
        if (p.path === '/api/v1/login' && p.geo !== 'INTERNAL') return V('RATE', 'external login flood')
        break
    }
  }
  // Malware payloads are ALWAYS invalid, even if not explicitly listed
  if (p.payloadKind === 'path') return V('PATH', 'Path Traversal')
  if (p.payloadKind === 'jndi') return V('JNDI', 'Log4Shell (JNDI) exploit')
  return null
}

export function breachMessage(v: Violation): string {
  switch (v.kind) {
    case 'SQLI':
    case 'PATH':
    case 'JNDI':
    case 'XSS':
    case 'AUTH':
      return `BREACH! Allowed ${v.label} into Production!`
    case 'SIZE':
      return 'VIOLATION! Allowed Payload > 5MB!'
    case 'DELETE':
      return 'VIOLATION! Allowed a DELETE request!'
    case 'GEO':
      return `VIOLATION! Allowed ${v.label}!`
    case 'RATE':
      return 'VIOLATION! Allowed external /login traffic!'
  }
}

export const VIOLATION_NAMES: Record<Violation['kind'], [string, string]> = {
  SQLI: ['SQL injection', 'SQL injections'],
  XSS: ['XSS payload', 'XSS payloads'],
  PATH: ['path traversal', 'path traversals'],
  JNDI: ['Log4Shell exploit', 'Log4Shell exploits'],
  AUTH: ['unauthenticated request', 'unauthenticated requests'],
  DELETE: ['forbidden DELETE', 'forbidden DELETEs'],
  SIZE: ['oversized payload', 'oversized payloads'],
  GEO: ['geo-blocked request', 'geo-blocked requests'],
  RATE: ['external login flood', 'external login floods'],
}
