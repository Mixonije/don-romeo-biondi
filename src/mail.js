// Sends the booking code by email through Resend (https://resend.com).
// Optional: without RESEND_API_KEY and MAIL_FROM the app works the same, it just skips the email.

const config = require('./config');

const KEY = process.env.RESEND_API_KEY || '';
const FROM = process.env.MAIL_FROM || '';
const enabled = Boolean(KEY && FROM);

const text = {
  de: {
    subject: (b) => `Ihr Termin am ${b.dateLabel} um ${b.start} · ${config.shopName}`,
    body: (b) => [
      `Hallo ${b.name}`,
      '',
      `Ihr Termin ist bestätigt: ${b.serviceName}, ${b.dateLabel} um ${b.start} Uhr.`,
      '',
      `Buchungscode: ${b.code}`,
      '',
      `Sie können bis ${config.cancelCutoffMinutes / 60} Stunden vorher online stornieren, auf der Seite "Buchung stornieren" mit dieser E-Mail-Adresse und dem Code.`,
      '',
      'Freundliche Grüsse',
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
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(lang === 'en' ? 'en-GB' : 'de-CH', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
  });
}

async function sendBookingCode(booking, email) {
  if (!enabled) return false;
  const lang = booking.lang === 'en' ? 'en' : 'de';
  const t = text[lang];
  const b = {
    ...booking,
    dateLabel: dateLabel(booking.date, lang),
    serviceName: lang === 'en' ? booking.service.name_en : booking.service.name_de,
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
