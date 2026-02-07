import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  // Private household app: don't index.
  return {
    rules: [
      {
        userAgent: '*',
        disallow: '/',
      },
    ],
  }
}
