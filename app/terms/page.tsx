export default function TermsPage() {
  const sections = [
    {
      title: 'ACCEPTANCE OF TERMS',
      body: 'By accessing or using the Rich Conflicts website and placing an order, you agree to be bound by these Terms of Service. If you do not agree, please do not use our site.',
    },
    {
      title: 'PRODUCTS AND PRICING',
      body: 'All prices are displayed in USD and are subject to change without notice. We reserve the right to limit quantities or refuse orders at our discretion. Product images are for illustrative purposes; actual colours may vary slightly due to screen calibration.',
    },
    {
      title: 'ALL SALES ARE FINAL',
      body: 'Due to the limited-drop nature of our products, all sales are final. We do not accept returns or exchanges for change of mind. Refunds are only issued for faulty, damaged, or incorrectly dispatched items. See our Returns Policy for details.',
    },
    {
      title: 'PAYMENT',
      body: 'We accept major credit/debit cards and digital wallets via Stripe. Payment is taken at time of order. All transactions are secured with SSL encryption.',
    },
    {
      title: 'SHIPPING AND DELIVERY',
      body: 'We aim to dispatch within 1–2 business days. Delivery times are estimates only and we are not responsible for delays caused by couriers or customs. Risk of loss passes to you upon dispatch.',
    },
    {
      title: 'INTELLECTUAL PROPERTY',
      body: 'All content on this site — including designs, graphics, text, and branding — is the property of Rich Conflicts and may not be reproduced, distributed, or used without written permission.',
    },
    {
      title: 'LIMITATION OF LIABILITY',
      body: 'To the maximum extent permitted by law, Rich Conflicts shall not be liable for any indirect, incidental, or consequential damages arising from your use of the site or products.',
    },
    {
      title: 'GOVERNING LAW',
      body: 'These terms are governed by the laws of the United Kingdom. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.',
    },
    {
      title: 'CONTACT',
      body: 'For questions about these terms, contact us at legal@richconflicts.com.',
    },
  ]

  return (
    <div className="pt-14 min-h-screen">
      <div className="max-w-[800px] mx-auto px-5 py-14">
        <p className="font-mono text-[9px] tracking-[0.3em] text-rc-muted mb-2">LEGAL</p>
        <h1 className="font-display text-display-md text-white mb-2">TERMS OF SERVICE</h1>
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
