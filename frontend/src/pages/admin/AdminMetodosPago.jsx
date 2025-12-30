import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { LayoutDashboard, Calendar, Settings, LogOut, Tag, ShoppingCart, Plus, Edit, Trash2, CreditCard, Shield, Table2, Upload, Image, Users, BarChart3, } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '../../components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminMetodosPago = () => {
  const navigate = useNavigate();
  const [metodos, setMetodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [metodoEditando, setMetodoEditando] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'banco',
    informacion: '',
    icono: '',
    imagen: '',
    orden: 0
  });

  useEffect(() => {
    cargarMetodos();
  }, []);

  const cargarMetodos = async () => {
    try {
      const response = await axios.get(`${API}/metodos-pago`);
      setMetodos(response.data);
    } catch (error) {
      console.error('Error cargando métodos:', error);
      toast.error('Error al cargar métodos de pago');
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
    const token = localStorage.getItem('admin_token');

    try {
      if (metodoEditando) {
        await axios.put(
          `${API}/admin/metodos-pago/${metodoEditando.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Método actualizado exitosamente');
      } else {
        await axios.post(
          `${API}/admin/metodos-pago`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Método creado exitosamente');
      }
      setMostrarModal(false);
      setMetodoEditando(null);
      resetForm();
      cargarMetodos();
    } catch (error) {
      console.error('Error guardando método:', error);
      toast.error(error.response?.data?.detail || 'Error al guardar método');
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este método de pago?')) return;

    const token = localStorage.getItem('admin_token');
    try {
      await axios.delete(`${API}/admin/metodos-pago/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Método eliminado');
      cargarMetodos();
    } catch (error) {
      console.error('Error eliminando método:', error);
      toast.error('Error al eliminar método');
    }
  };

  const handleEditar = (metodo) => {
    setMetodoEditando(metodo);
    setFormData({
      nombre: metodo.nombre,
      tipo: metodo.tipo,
      informacion: metodo.informacion,
      icono: metodo.icono || '',
      imagen: metodo.imagen || '',
      orden: metodo.orden
    });
    setMostrarModal(true);
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      tipo: 'banco',
      informacion: '',
      icono: '',
      imagen: '',
      orden: 0
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen es muy grande. Máximo 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes');
      return;
    }

    setUploadingImage(true);

    try {
      const imageFormData = new FormData();
      imageFormData.append('file', file);
      
      const response = await axios.post(`${API}/upload-imagen`, imageFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setFormData({...formData, imagen: `${BACKEND_URL}${response.data.url}`});
      toast.success('Imagen cargada exitosamente');
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      toast.error('Error al subir la imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Calendar, label: 'Eventos', path: '/admin/eventos' },
    { icon: Tag, label: 'Categorías', path: '/admin/categorias' },
    { icon: Table2, label: 'Categorías Mesas', path: '/admin/categorias-mesas' },
    { icon: ShoppingCart, label: 'Compras', path: '/admin/compras' },
    { icon: CreditCard, label: 'Métodos de Pago', path: '/admin/metodos-pago', active: true },
    { icon: Shield, label: 'Validar Entradas', path: '/admin/validar' },
    { icon: BarChart3, label: 'Asistencia', path: '/admin/asistencia' },
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
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-4xl font-heading font-black text-foreground">
              Métodos de Pago
            </h2>
            <motion.button
              onClick={() => { resetForm(); setMostrarModal(true); }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold btn-glow"
            >
              <Plus className="w-5 h-5" />
              Crear Método
            </motion.button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {metodos.map((metodo, index) => (
                <motion.div
                  key={metodo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card rounded-2xl p-6 group hover:border-primary/50 transition-all"
                >
                  {/* Imagen del método de pago */}
                  {metodo.imagen && (
                    <div className="mb-4 bg-white/5 rounded-xl p-3">
                      <img 
                        src={metodo.imagen} 
                        alt={metodo.nombre} 
                        className="w-full h-24 object-contain"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {metodo.icono && !metodo.imagen && (
                        <img src={metodo.icono} alt={metodo.nombre} className="w-12 h-12 object-contain" />
                      )}
                      <div>
                        <h3 className="text-xl font-heading font-bold text-foreground">
                          {metodo.nombre}
                        </h3>
                        <p className="text-foreground/50 text-sm capitalize">{metodo.tipo}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4 p-3 rounded-xl bg-white/5">
                    <p className="text-foreground/70 text-sm whitespace-pre-line">
                      {metodo.informacion}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditar(metodo)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary hover:bg-secondary/20 transition-all"
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleEliminar(metodo.id)}
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

      {mostrarModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-2xl font-heading font-bold text-foreground mb-6">
              {metodoEditando ? 'Editar Método' : 'Crear Nuevo Método'}
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
                  placeholder="Ej: Transferencia Bancaria"
                />
              </div>
              
              <div>
                <label className="block text-foreground/80 mb-2 font-medium">Tipo</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                >
                  <option value="banco">Banco</option>
                  <option value="movil">Pago Móvil</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-foreground/80 mb-2 font-medium">
                  Información (Datos de pago)
                </label>
                <textarea
                  value={formData.informacion}
                  onChange={(e) => setFormData({...formData, informacion: e.target.value})}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  rows="6"
                  required
                  placeholder="Banco: Banco de Venezuela&#10;Cuenta: 0102-1234-56789&#10;Titular: Ciudad Feria&#10;RIF: J-12345678-9"
                />
              </div>

              <div>
                <label className="block text-foreground/80 mb-2 font-medium">
                  📷 Imagen del Método de Pago
                </label>
                <div className="space-y-3">
                  {formData.imagen && (
                    <div className="relative inline-block">
                      <img 
                        src={formData.imagen} 
                        alt="Preview" 
                        className="w-full max-w-xs h-32 object-contain rounded-xl bg-white/5 p-2"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, imagen: ''})}
                        className="absolute -top-2 -right-2 bg-accent text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  <label className="block cursor-pointer">
                    <div className={`border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-primary/50 transition-all ${uploadingImage ? 'opacity-50' : ''}`}>
                      {uploadingImage ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 mx-auto mb-2 text-foreground/50" />
                          <p className="text-foreground/70 text-sm">
                            {formData.imagen ? 'Cambiar imagen' : 'Subir imagen (logo del banco, QR, etc.)'}
                          </p>
                          <p className="text-xs text-foreground/50 mt-1">PNG, JPG (Máx. 5MB)</p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-foreground/80 mb-2 font-medium">Icono (URL) - Opcional</label>
                <input
                  type="url"
                  value={formData.icono}
                  onChange={(e) => setFormData({...formData, icono: e.target.value})}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="https://ejemplo.com/icono.png"
                />
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
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => { setMostrarModal(false); setMetodoEditando(null); resetForm(); }}
                  className="flex-1 px-6 py-3 rounded-full glass-card font-bold text-foreground/80 hover:text-foreground transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-full bg-primary text-primary-foreground font-bold btn-glow"
                >
                  {metodoEditando ? 'Actualizar' : 'Crear'} Método
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminMetodosPago;
