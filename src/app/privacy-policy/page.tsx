import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — PitPass",
  description: "How PitPass collects, uses, and protects your personal information.",
};

const LAST_UPDATED = "March 28, 2026";

export default function PrivacyPolicyPage() {
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
          Privacy Policy
        </h1>
        <p className="text-sm text-on-surface/50 mb-14">
          Last updated: {LAST_UPDATED}
        </p>

        <div className="space-y-12 text-[0.95rem] leading-[1.75] text-on-surface/80">

          <section>
            <h2 className="text-white font-semibold text-lg mb-3 tracking-[-0.02em]">1. Introduction</h2>
            <p>
              PitPass (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the PitPass platform, a sim racing
              venue discovery and booking service. This Privacy Policy explains how we collect,
              use, disclose, and safeguard your information when you use our website and services.
              Please read it carefully. By using PitPass, you consent to the practices described
              in this policy.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3 tracking-[-0.02em]">2. Information We Collect</h2>
            <p className="mb-4">We collect information you provide directly to us, including:</p>
            <ul className="list-none space-y-2 pl-0">
              {[
                "Name and email address when you create an account",
                "Payment details processed securely through our payment provider",
                "Booking history, selected rigs, time slots, and venue preferences",
                "Profile information such as display name and password",
                "Communications you send to us via support channels",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-btn-red" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4">
              We also automatically collect certain technical information when you use our service,
              including IP address, browser type, operating system, referring URLs, and device
              identifiers. We use cookies and similar tracking technologies to maintain session
              state and improve your experience.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3 tracking-[-0.02em]">3. How We Use Your Information</h2>
            <p className="mb-4">We use the information we collect to:</p>
            <ul className="list-none space-y-2 pl-0">
              {[
                "Create and manage your account and bookings",
                "Process payments and send booking confirmations",
                "Generate and validate QR check-in tokens for venue access",
                "Send transactional emails such as booking receipts and reminders",
                "Respond to your support requests and feedback",
                "Improve, personalize, and expand our platform and services",
                "Detect, prevent, and address technical issues or fraudulent activity",
                "Comply with legal obligations",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-btn-red" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3 tracking-[-0.02em]">4. Sharing of Information</h2>
            <p className="mb-4">
              We do not sell your personal information. We may share your information with:
            </p>
            <ul className="list-none space-y-2 pl-0">
              {[
                "Venue operators — to fulfill your bookings and enable QR check-in at their location",
                "Service providers — such as Supabase (database and authentication) and payment processors, who assist us in operating the platform",
                "Legal authorities — when required by law, court order, or to protect the rights and safety of PitPass and its users",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-btn-red" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3 tracking-[-0.02em]">5. Authentication & Third-Party Sign-In</h2>
            <p>
              We offer sign-in via Google OAuth in addition to email and password. When you
              choose to sign in with Google, Google may share your name, email address, and
              profile picture with us. We only use this data to create and identify your account.
              Your use of Google sign-in is also governed by{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-btn-red hover:underline"
              >
                Google&apos;s Privacy Policy
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3 tracking-[-0.02em]">6. Data Retention</h2>
            <p>
              We retain your personal information for as long as your account is active or as
              needed to provide you services. Booking records may be retained for up to 3 years
              for accounting and dispute resolution purposes. You may request deletion of your
              account and associated data at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3 tracking-[-0.02em]">7. Your Rights</h2>
            <p className="mb-4">Depending on your location, you may have the right to:</p>
            <ul className="list-none space-y-2 pl-0">
              {[
                "Access the personal information we hold about you",
                "Correct inaccurate or incomplete information via your Profile page",
                "Request deletion of your account and personal data",
                "Object to or restrict certain types of processing",
                "Data portability — receive a copy of your data in a structured format",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-btn-red" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4">
              To exercise any of these rights, please contact us at the address below.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3 tracking-[-0.02em]">8. Security</h2>
            <p>
              We implement industry-standard security measures including HTTPS encryption,
              row-level security policies in our database, and hashed password storage via
              Supabase Auth. While we take reasonable steps to protect your information, no
              method of transmission over the internet is 100% secure, and we cannot guarantee
              absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3 tracking-[-0.02em]">9. Children&apos;s Privacy</h2>
            <p>
              PitPass is not directed to children under the age of 13. We do not knowingly
              collect personal information from children under 13. If you believe we have
              inadvertently collected such information, please contact us and we will delete it
              promptly.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3 tracking-[-0.02em]">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. When we do, we will revise
              the &quot;Last updated&quot; date at the top of this page. Continued use of PitPass after
              changes are posted constitutes your acceptance of the revised policy. We encourage
              you to review this page periodically.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold text-lg mb-3 tracking-[-0.02em]">11. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or our data practices, please
              contact us at:
            </p>
            <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 text-sm">
              <p className="text-white font-semibold mb-1">PitPass</p>
              <p className="text-on-surface/60">privacy@pitpass.app</p>
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] mt-16 px-6 py-8">
        <div className="max-w-[780px] mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-on-surface/40 font-outfit">
          <span>&copy;{new Date().getFullYear()} PitPass. All Rights Reserved.</span>
          <div className="flex gap-5">
            <Link href="/privacy-policy" className="hover:text-white transition-colors duration-200 no-underline text-btn-red">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors duration-200 no-underline">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
