import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { LayoutDashboard, Calendar, Settings, LogOut, Ticket, Users, CheckCircle, Tag, ShoppingCart, CreditCard, Shield, Table2, BarChart3, BadgeCheck, Activity, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '../../components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ventasPorEvento, setVentasPorEvento] = useState([]);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/estadisticas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
      setVentasPorEvento(response.data.ventas_por_evento || []);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    toast.success('Sesión cerrada');
    navigate('/secure-admin-panel-2026');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard', active: true },
    { icon: Calendar, label: 'Eventos', path: '/admin/eventos' },
    { icon: Tag, label: 'Categorías', path: '/admin/categorias' },
    { icon: Table2, label: 'Categorías Mesas', path: '/admin/categorias-mesas' },
    { icon: ShoppingCart, label: 'Compras', path: '/admin/compras' },
    { icon: CreditCard, label: 'Métodos de Pago', path: '/admin/metodos-pago' },
    { icon: Shield, label: 'Validar Entradas', path: '/admin/validar' },
    { icon: Printer, label: 'Tickets Térmicos', path: '/admin/tickets-termicos' },
    { icon: Ticket, label: 'Diseño Entrada', path: '/admin/diseno-entrada' },
    { icon: BadgeCheck, label: 'Acreditaciones', path: '/admin/acreditaciones' },
    { icon: BadgeCheck, label: 'Diseño Acreditación', path: '/admin/diseno-acreditacion' },
    { icon: Activity, label: 'Aforo', path: '/admin/aforo' },
    { icon: Users, label: 'Usuarios', path: '/admin/usuarios' },
    { icon: Settings, label: 'Configuración', path: '/admin/configuracion' },
  ];

  const renderStats = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 rounded-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-foreground mb-1">
            {stats?.total_eventos || 0}
          </h3>
          <p className="text-foreground/60 text-sm">Eventos Activos</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 rounded-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
              <Ticket className="w-6 h-6 text-secondary" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-foreground mb-1">
            {stats?.total_entradas_vendidas || 0}
          </h3>
          <p className="text-foreground/60 text-sm">Total Entradas</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 rounded-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-primary" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-foreground mb-1">
            {stats?.entradas_aprobadas || 0}
          </h3>
          <p className="text-foreground/60 text-sm">Aprobadas</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6 rounded-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-accent" />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-foreground mb-1">
            {stats?.entradas_pendientes_pago || 0}
          </h3>
          <p className="text-foreground/60 text-sm">Pendientes</p>
        </motion.div>
      </div>

      {ventasPorEvento.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-8 rounded-3xl mb-12"
        >
          <h3 className="text-2xl font-heading font-bold text-foreground mb-6">
            Ventas por Evento
          </h3>
          <div className="space-y-4">
            {ventasPorEvento.map((evento) => (
              <div key={evento._id} className="glass-card p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-foreground">{evento.nombre_evento}</h4>
                  <span className="text-primary font-bold">{evento.total_vendidas} entradas</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-foreground/70">
                  <span>✅ Aprobadas: {evento.aprobadas}</span>
                  <span>⏳ Pendientes: {evento.total_vendidas - evento.aprobadas}</span>
                </div>
                <div className="mt-3 h-2 bg-foreground/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${(evento.aprobadas / evento.total_vendidas) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/admin/eventos">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="glass-card p-8 rounded-2xl cursor-pointer group hover:border-primary/50 transition-all"
          >
            <Calendar className="w-10 h-10 text-primary mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-heading font-bold text-foreground mb-2">
              Gestionar Eventos
            </h3>
            <p className="text-foreground/60">
              Crear, editar y eliminar eventos de la feria
            </p>
          </motion.div>
        </Link>

        <Link to="/admin/configuracion">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="glass-card p-8 rounded-2xl cursor-pointer group hover:border-primary/50 transition-all"
          >
            <Settings className="w-10 h-10 text-primary mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-heading font-bold text-foreground mb-2">
              Configuración del Sitio
            </h3>
            <p className="text-foreground/60">
              Personalizar colores, banner, logo y redes sociales
            </p>
          </motion.div>
        </Link>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />
      
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

        <main className="flex-1 p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-4xl font-heading font-black text-foreground mb-8">
              Bienvenido al Dashboard
            </h2>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary"></div>
              </div>
            ) : (
              renderStats()
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
// build-fix-1767085501
