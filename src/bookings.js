const crypto = require('crypto');
const db = require('./db');
const config = require('./config');
const { nowInZone, addDays, weekday, toMinutes, toHHMM, isDate, minutesUntil } = require('./time');

// Codes look like KTM-482. No I/L/O or 0/1: they get read out over the phone.
// The email is the second factor, so 23^3 * 8^3 combinations is plenty behind a rate limit.
const LETTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ';
const DIGITS = '23456789';

class BookingError extends Error {
  constructor(status, code, message) {
    super(message || code);
    this.status = status;
    this.code = code;
  }
}

function newCode() {
  let s = '';
  for (let i = 0; i < 3; i++) s += LETTERS[crypto.randomInt(LETTERS.length)];
  for (let i = 0; i < 3; i++) s += DIGITS[crypto.randomInt(DIGITS.length)];
  return s;
}

// Accepts 'ktm 482', 'KTM-482', etc. Returns 'KTM482' or null.
function normalizeCode(input) {
  const s = String(input || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return s.length === 6 ? s : null;
}
const formatCode = (code) => `${code.slice(0, 3)}-${code.slice(3)}`;
const now = () => nowInZone(config.timezone);

const stmt = {
  services: db.prepare(`SELECT * FROM services WHERE active = 1 ORDER BY sort, id`),
  allServices: db.prepare(`SELECT * FROM services ORDER BY sort, id`),
  service: db.prepare(`SELECT * FROM services WHERE id = ?`),
  activeOnDate: db.prepare(`SELECT start_min, end_min FROM bookings WHERE date = ? AND status = 'confirmed'`),
  activeInRange: db.prepare(`SELECT date, start_min, end_min FROM bookings WHERE date >= ? AND date <= ? AND status = 'confirmed'`),
  closuresFrom: db.prepare(`SELECT date, reason FROM closures WHERE date >= ? ORDER BY date`),
  isClosed: db.prepare(`SELECT 1 FROM closures WHERE date = ?`),
  byCode: db.prepare(`SELECT * FROM bookings WHERE code = ?`),
  byId: db.prepare(`SELECT * FROM bookings WHERE id = ?`),
  codeExists: db.prepare(`SELECT 1 FROM bookings WHERE code = ?`),
  futureForContact: db.prepare(`SELECT date, start_min FROM bookings WHERE (email = ? OR phone = ?) AND status = 'confirmed' AND date >= ?`),
  insert: db.prepare(`INSERT INTO bookings (code, service_id, service_name_de, service_name_en, price, date, start_min, end_min, name, email, phone, lang)
                      VALUES (@code, @service_id, @service_name_de, @service_name_en, @price, @date, @start_min, @end_min, @name, @email, @phone, @lang)`),
  cancel: db.prepare(`UPDATE bookings SET status = 'cancelled', cancelled_by = ?, cancelled_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = ? AND status = 'confirmed'`),
};

// ---------- services ----------
const publicService = (s) => ({ id: s.id, name_de: s.name_de, name_en: s.name_en, duration_min: s.duration_min, price: s.price });
const listServices = () => stmt.services.all().map(publicService);
const listAllServices = () => stmt.allServices.all().map((s) => ({ ...publicService(s), sort: s.sort, active: Boolean(s.active) }));

function cleanService(input) {
  const name_de = String(input.name_de || '').replace(/\s+/g, ' ').trim();
  const name_en = String(input.name_en || '').replace(/\s+/g, ' ').trim() || name_de;
  const duration_min = Number(input.duration_min);
  const price = Number(input.price);
  if (name_de.length < 2 || name_de.length > 60 || name_en.length > 60) throw new BookingError(400, 'bad_service_name');
  if (!Number.isInteger(duration_min) || duration_min < 5 || duration_min > 480 || duration_min % config.slotStepMinutes !== 0) throw new BookingError(400, 'bad_duration');
  if (!Number.isInteger(price) || price < 0 || price > 100000) throw new BookingError(400, 'bad_price');
  return { name_de, name_en, duration_min, price };
}

function createService(input) {
  const s = cleanService(input);
  const sort = (db.prepare('SELECT MAX(sort) AS m FROM services').get().m ?? -1) + 1;
  const { lastInsertRowid } = db.prepare('INSERT INTO services (name_de, name_en, duration_min, price, sort) VALUES (?, ?, ?, ?, ?)')
    .run(s.name_de, s.name_en, s.duration_min, s.price, sort);
  return listAllServices().find((x) => x.id === Number(lastInsertRowid));
}

function updateService(id, input) {
  const existing = stmt.service.get(id);
  if (!existing) throw new BookingError(404, 'not_found');
  const s = cleanService({ ...existing, ...input });
  const active = input.active === undefined ? existing.active : (input.active ? 1 : 0);
  db.prepare('UPDATE services SET name_de = ?, name_en = ?, duration_min = ?, price = ?, active = ? WHERE id = ?')
    .run(s.name_de, s.name_en, s.duration_min, s.price, active, id);
  return listAllServices().find((x) => x.id === id);
}

function moveService(id, dir) {
  const list = stmt.allServices.all();
  const i = list.findIndex((s) => s.id === id);
  const j = i + (dir === 'up' ? -1 : 1);
  if (i < 0 || j < 0 || j >= list.length) return listAllServices();
  [list[i], list[j]] = [list[j], list[i]];
  const set = db.prepare('UPDATE services SET sort = ? WHERE id = ?');
  db.transaction(() => list.forEach((s, k) => set.run(k, s.id)))();
  return listAllServices();
}

function activeService(id) {
  const s = stmt.service.get(Number(id));
  if (!s || !s.active) throw new BookingError(400, 'unknown_service');
  return s;
}

// ---------- availability ----------
function openingFor(date) {
  const h = config.hours[weekday(date)];
  if (!h || stmt.isClosed.get(date)) return null;
  return [toMinutes(h[0]), toMinutes(h[1])];
}

function freeStarts(date, minutes, taken, n) {
  const open = openingFor(date);
  if (!open) return [];
  const slots = [];
  for (let t = open[0]; t + minutes <= open[1]; t += config.slotStepMinutes) {
    if (minutesUntil(n, date, t) < config.minLeadMinutes) continue;
    if (taken.some((b) => t < b.end_min && t + minutes > b.start_min)) continue;
    slots.push(t);
  }
  return slots;
}

function availability(serviceId) {
  const service = activeService(serviceId);
  const n = now();
  const last = addDays(n.date, config.bookingHorizonDays - 1);
  const taken = {};
  for (const b of stmt.activeInRange.all(n.date, last)) (taken[b.date] ||= []).push(b);

  const days = [];
  for (let i = 0; i < config.bookingHorizonDays; i++) {
    const date = addDays(n.date, i);
    const open = openingFor(date);
    // Today counts as closed once no start time could ever fit, booked or not.
    const over = open && i === 0 && minutesUntil(n, date, open[1] - service.duration_min) < config.minLeadMinutes;
    days.push({ date, closed: !open || over, slots: freeStarts(date, service.duration_min, taken[date] || [], n).map(toHHMM) });
  }
  return { service: publicService(service), days };
}

// ---------- bookings ----------
function present(row) {
  const until = minutesUntil(now(), row.date, row.start_min);
  return {
    code: formatCode(row.code),
    service: { id: row.service_id, name_de: row.service_name_de, name_en: row.service_name_en, price: row.price, duration_min: row.end_min - row.start_min },
    date: row.date,
    start: toHHMM(row.start_min),
    end: toHHMM(row.end_min),
    name: row.name,
    lang: row.lang,
    status: row.status,
    cancelledBy: row.cancelled_by,
    isPast: until < 0,
    canCancel: row.status === 'confirmed' && until >= config.cancelCutoffMinutes,
  };
}

function presentAdmin(row) {
  return { ...present(row), id: row.id, email: row.email, phone: row.phone, createdAt: row.created_at, cancelledAt: row.cancelled_at };
}

const cleanName = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const cleanEmail = (s) => String(s || '').trim().toLowerCase();
const cleanPhone = (s) => String(s || '').replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) && s.length <= 120;

const create = db.transaction((input) => {
  const service = activeService(input.serviceId);
  if (!isDate(input.date)) throw new BookingError(400, 'bad_date');
  if (typeof input.start !== 'string' || !/^\d{2}:\d{2}$/.test(input.start)) throw new BookingError(400, 'bad_time');

  const name = cleanName(input.name);
  const email = cleanEmail(input.email);
  const phone = cleanPhone(input.phone);
  if (name.length < 2 || name.length > 60) throw new BookingError(400, 'bad_name');
  if (!isEmail(email)) throw new BookingError(400, 'bad_email');
  if (phone.replace('+', '').length < 6 || phone.length > 20) throw new BookingError(400, 'bad_phone');

  const n = now();
  const start = toMinutes(input.start);
  const last = addDays(n.date, config.bookingHorizonDays - 1);
  if (input.date < n.date || input.date > last) throw new BookingError(400, 'out_of_range');

  const free = freeStarts(input.date, service.duration_min, stmt.activeOnDate.all(input.date), n);
  if (!free.includes(start)) throw new BookingError(409, 'slot_taken');

  const upcoming = stmt.futureForContact.all(email, phone, n.date).filter((b) => minutesUntil(n, b.date, b.start_min) >= 0);
  if (upcoming.length >= config.maxActivePerContact) throw new BookingError(409, 'too_many');

  let code;
  do { code = newCode(); } while (stmt.codeExists.get(code));
  stmt.insert.run({
    code, service_id: service.id, service_name_de: service.name_de, service_name_en: service.name_en, price: service.price,
    date: input.date, start_min: start, end_min: start + service.duration_min,
    name, email, phone, lang: input.lang === 'en' ? 'en' : 'de',
  });
  return { booking: present(stmt.byCode.get(code)), email };
});

// Both the code and the email must match; a wrong pair gives the same answer as no booking.
function find(email, codeInput) {
  const code = normalizeCode(codeInput);
  const row = code && stmt.byCode.get(code);
  if (!row || row.email !== cleanEmail(email)) throw new BookingError(404, 'not_found');
  return row;
}

function cancelByCustomer(email, code) {
  const row = find(email, code);
  if (row.status !== 'confirmed') throw new BookingError(409, 'already_cancelled');
  if (!present(row).canCancel) throw new BookingError(409, 'too_late');
  stmt.cancel.run('customer', row.id);
  return present(stmt.byId.get(row.id));
}

function cancelById(id) {
  const row = stmt.byId.get(id);
  if (!row) throw new BookingError(404, 'not_found');
  stmt.cancel.run('shop', row.id);
  return presentAdmin(stmt.byId.get(row.id));
}

function listForAdmin({ scope, includeCancelled }) {
  const n = now();
  const statusClause = includeCancelled ? '' : `AND status = 'confirmed'`;
  const rows = scope === 'past'
    ? db.prepare(`SELECT * FROM bookings WHERE date <= ? ${statusClause} ORDER BY date DESC, start_min DESC LIMIT 300`).all(n.date)
    : db.prepare(`SELECT * FROM bookings WHERE date >= ? ${statusClause} ORDER BY date, start_min LIMIT 500`).all(n.date);
  // Today belongs to both views: finished appointments are past, the rest upcoming.
  return rows.map(presentAdmin).filter((b) => (scope === 'past' ? b.isPast : !b.isPast));
}

const listClosures = () => stmt.closuresFrom.all(now().date);

function addClosure(date, reason) {
  if (!isDate(date)) throw new BookingError(400, 'bad_date');
  db.prepare(`INSERT INTO closures (date, reason) VALUES (?, ?) ON CONFLICT(date) DO UPDATE SET reason = excluded.reason`)
    .run(date, cleanName(reason).slice(0, 80) || null);
  return { date, affected: stmt.activeOnDate.all(date).length };
}

function removeClosure(date) {
  db.prepare(`DELETE FROM closures WHERE date = ?`).run(date);
}

module.exports = {
  BookingError, now, availability, create, find, present, cancelByCustomer, cancelById, listForAdmin,
  listClosures, addClosure, removeClosure, listServices, listAllServices, createService, updateService, moveService,
};
