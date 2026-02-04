import { describe, it, expect } from 'vitest'
import { CreateLinkSchema } from '../link'

describe('CreateLinkSchema', () => {
  describe('dest_url validation', () => {
    it('should accept valid URLs', () => {
      const result = CreateLinkSchema.safeParse({
        dest_url: 'https://example.com',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.dest_url).toBe('https://example.com')
      }
    })

    it('should reject invalid URLs', () => {
      const result = CreateLinkSchema.safeParse({
        dest_url: 'not a url',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('valid URL')
      }
    })

    it('should reject empty URLs', () => {
      const result = CreateLinkSchema.safeParse({
        dest_url: '',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('title validation', () => {
    it('should accept valid titles', () => {
      const result = CreateLinkSchema.safeParse({
        dest_url: 'https://example.com',
        title: 'My Link',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.title).toBe('My Link')
      }
    })

    it('should transform empty string to null', () => {
      const result = CreateLinkSchema.safeParse({
        dest_url: 'https://example.com',
        title: '',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.title).toBe(null)
      }
    })

    it('should transform undefined to null', () => {
      const result = CreateLinkSchema.safeParse({
        dest_url: 'https://example.com',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.title).toBe(null)
      }
    })

    it('should trim whitespace', () => {
      const result = CreateLinkSchema.safeParse({
        dest_url: 'https://example.com',
        title: '  Spaced Title  ',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.title).toBe('Spaced Title')
      }
    })

    it('should reject titles over 200 characters', () => {
      const longTitle = 'a'.repeat(201)
      const result = CreateLinkSchema.safeParse({
        dest_url: 'https://example.com',
        title: longTitle,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('200 characters')
      }
    })
  })

  describe('ads_required validation', () => {
    it('should default to 3', () => {
      const result = CreateLinkSchema.safeParse({
        dest_url: 'https://example.com',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.ads_required).toBe(3)
      }
    })

    it('should accept values between 1 and 5', () => {
      for (let i = 1; i <= 5; i++) {
        const result = CreateLinkSchema.safeParse({
          dest_url: 'https://example.com',
          ads_required: i,
        })
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.ads_required).toBe(i)
        }
      }
    })

    it('should coerce string numbers', () => {
      const result = CreateLinkSchema.safeParse({
        dest_url: 'https://example.com',
        ads_required: '4',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.ads_required).toBe(4)
      }
    })

    it('should reject values less than 1', () => {
      const result = CreateLinkSchema.safeParse({
        dest_url: 'https://example.com',
        ads_required: 0,
      })
      expect(result.success).toBe(false)
    })

    it('should reject values greater than 5', () => {
      const result = CreateLinkSchema.safeParse({
        dest_url: 'https://example.com',
        ads_required: 6,
      })
      expect(result.success).toBe(false)
    })

    it('should reject non-integer values', () => {
      const result = CreateLinkSchema.safeParse({
        dest_url: 'https://example.com',
        ads_required: 2.5,
      })
      expect(result.success).toBe(false)
    })
  })
})
