import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { LayoutDashboard, Calendar, Settings, LogOut, Save, Upload, Palette, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '../../components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminConfiguracion = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [config, setConfig] = useState({
    banner_principal: '',
    logo: '',
    color_primario: '#FACC15',
    color_secundario: '#3B82F6',
    color_acento: '#EF4444',
    redes_sociales: {
      facebook: '',
      instagram: '',
      twitter: '',
      youtube: '',
      tiktok: '',
      whatsapp: ''
    }
  });

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    try {
      const response = await axios.get(`${API}/configuracion`);
      setConfig(response.data);
    } catch (error) {
      console.error('Error cargando configuración:', error);
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    toast.success('Sesión cerrada');
    navigate('/secure-admin-panel-2026');
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setGuardando(true);

    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(`${API}/admin/configuracion`, config, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Configuración actualizada exitosamente');
    } catch (error) {
      console.error('Error guardando configuración:', error);
      toast.error(error.response?.data?.detail || 'Error al guardar configuración');
    } finally {
      setGuardando(false);
    }
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Calendar, label: 'Eventos', path: '/admin/eventos' },
    { icon: Tag, label: 'Categorías', path: '/admin/categorias' },
    { icon: Settings, label: 'Configuración', path: '/admin/configuracion', active: true },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />
      
      {/* Header */}
      <header className="glass-card border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎪</span>
              <div>
                <h1 className="text-xl font-heading font-black text-primary">Panel Admin</h1>
                <p className="text-xs text-foreground/50">Ciudad Feria 2026</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-6 py-3 rounded-full glass-card hover:border-accent/50 transition-all text-foreground/80 hover:text-accent"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 glass-card border-r border-white/10 min-h-screen p-6">
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  item.active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground/70 hover:bg-white/5 hover:text-foreground'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-4xl font-heading font-black text-foreground">
              Configuración del Sitio
            </h2>
            <motion.button
              onClick={handleGuardar}
              disabled={guardando}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold btn-glow disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {guardando ? 'Guardando...' : 'Guardar Cambios'}
            </motion.button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Banner y Logo */}
              <div className="glass-card p-8 rounded-3xl">
                <h3 className="text-2xl font-heading font-bold text-foreground mb-6 flex items-center gap-3">
                  <Upload className="w-6 h-6 text-primary" />
                  Imágenes
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-foreground/80 mb-2 font-medium">
                      Banner Principal (URL)
                    </label>
                    <input
                      type="url"
                      value={config.banner_principal || ''}
                      onChange={(e) => setConfig({...config, banner_principal: e.target.value})}
                      className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="https://..."
                    />
                    <p className="text-xs text-foreground/50 mt-2">
                      URL de la imagen que aparecerá en la página principal
                    </p>
                  </div>
                  <div>
                    <label className="block text-foreground/80 mb-2 font-medium">
                      Logo (URL)
                    </label>
                    <input
                      type="url"
                      value={config.logo || ''}
                      onChange={(e) => setConfig({...config, logo: e.target.value})}
                      className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="https://..."
                    />
                    <p className="text-xs text-foreground/50 mt-2">
                      URL del logo que aparecerá en el navbar
                    </p>
                  </div>
                </div>
              </div>

              {/* Colores */}
              <div className="glass-card p-8 rounded-3xl">
                <h3 className="text-2xl font-heading font-bold text-foreground mb-6 flex items-center gap-3">
                  <Palette className="w-6 h-6 text-primary" />
                  Colores del Sitio
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-foreground/80 mb-2 font-medium">
                      Color Primario
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="color"
                        value={config.color_primario}
                        onChange={(e) => setConfig({...config, color_primario: e.target.value})}
                        className="w-16 h-12 rounded-xl cursor-pointer"
                      />
                      <input
                        type="text"
                        value={config.color_primario}
                        onChange={(e) => setConfig({...config, color_primario: e.target.value})}
                        className="flex-1 bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-foreground/80 mb-2 font-medium">
                      Color Secundario
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="color"
                        value={config.color_secundario}
                        onChange={(e) => setConfig({...config, color_secundario: e.target.value})}
                        className="w-16 h-12 rounded-xl cursor-pointer"
                      />
                      <input
                        type="text"
                        value={config.color_secundario}
                        onChange={(e) => setConfig({...config, color_secundario: e.target.value})}
                        className="flex-1 bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-foreground/80 mb-2 font-medium">
                      Color Acento
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="color"
                        value={config.color_acento}
                        onChange={(e) => setConfig({...config, color_acento: e.target.value})}
                        className="w-16 h-12 rounded-xl cursor-pointer"
                      />
                      <input
                        type="text"
                        value={config.color_acento}
                        onChange={(e) => setConfig({...config, color_acento: e.target.value})}
                        className="flex-1 bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Redes Sociales */}
              <div className="glass-card p-8 rounded-3xl">
                <h3 className="text-2xl font-heading font-bold text-foreground mb-6">
                  Redes Sociales
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-foreground/80 mb-2 font-medium">Facebook</label>
                    <input
                      type="url"
                      value={config.redes_sociales.facebook}
                      onChange={(e) => setConfig({
                        ...config,
                        redes_sociales: {...config.redes_sociales, facebook: e.target.value}
                      })}
                      className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-foreground/80 mb-2 font-medium">Instagram</label>
                    <input
                      type="url"
                      value={config.redes_sociales.instagram}
                      onChange={(e) => setConfig({
                        ...config,
                        redes_sociales: {...config.redes_sociales, instagram: e.target.value}
                      })}
                      className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-foreground/80 mb-2 font-medium">Twitter</label>
                    <input
                      type="url"
                      value={config.redes_sociales.twitter}
                      onChange={(e) => setConfig({
                        ...config,
                        redes_sociales: {...config.redes_sociales, twitter: e.target.value}
                      })}
                      className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="https://twitter.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-foreground/80 mb-2 font-medium">YouTube</label>
                    <input
                      type="url"
                      value={config.redes_sociales.youtube}
                      onChange={(e) => setConfig({
                        ...config,
                        redes_sociales: {...config.redes_sociales, youtube: e.target.value}
                      })}
                      className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-foreground/80 mb-2 font-medium">TikTok</label>
                    <input
                      type="url"
                      value={config.redes_sociales.tiktok}
                      onChange={(e) => setConfig({
                        ...config,
                        redes_sociales: {...config.redes_sociales, tiktok: e.target.value}
                      })}
                      className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="https://tiktok.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-foreground/80 mb-2 font-medium">WhatsApp</label>
                    <input
                      type="text"
                      value={config.redes_sociales.whatsapp}
                      onChange={(e) => setConfig({
                        ...config,
                        redes_sociales: {...config.redes_sociales, whatsapp: e.target.value}
                      })}
                      className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="+58412000000"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminConfiguracion;
