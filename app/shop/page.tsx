import Link from 'next/link'

export default function ShopLanding() {
  return (
    <main className="min-h-screen bg-[#f5f5f0] relative">
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle, #00000012 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
      }} />

      <div className="relative max-w-2xl mx-auto px-6 py-16">

        <div className="flex items-center gap-3 mb-6">
          <div className="h-px w-8 bg-gray-400" />
          <span className="text-sm text-gray-500 tracking-wide">Partner programme</span>
        </div>

        <h1 className="text-5xl font-bold text-gray-900 tracking-tight mb-4">
          Earn with BudMatch.
        </h1>
        <p className="text-gray-400 text-lg mb-12 max-w-lg">
          Register your shop as a BudMatch partner. Earn commission on every
          successful match that comes through your referral code.
        </p>

        {/* How it works */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-8">
          {[
            {
              num: '01',
              title: 'Register your shop',
              desc: 'Fill in your shop details and get a unique referral code instantly.',
            },
            {
              num: '02',
              title: 'Share your code',
              desc: 'Give customers your code when they visit. They enter it when posting a listing.',
            },
            {
              num: '03',
              title: 'Earn commission',
              desc: 'Get 10% of every successful match fee from listings using your code.',
            },
          ].map((item, i) => (
            <div key={item.num}
              className={`flex gap-6 p-6 ${i !== 2 ? 'border-b border-gray-100' : ''}`}>
              <span className="text-2xl font-bold text-gray-200 w-10 shrink-0">{item.num}</span>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Earnings example */}
        <div className="bg-gray-900 text-white rounded-2xl p-6 mb-8">
          <h2 className="font-bold text-lg mb-4">Example earnings</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold">10</p>
              <p className="text-xs text-gray-400 mt-1">matches/month</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold">LKR 40</p>
              <p className="text-xs text-gray-400 mt-1">per match</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold">LKR 400</p>
              <p className="text-xs text-gray-400 mt-1">monthly</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Commission = Upto 50% of BudMatch platform fee (If platform fee is 10% of the bud price the shop will get 5%)
          </p>
        </div>

        {/* Also serves as drop-off point */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8">
          <h2 className="font-semibold text-gray-900 mb-2">Also become a drop-off point</h2>
          <p className="text-gray-400 text-sm mb-4">
            Let matched users use your shop as a safe exchange location.
            Builds foot traffic and trust in your community.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
              ✓ Free to join
            </span>
            <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
              ✓ No monthly fees
            </span>
            <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
              ✓ Pay per match
            </span>
          </div>
        </div>

        <Link href="/shop/register"
          className="w-full bg-gray-900 text-white py-4 rounded-full font-medium hover:bg-black transition text-center block text-sm">
          Register your shop →
        </Link>

        <p className="text-center text-xs text-gray-400 mt-4">
          Already registered?{' '}
          <Link href="/shop/login" className="text-gray-900 underline">
            View your dashboard
          </Link>
        </p>

      </div>
    </main>
  )
}