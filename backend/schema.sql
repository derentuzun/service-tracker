CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  ad VARCHAR(100) NOT NULL,
  rol VARCHAR(20) NOT NULL,
  aktif BOOLEAN DEFAULT true,
  olusturma_tarihi TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  ad VARCHAR(100) NOT NULL,
  soyad VARCHAR(100) NOT NULL,
  telefon VARCHAR(20) NOT NULL,
  adres TEXT NOT NULL,
  ilce VARCHAR(50) NOT NULL CHECK (ilce IN ('Foça', 'Menemen', 'Aliağa')),
  servis_turu VARCHAR(100) NOT NULL,
  notlar TEXT,
  durum VARCHAR(50) NOT NULL DEFAULT 'Beklemede',
  tamamlandi BOOLEAN DEFAULT false,
  kayit_tarihi TIMESTAMP DEFAULT NOW(),
  kaydeden_id INTEGER REFERENCES users(id)
);
