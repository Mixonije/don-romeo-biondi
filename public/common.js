// Shared helpers for every page: dictionary, language switch, formatting, DOM and API.
(() => {
  'use strict';

  const dict = {
    sr: {
      priceList: 'Cenovnik', hours: 'Radno vreme', closed: 'Zatvoreno', min: 'min',
      days: ['Nedelja', 'Ponedeljak', 'Utorak', 'Sreda', 'Četvrtak', 'Petak', 'Subota'],
      cancelLink: 'Otkazivanje rezervacije / Cancel booking',
      show: (c) => `Prikaži ${c}`,
      back: 'Nazad', booking: 'Zakazivanje', services: 'Usluge', schedule: 'Raspored',
      today: 'Danas', tomorrow: 'Sutra', yesterday: 'Juče', full: 'Popunjeno', later: 'Još', closedShort: 'Zatv.', fullShort: 'Puno',
      morning: 'Pre podne', afternoon: 'Popodne', evening: 'Uveče',
      noSlots: 'Nema slobodnih termina za ovaj dan.', noDays: 'Trenutno nema slobodnih termina. Pozovite radnju.',
      pickTime: 'Izaberite vreme', book: 'Zakaži', totalPrice: 'Ukupna cena',
      bookTitle: 'Rezervacija termina',
      nameLabel: 'Ime i prezime', namePh: 'npr. Petar Petrović',
      emailLabel: 'Email adresa', emailPh: 'npr. petar@gmail.com', enterEmail: 'Unesite Vaš email',
      phoneLabel: 'Broj telefona', phonePh: 'npr. 064 123 4567',
      confirm: 'Potvrdi rezervaciju', confirming: 'Rezervišem…',
      doneTitle: 'Termin je zakazan!',
      doneEmailed: 'Kod rezervacije smo poslali i na Vaš email.',
      doneNotEmailed: 'Vidimo se!',
      yourCode: 'Vaš kod rezervacije', saveHint: 'Sačuvajte ovaj kod. Uz Vaš email, treba Vam za otkazivanje.',
      copy: 'Kopiraj', copied: 'Kopirano!', close: 'Zatvori', addCal: 'Dodaj u kalendar',
      lService: 'Usluga', lDate: 'Datum', lTime: 'Vreme', lDuration: 'Trajanje', lPrice: 'Cena', lName: 'Ime', lCode: 'Kod', lStatus: 'Status',
      cancelHeader: 'Otkazivanje', cancelTitle: 'Otkaži termin',
      cancelSub: 'Unesite Vaš email i kod koji ste dobili pri zakazivanju.',
      codeLabel: 'Kod rezervacije', codePh: 'npr. KTM-482',
      cancelBtn: 'Otkaži rezervaciju', finding: 'Tražim…',
      sure: 'Da li ste sigurni? Ovo se ne može poništiti.', yesCancel: 'Da, otkaži', noBack: 'Ne, vrati se',
      cancelled: 'Rezervacija je otkazana. Termin je ponovo slobodan.',
      statusConfirmed: 'Potvrđeno', statusCancelled: 'Otkazano', statusPast: 'Prošao termin', byShop: 'Otkazala radnja',
      callShop: (p) => (p ? `Pozovite radnju: ${p}.` : 'Kontaktirajte radnju.'),
      // admin
      adminPanel: 'Admin panel', password: 'Lozinka', signIn: 'Prijavi se', signingIn: 'Prijavljujem…', signOut: 'Odjavi se',
      tabBookings: 'Rezervacije', tabServices: 'Usluge', tabDaysOff: 'Neradni dani',
      upcoming: 'Predstojeće', past: 'Prošle', showCancelled: 'Prikaži otkazane', updated: 'Ažurirano',
      stillToday: 'Još danas', next7: 'Narednih 7 dana',
      bookingsN: (n) => `${n} ${n % 10 === 1 && n % 100 !== 11 ? 'rezervacija' : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? 'rezervacije' : 'rezervacija'}`,
      cancel: 'Otkaži', keep: 'Ne', confirmShopCancel: (n, t) => `Otkazati ${n}, ${t}? Javite klijentu, aplikacija mu ne šalje poruku.`,
      customerCancelled: 'Klijent otkazao', youCancelled: 'Otkazano', done: 'Završeno',
      noUpcoming: 'Nema predstojećih rezervacija. Nove se pojavljuju ovde same.', noPast: 'Nema prošlih rezervacija.',
      daysOffHint: 'Zatvoreni dani nestaju sa stranice za zakazivanje. Postojeće rezervacije ostaju dok ih ne otkažete.',
      date: 'Datum', noteOpt: 'Napomena (opciono)', notePh: 'Odmor, seminar…', closeDay: 'Zatvori dan', reopen: 'Otvori', saving: 'Čuvam…',
      closedWithBookings: (n) => `Dan je zatvoren. Na taj dan ${n === 1 ? 'postoji 1 rezervacija' : `postoje ${n} rezervacije`}, otkažite ih u listi.`,
      noClosures: 'Nema zatvorenih dana.',
      servicesHint: 'Promene se odmah vide na cenovniku. Postojeće rezervacije zadržavaju staru cenu.',
      nameSr: 'Naziv (SR)', nameEn: 'Naziv (EN)', durationMin: 'Trajanje (min)', price: 'Cena',
      edit: 'Izmeni', save: 'Sačuvaj', discard: 'Odustani', hide: 'Sakrij', showSvc: 'Prikaži', hidden: 'Sakriveno', addService: 'Dodaj uslugu', up: 'Gore', down: 'Dole',
      pickDate: 'Izaberite datum.',
      errors: {
        slot_taken: 'Neko je upravo zauzeo taj termin. Izaberite drugo vreme.',
        bad_name: 'Unesite ime i prezime.', bad_email: 'Unesite ispravnu email adresu.', bad_phone: 'Unesite broj telefona.',
        too_many: 'Sa ovim podacima već imate 2 predstojeća termina. Otkažite jedan ili pozovite radnju.',
        not_found: 'Nismo pronašli rezervaciju sa ovim emailom i kodom.',
        already_cancelled: 'Ova rezervacija je već otkazana.',
        too_late: 'Online otkazivanje je moguće najkasnije 2 sata pre termina.',
        rate_limited: 'Previše pokušaja. Sačekajte nekoliko minuta.',
        unknown_service: 'Ova usluga više nije dostupna.', out_of_range: 'Taj dan nije otvoren za zakazivanje.',
        wrong_login: 'Pogrešan email ili lozinka.', not_configured: 'Admin lozinka nije podešena na serveru.',
        bad_service_name: 'Unesite naziv usluge.', bad_duration: 'Trajanje mora biti deljivo sa 15 minuta.', bad_price: 'Unesite cenu kao ceo broj.',
        bad_date: 'Izaberite ispravan datum.', unauthorized: 'Prijavite se ponovo.',
        network: 'Nema veze sa serverom. Pokušajte ponovo.', server_error: 'Greška na serveru. Pokušajte ponovo.',
      },
    },
    en: {
      priceList: 'Price list', hours: 'Working hours', closed: 'Closed', min: 'min',
      days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      cancelLink: 'Cancel booking',
      show: (c) => `Show ${c}`,
      back: 'Back', booking: 'Booking', services: 'Services', schedule: 'Schedule',
      today: 'Today', tomorrow: 'Tomorrow', yesterday: 'Yesterday', full: 'Full', later: 'More', closedShort: 'Closed', fullShort: 'Full',
      morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening',
      noSlots: 'No free times on this day.', noDays: 'No free times right now. Please call the shop.',
      pickTime: 'Pick a time', book: 'Book', totalPrice: 'Total price',
      bookTitle: 'Appointment booking',
      nameLabel: 'Full name', namePh: 'e.g. John Smith',
      emailLabel: 'Email address', emailPh: 'e.g. john@gmail.com', enterEmail: 'Enter your email',
      phoneLabel: 'Phone number', phonePh: 'e.g. +381 64 123 4567',
      confirm: 'Confirm booking', confirming: 'Booking…',
      doneTitle: 'You\'re booked!',
      doneEmailed: 'We also sent the booking code to your email.',
      doneNotEmailed: 'See you then!',
      yourCode: 'Your booking code', saveHint: 'Keep this code. Together with your email, you need it to cancel.',
      copy: 'Copy', copied: 'Copied!', close: 'Close', addCal: 'Add to calendar',
      lService: 'Service', lDate: 'Date', lTime: 'Time', lDuration: 'Duration', lPrice: 'Price', lName: 'Name', lCode: 'Code', lStatus: 'Status',
      cancelHeader: 'Cancel', cancelTitle: 'Cancel appointment',
      cancelSub: 'Enter your email and the code you got when you booked.',
      codeLabel: 'Booking code', codePh: 'e.g. KTM-482',
      cancelBtn: 'Cancel booking', finding: 'Looking…',
      sure: 'Are you sure? This can\'t be undone.', yesCancel: 'Yes, cancel', noBack: 'No, go back',
      cancelled: 'Booking cancelled. The time is free again.',
      statusConfirmed: 'Confirmed', statusCancelled: 'Cancelled', statusPast: 'Past appointment', byShop: 'Cancelled by the shop',
      callShop: (p) => (p ? `Call the shop: ${p}.` : 'Please contact the shop.'),
      adminPanel: 'Admin panel', password: 'Password', signIn: 'Sign in', signingIn: 'Signing in…', signOut: 'Sign out',
      tabBookings: 'Bookings', tabServices: 'Services', tabDaysOff: 'Days off',
      upcoming: 'Upcoming', past: 'Past', showCancelled: 'Show cancelled', updated: 'Updated',
      stillToday: 'Still today', next7: 'Next 7 days',
      bookingsN: (n) => `${n} ${n === 1 ? 'booking' : 'bookings'}`,
      cancel: 'Cancel', keep: 'Keep', confirmShopCancel: (n, t) => `Cancel ${n}, ${t}? Let them know, the app does not message them.`,
      customerCancelled: 'Customer cancelled', youCancelled: 'Cancelled', done: 'Done',
      noUpcoming: 'No upcoming bookings. New ones show up here on their own.', noPast: 'No past bookings.',
      daysOffHint: 'Closed days disappear from the booking page. Existing bookings stay until you cancel them.',
      date: 'Date', noteOpt: 'Note (optional)', notePh: 'Holiday, training…', closeDay: 'Close this day', reopen: 'Reopen', saving: 'Saving…',
      closedWithBookings: (n) => `Day closed. ${n === 1 ? '1 booking is' : `${n} bookings are`} still on that day, cancel them in the list.`,
      noClosures: 'No closed days.',
      servicesHint: 'Changes show on the price list right away. Existing bookings keep their old price.',
      nameSr: 'Name (SR)', nameEn: 'Name (EN)', durationMin: 'Duration (min)', price: 'Price',
      edit: 'Edit', save: 'Save', discard: 'Cancel', hide: 'Hide', showSvc: 'Show', hidden: 'Hidden', addService: 'Add service', up: 'Up', down: 'Down',
      pickDate: 'Pick a date.',
      errors: {
        slot_taken: 'Someone just took that time. Pick another one.',
        bad_name: 'Add your full name.', bad_email: 'Add a valid email address.', bad_phone: 'Add a phone number.',
        too_many: 'You already have 2 upcoming bookings with these details. Cancel one or call the shop.',
        not_found: 'No booking found with that email and code.',
        already_cancelled: 'This booking is already cancelled.',
        too_late: 'Online cancelling closes 2 hours before the appointment.',
        rate_limited: 'Too many tries. Wait a few minutes.',
        unknown_service: 'This service is no longer available.', out_of_range: 'That day is not open for booking.',
        wrong_login: 'Wrong email or password.', not_configured: 'The admin password is not set on the server.',
        bad_service_name: 'Add a service name.', bad_duration: 'Duration must be a multiple of 15 minutes.', bad_price: 'Enter the price as a whole number.',
        bad_date: 'Pick a valid date.', unauthorized: 'Please sign in again.',
        network: 'Can\'t reach the server. Try again.', server_error: 'Server error. Please try again.',
      },
    },
  };

  const LANG_KEY = 'drb-lang';
  const CUR_KEY = 'drb-alt-currency';
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
  };

  const listeners = [];
  const state = { lang: 'sr', alt: false, cfg: null };

  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v; // only ever used with static strings
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const c of children.flat(Infinity)) {
      if (c === null || c === undefined || c === false) continue;
      el.append(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    return el;
  }

  // Page URLs. The static demo (docs/) overrides these with plain .html files.
  const routes = Object.assign(
    { home: '/', book: '/book', cancel: '/my-booking', adminLogin: '/admin/login', admin: '/admin' },
    window.DRB_ROUTES || {},
  );
  const route = (name, query) => routes[name] + (query ? `?${new URLSearchParams(query)}` : '');

  async function api(path, opts = {}) {
    // The static demo answers API calls in the browser instead of a server.
    if (window.DRB_MOCK) {
      try { return await window.DRB_MOCK(path, opts); }
      catch (err) {
        const code = err.code || 'server_error';
        const e = new Error(t().errors[code] || t().errors.server_error);
        e.code = code; e.status = err.status || 400;
        throw e;
      }
    }
    let res;
    try {
      res = await fetch(path, {
        method: opts.method || 'GET',
        headers: opts.body ? { 'Content-Type': 'application/json' } : undefined,
        body: opts.body ? JSON.stringify(opts.body) : undefined,
        credentials: 'same-origin',
      });
    } catch {
      const e = new Error(t().errors.network); e.code = 'network'; throw e;
    }
    let data = null;
    try { data = await res.json(); } catch { /* empty body */ }
    if (!res.ok) {
      const code = (data && data.error) || 'server_error';
      const e = new Error(t().errors[code] || t().errors.server_error);
      e.code = code; e.status = res.status;
      throw e;
    }
    return data;
  }

  const t = () => dict[state.lang];
  const locale = () => (state.lang === 'en' ? 'en-GB' : 'sr-Latn-RS');

  function utcDate(date) { const [y, m, d] = date.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); }
  const fmt = {
    date: (date, opts) => utcDate(date).toLocaleDateString(locale(), { ...opts, timeZone: 'UTC' }),
    long: (date) => fmt.date(date, { weekday: 'long', day: 'numeric', month: 'long' }),
    short: (date) => fmt.date(date, { weekday: 'short', day: 'numeric', month: 'short' }),
    // Prices are stored in the main currency; the toggle converts for display only.
    price(n, forceMain) {
      const c = state.cfg;
      const useAlt = !forceMain && state.alt && c.altCurrency;
      const value = useAlt ? Math.round((n * c.altCurrency.rate) / (c.altCurrency.roundTo || 1)) * (c.altCurrency.roundTo || 1) : n;
      const code = useAlt ? c.altCurrency.code : c.currency;
      const num = new Intl.NumberFormat(locale(), { maximumFractionDigits: 0 }).format(value);
      if (code === 'EUR') return state.lang === 'en' ? `€${num}` : `${num} €`;
      return `${num} ${code}`;
    },
  };
  const dayDiff = (date) => Math.round((utcDate(date) - utcDate(state.cfg.today)) / 86400000);
  function relDay(date) {
    const n = dayDiff(date);
    if (n === 0) return t().today;
    if (n === 1) return t().tomorrow;
    if (n === -1) return t().yesterday;
    return null;
  }
  const svcName = (s) => (state.lang === 'en' ? s.name_en : s.name_sr) || s.name_sr;

  function setLang(lang) {
    state.lang = lang === 'en' ? 'en' : 'sr';
    store.set(LANG_KEY, state.lang);
    document.documentElement.lang = state.lang === 'en' ? 'en' : 'sr-Latn';
    listeners.forEach((fn) => fn());
  }
  function setAlt(on) {
    state.alt = Boolean(on);
    store.set(CUR_KEY, state.alt ? '1' : '0');
    listeners.forEach((fn) => fn());
  }

  function langSwitch() {
    const btn = (code, label) => h('button', {
      type: 'button', class: state.lang === code ? 'is-on' : '', 'aria-pressed': String(state.lang === code),
      onclick: () => setLang(code),
    }, label);
    return h('div', { class: 'lang', role: 'group', 'aria-label': 'Language' }, btn('sr', 'SR'), h('span', { 'aria-hidden': 'true' }, '/'), btn('en', 'EN'));
  }

  function setBusy(btn, busy, label) {
    if (busy) { btn.dataset.label = btn.textContent; btn.dataset.state = 'loading'; btn.disabled = true; btn.textContent = label; }
    else { btn.removeAttribute('data-state'); btn.disabled = false; if (btn.dataset.label) btn.textContent = btn.dataset.label; }
  }
  const errorBox = (msg) => h('p', { class: 'msg msg-error', role: 'alert' }, msg);

  async function boot(render) {
    state.cfg = await api('/api/config');
    state.lang = store.get(LANG_KEY) || state.cfg.defaultLang || 'sr';
    state.alt = store.get(CUR_KEY) === '1';
    document.documentElement.lang = state.lang === 'en' ? 'en' : 'sr-Latn';
    listeners.push(render);
    render();
  }

  window.DRB = { h, api, route, t, fmt, state, relDay, dayDiff, svcName, setLang, setAlt, langSwitch, setBusy, errorBox, boot };
})();
