import Link from "next/link";

export const metadata = {
  title: "Terms of Service — PitPass",
  description: "The terms and conditions governing your use of PitPass.",
};

const LAST_UPDATED = "March 28, 2026";

export default function TermsOfServicePage() {
  return (
    <div className="font-outfit bg-black text-on-surface min-h-screen antialiased">
      {/* Nav */}
      <header className="border-b border-white/[0.06] px-6 py-5">
        <div className="max-w-[780px] mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="font-outfit text-2xl font-black tracking-[-0.04em] text-btn-red no-underline"
          >
            PitPass
          </Link>
          <Link
            href="/"
            className="font-outfit text-sm text-on-surface/60 hover:text-white transition-colors duration-200 no-underline"
          >
            &larr; Back to Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[780px] mx-auto px-6 py-16">
        <p className="text-[0.8rem] text-on-surface/40 mb-3 tracking-widest uppercase">
          Legal
        </p>
        <h1 className="font-outfit text-4xl font-black tracking-[-0.04em] text-white mb-3">
          Terms of Service
        </h1>
        <p className="text-sm text-on-surface/50 mb-14">
          Last updated: {LAST_UPDATED}
        </p>

        <div className="space-y-12 text-[0.95rem] leading-[1.75] text-on-surface/80">

          <section>
            <h2 className="text-white font-semibold text-lg mb-3 tracking-[-0.02em]">1. Agreement to Terms</h2>
            <p>
              By accessing or using PitPass (&quot;Platform&quot;, &quot;Service&quot;), operated by PitPass
              (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;), you agree to be bound by these Terms of Service. If you
              do not agree to these terms, you may not use our Service. These terms apply to
              all visitors, customers, and venue administrators who access PitPass.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3 tracking-[-0.02em]">2. Description of Service</h2>
            <p>
              PitPass is an online platform that enables users to discover sim racing venues,
              browse available rigs, and book time slots at participating gaming facilities.
              Venue administrators can use PitPass to manage their listings, rigs, walk-in
              slots, and customer check-ins via QR code scanning. PitPass acts as an
              intermediary between customers and venues and does not own or operate any
              of the listed venues.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3 tracking-[-0.02em]">3. Accounts</h2>
            <p className="mb-4">
              To access certain features, you must create an account. When you do:
            </p>
            <ul className="list-none space-y-2 pl-0">
              {[
                "You must provide accurate and complete information",
                "You are responsible for maintaining the security of your account credentials",
                "You must notify us immediately of any unauthorized access to your account",
                "You may not share your account or use another person's account",
                "You must be at least 13 years of age to create an account",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-btn-red" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4">
              We reserve the right to suspend or terminate accounts that violate these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3 tracking-[-0.02em]">4. Bookings & Payments</h2>
            <p className="mb-4">
              When you make a booking through PitPass:
            </p>
            <ul className="list-none space-y-2 pl-0">
              {[
                "A booking constitutes an agreement between you and the venue for the selected time slot(s)",
                "Payment is processed at the time of booking through our secure payment provider",
                "You will receive a confirmation email and a QR check-in token upon successful payment",
                "Prices displayed are inclusive of any applicable taxes unless stated otherwise",
                "PitPass reserves the right to modify pricing at any time; changes will not affect confirmed bookings",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-btn-red" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3 tracking-[-0.02em]">5. Cancellations & Modifications</h2>
            <p className="mb-4">
              You may modify your booking (date or time slots) subject to the following conditions:
            </p>
            <ul className="list-none space-y-2 pl-0">
              {[
                "Modifications can be made up to 1 hour before the earliest booked slot",
                "Same-day modifications are subject to rig availability",
                "Cancellation policies are set by individual venues and displayed at the time of booking",
                "PitPass is not responsible for refunds issued outside our platform's cancellation window",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-btn-red" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3 tracking-[-0.02em]">6. QR Check-In System</h2>
            <p>
              Each confirmed booking generates a unique QR check-in token. This token is
              personal to your booking and must be presented to venue staff upon arrival.
              Sharing, duplicating, or transferring your QR token to another person is
              prohibited and may result in your booking being voided without refund. PitPass
              and participating venues reserve the right to deny entry if the presented token
              cannot be verified.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3 tracking-[-0.02em]">7. User Conduct</h2>
            <p className="mb-4">When using PitPass, you agree not to:</p>
            <ul className="list-none space-y-2 pl-0">
              {[
                "Use the platform for any unlawful purpose or in violation of applicable regulations",
                "Attempt to gain unauthorized access to any part of the platform or its infrastructure",
                "Submit false or misleading information during registration or booking",
                "Abuse the QR check-in system or attempt to forge, duplicate, or resell tokens",
                "Disrupt the experience of other users or venue operators",
                "Scrape, crawl, or otherwise extract data from PitPass without written permission",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-btn-red" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3 tracking-[-0.02em]">8. Venue Administrators</h2>
            <p className="mb-4">
              If you access PitPass as a venue administrator, you additionally agree to:
            </p>
            <ul className="list-none space-y-2 pl-0">
              {[
                "Provide accurate venue and rig information at all times",
                "Honor all confirmed bookings made through the platform",
                "Use the QR scanner exclusively for verifying legitimate PitPass bookings",
                "Maintain the confidentiality of your admin credentials",
                "Promptly report any discrepancies or system issues to PitPass support",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-btn-red" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3 tracking-[-0.02em]">9. Intellectual Property</h2>
            <p>
              All content on PitPass — including the name, logo, UI design, code, and copy —
              is the property of PitPass and protected by applicable intellectual property laws.
              You may not reproduce, distribute, or create derivative works from any part of
              the Platform without our prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3 tracking-[-0.02em]">10. Disclaimers</h2>
            <p className="mb-4">
              PitPass is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind,
              express or implied. We do not warrant that:
            </p>
            <ul className="list-none space-y-2 pl-0">
              {[
                "The Service will be uninterrupted, error-free, or secure at all times",
                "Venue listings, rig availability, or pricing information will always be accurate",
                "Results obtained through the platform will meet your expectations",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-btn-red" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4">
              PitPass is not responsible for any disputes between customers and venues,
              including injury, property damage, or unsatisfactory sessions at a listed venue.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3 tracking-[-0.02em]">11. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, PitPass and its affiliates, officers,
              employees, and agents shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages — including loss of data, revenue, or profits —
              arising out of or in connection with your use of the Service, even if we have been
              advised of the possibility of such damages. Our total liability to you for any
              claim shall not exceed the amount paid by you to PitPass in the 12 months
              preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3 tracking-[-0.02em]">12. Changes to Terms</h2>
            <p>
              We reserve the right to update these Terms of Service at any time. When we make
              material changes, we will update the &quot;Last updated&quot; date above. Continued use of
              PitPass after changes take effect constitutes acceptance of the revised Terms.
              We encourage you to review these terms periodically.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3 tracking-[-0.02em]">13. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with applicable law.
              Any disputes arising from these Terms or your use of PitPass shall be subject to
              the exclusive jurisdiction of the competent courts in the jurisdiction where
              PitPass operates.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3 tracking-[-0.02em]">14. Contact Us</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 text-sm">
              <p className="text-white font-semibold mb-1">PitPass</p>
              <p className="text-on-surface/60">legal@pitpass.app</p>
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] mt-16 px-6 py-8">
        <div className="max-w-[780px] mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-on-surface/40 font-outfit">
          <span>&copy;{new Date().getFullYear()} PitPass. All Rights Reserved.</span>
          <div className="flex gap-5">
            <Link href="/privacy-policy" className="hover:text-white transition-colors duration-200 no-underline">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors duration-200 no-underline text-btn-red">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
