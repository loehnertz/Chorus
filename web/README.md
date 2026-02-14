# Chorus (Web App)

This directory contains the Next.js application.

- Primary docs: `../README.md`
- Run commands from here: `cd web`

## Development

```bash
npm install
npx prisma migrate dev
npm run dev
```

Default dev URL: `http://localhost:3001`

Production deployment builds run `prisma migrate deploy` automatically before `next build`, so fresh databases are bootstrapped from committed migrations in `prisma/migrations/`.
Preview/non-production builds skip migrations by design.
For best reliability on Vercel, set `MIGRATE_DATABASE_URL` to a direct Neon connection string (non-pooler host) so migration advisory locks can be acquired cleanly.
The app runtime accepts either `DATABASE_URL` or `POSTGRES_URL` for the database connection string.
