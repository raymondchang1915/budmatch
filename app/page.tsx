import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">

      {/* Hero */}
      <section className="max-w-2xl mx-auto text-center px-4 pt-24 pb-16">
        <span className="bg-black text-white text-xs px-3 py-1 rounded-full mb-6 inline-block">
          Now live in Sri Lanka
        </span>
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Lost one earbud?<br />Someone has yours.
        </h1>
        <p className="text-gray-500 text-lg mb-10 max-w-md mx-auto">
          BudMatch connects people with incomplete earbud sets so everyone ends up with a working pair — for a fraction of the price.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/listings/new"
            className="bg-black text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition"
          >
            Post a listing
          </Link>
          <Link
            href="/browse"
            className="border border-gray-200 bg-white text-gray-700 px-6 py-3 rounded-xl font-medium hover:border-gray-400 transition"
          >
            Browse listings
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-2xl mx-auto px-4 pb-24">
        <h2 className="text-xl font-bold text-center text-gray-900 mb-10">How it works</h2>
        <div className="grid grid-cols-1 gap-4">
          {[
            { step: '01', title: 'Post what you have', desc: 'Tell us your earbud model, which piece you have, and what you need.' },
            { step: '02', title: 'Get auto-matched', desc: 'Our system instantly finds someone who has what you need and needs what you have.' },
            { step: '03', title: 'Negotiate a price', desc: 'Chat with your match, agree on a fair price, and complete the trade.' },
          ].map(item => (
            <div key={item.step} className="bg-white border border-gray-200 rounded-2xl p-6 flex gap-5 items-start">
              <span className="text-2xl font-bold text-gray-200">{item.step}</span>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </main>
  )
}