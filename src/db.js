const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const config = require('./config');

const file = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'bookings.db');
fs.mkdirSync(path.dirname(file), { recursive: true });

const db = new Database(file);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS services (
    id            INTEGER PRIMARY KEY,
    name_sr       TEXT    NOT NULL,
    name_en       TEXT    NOT NULL,
    duration_min  INTEGER NOT NULL,
    price         INTEGER NOT NULL,
    sort          INTEGER NOT NULL DEFAULT 0,
    active        INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id               INTEGER PRIMARY KEY,
    code             TEXT    NOT NULL UNIQUE,
    service_id       INTEGER NOT NULL,
    service_name_sr  TEXT    NOT NULL,
    service_name_en  TEXT    NOT NULL,
    price            INTEGER NOT NULL,
    date             TEXT    NOT NULL,
    start_min        INTEGER NOT NULL,
    end_min          INTEGER NOT NULL,
    name             TEXT    NOT NULL,
    email            TEXT    NOT NULL,
    phone            TEXT    NOT NULL,
    lang             TEXT    NOT NULL DEFAULT 'sr',
    status           TEXT    NOT NULL DEFAULT 'confirmed',
    cancelled_by     TEXT,
    created_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
    cancelled_at     TEXT
  );
  CREATE INDEX IF NOT EXISTS bookings_date ON bookings (date, status);
  CREATE INDEX IF NOT EXISTS bookings_email ON bookings (email, status);
  CREATE INDEX IF NOT EXISTS bookings_phone ON bookings (phone, status);

  CREATE TABLE IF NOT EXISTS closures (
    date    TEXT PRIMARY KEY,
    reason  TEXT
  );
`);

// First run: copy the starter services from config so the price list is never empty.
if (db.prepare('SELECT COUNT(*) AS n FROM services').get().n === 0) {
  const insert = db.prepare('INSERT INTO services (name_sr, name_en, duration_min, price, sort) VALUES (?, ?, ?, ?, ?)');
  config.seedServices.forEach((s, i) => insert.run(s.name_sr, s.name_en, s.duration_min, s.price, i));
}

module.exports = db;
