import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Lock, User } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '../../components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/admin/login`, {
        username,
        password
      });

      localStorage.setItem('admin_token', response.data.access_token);
      toast.success('¡Bienvenido al panel administrativo!');
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      toast.error(error.response?.data?.detail || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      backgroundImage: 'url("https://images.unsplash.com/photo-1750323313940-a267ef7d89fa?crop=entropy&cs=srgb&fm=jpg&q=85")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
      <Toaster richColors position="top-center" />
      <div className="absolute inset-0 bg-background/90"></div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass-card p-10 rounded-3xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
              <Lock className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-heading font-black text-primary glow-text mb-2">
              Panel Administrativo
            </h1>
            <p className="text-foreground/70">Ciudad Feria 2026</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-foreground/80 mb-2 font-medium">
                Usuario
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/50" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-input border border-border rounded-xl pl-12 pr-6 py-4 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="admin"
                  required
                  data-testid="admin-username"
                />
              </div>
            </div>

            <div>
              <label className="block text-foreground/80 mb-2 font-medium">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/50" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-input border border-border rounded-xl pl-12 pr-6 py-4 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="••••••••"
                  required
                  data-testid="admin-password"
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-primary text-primary-foreground py-4 rounded-full font-bold text-lg btn-glow disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="admin-login-button"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </motion.button>
          </form>

          <div className="mt-8 text-center">
            <a href="/" className="text-foreground/50 hover:text-primary transition-colors text-sm">
              ← Volver al sitio principal
            </a>
          </div>
        </div>

        <p className="text-center text-foreground/30 text-xs mt-6">
          Credenciales por defecto: admin / admin123
        </p>
      </motion.div>
    </div>
  );
};

export default AdminLogin;