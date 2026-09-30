import { useState } from 'react';
import { api } from '../api/client';

const ILCELER = ['Foça', 'Menemen', 'Aliağa'];
const TURLER = ['Makine arızası', 'Klima kurulumu', 'Klima arızası', 'Bakım', 'Diğer'];
const DURUMLAR = ['Beklemede', 'Servise alındı', 'Tamamlandı', 'İptal edildi'];

export default function CustomerModal({ customer, onClose, onSave }) {
  const isEdit = !!customer?.id;
  const [form, setForm] = useState({
    ad: customer?.ad || '',
    soyad: customer?.soyad || '',
    telefon: customer?.telefon || '',
    adres: customer?.adres || '',
    ilce: customer?.ilce || 'Foça',
    servis_turu: customer?.servis_turu || 'Klima kurulumu',
    durum: customer?.durum || 'Beklemede',
    notlar: customer?.notlar || '',
  });
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [forceMode, setForceMode] = useState(false);

  function update(field, val) {
    setForm(prev => ({ ...prev, [field]: val }));
  }

  async function handleSave() {
    setError('');
    setLoading(true);

    if (!form.ad || !form.soyad || !form.telefon || !form.adres) {
      setError('Lütfen zorunlu alanları doldurun.');
      setLoading(false);
      return;
    }

    try {
      if (isEdit) {
        await api.updateCustomer(customer.id, form);
      } else {
        await api.createCustomer({ ...form, force: forceMode });
      }
      onSave();
    } catch (err) {
      if (err.requireForce) {
        setWarnings(err.warnings || []);
        setForceMode(true);
      } else {
        setError(err.error || 'Kayıt başarısız.');
      }
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: '100%', padding: '8px 10px', border: '1px solid #ddd',
    borderRadius: 8, fontSize: 13, boxSizing: 'border-box', fontFamily: 'inherit'
  };
  const labelStyle = { fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 4, display: 'block' };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.4)', zIndex: 200,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 40
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'white', borderRadius: 12, width: 560,
        maxHeight: '85vh', overflowY: 'auto',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            {isEdit ? 'Müşteri Düzenle' : 'Yeni Müşteri Ekle'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888' }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Ad *</label>
              <input style={inputStyle} value={form.ad} onChange={e => update('ad', e.target.value)} placeholder="Ahmet" />
            </div>
            <div>
              <label style={labelStyle}>Soyad *</label>
              <input style={inputStyle} value={form.soyad} onChange={e => update('soyad', e.target.value)} placeholder="Yılmaz" />
            </div>
            <div>
              <label style={labelStyle}>Telefon *</label>
              <input style={inputStyle} value={form.telefon} onChange={e => update('telefon', e.target.value)} placeholder="05xx xxx xxxx" />
            </div>
            <div>
              <label style={labelStyle}>İlçe *</label>
              <select style={inputStyle} value={form.ilce} onChange={e => update('ilce', e.target.value)}>
                {ILCELER.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Adres *</label>
              <input style={inputStyle} value={form.adres} onChange={e => update('adres', e.target.value)} placeholder="Mahalle, cadde, kapı no..." />
            </div>
            <div>
              <label style={labelStyle}>Servis Türü *</label>
              <select style={inputStyle} value={form.servis_turu} onChange={e => update('servis_turu', e.target.value)}>
                {TURLER.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Durum</label>
              <select style={inputStyle} value={form.durum} onChange={e => update('durum', e.target.value)}>
                {DURUMLAR.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Not</label>
              <textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }}
                value={form.notlar} onChange={e => update('notlar', e.target.value)} />
            </div>
          </div>

          {error && (
            <div style={{ marginTop: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', color: '#dc2626', fontSize: 13 }}>
              ⚠️ {error}
            </div>
          )}

          {warnings.length > 0 && (
            <div style={{ marginTop: 12, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#92400e' }}>
              <div style={{ fontWeight: 500, marginBottom: 6 }}>⚠️ Dikkat:</div>
              {warnings.map((w, i) => <div key={i}>• {w}</div>)}
              <div style={{ marginTop: 8, color: '#666' }}>Yine de kaydetmek için tekrar <strong>Ekle</strong> butonuna tıklayın.</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose}
            style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 13 }}>
            İptal
          </button>
          <button onClick={handleSave} disabled={loading}
            style={{ padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
            {loading ? 'Kaydediliyor...' : isEdit ? '💾 Kaydet' : '➕ Ekle'}
          </button>
        </div>
      </div>
    </div>
  );
}