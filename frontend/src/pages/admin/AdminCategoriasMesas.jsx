import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { LayoutDashboard, Calendar, Settings, LogOut, Plus, Edit, Trash2, Tag, ShoppingCart, CreditCard, Shield, Table2, Upload, Users, BarChart3, } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '../../components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminCategoriasMesas = () => {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    color: '#10B981'
  });

  useEffect(() => {
    cargarCategorias();
  }, []);

  const cargarCategorias = async () => {
    try {
      const response = await axios.get(`${API}/categorias-mesas`);
      setCategorias(response.data);
    } catch (error) {
      console.error('Error cargando categorías:', error);
      toast.error('Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    toast.success('Sesión cerrada');
    navigate('/secure-admin-panel-2026');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      
      if (editando) {
        await axios.put(`${API}/admin/categorias-mesas/${editando.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Categoría actualizada');
      } else {
        await axios.post(`${API}/admin/categorias-mesas`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Categoría creada');
      }
      
      setMostrarModal(false);
      setEditando(null);
      setFormData({ nombre: '', color: '#10B981' });
      cargarCategorias();
    } catch (error) {
      console.error('Error guardando categoría:', error);
      toast.error(error.response?.data?.detail || 'Error al guardar');
    }
  };

  const handleEditar = (categoria) => {
    setEditando(categoria);
    setFormData({
      nombre: categoria.nombre,
      color: categoria.color || '#10B981'
    });
    setMostrarModal(true);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta categoría?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      await axios.delete(`${API}/admin/categorias-mesas/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Categoría eliminada');
      cargarCategorias();
    } catch (error) {
      console.error('Error eliminando categoría:', error);
      toast.error('Error al eliminar');
    }
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Calendar, label: 'Eventos', path: '/admin/eventos' },
    { icon: Tag, label: 'Categorías', path: '/admin/categorias' },
    { icon: Table2, label: 'Categorías Mesas', path: '/admin/categorias-mesas', active: true },
    { icon: ShoppingCart, label: 'Compras', path: '/admin/compras' },
    { icon: CreditCard, label: 'Métodos de Pago', path: '/admin/metodos-pago' },
    { icon: Shield, label: 'Validar Entradas', path: '/admin/validar' },
    { icon: Upload, label: 'Diseño Entrada', path: '/admin/diseno-entrada' },
    { icon: Users, label: 'Usuarios', path: '/admin/usuarios' },
    { icon: Settings, label: 'Configuración', path: '/admin/configuracion' },
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
            <div>
              <h2 className="text-4xl font-heading font-black text-foreground">
                Categorías de Mesas
              </h2>
              <p className="text-foreground/60 mt-2">
                Gestiona las categorías disponibles para mesas y sillas en los eventos
              </p>
            </div>
            <motion.button
              onClick={() => {
                setEditando(null);
                setFormData({ nombre: '', color: '#10B981' });
                setMostrarModal(true);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold btn-glow"
            >
              <Plus className="w-5 h-5" />
              Nueva Categoría
            </motion.button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary"></div>
            </div>
          ) : categorias.length === 0 ? (
            <div className="text-center py-20">
              <Table2 className="w-16 h-16 text-foreground/30 mx-auto mb-4" />
              <p className="text-foreground/60 text-lg">No hay categorías creadas</p>
              <p className="text-foreground/40 text-sm mt-2">Crea tu primera categoría de mesa</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categorias.map((categoria) => (
                <motion.div
                  key={categoria.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-6 rounded-2xl hover:border-primary/30 transition-all"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: categoria.color + '20' }}
                    >
                      <Table2 className="w-6 h-6" style={{ color: categoria.color }} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">
                        {categoria.nombre}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div 
                          className="w-4 h-4 rounded-full border border-white/20"
                          style={{ backgroundColor: categoria.color }}
                        />
                        <span className="text-xs text-foreground/50">{categoria.color}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditar(categoria)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary hover:bg-secondary/20 transition-all"
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleEliminar(categoria.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent hover:bg-accent/20 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Modal */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 rounded-3xl max-w-md w-full"
          >
            <h3 className="text-2xl font-heading font-bold text-foreground mb-6">
              {editando ? 'Editar Categoría' : 'Nueva Categoría de Mesa'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-foreground/80 mb-2 font-medium">
                  Nombre de la Categoría
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="Ej: VIP, Premium, General..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-foreground/80 mb-2 font-medium">
                  Color de la Categoría
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                    className="w-16 h-16 rounded-xl cursor-pointer border-2 border-white/10"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({...formData, color: e.target.value})}
                      className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono"
                      placeholder="#10B981"
                    />
                    <p className="text-xs text-foreground/50 mt-1">
                      Este color se usará para identificar las mesas de esta categoría
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="glass-card p-4 rounded-xl">
                <p className="text-xs text-foreground/50 mb-2">Vista previa:</p>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: formData.color + '20' }}
                  >
                    <Table2 className="w-5 h-5" style={{ color: formData.color }} />
                  </div>
                  <span className="font-bold text-foreground">
                    {formData.nombre || 'Nombre de categoría'}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarModal(false);
                    setEditando(null);
                    setFormData({ nombre: '', color: '#10B981' });
                  }}
                  className="flex-1 px-6 py-3 rounded-full glass-card font-bold text-foreground/80 hover:text-foreground transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-full bg-primary text-primary-foreground font-bold btn-glow"
                >
                  {editando ? 'Actualizar' : 'Crear'} Categoría
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminCategoriasMesas;
