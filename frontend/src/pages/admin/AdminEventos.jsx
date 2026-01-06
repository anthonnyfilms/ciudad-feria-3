import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { LayoutDashboard, Calendar, Settings, LogOut, Plus, Edit, Trash2, ExternalLink, Tag, ShoppingCart, CreditCard, Shield, Table2, Users, Upload, BarChart3, BadgeCheck, Activity, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '../../components/ui/sonner';
import ConfiguradorAsientos from '../../components/ConfiguradorAsientos';
import { getImageUrl, getRelativePath } from '../../utils/imageHelpers';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminEventos = () => {
  const navigate = useNavigate();
  const [eventos, setEventos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [eventoEditando, setEventoEditando] = useState(null);
  const [pasoActual, setPasoActual] = useState(1);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    fecha: '',
    hora: '',
    ubicacion: '',
    categoria: '',
    precio: 0,
    imagen: '',
    link_externo: '',
    asientos_disponibles: 1000,
    tipo_asientos: 'general',
    configuracion_asientos: null
  });

  useEffect(() => {
    cargarEventos();
    cargarCategorias();
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen');
      return;
    }

    setUploadingImage(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const response = await axios.post(`${API}/upload-imagen`, formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Guardar solo la ruta relativa para que funcione en cualquier dominio
      setFormData(prev => ({ ...prev, imagen: response.data.url }));
      toast.success('Imagen subida correctamente');
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      toast.error('Error al subir la imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const cargarCategorias = async () => {
    try {
      const response = await axios.get(`${API}/categorias`);
      setCategorias(response.data);
      if (response.data.length > 0 && !formData.categoria) {
        setFormData(prev => ({...prev, categoria: response.data[0].slug}));
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
      toast.error('Error al cargar categorías');
    }
  };

  const cargarEventos = async () => {
    try {
      const response = await axios.get(`${API}/eventos`);
      setEventos(response.data);
    } catch (error) {
      console.error('Error cargando eventos:', error);
      toast.error('Error al cargar eventos');
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
    
    if (!token) {
      toast.error('Sesión expirada. Por favor inicia sesión nuevamente.');
      navigate('/admin-ciudadferia');
      return;
    }

    try {
      // Asegurar que la imagen use ruta relativa
      const dataToSend = {
        ...formData,
        imagen: formData.imagen ? getRelativePath(formData.imagen) : ''
      };
      
      if (eventoEditando) {
        await axios.put(
          `${API}/admin/eventos/${eventoEditando.id}`,
          dataToSend,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Evento actualizado exitosamente');
      } else {
        await axios.post(
          `${API}/admin/eventos`,
          dataToSend,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Evento creado exitosamente');
      }
      setMostrarModal(false);
      setEventoEditando(null);
      resetForm();
      cargarEventos();
    } catch (error) {
      console.error('Error guardando evento:', error);
      if (error.response?.status === 401) {
        toast.error('Sesión expirada. Por favor inicia sesión nuevamente.');
        localStorage.removeItem('admin_token');
        navigate('/admin-ciudadferia');
      } else {
        toast.error(error.response?.data?.detail || 'Error al guardar evento');
      }
    }
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este evento?')) return;

    const token = localStorage.getItem('admin_token');
    try {
      await axios.delete(`${API}/admin/eventos/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Evento eliminado');
      cargarEventos();
    } catch (error) {
      console.error('Error eliminando evento:', error);
      toast.error('Error al eliminar evento');
    }
  };

  const handleEditar = (evento) => {
    setEventoEditando(evento);
    setFormData({
      nombre: evento.nombre,
      descripcion: evento.descripcion,
      fecha: evento.fecha,
      hora: evento.hora,
      ubicacion: evento.ubicacion,
      categoria: evento.categoria,
      precio: evento.precio,
      imagen: evento.imagen,
      link_externo: evento.link_externo || '',
      asientos_disponibles: evento.asientos_disponibles,
      tipo_asientos: evento.tipo_asientos || 'general',
      configuracion_asientos: evento.configuracion_asientos || null
    });
    setPasoActual(1);
    setMostrarModal(true);
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      fecha: '',
      hora: '',
      ubicacion: '',
      categoria: categorias.length > 0 ? categorias[0].slug : '',
      precio: 0,
      imagen: '',
      link_externo: '',
      asientos_disponibles: 1000,
      tipo_asientos: 'general',
      configuracion_asientos: null
    });
    setPasoActual(1);
  };

  const handleConfiguracionAsientos = (tipo, config) => {
    setFormData(prev => ({
      ...prev,
      tipo_asientos: tipo,
      configuracion_asientos: config
    }));
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Calendar, label: 'Eventos', path: '/admin/eventos', active: true },
    { icon: Tag, label: 'Categorías', path: '/admin/categorias' },
    { icon: Table2, label: 'Categorías Mesas', path: '/admin/categorias-mesas' },
    { icon: ShoppingCart, label: 'Compras', path: '/admin/compras' },
    { icon: CreditCard, label: 'Métodos de Pago', path: '/admin/metodos-pago' },
    { icon: Shield, label: 'Validar Entradas', path: '/admin/validar' },
    { icon: Printer, label: 'Tickets Térmicos', path: '/admin/tickets-termicos' },
    { icon: Upload, label: 'Diseño Entrada', path: '/admin/diseno-entrada' },
    { icon: BadgeCheck, label: 'Acreditaciones', path: '/admin/acreditaciones' },
    { icon: Activity, label: 'Aforo', path: '/admin/aforo' },
    { icon: Users, label: 'Usuarios', path: '/admin/usuarios' },
    { icon: Settings, label: 'Configuración', path: '/admin/configuracion' },
  ];

  const getTipoAsientosLabel = (tipo) => {
    switch (tipo) {
      case 'mesas': return 'Mesas';
      case 'mixto': return 'Mixto';
      default: return 'General';
    }
  };

  const getTipoAsientosIcon = (tipo) => {
    switch (tipo) {
      case 'mesas': return <Table2 className="w-3 h-3" />;
      case 'mixto': return <Users className="w-3 h-3" />;
      default: return null;
    }
  };

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
              Gestionar Eventos
            </h2>
            <motion.button
              onClick={() => { resetForm(); setMostrarModal(true); }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold btn-glow"
            >
              <Plus className="w-5 h-5" />
              Crear Evento
            </motion.button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {eventos.map((evento) => (
                <motion.div
                  key={evento.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card rounded-2xl overflow-hidden group"
                >
                  <div className="relative h-48">
                    <img
                      src={getImageUrl(evento.imagen)}
                      alt={evento.nombre}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full font-bold text-sm">
                      ${evento.precio}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-heading font-bold text-foreground mb-2">
                      {evento.nombre}
                    </h3>
                    <p className="text-foreground/60 text-sm mb-4 line-clamp-2">
                      {evento.descripcion}
                    </p>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs px-3 py-1 rounded-full bg-primary/20 text-primary">
                        {evento.categoria}
                      </span>
                      {evento.tipo_asientos && evento.tipo_asientos !== 'general' && (
                        <span className="text-xs px-3 py-1 rounded-full bg-secondary/20 text-secondary flex items-center gap-1">
                          {getTipoAsientosIcon(evento.tipo_asientos)}
                          {getTipoAsientosLabel(evento.tipo_asientos)}
                        </span>
                      )}
                      {evento.link_externo && (
                        <a
                          href={evento.link_externo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-3 py-1 rounded-full bg-accent/20 text-accent flex items-center gap-1 hover:bg-accent/30 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Link
                        </a>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditar(evento)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary hover:bg-secondary/20 transition-all"
                      >
                        <Edit className="w-4 h-4" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleEliminar(evento.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent hover:bg-accent/20 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                      </button>
                    </div>
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
            className="glass-card p-8 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Indicador de pasos */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <button
                type="button"
                onClick={() => setPasoActual(1)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  pasoActual === 1 ? 'bg-primary text-primary-foreground' : 'glass-card text-foreground/60'
                }`}
              >
                <span className="w-6 h-6 rounded-full bg-current/20 flex items-center justify-center text-sm">1</span>
                Info Básica
              </button>
              <div className="w-8 h-0.5 bg-foreground/20"></div>
              <button
                type="button"
                onClick={() => setPasoActual(2)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  pasoActual === 2 ? 'bg-primary text-primary-foreground' : 'glass-card text-foreground/60'
                }`}
              >
                <span className="w-6 h-6 rounded-full bg-current/20 flex items-center justify-center text-sm">2</span>
                Asientos
              </button>
            </div>

            <h3 className="text-2xl font-heading font-bold text-foreground mb-6">
              {eventoEditando ? 'Editar Evento' : 'Crear Nuevo Evento'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Paso 1: Info Básica */}
              {pasoActual === 1 && (
                <>
                  <div>
                    <label className="block text-foreground/80 mb-2 font-medium">Nombre del Evento</label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                      className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-foreground/80 mb-2 font-medium">Descripción</label>
                    <textarea
                      value={formData.descripcion}
                      onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                      className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      rows="3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-foreground/80 mb-2 font-medium">Fecha</label>
                      <input
                        type="date"
                        value={formData.fecha}
                        onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                        className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-foreground/80 mb-2 font-medium">Hora</label>
                      <input
                        type="time"
                        value={formData.hora}
                        onChange={(e) => setFormData({...formData, hora: e.target.value})}
                        className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-foreground/80 mb-2 font-medium">Ubicación</label>
                    <input
                      type="text"
                      value={formData.ubicacion}
                      onChange={(e) => setFormData({...formData, ubicacion: e.target.value})}
                      className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-foreground/80 mb-2 font-medium">Categoría</label>
                      <select
                        value={formData.categoria}
                        onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                        className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      >
                        {categorias.map((cat) => (
                          <option key={cat.id} value={cat.slug}>{cat.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-foreground/80 mb-2 font-medium">Precio Base ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.precio}
                        onChange={(e) => setFormData({...formData, precio: parseFloat(e.target.value)})}
                        className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-foreground/80 mb-2 font-medium">Imagen del Evento</label>
                    <div className="space-y-3">
                      {/* Upload de archivo */}
                      <div className="flex items-center gap-3">
                        <label className="flex-1 cursor-pointer">
                          <div className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary transition-all flex items-center gap-3 hover:border-primary/50">
                            <Upload className="w-5 h-5 text-primary" />
                            <span className="text-foreground/70">
                              {uploadingImage ? 'Subiendo...' : 'Seleccionar imagen'}
                            </span>
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
                      
                      {/* Campo URL alternativo */}
                      <div className="relative">
                        <input
                          type="url"
                          value={formData.imagen}
                          onChange={(e) => setFormData({...formData, imagen: e.target.value})}
                          className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                          placeholder="O pega una URL: https://..."
                        />
                      </div>
                      
                      {/* Preview de imagen */}
                      {formData.imagen && (
                        <div className="mt-2 p-2 glass-card rounded-xl">
                          <img 
                            src={getImageUrl(formData.imagen)} 
                            alt="Preview" 
                            className="w-full h-32 object-cover rounded-lg"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-foreground/80 mb-2 font-medium">Link Externo (Opcional)</label>
                    <input
                      type="url"
                      value={formData.link_externo}
                      onChange={(e) => setFormData({...formData, link_externo: e.target.value})}
                      className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="https://..."
                    />
                  </div>
                </>
              )}

              {/* Paso 2: Configuración de Asientos */}
              {pasoActual === 2 && (
                <ConfiguradorAsientos
                  eventoId={eventoEditando?.id}
                  configuracionInicial={{
                    tipo: formData.tipo_asientos,
                    capacidad: formData.asientos_disponibles,
                    mesas: formData.configuracion_asientos?.mesas || [],
                    entradas_generales: formData.configuracion_asientos?.entradas_generales || 0,
                    categorias_generales: formData.configuracion_asientos?.categorias_generales || []
                  }}
                  onConfiguracionChange={handleConfiguracionAsientos}
                />
              )}

              {/* Botones de navegación */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => { 
                    if (pasoActual === 1) {
                      setMostrarModal(false); 
                      setEventoEditando(null); 
                      resetForm();
                    } else {
                      setPasoActual(1);
                    }
                  }}
                  className="flex-1 px-6 py-3 rounded-full glass-card font-bold text-foreground/80 hover:text-foreground transition-all"
                >
                  {pasoActual === 1 ? 'Cancelar' : 'Anterior'}
                </button>
                
                {pasoActual === 1 ? (
                  <button
                    type="button"
                    onClick={() => setPasoActual(2)}
                    className="flex-1 px-6 py-3 rounded-full bg-primary text-primary-foreground font-bold btn-glow"
                  >
                    Siguiente: Asientos
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 rounded-full bg-primary text-primary-foreground font-bold btn-glow"
                  >
                    {eventoEditando ? 'Actualizar' : 'Crear'} Evento
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminEventos;// build-fix-1767085501
