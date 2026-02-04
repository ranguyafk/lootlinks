import { describe, it, expect } from 'vitest'
import { isLikelyBot } from '../bots'

describe('isLikelyBot', () => {
  it('should return true for empty user agent', () => {
    expect(isLikelyBot('')).toBe(true)
  })

  it('should detect bot patterns', () => {
    expect(isLikelyBot('Googlebot/2.1')).toBe(true)
    expect(isLikelyBot('Mozilla/5.0 (compatible; bingbot/2.0)')).toBe(true)
    expect(isLikelyBot('spider')).toBe(true)
    expect(isLikelyBot('crawler')).toBe(true)
    expect(isLikelyBot('curl/7.64.1')).toBe(true)
    expect(isLikelyBot('wget/1.20.3')).toBe(true)
    expect(isLikelyBot('facebookexternalhit/1.1')).toBe(true)
    expect(isLikelyBot('Yahoo! Slurp')).toBe(true)
    expect(isLikelyBot('HeadlessChrome/91.0.4472.114')).toBe(true)
    expect(isLikelyBot('PhantomJS/2.1.1')).toBe(true)
    expect(isLikelyBot('puppeteer')).toBe(true)
  })

  it('should return false for normal user agents', () => {
    expect(isLikelyBot('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')).toBe(false)
    expect(isLikelyBot('Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)')).toBe(false)
    expect(isLikelyBot('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')).toBe(false)
  })

  it('should be case insensitive', () => {
    expect(isLikelyBot('BOT')).toBe(true)
    expect(isLikelyBot('CRAWLER')).toBe(true)
    expect(isLikelyBot('Spider')).toBe(true)
  })
})
