const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function getToken() {
  return localStorage.getItem('servis_token');
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  if (res.status === 401) {
    localStorage.removeItem('servis_token');
    localStorage.removeItem('servis_user');
    window.location.href = '/';
    return;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
}

export const api = {
  login: (body)              => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getCustomers: (params = {})=> request('/customers?' + new URLSearchParams(params)),
  createCustomer: (body)     => request('/customers', { method: 'POST', body: JSON.stringify(body) }),
  updateCustomer: (id, body) => request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  setTamamlandi: (id, val)   => request(`/customers/${id}/tamamlandi`, { method: 'PATCH', body: JSON.stringify({ tamamlandi: val }) }),
  deleteCustomer: (id)       => request(`/customers/${id}`, { method: 'DELETE' }),
  exportExcel: (params)      => `${BASE}/export/excel?${new URLSearchParams(params)}&token=${getToken()}`,
  exportPdf: (params)        => `${BASE}/export/pdf?${new URLSearchParams(params)}&token=${getToken()}`,
};