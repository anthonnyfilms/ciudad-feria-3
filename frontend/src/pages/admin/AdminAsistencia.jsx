import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { LayoutDashboard, Calendar, Settings, LogOut, Tag, ShoppingCart, CreditCard, Shield, Table2, Users, BarChart3, RefreshCw, UserCheck, Clock, TrendingUp , Printer } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';
import { Toaster } from '../../components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = ['#FACC15', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#F97316'];

const AdminAsistencia = () => {
  const navigate = useNavigate();
  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState('');
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    cargarEventos();
  }, []);

  useEffect(() => {
    if (eventoSeleccionado) {
      cargarEstadisticas();
    }
  }, [eventoSeleccionado]);

  useEffect(() => {
    let interval;
    if (autoRefresh && eventoSeleccionado) {
      interval = setInterval(() => {
        cargarEstadisticas();
      }, 10000); // Refresh cada 10 segundos
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
    } finally {
      setLoading(false);
    }
  };

  const cargarEstadisticas = async () => {
    if (!eventoSeleccionado) return;
    
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/eventos/${eventoSeleccionado}/asistencia`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEstadisticas(response.data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      toast.error('Error al cargar estadísticas');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin-ciudadferia');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Calendar, label: 'Eventos', path: '/admin/eventos' },
    { icon: Tag, label: 'Categorías', path: '/admin/categorias' },
    { icon: Table2, label: 'Categorías Mesas', path: '/admin/categorias-mesas' },
    { icon: ShoppingCart, label: 'Compras', path: '/admin/compras' },
    { icon: CreditCard, label: 'Métodos de Pago', path: '/admin/metodos-pago' },
    { icon: Shield, label: 'Validar Entradas', path: '/admin/validar' },
    { icon: Printer, label: 'Tickets Térmicos', path: '/admin/tickets-termicos' },
    { icon: BarChart3, label: 'Asistencia', path: '/admin/asistencia', active: true },
    { icon: Tag, label: 'Diseño Entrada', path: '/admin/diseno-entrada' },
    { icon: Users, label: 'Usuarios', path: '/admin/usuarios' },
    { icon: Settings, label: 'Configuración', path: '/admin/configuracion' },
  ];

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
            <button onClick={handleLogout} className="flex items-center gap-2 px-6 py-3 rounded-full glass-card hover:border-accent/50 transition-all text-foreground/80 hover:text-accent">
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 glass-card border-r border-white/10 min-h-screen p-6 hidden lg:block">
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  item.active ? 'bg-primary text-primary-foreground' : 'text-foreground/70 hover:bg-white/5 hover:text-foreground'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-4 lg:p-8">
          <div className="mb-8">
            <h2 className="text-3xl lg:text-4xl font-heading font-black text-foreground">
              📊 Control de Asistencia
            </h2>
            <p className="text-foreground/60 mt-2">
              Monitorea en tiempo real quiénes han entrado al evento
            </p>
          </div>

          {/* Selector de Evento y Auto Refresh */}
          <div className="glass-card p-6 rounded-2xl mb-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
              <div className="flex-1 w-full">
                <label className="block text-foreground/70 text-sm mb-2">Selecciona un evento</label>
                <select
                  value={eventoSeleccionado}
                  onChange={(e) => setEventoSeleccionado(e.target.value)}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary outline-none"
                >
                  {eventos.map(evento => (
                    <option key={evento.id} value={evento.id}>{evento.nombre}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={cargarEstadisticas}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl glass-card hover:border-primary/50 transition-all"
                >
                  <RefreshCw className="w-5 h-5" />
                  Actualizar
                </button>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="w-5 h-5 rounded accent-primary"
                  />
                  <span className="text-foreground/70 text-sm">Auto-refresh (10s)</span>
                </label>
              </div>
            </div>
          </div>

          {estadisticas && (
            <>
              {/* Resumen General */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-6 rounded-2xl"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-foreground/60 text-sm">Vendidas</span>
                  </div>
                  <p className="text-3xl font-black text-foreground">{estadisticas.total_vendidas}</p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="glass-card p-6 rounded-2xl border border-green-500/30"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-green-500" />
                    </div>
                    <span className="text-foreground/60 text-sm">Han Entrado</span>
                  </div>
                  <p className="text-3xl font-black text-green-500">{estadisticas.han_entrado}</p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="glass-card p-6 rounded-2xl"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-orange-500" />
                    </div>
                    <span className="text-foreground/60 text-sm">Pendientes</span>
                  </div>
                  <p className="text-3xl font-black text-orange-500">{estadisticas.pendientes_entrar}</p>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="glass-card p-6 rounded-2xl"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-blue-500" />
                    </div>
                    <span className="text-foreground/60 text-sm">Asistencia</span>
                  </div>
                  <p className="text-3xl font-black text-blue-500">{estadisticas.porcentaje_asistencia}%</p>
                </motion.div>
              </div>

              {/* Gráficas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Gráfica de Barras por Categoría */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-6 rounded-2xl"
                >
                  <h3 className="text-xl font-bold text-foreground mb-4">📊 Asistencia por Categoría</h3>
                  {estadisticas.por_categoria.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={estadisticas.por_categoria}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="categoria" stroke="#888" fontSize={12} />
                        <YAxis stroke="#888" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333' }}
                          labelStyle={{ color: '#fff' }}
                        />
                        <Legend />
                        <Bar dataKey="han_entrado" name="Han Entrado" fill="#10B981" />
                        <Bar dataKey="pendientes" name="Pendientes" fill="#F97316" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-foreground/50 text-center py-12">No hay datos de categorías</p>
                  )}
                </motion.div>

                {/* Gráfica Circular */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-6 rounded-2xl"
                >
                  <h3 className="text-xl font-bold text-foreground mb-4">🥧 Distribución</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Han Entrado', value: estadisticas.han_entrado },
                          { name: 'Pendientes', value: estadisticas.pendientes_entrar }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        dataKey="value"
                      >
                        <Cell fill="#10B981" />
                        <Cell fill="#F97316" />
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #333' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </motion.div>
              </div>

              {/* Tabla de Categorías */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 rounded-2xl mb-6"
              >
                <h3 className="text-xl font-bold text-foreground mb-4">📋 Detalle por Categoría</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4 text-foreground/70">Categoría</th>
                        <th className="text-center py-3 px-4 text-foreground/70">Vendidas</th>
                        <th className="text-center py-3 px-4 text-foreground/70">Han Entrado</th>
                        <th className="text-center py-3 px-4 text-foreground/70">Pendientes</th>
                        <th className="text-center py-3 px-4 text-foreground/70">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {estadisticas.por_categoria.map((cat, index) => (
                        <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                          <td className="py-3 px-4 font-medium text-foreground">
                            <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                            {cat.categoria}
                          </td>
                          <td className="py-3 px-4 text-center text-foreground/80">{cat.total_vendidas}</td>
                          <td className="py-3 px-4 text-center text-green-500 font-bold">{cat.han_entrado}</td>
                          <td className="py-3 px-4 text-center text-orange-500">{cat.pendientes}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              (cat.han_entrado / cat.total_vendidas * 100) >= 80 ? 'bg-green-500/20 text-green-500' :
                              (cat.han_entrado / cat.total_vendidas * 100) >= 50 ? 'bg-yellow-500/20 text-yellow-500' :
                              'bg-red-500/20 text-red-500'
                            }`}>
                              {cat.total_vendidas > 0 ? Math.round(cat.han_entrado / cat.total_vendidas * 100) : 0}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* Últimas Entradas */}
              {estadisticas.ultimas_entradas && estadisticas.ultimas_entradas.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-6 rounded-2xl"
                >
                  <h3 className="text-xl font-bold text-foreground mb-4">🚪 Últimas Entradas Registradas</h3>
                  <div className="space-y-2">
                    {estadisticas.ultimas_entradas.map((entrada, index) => (
                      <div key={index} className="flex items-center justify-between py-2 px-4 rounded-lg bg-white/5">
                        <div className="flex items-center gap-3">
                          <span className="text-green-500">✓</span>
                          <span className="font-medium text-foreground">{entrada.nombre_comprador}</span>
                          {entrada.categoria_asiento && (
                            <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full">
                              {entrada.categoria_asiento}
                            </span>
                          )}
                        </div>
                        <span className="text-foreground/50 text-sm">
                          {entrada.hora_entrada ? new Date(entrada.hora_entrada).toLocaleTimeString() : '-'}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </>
          )}

          {!estadisticas && !loading && (
            <div className="glass-card p-12 rounded-3xl text-center">
              <BarChart3 className="w-16 h-16 text-foreground/30 mx-auto mb-4" />
              <p className="text-foreground/50 text-lg">Selecciona un evento para ver las estadísticas</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminAsistencia;
