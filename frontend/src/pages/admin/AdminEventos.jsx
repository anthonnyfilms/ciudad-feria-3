import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { LayoutDashboard, Calendar, Settings, LogOut, Plus, Edit, Trash2, ExternalLink, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '../../components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminEventos = () => {
  const navigate = useNavigate();
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [eventoEditando, setEventoEditando] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    fecha: '',
    hora: '',
    ubicacion: '',
    categoria: 'conciertos',
    precio: 0,
    imagen: '',
    link_externo: '',
    asientos_disponibles: 1000
  });

  useEffect(() => {
    cargarEventos();
  }, []);

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
    navigate('/secure-admin-panel-2026');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('admin_token');

    try {
      if (eventoEditando) {
        await axios.put(
          `${API}/admin/eventos/${eventoEditando.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Evento actualizado exitosamente');
      } else {
        await axios.post(
          `${API}/admin/eventos`,
          formData,
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
      toast.error(error.response?.data?.detail || 'Error al guardar evento');
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
      asientos_disponibles: evento.asientos_disponibles
    });
    setMostrarModal(true);
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      fecha: '',
      hora: '',
      ubicacion: '',
      categoria: 'conciertos',
      precio: 0,
      imagen: '',
      link_externo: '',
      asientos_disponibles: 1000
    });
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Calendar, label: 'Eventos', path: '/admin/eventos', active: true },
    { icon: Tag, label: 'Categorías', path: '/admin/categorias' },
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
                      src={evento.imagen}
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
                      {evento.link_externo && (
                        <a
                          href={evento.link_externo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-3 py-1 rounded-full bg-secondary/20 text-secondary flex items-center gap-1 hover:bg-secondary/30 transition-colors"
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
            <h3 className="text-2xl font-heading font-bold text-foreground mb-6">
              {eventoEditando ? 'Editar Evento' : 'Crear Nuevo Evento'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    <option value="conciertos">Conciertos</option>
                    <option value="culturales">Culturales</option>
                    <option value="deportivos">Deportivos</option>
                  </select>
                </div>
                <div>
                  <label className="block text-foreground/80 mb-2 font-medium">Precio ($)</label>
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
                <label className="block text-foreground/80 mb-2 font-medium">URL de la Imagen</label>
                <input
                  type="url"
                  value={formData.imagen}
                  onChange={(e) => setFormData({...formData, imagen: e.target.value})}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  required
                  placeholder="https://..."
                />
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
              <div>
                <label className="block text-foreground/80 mb-2 font-medium">Asientos Disponibles</label>
                <input
                  type="number"
                  value={formData.asientos_disponibles}
                  onChange={(e) => setFormData({...formData, asientos_disponibles: parseInt(e.target.value)})}
                  className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  required
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => { setMostrarModal(false); setEventoEditando(null); resetForm(); }}
                  className="flex-1 px-6 py-3 rounded-full glass-card font-bold text-foreground/80 hover:text-foreground transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-full bg-primary text-primary-foreground font-bold btn-glow"
                >
                  {eventoEditando ? 'Actualizar' : 'Crear'} Evento
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminEventos;