export default function TermsAndConditions() {
  return (
    <main className="min-h-screen bg-[#f5f5f0]">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <a href="/" className="text-sm text-gray-400 hover:text-gray-700 transition">← Back to BudMatch</a>

        <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-2">Terms &amp; Conditions</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: April 2025</p>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm space-y-8 text-sm text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">1. About BudMatch</h2>
            <p>BudMatch is an online marketplace that connects individuals who each own one earbud from the same model, facilitating the negotiation and sale between them. We act as a platform intermediary — we are not a party to the transaction between buyer and seller.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">2. Eligibility</h2>
            <p>You must be at least 18 years old and a resident of Sri Lanka to use BudMatch. By using the platform you confirm that the information you provide is accurate and that you have the right to sell any item you list.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">3. Listings</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Each listing must represent a real, physical earbud in your possession.</li>
              <li>You are responsible for accurately describing the condition of your item.</li>
              <li>Fraudulent, duplicate, or misleading listings will be removed and your account suspended.</li>
              <li>BudMatch reserves the right to remove any listing at its discretion.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">4. Matching and negotiation</h2>
            <p>Our algorithm automatically pairs compatible listings. Matched users negotiate a price within the system. Once both parties agree and the agreed price is locked, it is binding — you are committing to complete the transaction at that price.</p>
            <p className="mt-2">Renegotiation is available up to 3 times per match. If no agreement is reached, the match may be cancelled and both listings returned to the pool.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">5. Platform fee</h2>
            <p>Both the buyer and seller each pay a platform fee of <strong>5% of the agreed price</strong> (minimum LKR 100). This fee is paid to BudMatch via PayHere to unlock chat and confirm the deal. The fee is non-refundable except as stated in our Refund Policy.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">6. Payment window</h2>
            <p>Once a price is agreed, both parties have <strong>24 hours</strong> to pay their platform fee. If one party pays and the other does not within 24 hours, the match is automatically cancelled and a refund is issued to the party who paid. See our Refund Policy for details.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">7. Post-payment obligations</h2>
            <p>After both fees are paid and chat is unlocked, buyer and seller are responsible for arranging the physical handoff of the earbud. BudMatch is not responsible for the condition of items received, disputes over delivery, or any physical transaction between users.</p>
            <p className="mt-2">We recommend using a tracked courier service and meeting in a public place for in-person exchanges.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">8. Prohibited conduct</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Creating fake listings or impersonating others.</li>
              <li>Attempting to transact outside the platform to avoid fees after being matched.</li>
              <li>Harassing, threatening, or deceiving other users.</li>
              <li>Using the platform for any unlawful purpose.</li>
            </ul>
            <p className="mt-2">Violation of these rules may result in immediate account termination without refund.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">9. Limitation of liability</h2>
            <p>BudMatch is provided "as is". We make no guarantees about match availability, platform uptime, or the outcome of any transaction. To the maximum extent permitted by Sri Lankan law, BudMatch's liability is limited to the platform fees you paid in the relevant transaction.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">10. Governing law</h2>
            <p>These terms are governed by the laws of the Democratic Socialist Republic of Sri Lanka. Any disputes will be resolved in the courts of Sri Lanka.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">11. Changes to terms</h2>
            <p>We may update these terms at any time. Continued use of BudMatch after changes constitutes acceptance of the updated terms.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3">12. Contact</h2>
            <p>Questions? Email us at <strong>hello@budmatch.site</strong>.</p>
          </section>

        </div>
      </div>
    </main>
  )
}
