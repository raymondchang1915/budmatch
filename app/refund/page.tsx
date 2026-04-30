export default function RefundPolicy() {
  return (
    <main className="min-h-screen bg-[#f5f5f0]">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <a href="/" className="text-sm text-gray-400 hover:text-gray-700 transition">← Back to BudMatch</a>

        <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-2">Refund Policy</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: April 2025</p>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm space-y-8 text-sm text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">1. Overview</h2>
            <p>BudMatch charges a platform fee of <strong>10% of the agreed price</strong> (minimum LKR 100) from each party — buyer and seller — to confirm a deal and unlock chat. This policy explains when that fee is refunded and when it is not.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">2. Eligible refunds</h2>
            <p className="mb-3">You are entitled to a full refund of your platform fee in the following situations:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Partner did not pay within 24 hours:</strong> If you paid your fee but your matched counterpart failed to pay theirs within the 24-hour payment window, your match is cancelled and your fee is refunded in full.
              </li>
              <li>
                <strong>Technical error:</strong> If a payment was charged but the deal was not recorded on our system due to a technical fault on our end, you are entitled to a full refund.
              </li>
              <li>
                <strong>Duplicate charge:</strong> If you were charged more than once for the same transaction, the duplicate charge will be refunded.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">3. Non-refundable situations</h2>
            <p className="mb-3">Platform fees are <strong>not</strong> refunded in the following situations:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Both parties paid and chat was successfully unlocked — the service was delivered.</li>
              <li>You change your mind about the deal after both fees have been paid.</li>
              <li>A dispute arises between buyer and seller over the physical condition of the item or delivery — these are between the two parties and outside BudMatch's scope.</li>
              <li>Your account was suspended for a violation of our Terms of Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">4. Refund timeline</h2>
            <p>Eligible refunds are processed within <strong>5–10 business days</strong> back to your original payment method via PayHere. Processing times may vary depending on your bank.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">5. How to request a refund</h2>
            <p>If you believe you are eligible for a refund, email us at <strong>support@budmatch.site</strong> with:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Your registered email address</li>
              <li>The match ID (visible on the listing page)</li>
              <li>A brief description of the issue</li>
            </ul>
            <p className="mt-3">We will review and respond within 3 business days.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">6. Contact</h2>
            <p>For any payment or refund queries, contact us at <strong>support@budmatch.site</strong>.</p>
          </section>

        </div>
      </div>
    </main>
  )
}
