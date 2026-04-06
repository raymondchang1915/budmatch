import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f5f5f0] relative overflow-hidden">

      {/* Background dot/grid pattern */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle, #00000012 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
      }} />

      {/* Hero */}
      <section className="relative max-w-6xl mx-auto px-8 pt-32 pb-24">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-px w-8 bg-gray-400" />
          <span className="text-sm text-gray-500 tracking-wide">The marketplace for missing earbuds</span>
        </div>

        <h1 className="text-[80px] leading-[0.95] font-bold text-gray-900 mb-10 max-w-3xl tracking-tight">
          Im sorryy cutiee come to meee
        </h1>

        <p className="text-lg text-gray-500 max-w-lg mb-12 leading-relaxed">
          Lost one earbud? Someone out there has yours and needs yours. BudMatch connects you both — for a fraction of the replacement cost.
        </p>

        <div className="flex gap-4">
          <Link
            href="/listings/new"
            className="bg-gray-900 text-white px-7 py-3.5 rounded-full font-medium hover:bg-black transition flex items-center gap-2 text-sm"
          >
            Post a listing →
          </Link>
          <Link
            href="/browse"
            className="bg-white border border-gray-200 text-gray-700 px-7 py-3.5 rounded-full font-medium hover:border-gray-400 transition text-sm"
          >
            Browse listings
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="relative max-w-6xl mx-auto px-8 pb-32">
        <div className="flex items-center gap-3 mb-16">
          <div className="h-px w-8 bg-gray-400" />
          <span className="text-sm text-gray-500 tracking-wide">Process</span>
        </div>

        <h2 className="text-5xl font-bold text-gray-900 mb-2">Three steps.</h2>
        <p className="text-5xl font-bold text-gray-300 mb-20">Infinite matches.</p>

        <div className="grid grid-cols-1 gap-0 border border-gray-200 rounded-2xl overflow-hidden bg-white">
          {[
            {
              num: 'I',
              title: 'Post what you have',
              desc: 'Tell us your earbud model, which piece you have, and what condition it\'s in.',
            },
            {
              num: 'II',
              title: 'Get auto-matched',
              desc: 'Our system instantly finds someone who has what you need and needs what you have.',
            },
            {
              num: 'III',
              title: 'Negotiate and trade',
              desc: 'Chat with your match, agree on a fair price, and complete the swap.',
            },
          ].map((item, i) => (
            <div
              key={item.num}
              className={`flex gap-8 items-start p-10 ${i !== 2 ? 'border-b border-gray-100' : ''}`}
            >
              <span className="text-2xl font-bold text-gray-200 w-10 shrink-0">{item.num}</span>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </main>
  )
}