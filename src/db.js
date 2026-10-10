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
    name_de       TEXT    NOT NULL,
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
    service_name_de  TEXT    NOT NULL,
    service_name_en  TEXT    NOT NULL,
    price            INTEGER NOT NULL,
    date             TEXT    NOT NULL,
    start_min        INTEGER NOT NULL,
    end_min          INTEGER NOT NULL,
    name             TEXT    NOT NULL,
    email            TEXT    NOT NULL,
    phone            TEXT    NOT NULL,
    lang             TEXT    NOT NULL DEFAULT 'de',
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

  -- Breaks inside a working day (lunch, an errand): those minutes cannot be booked.
  CREATE TABLE IF NOT EXISTS blocks (
    id         INTEGER PRIMARY KEY,
    date       TEXT    NOT NULL,
    start_min  INTEGER NOT NULL,
    end_min    INTEGER NOT NULL,
    reason     TEXT
  );
  CREATE INDEX IF NOT EXISTS blocks_date ON blocks (date);
`);

// Columns added after the first version. SQLite has no "ADD COLUMN IF NOT EXISTS".
function addColumn(table, column, definition) {
  const exists = db.prepare(`PRAGMA table_info(${table})`).all().some((c) => c.name === column);
  if (!exists) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}
addColumn('services', 'category', "TEXT NOT NULL DEFAULT 'other'");
addColumn('services', 'desc_de', 'TEXT');
addColumn('services', 'desc_en', 'TEXT');
addColumn('services', 'price_from', 'INTEGER NOT NULL DEFAULT 0');
addColumn('bookings', 'price_from', 'INTEGER NOT NULL DEFAULT 0');

// First run: copy the starter services from config so the price list is never empty.
if (db.prepare('SELECT COUNT(*) AS n FROM services').get().n === 0) {
  const insert = db.prepare(`INSERT INTO services (name_de, name_en, desc_de, desc_en, category, duration_min, price, price_from, sort)
                             VALUES (@name_de, @name_en, @desc_de, @desc_en, @category, @duration_min, @price, @price_from, @sort)`);
  config.seedServices.forEach((s, i) => insert.run({
    desc_de: null, desc_en: null, category: 'other', price_from: 0, ...s, price_from: s.price_from ? 1 : 0, sort: i,
  }));
}

module.exports = db;
