import { useState } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../api/client';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setUser = useStore(s => s.setUser);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api.login({ username, password });
      setUser(data.user, data.token);
      window.location.href = '/';
    } catch (err) {
      setError(err.error || 'Giriş başarısız.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#f5f5f5'
    }}>
      <div style={{
        background: 'white', borderRadius: 12, padding: 32,
        width: 360, boxShadow: '0 2px 16px rgba(0,0,0,0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 48, height: 48, background: '#dbeafe', borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px', fontSize: 24
          }}>🔧</div>
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Servis Takip</h1>
          <p style={{ color: '#666', fontSize: 13, marginTop: 4 }}>Şirket içi yönetim paneli</p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: 8, padding: '10px 12px', marginBottom: 16,
            color: '#dc2626', fontSize: 13
          }}>{error}</div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#555' }}>Kullanıcı adı</label>
            <input
              value={username} onChange={e => setUsername(e.target.value)}
              placeholder="kullanici_adi" required
              style={{
                width: '100%', marginTop: 4, padding: '8px 10px',
                border: '1px solid #ddd', borderRadius: 8, fontSize: 14,
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#555' }}>Şifre</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••" required
              style={{
                width: '100%', marginTop: 4, padding: '8px 10px',
                border: '1px solid #ddd', borderRadius: 8, fontSize: 14,
                boxSizing: 'border-box'
              }}
            />
          </div>
          <button
            type="submit" disabled={loading}
            style={{
              background: '#2563eb', color: 'white', border: 'none',
              borderRadius: 8, padding: '10px', fontSize: 14,
              fontWeight: 500, cursor: 'pointer', marginTop: 4
            }}
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <div style={{
          marginTop: 16, padding: 10, background: '#f9fafb',
          borderRadius: 8, fontSize: 11, color: '#888', textAlign: 'center'
        }}>
          Demo: admin / admin123 · teknisyen / admin123
        </div>
      </div>
    </div>
  );
}