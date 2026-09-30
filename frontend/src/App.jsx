import { useStore } from './store/useStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

export default function App() {
  const user = useStore(s => s.user);
  return user ? <Dashboard /> : <Login />;
}