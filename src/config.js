// Shop settings. Everything the owner might want to change lives here.
// Values marked PLACEHOLDER have not been confirmed with the shop yet.
// Services and prices are edited in the admin panel; the list below only seeds an empty database.

module.exports = {
  shopName: 'Don Romeo Brioni',
  tagline: 'CUTS & SHAVES · ZÜRICH', // small spaced line under the name in the footer (from the shop sign)
  logo: '/images/logo.jpg',          // the shop-window sign, from instagram.com/brioni_barbershop (150px; ask the shop for a bigger file)
  address: 'Überlandstrasse 327, 8051 Zürich', // from the Instagram bio
  instagram: 'brioni_barbershop',    // handle only; null hides the link
  phone: '',                        // PLACEHOLDER, shown when online cancelling has closed
  defaultLang: 'de',

  // "Unsere Arbeit" photos on the home page, taken from the shop's Instagram and cropped square.
  gallery: [
    { src: '/images/work-1.jpg', alt: { de: 'Haarschnitt und Bart im Profil', en: 'Haircut and beard, side view' } },
    { src: '/images/work-2.jpg', alt: { de: 'Taper Fade, Seitenansicht', en: 'Taper fade, side view' } },
    { src: '/images/work-3.jpg', alt: { de: 'Bowl Cut mit Fade', en: 'Bowl cut with fade' } },
    { src: '/images/work-4.jpg', alt: { de: 'Slick Back mit Taper', en: 'Slick back with taper' } },
    { src: '/images/work-5.jpg', alt: { de: 'Strukturierter Schnitt mit Fade', en: 'Textured cut with fade' } },
    { src: '/images/work-6.jpg', alt: { de: 'Schaufenster: Barbershop Brioni, Cuts & Shaves', en: 'Shop window: Barbershop Brioni, Cuts & Shaves' } },
  ],

  // One-line note under the price list, per language.
  note: {
    de: '* Bezahlung im Salon, bar oder mit Karte',
    en: '* Pay at the shop, cash or card',
  },

  currency: 'CHF',
  // Second currency for the price toggle (display only). Set to null to hide the toggle.
  altCurrency: { code: 'EUR', rate: 1.06, roundTo: 1 }, // PLACEHOLDER rate: 1 CHF = 1.06 EUR

  // All times are wall-clock times in this zone, whatever zone the server runs in.
  timezone: process.env.SHOP_TZ || 'Europe/Zurich',

  // PLACEHOLDER: dummy services and prices until the shop confirms them.
  seedServices: [
    { name_de: 'Haarschnitt',          name_en: 'Haircut',              duration_min: 45, price: 45 },
    { name_de: 'Haarschnitt + Bart',   name_en: 'Haircut + beard trim', duration_min: 60, price: 65 },
  ],

  // Opening hours per weekday (0 = Sunday). null = closed. PLACEHOLDER.
  hours: {
    0: null,
    1: ['09:00', '19:00'],
    2: ['09:00', '19:00'],
    3: ['09:00', '19:00'],
    4: ['09:00', '19:00'],
    5: ['09:00', '19:00'],
    6: ['09:00', '16:00'],
  },

  slotStepMinutes: 15,       // a new start time every 15 minutes
  bookingHorizonDays: 30,    // how far ahead customers can book
  minLeadMinutes: 60,        // earliest bookable slot is 1h from now
  cancelCutoffMinutes: 120,  // customers can cancel online until 2h before
  maxActivePerContact: 2,    // upcoming bookings one email or phone number may hold
};
