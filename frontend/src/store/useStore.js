import { create } from 'zustand';

export const useStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('servis_user') || 'null'),
  token: localStorage.getItem('servis_token') || null,

  setUser: (user, token) => {
    localStorage.setItem('servis_user', JSON.stringify(user));
    localStorage.setItem('servis_token', token);
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem('servis_user');
    localStorage.removeItem('servis_token');
    set({ user: null, token: null });
  },
}));