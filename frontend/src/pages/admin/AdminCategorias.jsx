import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { LayoutDashboard, Calendar, Settings, LogOut, Plus, Edit, Trash2, Tag, Palette, ShoppingCart, CreditCard, Shield, Table2, Upload, Users, BarChart3, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '../../components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminCategorias = () => {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    color: '#FACC15',
    icono: '',
    orden: 0
  });

  useEffect(() => {
    cargarCategorias();
  }, []);

  const cargarCategorias = async () => {
    try {
      const response = await axios.get(`${API}/categorias`);
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
    navigate('/admin-ciudadferia');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');

    try {
      if (categoriaEditando) {
        await axios.put(
          `${API}/admin/categorias/${categoriaEditando.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Categoría actualizada exitosamente');
      } else {
        await axios.post(
          `${API}/admin/categorias`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Categoría creada exitosamente');
      }
      setMostrarModal(false);
      setCategoriaEditando(null);
      resetForm();
      cargarCategorias();
    } catch (error) {
      console.error('Error guardando categoría:', error);
      toast.error(error.response?.data?.detail || 'Error al guardar categoría');
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta categoría? Los eventos con esta categoría no se eliminarán.')) return;

    const token = localStorage.getItem('admin_token');
    try {
      await axios.delete(`${API}/admin/categorias/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Categoría eliminada');
      cargarCategorias();
    } catch (error) {
      console.error('Error eliminando categoría:', error);
      toast.error('Error al eliminar categoría');
    }
  };

  const handleEditar = (categoria) => {
    setCategoriaEditando(categoria);
    setFormData({
      nombre: categoria.nombre,
      color: categoria.color,
      icono: categoria.icono || '',
      orden: categoria.orden
    });
    setMostrarModal(true);
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      color: '#FACC15',
      icono: '',
      orden: 0
    });
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Calendar, label: 'Eventos', path: '/admin/eventos' },
    { icon: Tag, label: 'Categorías', path: '/admin/categorias', active: true },
    { icon: Table2, label: 'Categorías Mesas', path: '/admin/categorias-mesas' },
    { icon: ShoppingCart, label: 'Compras', path: '/admin/compras' },
    { icon: CreditCard, label: 'Métodos de Pago', path: '/admin/metodos-pago' },
    { icon: Shield, label: 'Validar Entradas', path: '/admin/validar' },
    { icon: Printer, label: 'Tickets Térmicos', path: '/admin/tickets-termicos' },
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
            <h2 className="text-4xl font-heading font-black text-foreground">
              Gestionar Categorías
            </h2>
            <motion.button
              onClick={() => { resetForm(); setMostrarModal(true); }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold btn-glow"
            >
              <Plus className="w-5 h-5" />
              Crear Categoría
            </motion.button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categorias.map((categoria, index) => (
                <motion.div
                  key={categoria.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card rounded-2xl p-6 group hover:border-primary/50 transition-all"
                  style={{ borderLeftWidth: '4px', borderLeftColor: categoria.color }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {categoria.icono && (
                        <span className="text-4xl">{categoria.icono}</span>
                      )}
                      <div>
                        <h3 className="text-xl font-heading font-bold text-foreground">
                          {categoria.nombre}
                        </h3>
                        <p className="text-foreground/50 text-sm">Orden: {categoria.orden}</p>
                      </div>
                    </div>
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-white/20"
                      style={{ backgroundColor: categoria.color }}
                    ></div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
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

          {categorias.length === 0 && !loading && (
            <div className="glass-card p-12 rounded-3xl text-center">
              <Tag className="w-16 h-16 text-foreground/30 mx-auto mb-4" />
              <p className="text-foreground/50 text-lg">
                No hay categorías creadas. ¡Crea tu primera categoría!
              </p>
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
              {categoriaEditando ? 'Editar Categoría' : 'Crear Nueva Categoría'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-foreground/80 mb-2 font-medium">Nombre</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  required
                  placeholder="Ej: Conciertos"
                />
              </div>
              
              <div>
                <label className="block text-foreground/80 mb-2 font-medium">Color</label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                    className="w-16 h-12 rounded-xl cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                    className="flex-1 bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="#FACC15"
                  />
                </div>
              </div>

              <div>
                <label className="block text-foreground/80 mb-2 font-medium">Icono Emoji (Opcional)</label>
                <input
                  type="text"
                  value={formData.icono}
                  onChange={(e) => setFormData({...formData, icono: e.target.value})}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="🎵"
                  maxLength="2"
                />
                <p className="text-xs text-foreground/50 mt-1">
                  Agrega un emoji para representar la categoría
                </p>
              </div>

              <div>
                <label className="block text-foreground/80 mb-2 font-medium">Orden</label>
                <input
                  type="number"
                  value={formData.orden}
                  onChange={(e) => setFormData({...formData, orden: parseInt(e.target.value)})}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  min="0"
                />
                <p className="text-xs text-foreground/50 mt-1">
                  Las categorías se mostrarán según este orden
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => { setMostrarModal(false); setCategoriaEditando(null); resetForm(); }}
                  className="flex-1 px-6 py-3 rounded-full glass-card font-bold text-foreground/80 hover:text-foreground transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-full bg-primary text-primary-foreground font-bold btn-glow"
                >
                  {categoriaEditando ? 'Actualizar' : 'Crear'} Categoría
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminCategorias;
