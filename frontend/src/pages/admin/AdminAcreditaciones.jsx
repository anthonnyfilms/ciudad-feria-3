import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { LayoutDashboard, Calendar, Settings, LogOut, Tag, ShoppingCart, CreditCard, Shield, Table2, Users, Plus, Trash2, Eye, BadgeCheck, BarChart3, Download, QrCode, FileText, Activity, Palette } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '../../components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminAcreditaciones = () => {
  const navigate = useNavigate();
  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState('');
  const [categorias, setCategorias] = useState([]);
  const [acreditaciones, setAcreditaciones] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showCategoriaModal, setShowCategoriaModal] = useState(false);
  const [userRole, setUserRole] = useState(null);
  
  const [nuevaAcreditacion, setNuevaAcreditacion] = useState({
    nombre_persona: '',
    cedula: '',
    organizacion: '',
    cargo: '',
    email: '',
    telefono: '',
    categoria_id: '',
    categoria_nombre: '',
    zonas_acceso: []
  });

  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const [nuevaCategoria, setNuevaCategoria] = useState({
    nombre: '',
    color: '#8B5CF6',
    zonas_acceso: [],
    capacidad: 100,
    descripcion: ''
  });

  const zonasDisponibles = ['Backstage', 'VIP', 'Prensa', 'General', 'Escenario', 'Camerinos', 'Área de Comida', 'Estacionamiento'];

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/secure-admin-panel-2026');
      return;
    }
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserRole(payload.role);
    } catch (e) {
      console.error('Error decoding token');
    }
    
    cargarDatos();
  }, [navigate]);

  const cargarDatos = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [eventosRes, categoriasRes] = await Promise.all([
        axios.get(`${API}/eventos`),
        axios.get(`${API}/admin/categorias-acreditacion`, { headers })
      ]);
      
      setEventos(eventosRes.data);
      setCategorias(categoriasRes.data);
      
      if (eventosRes.data.length > 0 && !eventoSeleccionado) {
        setEventoSeleccionado(eventosRes.data[0].id);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  useEffect(() => {
    if (eventoSeleccionado) {
      cargarAcreditaciones();
    }
  }, [eventoSeleccionado]);

  const cargarAcreditaciones = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/acreditaciones?evento_id=${eventoSeleccionado}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAcreditaciones(response.data);
    } catch (error) {
      console.error('Error cargando acreditaciones:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/secure-admin-panel-2026');
  };

  const crearCategoria = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      await axios.post(`${API}/admin/categorias-acreditacion`, nuevaCategoria, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Categoría creada');
      setShowCategoriaModal(false);
      setNuevaCategoria({ nombre: '', color: '#8B5CF6', zonas_acceso: [], capacidad: 100, descripcion: '' });
      cargarDatos();
    } catch (error) {
      toast.error('Error al crear categoría');
    }
  };

  const crearAcreditacion = async () => {
    if (!nuevaAcreditacion.nombre_persona || !nuevaAcreditacion.categoria_id) {
      toast.error('Nombre y categoría son requeridos');
      return;
    }

    try {
      const token = localStorage.getItem('admin_token');
      const categoria = categorias.find(c => c.id === nuevaAcreditacion.categoria_id);
      
      await axios.post(`${API}/admin/acreditaciones`, {
        ...nuevaAcreditacion,
        evento_id: eventoSeleccionado,
        categoria_nombre: categoria?.nombre || '',
        zonas_acceso: categoria?.zonas_acceso || []
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Acreditación creada');
      setShowModal(false);
      setNuevaAcreditacion({
        nombre_persona: '',
        cedula: '',
        organizacion: '',
        cargo: '',
        email: '',
        telefono: '',
        categoria_id: '',
        categoria_nombre: '',
        zonas_acceso: []
      });
      cargarAcreditaciones();
    } catch (error) {
      toast.error('Error al crear acreditación');
    }
  };

  const eliminarAcreditacion = async (id) => {
    if (!window.confirm('¿Eliminar esta acreditación?')) return;
    
    try {
      const token = localStorage.getItem('admin_token');
      await axios.delete(`${API}/admin/acreditaciones/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Acreditación eliminada');
      cargarAcreditaciones();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const eliminarCategoria = async (id) => {
    if (!window.confirm('¿Eliminar esta categoría?')) return;
    
    try {
      const token = localStorage.getItem('admin_token');
      await axios.delete(`${API}/admin/categorias-acreditacion/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Categoría eliminada');
      cargarDatos();
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Calendar, label: 'Eventos', path: '/admin/eventos' },
    { icon: Tag, label: 'Categorías', path: '/admin/categorias' },
    { icon: ShoppingCart, label: 'Compras', path: '/admin/compras' },
    { icon: CreditCard, label: 'Métodos de Pago', path: '/admin/metodos-pago' },
    { icon: BadgeCheck, label: 'Acreditaciones', path: '/admin/acreditaciones', active: true },
    { icon: Palette, label: 'Diseño Acreditación', path: '/admin/diseno-acreditacion' },
    { icon: Shield, label: 'Validar Entradas', path: '/admin/validar' },
    { icon: Activity, label: 'Aforo', path: '/admin/aforo' },
    { icon: Table2, label: 'Diseño Entrada', path: '/admin/diseno-entrada' },
    { icon: Users, label: 'Usuarios', path: '/admin/usuarios' },
    { icon: Settings, label: 'Configuración', path: '/admin/configuracion' },
  ];

  // Funciones para descargar PDFs
  const descargarPdfIndividual = async (acreditacionId, nombrePersona) => {
    try {
      setDownloadingPdf(true);
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/acreditaciones/${acreditacionId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `acreditacion_${nombrePersona.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF descargado');
    } catch (error) {
      console.error('Error descargando PDF:', error);
      toast.error('Error al descargar PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const descargarTodosPdf = async () => {
    if (!eventoSeleccionado) {
      toast.error('Selecciona un evento');
      return;
    }
    
    try {
      setDownloadingPdf(true);
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/acreditaciones/evento/${eventoSeleccionado}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const evento = eventos.find(e => e.id === eventoSeleccionado);
      const nombreEvento = evento?.nombre?.replace(/\s+/g, '_') || 'evento';
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `acreditaciones_${nombreEvento}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF con todas las acreditaciones descargado');
    } catch (error) {
      console.error('Error descargando PDF:', error);
      toast.error('Error al descargar PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

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
                item.path === '/admin/acreditaciones'
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
              <h1 className="text-3xl font-heading font-bold text-foreground">Acreditaciones</h1>
              <p className="text-foreground/60">Gestiona credenciales para prensa, expositores, etc.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={descargarTodosPdf}
                disabled={downloadingPdf || acreditaciones.length === 0}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <FileText className="w-4 h-4" />
                {downloadingPdf ? 'Descargando...' : 'Descargar Todas (PDF)'}
              </button>
              <Link
                to="/admin/diseno-acreditacion"
                className="bg-purple-600 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 hover:bg-purple-700 transition-colors"
              >
                <Palette className="w-4 h-4" />
                Diseñar
              </Link>
              <button
                onClick={() => setShowCategoriaModal(true)}
                className="bg-secondary text-secondary-foreground px-4 py-2 rounded-xl font-medium flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nueva Categoría
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nueva Acreditación
              </button>
            </div>
          </div>

          {/* Selector de Evento */}
          <div className="mb-6">
            <label className="text-foreground/70 text-sm mb-2 block">Evento</label>
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

          {/* Categorías */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4">Categorías de Acreditación</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categorias.map(cat => (
                <div key={cat.id} className="glass-card p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-bold text-foreground">{cat.nombre}</span>
                    </div>
                    <button
                      onClick={() => eliminarCategoria(cat.id)}
                      className="text-accent hover:bg-accent/20 p-1 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-foreground/60 text-sm">Capacidad: {cat.capacidad}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {cat.zonas_acceso?.map(zona => (
                      <span key={zona} className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                        {zona}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lista de Acreditaciones */}
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4">
              Acreditaciones ({acreditaciones.length})
            </h2>
            {acreditaciones.length === 0 ? (
              <div className="glass-card p-8 rounded-xl text-center">
                <BadgeCheck className="w-12 h-12 text-foreground/30 mx-auto mb-3" />
                <p className="text-foreground/60">No hay acreditaciones para este evento</p>
                <p className="text-foreground/40 text-sm mt-1">Crea una nueva acreditación para comenzar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {acreditaciones.map(acred => (
                  <motion.div
                    key={acred.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-4 rounded-xl"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: categorias.find(c => c.id === acred.categoria_id)?.color || '#8B5CF6' }}
                        >
                          {acred.nombre_persona?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground">{acred.nombre_persona}</h3>
                          <p className="text-foreground/60 text-sm">
                            {acred.categoria_nombre} • {acred.cedula || 'Sin cédula'} • {acred.organizacion || 'Sin organización'}
                          </p>
                          <p className="text-foreground/40 text-xs">{acred.codigo_alfanumerico}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          acred.estado_entrada === 'dentro' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-gray-500/20 text-gray-400'
                        }`}>
                          {acred.estado_entrada === 'dentro' ? 'Dentro' : 'Fuera'}
                        </span>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {acred.zonas_acceso?.slice(0, 3).map(zona => (
                            <span key={zona} className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                            {zona}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => descargarPdfIndividual(acred.id, acred.nombre_persona)}
                        disabled={downloadingPdf}
                        className="text-blue-400 hover:bg-blue-500/20 p-2 rounded-lg disabled:opacity-50"
                        title="Descargar PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => eliminarAcreditacion(acred.id)}
                        className="text-accent hover:bg-accent/20 p-2 rounded-lg"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal Nueva Categoría */}
      <AnimatePresence>
        {showCategoriaModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="glass-card p-6 rounded-2xl w-full max-w-md"
            >
              <h2 className="text-xl font-bold text-foreground mb-4">Nueva Categoría</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-foreground/70 text-sm">Nombre</label>
                  <input
                    type="text"
                    value={nuevaCategoria.nombre}
                    onChange={(e) => setNuevaCategoria({...nuevaCategoria, nombre: e.target.value})}
                    placeholder="Ej: Prensa, VIP, Expositor..."
                    className="w-full bg-background/50 border border-white/20 rounded-xl px-4 py-3 text-foreground mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-foreground/70 text-sm">Color</label>
                  <input
                    type="color"
                    value={nuevaCategoria.color}
                    onChange={(e) => setNuevaCategoria({...nuevaCategoria, color: e.target.value})}
                    className="w-full h-12 rounded-xl cursor-pointer mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-foreground/70 text-sm">Capacidad</label>
                  <input
                    type="number"
                    value={nuevaCategoria.capacidad}
                    onChange={(e) => setNuevaCategoria({...nuevaCategoria, capacidad: parseInt(e.target.value) || 0})}
                    className="w-full bg-background/50 border border-white/20 rounded-xl px-4 py-3 text-foreground mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-foreground/70 text-sm">Zonas de Acceso</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {zonasDisponibles.map(zona => (
                      <button
                        key={zona}
                        type="button"
                        onClick={() => {
                          const zonas = nuevaCategoria.zonas_acceso.includes(zona)
                            ? nuevaCategoria.zonas_acceso.filter(z => z !== zona)
                            : [...nuevaCategoria.zonas_acceso, zona];
                          setNuevaCategoria({...nuevaCategoria, zonas_acceso: zonas});
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                          nuevaCategoria.zonas_acceso.includes(zona)
                            ? 'bg-primary text-white'
                            : 'bg-background/50 text-foreground/70 border border-white/20'
                        }`}
                      >
                        {zona}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCategoriaModal(false)}
                  className="flex-1 py-3 rounded-xl border border-white/20 text-foreground"
                >
                  Cancelar
                </button>
                <button
                  onClick={crearCategoria}
                  className="flex-1 py-3 rounded-xl bg-primary text-white font-medium"
                >
                  Crear Categoría
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Nueva Acreditación */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="glass-card p-6 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-xl font-bold text-foreground mb-4">Nueva Acreditación</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-foreground/70 text-sm">Categoría *</label>
                  <select
                    value={nuevaAcreditacion.categoria_id}
                    onChange={(e) => setNuevaAcreditacion({...nuevaAcreditacion, categoria_id: e.target.value})}
                    className="w-full bg-background/50 border border-white/20 rounded-xl px-4 py-3 text-foreground mt-1"
                  >
                    <option value="">Seleccionar categoría</option>
                    {categorias.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-foreground/70 text-sm">Nombre *</label>
                  <input
                    type="text"
                    value={nuevaAcreditacion.nombre_persona}
                    onChange={(e) => setNuevaAcreditacion({...nuevaAcreditacion, nombre_persona: e.target.value})}
                    placeholder="Nombre completo"
                    className="w-full bg-background/50 border border-white/20 rounded-xl px-4 py-3 text-foreground mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-foreground/70 text-sm">Cédula</label>
                  <input
                    type="text"
                    value={nuevaAcreditacion.cedula}
                    onChange={(e) => setNuevaAcreditacion({...nuevaAcreditacion, cedula: e.target.value})}
                    placeholder="V-12.345.678"
                    className="w-full bg-background/50 border border-white/20 rounded-xl px-4 py-3 text-foreground mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-foreground/70 text-sm">Organización / Departamento</label>
                  <input
                    type="text"
                    value={nuevaAcreditacion.organizacion}
                    onChange={(e) => setNuevaAcreditacion({...nuevaAcreditacion, organizacion: e.target.value})}
                    placeholder="Empresa, medio o departamento"
                    className="w-full bg-background/50 border border-white/20 rounded-xl px-4 py-3 text-foreground mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-foreground/70 text-sm">Cargo</label>
                  <input
                    type="text"
                    value={nuevaAcreditacion.cargo}
                    onChange={(e) => setNuevaAcreditacion({...nuevaAcreditacion, cargo: e.target.value})}
                    placeholder="Cargo o función"
                    className="w-full bg-background/50 border border-white/20 rounded-xl px-4 py-3 text-foreground mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-foreground/70 text-sm">Email</label>
                  <input
                    type="email"
                    value={nuevaAcreditacion.email}
                    onChange={(e) => setNuevaAcreditacion({...nuevaAcreditacion, email: e.target.value})}
                    placeholder="correo@ejemplo.com"
                    className="w-full bg-background/50 border border-white/20 rounded-xl px-4 py-3 text-foreground mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-foreground/70 text-sm">Teléfono</label>
                  <input
                    type="tel"
                    value={nuevaAcreditacion.telefono}
                    onChange={(e) => setNuevaAcreditacion({...nuevaAcreditacion, telefono: e.target.value})}
                    placeholder="04XX-XXXXXXX"
                    className="w-full bg-background/50 border border-white/20 rounded-xl px-4 py-3 text-foreground mt-1"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl border border-white/20 text-foreground"
                >
                  Cancelar
                </button>
                <button
                  onClick={crearAcreditacion}
                  className="flex-1 py-3 rounded-xl bg-primary text-white font-medium"
                >
                  Crear Acreditación
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminAcreditaciones;
