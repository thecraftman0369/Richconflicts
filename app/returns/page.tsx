export default function ReturnsPage() {
  return (
    <div className="pt-14 min-h-screen">
      <div className="max-w-[900px] mx-auto px-5 py-14">
        <p className="font-mono text-[9px] tracking-[0.3em] text-rc-muted mb-2">INFORMATION</p>
        <h1 className="font-display text-display-md text-white mb-10">RETURNS & REFUNDS</h1>

        <div className="space-y-10 font-mono text-[11px] text-zinc-400 leading-relaxed">

          <div className="border border-white/10 rounded-sm p-5 bg-white/[0.02]">
            <p className="text-white font-mono text-[10px] tracking-[0.18em] mb-2">ALL SALES ARE FINAL</p>
            <p>Due to the limited-run nature of our drops, we do not accept returns or exchanges for change of mind. Please review your order carefully before completing your purchase.</p>
          </div>

          <section className="space-y-4">
            <p className="font-mono text-[10px] tracking-[0.22em] text-white">FAULTY OR DAMAGED ITEMS</p>
            <p>If your item arrives faulty, damaged, or not as described, you are entitled to a full refund or replacement. Please contact us within 14 days of delivery with:</p>
            <ul className="space-y-2 pl-4">
              {['Your order number', 'A description of the fault', 'Clear photos of the item and packaging'].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-rc-muted mt-0.5">—</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-4">
            <p className="font-mono text-[10px] tracking-[0.22em] text-white">WRONG ITEM RECEIVED</p>
            <p>If you received the wrong item, contact us within 7 days of delivery. We will arrange collection and dispatch the correct item at no additional cost.</p>
          </section>

          <section className="space-y-4">
            <p className="font-mono text-[10px] tracking-[0.22em] text-white">REFUND PROCESS</p>
            <p>Approved refunds are processed within 5–7 business days and returned to your original payment method. You will receive an email confirmation once the refund has been issued.</p>
          </section>

          <section className="space-y-4">
            <p className="font-mono text-[10px] tracking-[0.22em] text-white">HOW TO START A CLAIM</p>
            <p>Sign in to your account and use the Returns/Refund option on your order, or{' '}
              <a href="/contact" className="text-white underline underline-offset-2">contact us directly</a>.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
