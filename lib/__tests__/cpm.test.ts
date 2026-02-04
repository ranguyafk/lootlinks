import { describe, it, expect } from 'vitest'
import { resolveCpm } from '../cpm'

describe('resolveCpm', () => {
  it('should return correct CPM for known countries', () => {
    expect(resolveCpm('US')).toBe(5.0)
    expect(resolveCpm('CA')).toBe(4.0)
    expect(resolveCpm('GB')).toBe(4.5)
    expect(resolveCpm('AU')).toBe(4.2)
    expect(resolveCpm('DE')).toBe(3.5)
    expect(resolveCpm('FR')).toBe(3.2)
    expect(resolveCpm('IN')).toBe(1.0)
    expect(resolveCpm('BR')).toBe(1.2)
  })

  it('should return default CPM for unknown countries', () => {
    expect(resolveCpm('XY')).toBe(0.8)
    expect(resolveCpm('UNKNOWN')).toBe(0.8)
    expect(resolveCpm('ZZ')).toBe(0.8)
  })

  it('should handle null and undefined', () => {
    expect(resolveCpm(null)).toBe(0.8)
    expect(resolveCpm(undefined)).toBe(0.8)
  })

  it('should be case insensitive', () => {
    expect(resolveCpm('us')).toBe(5.0)
    expect(resolveCpm('gb')).toBe(4.5)
    expect(resolveCpm('ca')).toBe(4.0)
  })

  it('should handle empty string', () => {
    expect(resolveCpm('')).toBe(0.8)
  })
})
