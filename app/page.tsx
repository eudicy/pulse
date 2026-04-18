import Link from 'next/link'

const features = [
  {
    title: 'Simple task management',
    description:
      'Create projects, assign tasks, set due dates. Everything your small team needs without the bloat.',
    icon: '✓',
  },
  {
    title: 'Auto weekly updates',
    description:
      'Every week, a status update is generated automatically from your task activity. No manual write-ups.',
    icon: '↻',
  },
  {
    title: 'One-click stakeholder reports',
    description:
      'Generate polished, investor-ready progress reports in seconds. Export as PDF or Markdown.',
    icon: '⚡',
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto">
        <span className="text-lg font-semibold tracking-tight">Reportly</span>
        <nav className="flex gap-4 text-sm">
          <Link
            href="/login"
            className="text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="bg-indigo-600 text-white px-4 py-1.5 rounded-full hover:bg-indigo-700 transition-colors"
          >
            Start for free
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="text-center px-6 pt-24 pb-20 max-w-3xl mx-auto">
        <h1 className="text-5xl font-bold tracking-tight leading-tight mb-6">
          Ship faster with{' '}
          <span className="text-indigo-600">auto-generated</span> status reports
        </h1>
        <p className="text-xl text-zinc-500 mb-10 leading-relaxed">
          The PM tool for 2–20 person startups. Manage tasks and get weekly
          updates + stakeholder reports — written for you automatically.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/signup"
            className="bg-indigo-600 text-white text-base font-medium px-8 py-3 rounded-full hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Start for free
          </Link>
          <Link
            href="/login"
            className="text-base font-medium px-8 py-3 rounded-full border border-zinc-200 hover:border-zinc-400 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Feature cards */}
      <section className="px-6 pb-24 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-zinc-100 bg-zinc-50 p-8 flex flex-col gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl font-bold">
                {f.icon}
              </div>
              <h3 className="text-base font-semibold">{f.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-zinc-100 bg-zinc-50 py-16 text-center px-6">
        <h2 className="text-2xl font-bold mb-3">Ready to stop writing updates?</h2>
        <p className="text-zinc-500 mb-8 text-base">
          Free to start. No credit card required.
        </p>
        <Link
          href="/signup"
          className="bg-indigo-600 text-white text-base font-medium px-8 py-3 rounded-full hover:bg-indigo-700 transition-colors"
        >
          Start for free
        </Link>
      </section>
    </div>
  )
}
