const router = require('express').Router();
const pool = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.use(authenticate);

function normalizeTel(tel) {
  let t = tel.replace(/[\s\-]/g, '');
  if (t.startsWith('5') && t.length === 10) t = '0' + t;
  if (t.startsWith('+90')) t = '0' + t.slice(3);
  if (t.startsWith('90') && t.length === 12) t = '0' + t.slice(2);
  return t;
}

async function checkDuplicate(telefon, ad, soyad, excludeId = null) {
  const warnings = [];
  const normalTel = normalizeTel(telefon);

  const telQ = await pool.query(
    `SELECT id, ad, soyad, telefon FROM customers ${excludeId ? 'WHERE id != $1' : ''}`,
    excludeId ? [excludeId] : []
  );

  const dupTel = telQ.rows.find(r => normalizeTel(r.telefon) === normalTel);
  if (dupTel) {
    warnings.push(`Bu telefon numarasıyla daha önce bir kayıt açılmış: ${dupTel.ad} ${dupTel.soyad}`);
  }

  const isimQ = await pool.query(
    `SELECT id FROM customers WHERE LOWER(ad) = LOWER($1) AND LOWER(soyad) = LOWER($2) ${excludeId ? 'AND id != $3' : ''}`,
    excludeId ? [ad, soyad, excludeId] : [ad, soyad]
  );
  if (isimQ.rows.length > 0) {
    warnings.push('Bu isimle benzer bir müşteri kaydı bulunuyor.');
  }

  return warnings;
}
router.get('/', async (req, res) => {
  try {
    const { ilce, durum, servis_turu, tarih, search } = req.query;
    let query = `SELECT * FROM customers WHERE 1=1`;
    const params = [];
    let p = 1;
    if (ilce)        { query += ` AND ilce = $${p++}`;               params.push(ilce); }
    if (durum)       { query += ` AND durum = $${p++}`;              params.push(durum); }
    if (servis_turu) { query += ` AND servis_turu = $${p++}`;        params.push(servis_turu); }
    if (tarih)       { query += ` AND DATE(kayit_tarihi) = $${p++}`; params.push(tarih); }
    if (search) {
      query += ` AND (LOWER(ad || ' ' || soyad) LIKE LOWER($${p}) OR telefon LIKE $${p+1})`;
      params.push(`%${search}%`, `%${search}%`); p += 2;
    }
    query += ` ORDER BY ilce, kayit_tarihi ASC`;
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Müşteriler alınamadı.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Kayıt bulunamadı.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const { ad, soyad, telefon, adres, ilce, servis_turu, notlar, durum, force } = req.body;
    if (!ad || !soyad || !telefon || !adres || !ilce || !servis_turu) {
      return res.status(400).json({ error: 'Zorunlu alanlar eksik.' });
    }
    const telClean = telefon.replace(/\s/g, '');
    if (!/^0?5[0-9]{9}$/.test(telClean)) {
      return res.status(400).json({ error: 'Geçersiz telefon numarası formatı.' });
    }
    if (!force) {
      const warnings = await checkDuplicate(telefon, ad, soyad);
      if (warnings.length > 0) {
        return res.status(409).json({ warnings, requireForce: true });
      }
    }
    const result = await pool.query(
      `INSERT INTO customers (ad, soyad, telefon, adres, ilce, servis_turu, notlar, durum, kaydeden_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [ad, soyad, telefon, adres, ilce, servis_turu, notlar || null, durum || 'Beklemede', req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kayıt oluşturulamadı.' });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { ad, soyad, telefon, adres, ilce, servis_turu, notlar, durum } = req.body;
    const result = await pool.query(
      `UPDATE customers SET ad=$1, soyad=$2, telefon=$3, adres=$4, ilce=$5,
       servis_turu=$6, notlar=$7, durum=$8 WHERE id=$9 RETURNING *`,
      [ad, soyad, telefon, adres, ilce, servis_turu, notlar, durum, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Kayıt bulunamadı.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Güncelleme yapılamadı.' });
  }
});

router.patch('/:id/tamamlandi', async (req, res) => {
  try {
    const { tamamlandi } = req.body;
    const yeniDurum = tamamlandi ? 'Tamamlandı' : 'Beklemede';
    const result = await pool.query(
      `UPDATE customers SET tamamlandi=$1, durum=$2 WHERE id=$3 RETURNING *`,
      [tamamlandi, yeniDurum, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Kayıt bulunamadı.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Güncelleme yapılamadı.' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM customers WHERE id=$1 RETURNING id', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Kayıt bulunamadı.' });
    res.json({ message: 'Kayıt silindi.' });
  } catch (err) {
    res.status(500).json({ error: 'Silme işlemi yapılamadı.' });
  }
});

module.exports = router;