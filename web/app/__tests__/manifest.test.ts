import manifest from '@/app/manifest'

describe('PWA manifest', () => {
  it('returns a basic installable manifest', () => {
    const m = manifest()

    expect(m.name).toBe('Chorus')
    expect(m.short_name).toBe('Chorus')
    expect(m.start_url).toBe('/sign-in')
    expect(m.scope).toBe('/')
    expect(m.display).toBe('standalone')

    expect(m.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }),
        expect.objectContaining({ src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }),
      ])
    )
  })
})
