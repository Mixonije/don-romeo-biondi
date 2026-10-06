// Shop settings. Everything the owner might want to change lives here.
// Values marked PLACEHOLDER have not been confirmed with the shop yet.
// Services and prices are edited in the admin panel; the list below only seeds an empty database.

module.exports = {
  shopName: 'Don Romeo Brioni',
  tagline: 'BARBER SHOP · ZÜRICH',  // small spaced line under the name in the footer
  logo: '/logo.svg',                // PLACEHOLDER: replace public/logo.svg with the shop's real logo
  address: '',                      // PLACEHOLDER, e.g. 'Musterstrasse 1, 8001 Zürich'. Hidden when empty
  phone: '',                        // PLACEHOLDER, shown when online cancelling has closed
  defaultLang: 'de',

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
