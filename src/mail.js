// Sends the booking code by email through Resend (https://resend.com).
// Optional: without RESEND_API_KEY and MAIL_FROM the app works the same, it just skips the email.

const config = require('./config');

const KEY = process.env.RESEND_API_KEY || '';
const FROM = process.env.MAIL_FROM || '';
const enabled = Boolean(KEY && FROM);

const text = {
  sr: {
    subject: (b) => `Vaš termin ${b.dateLabel} u ${b.start} · ${config.shopName}`,
    body: (b) => [
      `Zdravo ${b.name},`,
      '',
      `Vaš termin je zakazan: ${b.serviceName}, ${b.dateLabel} u ${b.start}.`,
      '',
      `Kod rezervacije: ${b.code}`,
      '',
      `Termin možete otkazati najkasnije ${config.cancelCutoffMinutes / 60} h ranije na stranici "Otkazivanje rezervacije", uz ovaj email i kod.`,
      '',
      config.shopName,
      config.address,
      config.phone,
    ],
  },
  en: {
    subject: (b) => `Your appointment ${b.dateLabel} at ${b.start} · ${config.shopName}`,
    body: (b) => [
      `Hi ${b.name},`,
      '',
      `You're booked: ${b.serviceName}, ${b.dateLabel} at ${b.start}.`,
      '',
      `Booking code: ${b.code}`,
      '',
      `You can cancel up to ${config.cancelCutoffMinutes / 60} hours before on the "Cancel booking" page, using this email and code.`,
      '',
      config.shopName,
      config.address,
      config.phone,
    ],
  },
};

function dateLabel(date, lang) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(lang === 'en' ? 'en-GB' : 'sr-Latn-RS', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
  });
}

async function sendBookingCode(booking, email) {
  if (!enabled) return false;
  const lang = booking.lang === 'en' ? 'en' : 'sr';
  const t = text[lang];
  const b = {
    ...booking,
    dateLabel: dateLabel(booking.date, lang),
    serviceName: lang === 'en' ? booking.service.name_en : booking.service.name_sr,
  };
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [email], subject: t.subject(b), text: t.body(b).filter((l) => l !== undefined).join('\n') }),
    });
    if (!res.ok) console.error('[drb] email failed', res.status, await res.text());
    return res.ok;
  } catch (err) {
    console.error('[drb] email failed', err.message);
    return false;
  }
}

module.exports = { enabled, sendBookingCode };
