import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useStore } from '../store/useStore';
import CustomerModal from '../components/CustomerModal';

const ILCELER = ['Foça', 'Menemen', 'Aliağa'];
const TURLER = ['Makine arızası', 'Klima kurulumu', 'Klima arızası', 'Bakım', 'Diğer'];
const DURUMLAR = ['Beklemede', 'Servise alındı', 'Tamamlandı', 'İptal edildi'];

function StatusBadge({ durum }) {
  const styles = {
    'Beklemede':     { background: '#fef9c3', color: '#854d0e' },
    'Servise alındı':{ background: '#dbeafe', color: '#1e40af' },
    'Tamamlandı':    { background: '#dcfce7', color: '#166534' },
    'İptal edildi':  { background: '#f3f4f6', color: '#6b7280' },
  };
  const s = styles[durum] || styles['Beklemede'];
  return (
    <span style={{
      ...s, padding: '3px 8px', borderRadius: 10,
      fontSize: 11, fontWeight: 500
    }}>{durum}</span>
  );
}

export default function Dashboard() {
  const { user, logout } = useStore();
  const [customers, setCustomers] = useState([]);
  const [activeTab, setActiveTab] = useState('Foça');
  const [filterDurum, setFilterDurum] = useState('');
  const [filterTur, setFilterTur] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);
  const [page, setPage] = useState('liste');

  const isAdmin = user?.rol === 'admin';

  useEffect(() => { loadCustomers(); }, []);

  async function loadCustomers() {
    try {
      const data = await api.getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleTamamlandi(id, val) {
    try {
      const updated = await api.setTamamlandi(id, val);
      setCustomers(prev => prev.map(c => c.id === updated.id ? updated : c));
    } catch (err) { console.error(err); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Bu müşteriyi silmek istediğinizden emin misiniz?')) return;
    try {
      await api.deleteCustomer(id);
      setCustomers(prev => prev.filter(c => c.id !== id));
    } catch (err) { alert('Silme başarısız.'); }
  }

  const filtered = customers.filter(c => {
    if (page === 'liste' && c.ilce !== activeTab) return false;
    if (filterDurum && c.durum !== filterDurum) return false;
    if (filterTur && c.servis_turu !== filterTur) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!(c.ad + ' ' + c.soyad).toLowerCase().includes(q) && !c.telefon.includes(q)) return false;
    }
    return true;
  }).sort((a, b) => new Date(a.kayit_tarihi) - new Date(b.kayit_tarihi));

  const pending = filtered.filter(c => !c.tamamlandi && c.durum !== 'İptal edildi');
  const done = filtered.filter(c => c.tamamlandi || c.durum === 'Tamamlandı');
  const cancelled = filtered.filter(c => c.durum === 'İptal edildi' && !c.tamamlandi);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      {/* Sidebar */}
      <div style={{
        width: 220, background: 'white', borderRight: '1px solid #e5e7eb',
        display: 'flex', flexDirection: 'column', position: 'fixed',
        top: 0, left: 0, height: '100vh'
      }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, background: '#dbeafe', borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>🔧</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Servis Takip</div>
              <div style={{ fontSize: 11, color: '#888' }}>{user?.ad}</div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, padding: '8px 0' }}>
          {[
            { key: 'liste', label: '📋 Günlük Servis Listesi' },
            ...(isAdmin ? [{ key: 'musteriler', label: '👥 Müşteri Yönetimi' }] : [])
          ].map(item => (
            <div key={item.key} onClick={() => setPage(item.key)}
              style={{
                padding: '10px 16px', cursor: 'pointer', fontSize: 13,
                background: page === item.key ? '#dbeafe' : 'transparent',
                color: page === item.key ? '#1e40af' : '#555',
                fontWeight: page === item.key ? 500 : 400
              }}>{item.label}</div>
          ))}

          <div style={{ padding: '12px 16px 4px', fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>İlçeler</div>
          {ILCELER.map(ilce => {
            const cnt = customers.filter(c => c.ilce === ilce && !c.tamamlandi && c.durum !== 'İptal edildi').length;
            return (
              <div key={ilce} onClick={() => { setPage('liste'); setActiveTab(ilce); }}
                style={{ padding: '8px 16px 8px 24px', cursor: 'pointer', fontSize: 13, color: '#555', display: 'flex', justifyContent: 'space-between' }}>
                📍 {ilce}
                {cnt > 0 && <span style={{ background: '#dbeafe', color: '#1e40af', borderRadius: 10, padding: '1px 7px', fontSize: 11 }}>{cnt}</span>}
              </div>
            );
          })}
        </div>

        <div style={{ borderTop: '1px solid #e5e7eb', padding: 12 }}>
          <div onClick={logout} style={{ padding: '8px 16px', cursor: 'pointer', fontSize: 13, color: '#dc2626', borderRadius: 8 }}>
            🚪 Çıkış Yap
          </div>
        </div>
      </div>

      {/* Ana içerik */}
      <div style={{ marginLeft: 220, flex: 1 }}>
        {/* Topbar */}
        <div style={{
          background: 'white', borderBottom: '1px solid #e5e7eb',
          padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            {page === 'liste' ? 'Günlük Servis Listesi' : 'Müşteri Yönetimi'}
          </h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {isAdmin && (
              <button onClick={() => { setEditCustomer(null); setShowModal(true); }}
                style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                + Yeni Müşteri
              </button>
            )}
            <button onClick={() => window.open(api.exportExcel({ ilce: page === 'liste' ? activeTab : '' }))}
              style={{ background: 'white', border: '1px solid #ddd', borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer' }}>
              📥 Excel
            </button>
            <button onClick={() => window.open(api.exportPdf({ ilce: page === 'liste' ? activeTab : '' }))}
              style={{ background: 'white', border: '1px solid #ddd', borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer' }}>
              📄 PDF
            </button>
          </div>
        </div>

        <div style={{ padding: 24 }}>
          {/* İstatistikler */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Toplam Kayıt', val: customers.length },
              { label: 'Beklemede', val: customers.filter(c => c.durum === 'Beklemede').length },
              { label: 'Tamamlandı', val: customers.filter(c => c.tamamlandi).length },
              { label: `${page === 'liste' ? activeTab : 'Bugün'} Kaydı`, val: page === 'liste' ? customers.filter(c => c.ilce === activeTab).length : customers.length },
            ].map(s => (
              <div key={s.label} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 24, fontWeight: 600 }}>{s.val}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Sekmeler (sadece liste sayfasında) */}
          {page === 'liste' && (
            <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: 16 }}>
              {ILCELER.map(ilce => (
                <div key={ilce} onClick={() => setActiveTab(ilce)}
                  style={{
                    padding: '10px 20px', cursor: 'pointer', fontSize: 13,
                    borderBottom: activeTab === ilce ? '2px solid #2563eb' : '2px solid transparent',
                    color: activeTab === ilce ? '#2563eb' : '#555',
                    fontWeight: activeTab === ilce ? 500 : 400
                  }}>
                  {ilce} <span style={{ background: '#f3f4f6', borderRadius: 10, padding: '1px 7px', fontSize: 11, marginLeft: 4 }}>
                    {customers.filter(c => c.ilce === ilce).length}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Filtreler */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Ad, soyad veya telefon..."
              style={{ padding: '7px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, minWidth: 220 }} />
            <select value={filterDurum} onChange={e => setFilterDurum(e.target.value)}
              style={{ padding: '7px 10px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13 }}>
              <option value="">Tüm Durumlar</option>
              {DURUMLAR.map(d => <option key={d}>{d}</option>)}
            </select>
            <select value={filterTur} onChange={e => setFilterTur(e.target.value)}
              style={{ padding: '7px 10px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13 }}>
              <option value="">Tüm Servis Türleri</option>
              {TURLER.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          {/* Tablo */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500, color: '#555', fontSize: 12 }}>#</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500, color: '#555', fontSize: 12 }}>Müşteri</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500, color: '#555', fontSize: 12 }}>Telefon</th>
                  {page === 'musteriler' && <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500, color: '#555', fontSize: 12 }}>İlçe</th>}
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500, color: '#555', fontSize: 12 }}>Adres</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500, color: '#555', fontSize: 12 }}>Servis Türü</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500, color: '#555', fontSize: 12 }}>Not</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500, color: '#555', fontSize: 12 }}>Kayıt Tarihi</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500, color: '#555', fontSize: 12 }}>Durum</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 500, color: '#555', fontSize: 12 }}>Tamamlandı</th>
                  {isAdmin && <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500, color: '#555', fontSize: 12 }}>İşlem</th>}
                </tr>
              </thead>
              <tbody>
                {pending.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500 }}>{i + 1}</div>
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 500 }}>{c.ad} {c.soyad}</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12 }}>{c.telefon}</td>
                    {page === 'musteriler' && <td style={{ padding: '10px 12px' }}>{c.ilce}</td>}
                    <td style={{ padding: '10px 12px', fontSize: 12, maxWidth: 160 }}>{c.adres}</td>
                    <td style={{ padding: '10px 12px' }}><StatusBadge durum={c.servis_turu} /></td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: '#888' }}>{c.notlar || '—'}</td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: '#888' }}>{new Date(c.kayit_tarihi).toLocaleString('tr-TR')}</td>
                    <td style={{ padding: '10px 12px' }}><StatusBadge durum={c.durum} /></td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <input type="checkbox" checked={c.tamamlandi} onChange={e => handleTamamlandi(c.id, e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                    </td>
                    {isAdmin && (
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => { setEditCustomer(c); setShowModal(true); }}
                            style={{ padding: '4px 8px', border: '1px solid #ddd', borderRadius: 6, background: 'white', cursor: 'pointer', fontSize: 12 }}>✏️</button>
                          <button onClick={() => handleDelete(c.id)}
                            style={{ padding: '4px 8px', border: '1px solid #fecaca', borderRadius: 6, background: '#fef2f2', cursor: 'pointer', fontSize: 12 }}>🗑️</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}

                {done.length > 0 && (
                  <tr><td colSpan={isAdmin ? 11 : 10} style={{ padding: '8px 12px', background: '#dcfce7', fontSize: 11, fontWeight: 500, color: '#166534' }}>
                    ✅ Tamamlanan kayıtlar ({done.length})
                  </td></tr>
                )}

                {done.map((c, i) => (
                  <tr key={c.id} style={{ background: '#f0fdf4', borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>✓</div>
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 500, textDecoration: 'line-through', color: '#888' }}>{c.ad} {c.soyad}</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12, color: '#888' }}>{c.telefon}</td>
                    {page === 'musteriler' && <td style={{ padding: '10px 12px', color: '#888' }}>{c.ilce}</td>}
                    <td style={{ padding: '10px 12px', fontSize: 12, color: '#888' }}>{c.adres}</td>
                    <td style={{ padding: '10px 12px', color: '#888' }}>{c.servis_turu}</td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: '#888' }}>{c.notlar || '—'}</td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: '#888' }}>{new Date(c.kayit_tarihi).toLocaleString('tr-TR')}</td>
                    <td style={{ padding: '10px 12px' }}><StatusBadge durum="Tamamlandı" /></td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <input type="checkbox" checked={true} onChange={e => handleTamamlandi(c.id, e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                    </td>
                    {isAdmin && <td style={{ padding: '10px 12px' }}></td>}
                  </tr>
                ))}

                {cancelled.map((c) => (
                  <tr key={c.id} style={{ background: '#f9fafb', opacity: 0.6, borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '10px 12px' }}>—</td>
                    <td style={{ padding: '10px 12px', color: '#888' }}>{c.ad} {c.soyad}</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12, color: '#888' }}>{c.telefon}</td>
                    {page === 'musteriler' && <td style={{ padding: '10px 12px', color: '#888' }}>{c.ilce}</td>}
                    <td style={{ padding: '10px 12px', fontSize: 12, color: '#888' }}>{c.adres}</td>
                    <td style={{ padding: '10px 12px', color: '#888' }}>{c.servis_turu}</td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: '#888' }}>{c.notlar || '—'}</td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: '#888' }}>{new Date(c.kayit_tarihi).toLocaleString('tr-TR')}</td>
                    <td style={{ padding: '10px 12px' }}><StatusBadge durum="İptal edildi" /></td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>—</td>
                    {isAdmin && (
                      <td style={{ padding: '10px 12px' }}>
                        <button onClick={() => handleDelete(c.id)}
                          style={{ padding: '4px 8px', border: '1px solid #fecaca', borderRadius: 6, background: '#fef2f2', cursor: 'pointer', fontSize: 12 }}>🗑️</button>
                      </td>
                    )}
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr><td colSpan={isAdmin ? 11 : 10} style={{ textAlign: 'center', padding: 32, color: '#888' }}>
                    Kayıt bulunamadı
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <CustomerModal
          customer={editCustomer}
          onClose={() => { setShowModal(false); setEditCustomer(null); }}
          onSave={() => { setShowModal(false); setEditCustomer(null); loadCustomers(); }}
        />
      )}
    </div>
  );
}