const router = require('express').Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

router.use(authenticate);

router.get('/excel', async (req, res) => {
  try {
    const { tarih, ilce } = req.query;
    const today = tarih || new Date().toISOString().split('T')[0];
    let query = `SELECT * FROM customers WHERE DATE(kayit_tarihi) = $1`;
    const params = [today];
    if (ilce) { query += ` AND ilce = $2`; params.push(ilce); }
    query += ` ORDER BY ilce, kayit_tarihi`;
    const result = await pool.query(query, params);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Günlük Servis Listesi');
    sheet.columns = [
      { header: '#',            key: 'sira',        width: 6 },
      { header: 'Ad Soyad',     key: 'adsoyad',     width: 22 },
      { header: 'Telefon',      key: 'telefon',     width: 16 },
      { header: 'İlçe',         key: 'ilce',        width: 12 },
      { header: 'Adres',        key: 'adres',       width: 35 },
      { header: 'Servis Türü',  key: 'servis_turu', width: 18 },
      { header: 'Not',          key: 'not',         width: 25 },
      { header: 'Kayıt Tarihi', key: 'kayit_tarihi',width: 18 },
      { header: 'Durum',        key: 'durum',       width: 14 },
    ];
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };

    result.rows.forEach((c, i) => {
      const row = sheet.addRow({
        sira: i + 1,
        adsoyad: `${c.ad} ${c.soyad}`,
        telefon: c.telefon,
        ilce: c.ilce,
        adres: c.adres,
        servis_turu: c.servis_turu,
        not: c.not || '',
        kayit_tarihi: new Date(c.kayit_tarihi).toLocaleString('tr-TR'),
        durum: c.durum,
      });
      if (c.tamamlandi) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
      }
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="servis-${today}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Excel oluşturulamadı.' });
  }
});

router.get('/pdf', async (req, res) => {
  try {
    const { tarih, ilce } = req.query;
    const today = tarih || new Date().toISOString().split('T')[0];
    let query = `SELECT * FROM customers WHERE DATE(kayit_tarihi) = $1`;
    const params = [today];
    if (ilce) { query += ` AND ilce = $2`; params.push(ilce); }
    query += ` ORDER BY ilce, kayit_tarihi`;
    const { rows } = await pool.query(query, params);

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="servis-${today}.pdf"`);
    doc.pipe(res);

    doc.fontSize(16).font('Helvetica-Bold').text('Günlük Servis Listesi', { align: 'center' });
    doc.fontSize(11).font('Helvetica').text(`Tarih: ${today}${ilce ? ' | İlçe: ' + ilce : ''}`, { align: 'center' });
    doc.moveDown();

    rows.forEach((c, i) => {
      doc.fontSize(10).font('Helvetica-Bold').text(`${i+1}. ${c.ad} ${c.soyad}  —  ${c.telefon}`);
      doc.fontSize(9).font('Helvetica').fillColor('#444').text(`   Adres: ${c.adres} (${c.ilce})`);
      doc.text(`   Servis: ${c.servis_turu}  |  Durum: ${c.durum}`);
      if (c.not) doc.text(`   Not: ${c.not}`);
      doc.moveDown(0.4);
      if (i < rows.length - 1) doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#ddd').stroke();
      doc.moveDown(0.2).fillColor('#000');
    });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'PDF oluşturulamadı.' });
  }
});

module.exports = router;