'use client'

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f0] relative">
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle, #00000012 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
      }} />

      <div className="relative max-w-3xl mx-auto px-6 py-16">
        <a href="/" className="text-sm text-gray-400 hover:text-gray-700 transition flex items-center gap-1.5 mb-8">
          ← Back to BudMatch
        </a>

        {/* Hero */}
        <div className="text-center mb-12">
          <p className="text-xs text-gray-400 tracking-widest uppercase mb-3">BudMatch Help</p>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-3">How can we help?</h1>
          <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
            Everything you need to know about trading single earbuds, resetting your device, pricing, and getting matched.
          </p>
          <a href="mailto:hello@budmatch.site"
            className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-5 py-2.5 text-sm font-medium text-gray-700 hover:border-gray-400 transition shadow-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
            hello@budmatch.site
          </a>
        </div>

        <div className="space-y-10">

          {/* How BudMatch works */}
          <Section title="How BudMatch works">
            <Steps items={[
              { n: 1, title: 'Post your single bud', body: 'Select your model, choose left or right, describe the condition, and set whether you\'re selling or looking to buy. Free to list.' },
              { n: 2, title: 'Get matched automatically', body: 'We match you with someone who has the opposite bud of the same model. You\'ll get an in-app notification and email the moment a match is found.' },
              { n: 3, title: 'Negotiate the price', body: 'Both sides move their offer using the +/− bar. When you\'re happy, lock in your offer. Once both sides lock, you\'re shown the midpoint and asked to confirm.' },
              { n: 4, title: 'Confirm and pay the fee', body: 'Both sides pay a small 5% platform fee each to unlock chat. You have 24 hours each to pay — if either side doesn\'t pay in time, the match is cancelled and both are relisted.' },
              { n: 5, title: 'Chat and arrange the swap', body: 'Once both fees are paid, chat opens. Arrange a meetup or delivery, exchange your buds, reset using your case, and you\'re done.' },
            ]} />
          </Section>

          {/* Direct offers */}
          <Section title="Direct offers">
            <p className="text-sm text-gray-500 leading-relaxed">
              If you see a listing you want in Browse, you can skip the automatic matching and send a direct offer. Enter the amount you're willing to pay and the listing owner will see it in their profile. If they accept, you skip straight to the payment step — no negotiation bar needed. If they already have an active match, they'll need to cancel it first before accepting your offer.
            </p>
          </Section>

          {/* How pricing works */}
          <Section title="How pricing works">
            <div className="space-y-4 text-sm text-gray-500 leading-relaxed">
              <p>
                BudMatch suggests a starting price range based on the current Sri Lanka retail price of the full pair. Since you're trading one bud, the base value is roughly <strong className="text-gray-800">50% of the market price</strong>, then adjusted for:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Condition', body: 'Working perfectly (100%), Usable (60%), Unknown (30%)' },
                  { label: 'Age', body: 'Loses ~12% value per year from purchase, with a floor of 40%' },
                  { label: 'Demand', body: 'How many people need vs have this model affects the price up to ±30%' },
                ].map(c => (
                  <div key={c.label} className="bg-white border border-gray-200 rounded-2xl p-4">
                    <p className="font-medium text-gray-900 text-xs mb-1">{c.label}</p>
                    <p className="text-xs text-gray-400">{c.body}</p>
                  </div>
                ))}
              </div>
              <p>
                The negotiation bar shows a range of ±30% around the anchor price, with a minimum spread of LKR 300. You can move in LKR 100 steps. You're never forced to accept the suggested price — it's just a fair starting point.
              </p>
            </div>
          </Section>

          {/* How negotiation works */}
          <Section title="How negotiation works">
            <Steps items={[
              { n: 1, title: 'Move your offer', body: 'Use the − LKR 100 and + LKR 100 buttons to move your offer within the range. Each side moves independently — you can\'t see their exact offer until both lock in.' },
              { n: 2, title: 'Lock in', body: 'When you\'re happy with your offer, click "Lock my offer". Moving again after locking automatically unlocks you.' },
              { n: 3, title: 'Both locked — midpoint shown', body: 'When both sides lock, a confirmation screen appears showing the midpoint of your two offers. Both must confirm for the deal to go through.' },
              { n: 4, title: 'Confirm or renegotiate', body: 'Either side can click Renegotiate to unlock both and go again — up to 3 times. After 3 rounds the deal must be confirmed. If both confirm, the deal is set and payment begins.' },
              { n: 5, title: 'Match their price', body: 'After the first renegotiation, a "Match their price" button appears. Clicking it snaps your offer to theirs and auto-locks — the fastest way to close a deal.' },
            ]} />
          </Section>

          {/* Platform fee */}
          <Section title="Platform fee">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 text-sm space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-500">Fee per side</span>
                <span className="font-semibold text-gray-900">5% of agreed price</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-500">Minimum fee</span>
                <span className="font-semibold text-gray-900">LKR 100</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <span className="text-gray-500">What it covers</span>
                <span className="text-gray-700">Matching, negotiation, secure chat</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Payment window</span>
                <span className="text-gray-700">24 hours per side after confirmation</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              The fee is paid to BudMatch — it is not part of the earbud price. The actual payment for the bud itself is arranged directly between buyer and seller.
            </p>
          </Section>

          {/* Refunds */}
          <Section title="Refunds">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-700 mb-4">
              ⚠️ Platform fees are only refunded in one specific situation — see below.
            </div>
            <Steps items={[
              { n: '✓', title: 'Refund — partner didn\'t pay in time', body: 'If you paid your 5% but your match partner didn\'t pay within 24 hours, the match is cancelled and your fee is refunded within 3 business days to your original payment method.' },
              { n: '✗', title: 'No refund — both paid', body: 'Once both sides have paid and chat is unlocked, the fee is non-refundable regardless of what happens during the exchange.' },
              { n: '✗', title: 'No refund — bud condition dispute', body: 'BudMatch does not verify listing condition. If the bud turns out different from what was described, this is between buyer and seller — the platform fee is not refunded.' },
              { n: '✗', title: 'No refund — changed your mind', body: 'If you paid but then decide not to go through with the exchange, the fee is not refunded.' },
            ]} />
            <p className="text-sm text-gray-400 mt-4">
              For refund requests contact <a href="mailto:hello@budmatch.site" className="text-gray-600 underline">hello@budmatch.site</a> with your match ID and payment date.
            </p>
          </Section>

          {/* Match cancellation */}
          <Section title="Match cancellation">
            <div className="space-y-3 text-sm text-gray-500 leading-relaxed">
              <p>A match is cancelled automatically if:</p>
              <ul className="list-disc ml-5 space-y-1.5">
                <li>Either party doesn't pay the platform fee within 24 hours of confirmation</li>
                <li>Either party deletes their listing</li>
                <li>Either party switches their listing type (selling → buying)</li>
              </ul>
              <p className="mt-2">
                When a match is cancelled, both listings are returned to the pool and matched with new compatible listings automatically. The two cancelled parties cannot be rematched with each other.
              </p>
            </div>
          </Section>

          {/* How to reset */}
          <Section title="How to reset and re-pair after a trade">
            <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-xl px-4 py-3 text-sm text-amber-700 mb-5">
              You only need your own charging case. Do not use two cases — one case is all you need.
            </div>
            <Steps items={[
              { n: 1, title: 'Forget the device', body: 'Go to your phone\'s Bluetooth settings and forget/unpair the old earbuds entry entirely before doing anything else.' },
              { n: 2, title: 'Place both buds in your case', body: 'Your original surviving bud and the new one from the trade. Make sure both are seated and charging.' },
              { n: 3, title: 'Factory reset', body: 'The exact method depends on your brand — see the brand guide below.' },
              { n: 4, title: 'Pair as a new device', body: 'Take the buds out of the case — they enter pairing mode automatically. Find them in your Bluetooth list and connect.' },
            ]} />
          </Section>

          {/* Reset by brand */}
          <Section title="Reset method by brand">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { name: 'Samsung Galaxy Buds', method: 'Place both buds in case. Open Galaxy Wearable app → Earbud settings → Reset. Or close case lid for 7 sec, reopen.' },
                { name: 'Sony WF series', method: 'Place buds in open case. Press and hold touch sensors on both buds for 15 sec until LED flashes red then turns off.' },
                { name: 'JBL TWS', method: 'With both buds out of case and connected, double-tap right bud then on third tap hold 5+ sec until they shut off. Some models: hold case button 10 sec.' },
                { name: 'Nothing / CMF', method: 'Place buds in case, keep lid open. Press and hold button on back of case for 15–20 sec until LED flashes orange then off.' },
                { name: 'Soundcore', method: 'Place buds in case while charging. Press and hold button on both buds 3 sec until LED flashes red 3 times then turns white.' },
                { name: 'Realme Buds', method: 'Place both buds in case. Press and hold case button for 10 sec until LED scrolls. Take buds out to pair fresh.' },
                { name: 'OnePlus Buds', method: 'Place both buds in case. Close lid for 5 sec, reopen. Or use the HeyMelody app → device settings → reset.' },
                { name: 'Xiaomi / Redmi Buds', method: 'Place both buds in case. Press and hold case button for 10 sec until LED flashes 3 times. Pair fresh via Bluetooth.' },
                { name: 'Oppo Enco', method: 'Place buds in case. Hold case button 10 sec until LED blinks rapidly. Open lid to enter pairing mode.' },
                { name: 'Huawei FreeBuds', method: 'Place buds in open case. Touch and hold both bud touch areas for 15 sec until LED flashes white rapidly.' },
                { name: 'Haylou', method: 'Place buds in case. Long-press the button on the case for 8–10 sec until LED flashes. Or long-press both bud touch sensors 5 sec outside of case.' },
                { name: 'Bose QC Earbuds', method: 'Place buds in case, close lid 30 sec. Open lid, press and hold case button 30 sec until LED flashes white twice then blinks blue.' },
                { name: 'Jabra Elite', method: 'Place buds in case. Press and hold button inside case for 10 sec until LED flashes purple. Buds will enter pairing mode on removal.' },
                { name: 'JBL Tour Pro 2', method: 'Use the touchscreen on the case: tap Settings → Reset. This model has a built-in display for case controls.' },
              ].map(b => (
                <div key={b.name} className="bg-white border border-gray-200 rounded-2xl p-4">
                  <p className="text-sm font-medium text-gray-900 mb-1.5">{b.name}</p>
                  <p className="text-xs text-gray-400 leading-relaxed">{b.method}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* FAQ */}
          <Section title="Frequently asked questions">
            <div className="space-y-2">
              {[
                {
                  q: 'Do I need to send my charging case with the bud?',
                  a: 'No. You keep your own case. The buyer uses their own case to reset and pair the new bud. This is exactly how the system is designed — one case is all you need.'
                },
                {
                  q: 'Will the traded bud work with my case?',
                  a: 'For all brands on BudMatch — yes. After a factory reset the case will re-pair with both buds regardless of their origin. Each bud has its own Bluetooth address; the case does not lock to specific bud serials on these brands.'
                },
                {
                  q: 'Why are Apple AirPods not on BudMatch?',
                  a: 'Apple cryptographically pairs each AirPod to its original case. Mixing a bud from one pair with another person\'s case requires Apple Service to reprogram the bud — it can\'t be done at home. Since we can\'t guarantee the reset will work, we don\'t list AirPods.'
                },
                {
                  q: 'What if the reset doesn\'t work?',
                  a: 'First make sure you\'ve fully forgotten the device in Bluetooth settings before resetting. Check that both buds are charging properly — dirty contacts are a common culprit. If still stuck, email hello@budmatch.site with your model and we\'ll help troubleshoot.'
                },
                {
                  q: 'Can I make an offer without posting a listing?',
                  a: 'Yes. You can browse listings and send direct offers without posting your own listing. You just need to be logged in.'
                },
                {
                  q: 'What happens if my match doesn\'t pay?',
                  a: 'If you paid but your partner doesn\'t pay within 24 hours, the match is cancelled automatically. Your platform fee is refunded, and both listings go back into the pool to be matched again.'
                },
                {
                  q: 'Can I renegotiate after confirming?',
                  a: 'Yes — up to 3 times per match. After the 3rd round, both sides must confirm the midpoint and it cannot be renegotiated again. Once either side has paid the fee, renegotiation is no longer available.'
                },
                {
                  q: 'Is BudMatch free to use?',
                  a: 'Listing and matching is completely free. BudMatch only charges a 5% platform fee (minimum LKR 100) per side when both parties confirm a deal and unlock chat.'
                },
                {
                  q: 'What if my match turns out to be a scammer?',
                  a: 'Meet in a public place or use a trusted courier with cash-on-delivery. Always test the bud before completing the exchange. Report suspicious accounts to hello@budmatch.site.'
                },
                {
                  q: 'How do partner shops work?',
                  a: 'Partner shops are verified local electronics and phone accessory stores. You can drop off or collect earbuds through them instead of meeting a stranger directly. Shops earn a small commission per completed match they refer.'
                },
              ].map((item, i) => (
                <FaqItem key={i} q={item.q} a={item.a} />
              ))}
            </div>
          </Section>

          {/* Contact */}
          <Section title="Contact us">
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              {[
                { label: 'Email', value: <a href="mailto:hello@budmatch.site" className="text-blue-600 hover:underline">hello@budmatch.site</a> },
                { label: 'Response', value: 'Within 24 hours — usually faster' },
                { label: 'Best for', value: 'Reset help, listing issues, dispute reports, refund requests, feedback' },
                { label: 'Based in', value: 'Sri Lanka — serving islandwide' },
              ].map((row, i, arr) => (
                <div key={row.label} className={`flex items-start gap-4 px-5 py-4 text-sm ${i < arr.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  <span className="text-gray-400 w-24 flex-shrink-0 text-xs mt-0.5">{row.label}</span>
                  <span className="text-gray-700">{row.value}</span>
                </div>
              ))}
            </div>
          </Section>

        </div>

        <div className="pt-10 border-t border-gray-200 text-center mt-10">
          <p className="text-xs text-gray-400">BudMatch · Sri Lanka</p>
        </div>
      </div>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">{title}</h2>
      {children}
    </section>
  )
}

function Steps({ items }: { items: { n: number | string; title: string; body: string }[] }) {
  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={i} className="flex gap-3 items-start">
          <div className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 flex-shrink-0 mt-0.5">
            {item.n}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 mb-0.5">{item.title}</p>
            <p className="text-sm text-gray-400 leading-relaxed">{item.body}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="bg-white border border-gray-200 rounded-2xl overflow-hidden group">
      <summary className="flex items-center justify-between px-5 py-4 cursor-pointer text-sm font-medium text-gray-900 select-none list-none hover:bg-gray-50 transition">
        {q}
        <span className="text-gray-400 text-xs ml-3 flex-shrink-0 transition-transform group-open:rotate-180">▼</span>
      </summary>
      <div className="px-5 pb-4 text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-3">
        {a}
      </div>
    </details>
  )
}