import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { LayoutDashboard, Calendar, Settings, LogOut, Tag, ShoppingCart, CreditCard, Shield, Table2, Users, Plus, Trash2, Eye, EyeOff, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '../../components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminUsuarios = () => {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'validador'
  });

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/usuarios`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsuarios(response.data);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      toast.error('Completa todos los campos');
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      await axios.post(`${API}/admin/usuarios`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Usuario ${formData.username} creado exitosamente`);
      setMostrarModal(false);
      setFormData({ username: '', password: '', role: 'validador' });
      cargarUsuarios();
    } catch (error) {
      console.error('Error creando usuario:', error);
      toast.error(error.response?.data?.detail || 'Error al crear usuario');
    }
  };

  const handleEliminar = async (username) => {
    if (!window.confirm(`¿Estás seguro de eliminar al usuario ${username}?`)) return;

    try {
      const token = localStorage.getItem('admin_token');
      await axios.delete(`${API}/admin/usuarios/${username}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Usuario eliminado');
      cargarUsuarios();
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      toast.error(error.response?.data?.detail || 'Error al eliminar usuario');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/secure-admin-panel-2026');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Calendar, label: 'Eventos', path: '/admin/eventos' },
    { icon: Tag, label: 'Categorías', path: '/admin/categorias' },
    { icon: Table2, label: 'Categorías Mesas', path: '/admin/categorias-mesas' },
    { icon: ShoppingCart, label: 'Compras', path: '/admin/compras' },
    { icon: CreditCard, label: 'Métodos de Pago', path: '/admin/metodos-pago' },
    { icon: Shield, label: 'Validar Entradas', path: '/admin/validar' },
    { icon: BarChart3, label: 'Asistencia', path: '/admin/asistencia' },
    { icon: Tag, label: 'Diseño Entrada', path: '/admin/diseno-entrada' },
    { icon: Users, label: 'Usuarios', path: '/admin/usuarios', active: true },
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
        <aside className="w-64 glass-card border-r border-white/10 min-h-screen p-6">
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

        <main className="flex-1 p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-4xl font-heading font-black text-foreground">
                👥 Gestión de Usuarios
              </h2>
              <p className="text-foreground/60 mt-2">
                Administra los usuarios que pueden acceder al panel
              </p>
            </div>
            <button
              onClick={() => setMostrarModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-bold hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Crear Usuario
            </button>
          </div>

          {/* Info de roles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="glass-card p-4 rounded-xl border-l-4 border-primary">
              <h4 className="font-bold text-foreground flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Rol: Admin
              </h4>
              <p className="text-sm text-foreground/60 mt-1">
                Acceso completo a todas las funciones del panel administrativo
              </p>
            </div>
            <div className="glass-card p-4 rounded-xl border-l-4 border-green-500">
              <h4 className="font-bold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-green-500" />
                Rol: Validador
              </h4>
              <p className="text-sm text-foreground/60 mt-1">
                Solo puede acceder al escáner QR para validar entradas en el evento
              </p>
            </div>
          </div>

          {/* Lista de usuarios */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary mx-auto"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {usuarios.map((usuario) => (
                <motion.div
                  key={usuario.username}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-6 rounded-2xl"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      usuario.role === 'admin' ? 'bg-primary/20' : 'bg-green-500/20'
                    }`}>
                      {usuario.role === 'admin' ? (
                        <Shield className="w-6 h-6 text-primary" />
                      ) : (
                        <Users className="w-6 h-6 text-green-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-lg">{usuario.username}</h3>
                      <p className={`text-sm ${
                        usuario.role === 'admin' ? 'text-primary' : 'text-green-500'
                      }`}>
                        {usuario.role === 'admin' ? 'Administrador' : 'Validador'}
                      </p>
                    </div>
                  </div>
                  
                  {usuario.username !== 'admin' && (
                    <button
                      onClick={() => handleEliminar(usuario.username)}
                      className="w-full py-2 rounded-xl bg-accent/10 text-accent hover:bg-accent/20 transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </button>
                  )}
                  {usuario.username === 'admin' && (
                    <p className="text-center text-foreground/40 text-sm py-2">
                      Usuario protegido
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Modal Crear Usuario */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 rounded-3xl max-w-md w-full"
          >
            <h3 className="text-2xl font-heading font-bold text-foreground mb-6">
              Crear Nuevo Usuario
            </h3>
            
            <form onSubmit={handleCrear} className="space-y-4">
              <div>
                <label className="block text-foreground/80 mb-2 font-medium">Usuario</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary outline-none"
                  placeholder="nombre_usuario"
                  required
                />
              </div>
              
              <div>
                <label className="block text-foreground/80 mb-2 font-medium">Contraseña</label>
                <div className="relative">
                  <input
                    type={mostrarPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary outline-none pr-12"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground"
                  >
                    {mostrarPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-foreground/80 mb-2 font-medium">Rol</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary outline-none"
                >
                  <option value="validador">🎫 Validador (Solo escáner QR)</option>
                  <option value="admin">👑 Administrador (Acceso completo)</option>
                </select>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="flex-1 py-3 rounded-xl glass-card text-foreground hover:border-white/30 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
                >
                  Crear Usuario
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminUsuarios;
// build-fix-1767085501
