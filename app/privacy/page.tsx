export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-[#f5f5f0]">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <a href="/" className="text-sm text-gray-400 hover:text-gray-700 transition">← Back to BudMatch</a>

        <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: April 2025</p>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm space-y-8 text-sm text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">1. Who we are</h2>
            <p>BudMatch ("we", "our", "us") operates at budmatch.site. We connect buyers and sellers of individual earbuds in Sri Lanka. This policy explains what personal data we collect, how we use it, and your rights.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">2. Data we collect</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Account data:</strong> your email address when you sign in via Google or email link.</li>
              <li><strong>Listing data:</strong> earbud model, component, condition, location, asking price, and any optional details you provide.</li>
              <li><strong>Transaction data:</strong> agreed prices, platform fees, and payment status (we do not store card or bank details — payments are processed by PayHere).</li>
              <li><strong>Chat messages:</strong> messages sent between matched users after payment.</li>
              <li><strong>Usage data:</strong> pages visited, actions taken, and timestamps — collected via standard server logs.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">3. How we use your data</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To match you with compatible listings and run the negotiation system.</li>
              <li>To send transactional emails (match notifications, payment confirmations).</li>
              <li>To process platform fee payments via PayHere.</li>
              <li>To prevent fraud and enforce our Terms of Service.</li>
              <li>To improve the platform based on aggregate usage patterns.</li>
            </ul>
            <p className="mt-3">We do not sell your personal data to third parties. We do not use your data for advertising.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">4. Data sharing</h2>
            <p className="mb-2">We share limited data only as required to operate the service:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Supabase</strong> — database and authentication (EU/US servers).</li>
              <li><strong>PayHere</strong> — payment processing (Sri Lanka). Your name and email are shared with PayHere to complete transactions.</li>
              <li><strong>Resend</strong> — transactional email delivery.</li>
              <li><strong>Vercel</strong> — hosting and edge infrastructure.</li>
            </ul>
            <p className="mt-3">Your email is never shown publicly on listings. Only your username (the part before @) may be visible to your matched counterpart.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">5. Data retention</h2>
            <p>We retain your account and listing data for as long as your account is active. Completed match records are kept for 12 months for dispute resolution purposes, then deleted. You may request deletion at any time.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">6. Your rights</h2>
            <p>You may request access to, correction of, or deletion of your personal data at any time by emailing us at <strong>hello@budmatch.site</strong>. We will respond within 14 days.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">7. Cookies</h2>
            <p>We use only functional cookies required for authentication (Supabase session token). We do not use tracking or advertising cookies.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">8. Contact</h2>
            <p>Questions about this policy? Email us at <strong>hello@budmatch.site</strong>.</p>
          </section>

        </div>
      </div>
    </main>
  )
}
