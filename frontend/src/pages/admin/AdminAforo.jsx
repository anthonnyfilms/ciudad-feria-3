import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { LayoutDashboard, Calendar, Settings, LogOut, Tag, ShoppingCart, CreditCard, Shield, Table2, Users, BadgeCheck, BarChart3, RefreshCw, TrendingUp, UserCheck, UserX , Printer } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '../../components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminAforo = () => {
  const navigate = useNavigate();
  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState('');
  const [aforo, setAforo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/secure-admin-panel-2026');
      return;
    }
    cargarEventos();
  }, [navigate]);

  useEffect(() => {
    if (eventoSeleccionado) {
      cargarAforo();
    }
  }, [eventoSeleccionado]);

  useEffect(() => {
    let interval;
    if (autoRefresh && eventoSeleccionado) {
      interval = setInterval(cargarAforo, 5000); // Actualizar cada 5 segundos
    }
    return () => clearInterval(interval);
  }, [autoRefresh, eventoSeleccionado]);

  const cargarEventos = async () => {
    try {
      const response = await axios.get(`${API}/eventos`);
      setEventos(response.data);
      if (response.data.length > 0) {
        setEventoSeleccionado(response.data[0].id);
      }
    } catch (error) {
      console.error('Error cargando eventos:', error);
    }
  };

  const cargarAforo = async () => {
    if (!eventoSeleccionado) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/aforo/${eventoSeleccionado}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAforo(response.data);
    } catch (error) {
      console.error('Error cargando aforo:', error);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/secure-admin-panel-2026');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Calendar, label: 'Eventos', path: '/admin/eventos' },
    { icon: Tag, label: 'Categorías', path: '/admin/categorias' },
    { icon: ShoppingCart, label: 'Compras', path: '/admin/compras' },
    { icon: CreditCard, label: 'Métodos de Pago', path: '/admin/metodos-pago' },
    { icon: BadgeCheck, label: 'Acreditaciones', path: '/admin/acreditaciones' },
    { icon: Shield, label: 'Validar Entradas', path: '/admin/validar' },
    { icon: BarChart3, label: 'Aforo', path: '/admin/aforo' },
    { icon: Table2, label: 'Diseño Entrada', path: '/admin/diseno-entrada' },
    { icon: Users, label: 'Usuarios', path: '/admin/usuarios' },
    { icon: Settings, label: 'Configuración', path: '/admin/configuracion' },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <Toaster position="top-right" />
      
      {/* Sidebar */}
      <aside className="w-64 glass-card border-r border-white/10 p-6 flex flex-col">
        <div className="mb-8">
          <h1 className="text-2xl font-heading font-black text-gradient">Ciudad Feria</h1>
          <p className="text-foreground/60 text-sm">Panel Admin</p>
        </div>
        
        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                item.path === '/admin/aforo'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground/70 hover:bg-white/5'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-accent hover:bg-accent/10 transition-all mt-auto"
        >
          <LogOut className="w-5 h-5" />
          <span>Cerrar Sesión</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground">Aforo en Tiempo Real</h1>
              <p className="text-foreground/60">Control de capacidad y acceso</p>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-foreground/70">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                Auto-actualizar
              </label>
              <button
                onClick={cargarAforo}
                disabled={loading}
                className="bg-primary text-white px-4 py-2 rounded-xl flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
            </div>
          </div>

          {/* Selector de Evento */}
          <div className="mb-6">
            <select
              value={eventoSeleccionado}
              onChange={(e) => setEventoSeleccionado(e.target.value)}
              className="bg-background/50 border border-white/20 rounded-xl px-4 py-3 text-foreground w-full max-w-md"
            >
              {eventos.map(e => (
                <option key={e.id} value={e.id}>{e.nombre}</option>
              ))}
            </select>
          </div>

          {aforo && (
            <>
              {/* Resumen General */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-6 rounded-2xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-green-500/20 flex items-center justify-center">
                      <UserCheck className="w-7 h-7 text-green-400" />
                    </div>
                    <div>
                      <p className="text-foreground/60 text-sm">Personas Dentro</p>
                      <p className="text-3xl font-black text-green-400">{aforo.total_personas_dentro}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="glass-card p-6 rounded-2xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                      <TrendingUp className="w-7 h-7 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-foreground/60 text-sm">Entradas Vendidas</p>
                      <p className="text-3xl font-black text-blue-400">{aforo.total_entradas}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="glass-card p-6 rounded-2xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                      <BadgeCheck className="w-7 h-7 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-foreground/60 text-sm">Acreditaciones</p>
                      <p className="text-3xl font-black text-purple-400">{aforo.total_acreditaciones}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glass-card p-6 rounded-2xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-orange-500/20 flex items-center justify-center">
                      <UserX className="w-7 h-7 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-foreground/60 text-sm">Por Ingresar</p>
                      <p className="text-3xl font-black text-orange-400">
                        {aforo.entradas_fuera + aforo.acreditaciones_fuera}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Desglose por Categorías */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Entradas por Categoría */}
                <div className="glass-card p-6 rounded-2xl">
                  <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                    Entradas por Categoría
                  </h2>
                  <div className="space-y-4">
                    {Object.entries(aforo.categorias_entradas).map(([categoria, datos]) => (
                      <div key={categoria} className="bg-background/30 rounded-xl p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-foreground">{categoria}</span>
                          <span className="text-foreground/60">{datos.total} total</span>
                        </div>
                        <div className="flex gap-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <span className="text-green-400">{datos.dentro} dentro</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gray-500" />
                            <span className="text-gray-400">{datos.fuera} fuera</span>
                          </div>
                        </div>
                        {/* Barra de progreso */}
                        <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 transition-all duration-500"
                            style={{ width: `${datos.total > 0 ? (datos.dentro / datos.total) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    {Object.keys(aforo.categorias_entradas).length === 0 && (
                      <p className="text-foreground/50 text-center py-4">Sin datos de entradas</p>
                    )}
                  </div>
                </div>

                {/* Acreditaciones por Categoría */}
                <div className="glass-card p-6 rounded-2xl">
                  <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <BadgeCheck className="w-5 h-5 text-purple-400" />
                    Acreditaciones por Categoría
                  </h2>
                  <div className="space-y-4">
                    {Object.entries(aforo.categorias_acreditaciones).map(([categoria, datos]) => (
                      <div key={categoria} className="bg-background/30 rounded-xl p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-foreground">{categoria}</span>
                          <span className="text-foreground/60">{datos.total} total</span>
                        </div>
                        <div className="flex gap-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <span className="text-green-400">{datos.dentro} dentro</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gray-500" />
                            <span className="text-gray-400">{datos.fuera} fuera</span>
                          </div>
                        </div>
                        {/* Barra de progreso */}
                        <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-500 transition-all duration-500"
                            style={{ width: `${datos.total > 0 ? (datos.dentro / datos.total) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    {Object.keys(aforo.categorias_acreditaciones).length === 0 && (
                      <p className="text-foreground/50 text-center py-4">Sin acreditaciones</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {!aforo && !loading && (
            <div className="text-center py-20 text-foreground/50">
              Selecciona un evento para ver el aforo
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminAforo;
