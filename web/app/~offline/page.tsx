export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="max-w-xl mx-auto px-6 py-16">
        <h1 className="text-2xl sm:text-3xl font-[var(--font-display)]">You&apos;re offline</h1>
        <p className="mt-3 text-[var(--foreground)]/80">
          Chorus needs a connection to load fresh chore data. Reconnect and try again.
        </p>
      </div>
    </main>
  )
}
