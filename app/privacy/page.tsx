export default function PrivacyPage() {
  const sections = [
    {
      title: 'INFORMATION WE COLLECT',
      body: 'We collect information you provide directly to us when you create an account, place an order, or contact us. This includes your name, email address, shipping address, and payment information. Payment details are processed securely by Stripe and are never stored on our servers.',
    },
    {
      title: 'HOW WE USE YOUR INFORMATION',
      body: 'We use your information to process orders, send order confirmations and shipping updates, respond to your queries, and — if you opt in — send you information about new drops and promotions. We do not sell your personal data to third parties.',
    },
    {
      title: 'COOKIES',
      body: 'We use essential cookies to keep your shopping cart persistent across sessions and to maintain your login state. We do not use third-party advertising cookies.',
    },
    {
      title: 'DATA RETENTION',
      body: 'We retain your account information for as long as your account is active. Order data is retained for 7 years for legal and accounting purposes. You may request deletion of your account at any time by contacting us.',
    },
    {
      title: 'YOUR RIGHTS',
      body: 'Under applicable data protection law, you have the right to access, correct, or delete your personal data. To exercise these rights, contact us at privacy@richconflicts.com.',
    },
    {
      title: 'THIRD-PARTY SERVICES',
      body: 'We use Supabase for data storage, Stripe for payment processing, and Netlify/Vercel for hosting. Each of these services has its own privacy policy governing the data they process.',
    },
    {
      title: 'CHANGES TO THIS POLICY',
      body: 'We may update this policy from time to time. Changes will be posted on this page with an updated effective date.',
    },
  ]

  return (
    <div className="pt-14 min-h-screen">
      <div className="max-w-[800px] mx-auto px-5 py-14">
        <p className="font-mono text-[9px] tracking-[0.3em] text-rc-muted mb-2">LEGAL</p>
        <h1 className="font-display text-display-md text-white mb-2">PRIVACY POLICY</h1>
        <p className="font-mono text-[10px] text-rc-muted mb-10">Effective: June 2026</p>

        <div className="space-y-8">
          {sections.map((s) => (
            <section key={s.title}>
              <p className="font-mono text-[10px] tracking-[0.22em] text-white mb-3">{s.title}</p>
              <p className="font-mono text-[11px] text-zinc-400 leading-relaxed">{s.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
