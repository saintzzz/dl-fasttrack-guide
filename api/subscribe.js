// POST /api/subscribe {email} -> Resend audience + checklist email
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { email } = req.body || {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'invalid email' });
  const key = process.env.RESEND_API_KEY;
  if (!key) return res.status(500).json({ error: 'not configured' });
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  try {
    if (audienceId) {
      await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, unsubscribed: false }),
      });
    }
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Vietnam Arrival Guide <guide@vieschool.com>',
        to: [email],
        subject: 'Your Vietnam airport arrival checklist',
        html: `<p>Here is the checklist - save it offline:</p>
<ol>
<li><strong>Passport</strong> - 6+ months validity from entry date, 2 blank pages.</li>
<li><strong>E-visa printed</strong> - border officers still ask for paper; screenshot the QR too.</li>
<li><strong>Onward/return ticket</strong> - occasionally checked at immigration for visa-free entries.</li>
<li><strong>Hotel booking (first night)</strong> - address needed for the arrival declaration.</li>
<li><strong>Arrival card</strong> - mostly abolished for e-visa holders; airline may still hand them out.</li>
<li><strong>Cash</strong> - ~500k VND for transport + sim; airport ATMs sit after customs, not before.</li>
<li><strong>SIM plan</strong> - counters after baggage are fine, but prices at the door are better outside arrivals.</li>
<li><strong>Immigration timing</strong> - midday and evening banks mean 30-60+ min queues at SGN/HAN; a meet-and-greet skips the line entirely.</li>
</ol>
<p>Flying soon? <a href="https://fasttrack.vieschool.com/vietnam-immigration-wait-times.html">Check typical queue times for your airport</a> or <a href="https://fasttrack.aal.vn/en/booking?ref=DLDIGITAL&utm_source=checklist-email">book a fast track agent</a> - confirmed within 2 working hours, pay on meet.</p>
<p style="color:#888;font-size:12px">Vietnam Arrival Guide - one email, no spam. Reply STOP to unsubscribe.</p>`,
      }),
    });
    const j = await r.json();
    if (!r.ok) return res.status(502).json({ error: j.message || 'send failed' });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'send failed' });
  }
}
