export default function ShippingPage() {
  return (
    <div className="pt-14 min-h-screen">
      <div className="max-w-[900px] mx-auto px-5 py-14">
        <p className="font-mono text-[9px] tracking-[0.3em] text-rc-muted mb-2">INFORMATION</p>
        <h1 className="font-display text-display-md text-white mb-10">SHIPPING</h1>

        <div className="space-y-10 font-mono text-[11px] text-zinc-400 leading-relaxed">

          <section className="border border-rc-border rounded-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-rc-border bg-rc-subtle">
              <p className="font-mono text-[10px] tracking-[0.22em] text-white">DELIVERY OPTIONS</p>
            </div>
            <div className="divide-y divide-rc-border">
              {[
                { method: 'STANDARD', time: '3–5 business days', cost: '$9.95 (FREE over $150)' },
                { method: 'EXPRESS',  time: '1–2 business days', cost: '$14.95' },
              ].map((row) => (
                <div key={row.method} className="grid grid-cols-3 gap-4 px-6 py-4">
                  <p className="text-white tracking-[0.1em]">{row.method}</p>
                  <p>{row.time}</p>
                  <p>{row.cost}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <p className="font-mono text-[10px] tracking-[0.22em] text-white">DISPATCH</p>
            <p>Orders are processed and dispatched within 1–2 business days of payment confirmation. You will receive a dispatch confirmation email with tracking information once your order has shipped.</p>
          </section>

          <section className="space-y-4">
            <p className="font-mono text-[10px] tracking-[0.22em] text-white">INTERNATIONAL SHIPPING</p>
            <p>We ship worldwide. International delivery times vary by destination and are typically 7–14 business days. Customs duties and import taxes are the responsibility of the recipient and are not included in our shipping fees.</p>
          </section>

          <section className="space-y-4">
            <p className="font-mono text-[10px] tracking-[0.22em] text-white">TRACKING</p>
            <p>All orders include a tracking number sent via email at dispatch. You can also view your order status in your{' '}
              <a href="/dashboard" className="text-white underline underline-offset-2">account dashboard</a>.
            </p>
          </section>

          <section className="space-y-4">
            <p className="font-mono text-[10px] tracking-[0.22em] text-white">MISSING ORDERS</p>
            <p>If your order has not arrived within the estimated timeframe, please{' '}
              <a href="/contact" className="text-white underline underline-offset-2">contact us</a>{' '}
              and we will investigate with the courier.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
