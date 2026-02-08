import { logError, sanitizeErrorMessage } from '../logger'

describe('logger', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.restoreAllMocks()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('sanitizeErrorMessage', () => {
    it('returns generic message in production', () => {
      process.env.NODE_ENV = 'production'
      expect(sanitizeErrorMessage(new Error('secret details'))).toBe(
        'An error occurred. Please try again later.',
      )
    })

    it('returns detailed message outside production', () => {
      process.env.NODE_ENV = 'test'
      expect(sanitizeErrorMessage(new Error('secret details'))).toBe('secret details')
    })
  })

  describe('logError', () => {
    it('logs JSON in production', () => {
      process.env.NODE_ENV = 'production'
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {})

      logError('ctx', new Error('boom'), { userId: 'u1' })

      expect(spy).toHaveBeenCalledTimes(1)
      const arg = spy.mock.calls[0]?.[0]
      expect(typeof arg).toBe('string')
      expect(String(arg)).toContain('"context":"ctx"')
    })

    it('logs raw error outside production', () => {
      process.env.NODE_ENV = 'test'
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {})

      const err = new Error('boom')
      logError('ctx', err, { userId: 'u1' })

      expect(spy).toHaveBeenCalledWith('[ctx]', err, { userId: 'u1' })
    })
  })
})
