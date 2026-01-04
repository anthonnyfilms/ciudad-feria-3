import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { LayoutDashboard, Calendar, Settings, LogOut, Tag, ShoppingCart, CreditCard, Shield, Table2, Upload, Save, Eye, Users, BadgeCheck, Activity, Type, QrCode, Building, CreditCard as IdCard, Trash2, Download, FileText, Palette , Printer } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '../../components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDisenoAcreditacion = () => {
  const navigate = useNavigate();
  const previewRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [eventos, setEventos] = useState([]);
  const [eventoSeleccionado, setEventoSeleccionado] = useState('');
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [fondoImagen, setFondoImagen] = useState(null);
  const [fondoPreview, setFondoPreview] = useState(null);
  
  // Elementos del diseño con posiciones individuales
  const [elementos, setElementos] = useState({
    nombre: { visible: true, x: 50, y: 35, size: 24, color: '#FFFFFF', rotation: 0 },
    cedula: { visible: true, x: 50, y: 45, size: 14, color: '#FFFFFF', rotation: 0 },
    departamento: { visible: true, x: 50, y: 55, size: 16, color: '#FFFFFF', rotation: 0 },
    categoria: { visible: true, x: 50, y: 15, size: 18, color: '#FFD700', rotation: 0 },
    evento: { visible: true, x: 50, y: 90, size: 10, color: '#CCCCCC', rotation: 0 },
    qr: { visible: true, x: 85, y: 75, size: 60, rotation: 0 }
  });
  
  const [elementoActivo, setElementoActivo] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Datos de ejemplo para preview
  const [datosEjemplo, setDatosEjemplo] = useState({
    nombre: 'JUAN PÉREZ',
    cedula: 'V-12.345.678',
    departamento: 'PRENSA DIGITAL',
    categoria: 'PRENSA',
    evento: 'EVENTO 2026'
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (eventoSeleccionado && categoriaSeleccionada) {
      cargarConfiguracion();
    }
  }, [eventoSeleccionado, categoriaSeleccionada]);

  const cargarDatos = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const [eventosRes, categoriasRes] = await Promise.all([
        axios.get(`${API}/eventos`),
        axios.get(`${API}/admin/categorias-acreditacion`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      setEventos(eventosRes.data);
      setCategorias(categoriasRes.data);
      
      if (eventosRes.data.length > 0 && !eventoSeleccionado) {
        setEventoSeleccionado(eventosRes.data[0].id);
      }
      if (categoriasRes.data.length > 0 && !categoriaSeleccionada) {
        setCategoriaSeleccionada(categoriasRes.data[0].id);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar datos');
    }
  };

  const cargarConfiguracion = () => {
    const evento = eventos.find(e => e.id === eventoSeleccionado);
    const categoria = categorias.find(c => c.id === categoriaSeleccionada);
    
    // Actualizar datos de ejemplo
    setDatosEjemplo(prev => ({
      ...prev,
      categoria: categoria?.nombre || 'CATEGORÍA',
      evento: evento?.nombre || 'EVENTO 2026'
    }));
    
    // Buscar configuración guardada para este evento + categoría
    const configAcreditaciones = evento?.config_acreditaciones || {};
    const configCategoria = configAcreditaciones[categoriaSeleccionada];
    
    if (configCategoria) {
      if (configCategoria.template_imagen) {
        setFondoPreview(configCategoria.template_imagen);
        setFondoImagen(configCategoria.template_imagen);
      } else {
        setFondoPreview(null);
        setFondoImagen(null);
      }
      
      if (configCategoria.config_elementos) {
        setElementos(prev => ({
          ...prev,
          ...configCategoria.config_elementos
        }));
      } else {
        resetElementos();
      }
    } else {
      // Sin configuración guardada, usar defaults
      setFondoPreview(null);
      setFondoImagen(null);
      resetElementos();
    }
  };

  const resetElementos = () => {
    setElementos({
      nombre: { visible: true, x: 50, y: 35, size: 24, color: '#FFFFFF', rotation: 0 },
      cedula: { visible: true, x: 50, y: 45, size: 14, color: '#FFFFFF', rotation: 0 },
      departamento: { visible: true, x: 50, y: 55, size: 16, color: '#FFFFFF', rotation: 0 },
      categoria: { visible: true, x: 50, y: 15, size: 18, color: '#FFD700', rotation: 0 },
      evento: { visible: true, x: 50, y: 90, size: 10, color: '#CCCCCC', rotation: 0 },
      qr: { visible: true, x: 85, y: 75, size: 60, rotation: 0 }
    });
  };

  const handleFondoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFondoPreview(reader.result);
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API}/upload-imagen`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFondoImagen(`${BACKEND_URL}${response.data.url}`);
      toast.success('Imagen de fondo cargada');
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      toast.error('Error al subir imagen');
    }
  };

  // Drag & Drop para elementos
  const handleMouseDown = (e, elementoKey) => {
    if (!previewRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    
    const rect = previewRef.current.getBoundingClientRect();
    const elemento = elementos[elementoKey];
    const currentX = (elemento.x / 100) * rect.width;
    const currentY = (elemento.y / 100) * rect.height;
    
    setDragOffset({
      x: e.clientX - rect.left - currentX,
      y: e.clientY - rect.top - currentY
    });
    setElementoActivo(elementoKey);
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !previewRef.current || !elementoActivo) return;
    
    const rect = previewRef.current.getBoundingClientRect();
    const newX = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100;
    const newY = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100;
    
    setElementos(prev => ({
      ...prev,
      [elementoActivo]: {
        ...prev[elementoActivo],
        x: Math.max(5, Math.min(95, newX)),
        y: Math.max(5, Math.min(95, newY))
      }
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch support
  const handleTouchStart = (e, elementoKey) => {
    if (!previewRef.current) return;
    const touch = e.touches[0];
    
    const rect = previewRef.current.getBoundingClientRect();
    const elemento = elementos[elementoKey];
    const currentX = (elemento.x / 100) * rect.width;
    const currentY = (elemento.y / 100) * rect.height;
    
    setDragOffset({
      x: touch.clientX - rect.left - currentX,
      y: touch.clientY - rect.top - currentY
    });
    setElementoActivo(elementoKey);
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !previewRef.current || !elementoActivo) return;
    const touch = e.touches[0];
    
    const rect = previewRef.current.getBoundingClientRect();
    const newX = ((touch.clientX - rect.left - dragOffset.x) / rect.width) * 100;
    const newY = ((touch.clientY - rect.top - dragOffset.y) / rect.height) * 100;
    
    setElementos(prev => ({
      ...prev,
      [elementoActivo]: {
        ...prev[elementoActivo],
        x: Math.max(5, Math.min(95, newX)),
        y: Math.max(5, Math.min(95, newY))
      }
    }));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const actualizarElemento = (key, campo, valor) => {
    setElementos(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [campo]: valor
      }
    }));
  };

  const guardarConfiguracion = async () => {
    if (!eventoSeleccionado || !categoriaSeleccionada) {
      toast.error('Selecciona un evento y una categoría');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      
      // Obtener configuración actual del evento
      const evento = eventos.find(e => e.id === eventoSeleccionado);
      const configActual = evento?.config_acreditaciones || {};
      
      // Actualizar solo la configuración de esta categoría
      const nuevaConfig = {
        ...configActual,
        [categoriaSeleccionada]: {
          template_imagen: fondoImagen || fondoPreview,
          config_elementos: elementos
        }
      };
      
      await axios.put(
        `${API}/admin/eventos/${eventoSeleccionado}`,
        { config_acreditaciones: nuevaConfig },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('✅ Diseño guardado para este evento y categoría');
      
      // Recargar datos para actualizar el estado
      const eventosRes = await axios.get(`${API}/eventos`);
      setEventos(eventosRes.data);
    } catch (error) {
      console.error('Error guardando:', error);
      toast.error('Error al guardar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/secure-admin-panel-2026');
  };

  const getCategoriaColor = () => {
    const cat = categorias.find(c => c.id === categoriaSeleccionada);
    return cat?.color || '#8B5CF6';
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
    { icon: Tag, label: 'Diseño Entrada', path: '/admin/diseno-entrada' },
    { icon: BadgeCheck, label: 'Acreditaciones', path: '/admin/acreditaciones' },
    { icon: Palette, label: 'Diseño Acreditación', path: '/admin/diseno-acreditacion', active: true },
    { icon: Activity, label: 'Aforo', path: '/admin/aforo' },
    { icon: Users, label: 'Usuarios', path: '/admin/usuarios' },
    { icon: Settings, label: 'Configuración', path: '/admin/configuracion' },
  ];

  const elementosConfig = [
    { key: 'categoria', label: 'Categoría', icon: Tag },
    { key: 'nombre', label: 'Nombre', icon: Type },
    { key: 'cedula', label: 'Cédula', icon: IdCard },
    { key: 'departamento', label: 'Departamento', icon: Building },
    { key: 'evento', label: 'Evento', icon: Calendar },
    { key: 'qr', label: 'Código QR', icon: QrCode },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />
      
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen glass-card border-r border-white/10 p-6 hidden lg:block">
          <div className="mb-8">
            <h2 className="text-2xl font-heading font-bold text-primary">Ciudad Feria</h2>
            <p className="text-foreground/60 text-sm">Panel Admin</p>
          </div>
          
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
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-foreground/70 hover:bg-accent/10 hover:text-accent transition-all mt-8 w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-heading font-bold text-foreground">
                  🎫 Diseño de Acreditación
                </h1>
                <p className="text-foreground/60 mt-1">
                  Personaliza el diseño de credenciales para cada evento y categoría
                </p>
              </div>
            </div>

            {categorias.length === 0 ? (
              <div className="glass-card p-12 rounded-2xl text-center">
                <BadgeCheck className="w-16 h-16 text-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">No hay categorías de acreditación</h3>
                <p className="text-foreground/60 mb-6">
                  Primero debes crear categorías en la sección de Acreditaciones
                </p>
                <Link 
                  to="/admin/acreditaciones"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold"
                >
                  <BadgeCheck className="w-5 h-5" />
                  Ir a Acreditaciones
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Panel de Controles */}
                <div className="space-y-6">
                  {/* Selector de Evento */}
                  <div className="glass-card p-6 rounded-2xl">
                    <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      Evento
                    </h3>
                    <select
                      value={eventoSeleccionado}
                      onChange={(e) => setEventoSeleccionado(e.target.value)}
                      className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:border-primary outline-none"
                    >
                      {eventos.map(evento => (
                        <option key={evento.id} value={evento.id}>{evento.nombre}</option>
                      ))}
                    </select>
                  </div>

                  {/* Selector de Categoría */}
                  <div className="glass-card p-6 rounded-2xl">
                    <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                      <Tag className="w-5 h-5 text-primary" />
                      Categoría de Acreditación
                    </h3>
                    <select
                      value={categoriaSeleccionada}
                      onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                      className="w-full bg-background/50 border border-white/10 rounded-xl px-4 py-3 text-foreground focus:border-primary outline-none"
                    >
                      {categorias.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                      ))}
                    </select>
                    
                    {/* Indicador de color de categoría */}
                    <div className="flex items-center gap-2 mt-3">
                      <div 
                        className="w-6 h-6 rounded-full border-2 border-white/20"
                        style={{ backgroundColor: getCategoriaColor() }}
                      />
                      <span className="text-sm text-foreground/60">Color de la categoría</span>
                    </div>
                  </div>

                  {/* Imagen de Fondo */}
                  <div className="glass-card p-6 rounded-2xl">
                    <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                      <Upload className="w-5 h-5 text-primary" />
                      Fondo de Credencial
                    </h3>
                    <label className="block">
                      <div className="border-2 border-dashed border-white/20 rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 transition-colors">
                        <Upload className="w-8 h-8 text-foreground/40 mx-auto mb-2" />
                        <p className="text-foreground/60 text-sm">
                          {fondoPreview ? 'Cambiar imagen' : 'Subir imagen'}
                        </p>
                        <p className="text-foreground/40 text-xs mt-1">PNG, JPG (400x250px)</p>
                      </div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFondoUpload} 
                        className="hidden" 
                      />
                    </label>
                    {fondoPreview && (
                      <button
                        onClick={() => { setFondoPreview(null); setFondoImagen(null); }}
                        className="mt-3 text-sm text-accent hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" /> Quitar fondo
                      </button>
                    )}
                  </div>

                  {/* Configuración de Elementos */}
                  <div className="glass-card p-6 rounded-2xl">
                    <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-primary" />
                      Elementos
                    </h3>
                    <p className="text-foreground/50 text-xs mb-4">
                      Arrastra en la vista previa para posicionar
                    </p>
                    
                    <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2">
                      {elementosConfig.map(({ key, label, icon: Icon }) => (
                        <div 
                          key={key} 
                          className={`p-3 rounded-xl border transition-all ${
                            elementoActivo === key 
                              ? 'border-primary bg-primary/10' 
                              : 'border-white/10 bg-background/30'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4 text-primary" />
                              <span className="text-foreground text-sm font-medium">{label}</span>
                            </div>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={elementos[key].visible}
                                onChange={(e) => actualizarElemento(key, 'visible', e.target.checked)}
                                className="rounded border-white/20"
                              />
                              <span className="text-xs text-foreground/50">Visible</span>
                            </label>
                          </div>
                          
                          {elementos[key].visible && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <div>
                                <label className="text-xs text-foreground/50">Pos X %</label>
                                <input
                                  type="number"
                                  value={Math.round(elementos[key].x)}
                                  onChange={(e) => actualizarElemento(key, 'x', Math.max(5, Math.min(95, parseInt(e.target.value) || 50)))}
                                  min="5"
                                  max="95"
                                  className="w-full bg-background/50 border border-white/10 rounded-lg px-2 py-1 text-sm text-foreground"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-foreground/50">Pos Y %</label>
                                <input
                                  type="number"
                                  value={Math.round(elementos[key].y)}
                                  onChange={(e) => actualizarElemento(key, 'y', Math.max(5, Math.min(95, parseInt(e.target.value) || 50)))}
                                  min="5"
                                  max="95"
                                  className="w-full bg-background/50 border border-white/10 rounded-lg px-2 py-1 text-sm text-foreground"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-foreground/50">Tamaño</label>
                                <input
                                  type="number"
                                  value={elementos[key].size}
                                  onChange={(e) => actualizarElemento(key, 'size', parseInt(e.target.value) || 12)}
                                  min="8"
                                  max={key === 'qr' ? 150 : 48}
                                  className="w-full bg-background/50 border border-white/10 rounded-lg px-2 py-1 text-sm text-foreground"
                                />
                              </div>
                              {key !== 'qr' && (
                                <div>
                                  <label className="text-xs text-foreground/50">Color</label>
                                  <input
                                    type="color"
                                    value={elementos[key].color}
                                    onChange={(e) => actualizarElemento(key, 'color', e.target.value)}
                                    className="w-full h-7 rounded-lg cursor-pointer border border-white/10"
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Botón Guardar */}
                  <motion.button
                    onClick={guardarConfiguracion}
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-5 h-5" />
                    {loading ? 'Guardando...' : 'Guardar Diseño'}
                  </motion.button>
                </div>

                {/* Vista Previa */}
                <div className="lg:col-span-2">
                  <div className="glass-card p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-foreground flex items-center gap-2">
                        <Eye className="w-5 h-5 text-primary" />
                        Vista Previa de Credencial
                      </h3>
                      <div className="text-sm text-foreground/50 bg-background/30 px-3 py-1 rounded-full">
                        {eventos.find(e => e.id === eventoSeleccionado)?.nombre || 'Evento'} • {categorias.find(c => c.id === categoriaSeleccionada)?.nombre || 'Categoría'}
                      </div>
                    </div>
                    <p className="text-foreground/50 text-xs mb-4">
                      Arrastra los elementos para posicionarlos donde desees
                    </p>
                    
                    {/* Contenedor de Preview - Formato credencial vertical 9.5cm (ancho) x 14.5cm (alto) */}
                    <div 
                      ref={previewRef}
                      className="relative mx-auto rounded-2xl overflow-hidden shadow-2xl"
                      style={{ 
                        width: '285px',   /* 9.5 cm en proporción (3x) */
                        height: '435px',  /* 14.5 cm en proporción (3x) */
                        backgroundImage: fondoPreview ? `url(${fondoPreview})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundColor: fondoPreview ? undefined : '#1a1a2e'
                      }}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    >
                      {/* Fondo por defecto si no hay imagen */}
                      {!fondoPreview && (
                        <div className="absolute inset-0">
                          {/* Barra de color superior */}
                          <div 
                            className="absolute top-0 left-0 right-0 h-16"
                            style={{ backgroundColor: getCategoriaColor() }}
                          />
                          {/* Gradiente de fondo */}
                          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 opacity-90" 
                               style={{ top: '64px' }} />
                        </div>
                      )}

                      {/* Elementos arrastrables */}
                      {elementos.categoria.visible && (
                        <div
                          className={`absolute cursor-move select-none font-bold text-center uppercase tracking-widest ${isDragging && elementoActivo === 'categoria' ? 'ring-2 ring-white rounded' : ''}`}
                          style={{
                            left: `${elementos.categoria.x}%`,
                            top: `${elementos.categoria.y}%`,
                            transform: `translate(-50%, -50%) rotate(${elementos.categoria.rotation}deg)`,
                            fontSize: `${elementos.categoria.size}px`,
                            color: elementos.categoria.color,
                            textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                          }}
                          onMouseDown={(e) => handleMouseDown(e, 'categoria')}
                          onTouchStart={(e) => handleTouchStart(e, 'categoria')}
                        >
                          {datosEjemplo.categoria}
                        </div>
                      )}

                      {elementos.nombre.visible && (
                        <div
                          className={`absolute cursor-move select-none font-bold text-center whitespace-nowrap ${isDragging && elementoActivo === 'nombre' ? 'ring-2 ring-white rounded' : ''}`}
                          style={{
                            left: `${elementos.nombre.x}%`,
                            top: `${elementos.nombre.y}%`,
                            transform: `translate(-50%, -50%) rotate(${elementos.nombre.rotation}deg)`,
                            fontSize: `${elementos.nombre.size}px`,
                            color: elementos.nombre.color,
                            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                            maxWidth: '90%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                          onMouseDown={(e) => handleMouseDown(e, 'nombre')}
                          onTouchStart={(e) => handleTouchStart(e, 'nombre')}
                        >
                          {datosEjemplo.nombre}
                        </div>
                      )}

                      {elementos.cedula.visible && (
                        <div
                          className={`absolute cursor-move select-none font-medium text-center whitespace-nowrap ${isDragging && elementoActivo === 'cedula' ? 'ring-2 ring-white rounded' : ''}`}
                          style={{
                            left: `${elementos.cedula.x}%`,
                            top: `${elementos.cedula.y}%`,
                            transform: `translate(-50%, -50%) rotate(${elementos.cedula.rotation}deg)`,
                            fontSize: `${elementos.cedula.size}px`,
                            color: elementos.cedula.color,
                            textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                            maxWidth: '80%'
                          }}
                          onMouseDown={(e) => handleMouseDown(e, 'cedula')}
                          onTouchStart={(e) => handleTouchStart(e, 'cedula')}
                        >
                          C.I.: {datosEjemplo.cedula}
                        </div>
                      )}

                      {elementos.departamento.visible && (
                        <div
                          className={`absolute cursor-move select-none font-semibold text-center uppercase ${isDragging && elementoActivo === 'departamento' ? 'ring-2 ring-white rounded' : ''}`}
                          style={{
                            left: `${elementos.departamento.x}%`,
                            top: `${elementos.departamento.y}%`,
                            transform: `translate(-50%, -50%) rotate(${elementos.departamento.rotation}deg)`,
                            fontSize: `${elementos.departamento.size}px`,
                            color: elementos.departamento.color,
                            textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                          }}
                          onMouseDown={(e) => handleMouseDown(e, 'departamento')}
                          onTouchStart={(e) => handleTouchStart(e, 'departamento')}
                        >
                          {datosEjemplo.departamento}
                        </div>
                      )}

                      {elementos.evento.visible && (
                        <div
                          className={`absolute cursor-move select-none text-center ${isDragging && elementoActivo === 'evento' ? 'ring-2 ring-white rounded' : ''}`}
                          style={{
                            left: `${elementos.evento.x}%`,
                            top: `${elementos.evento.y}%`,
                            transform: `translate(-50%, -50%) rotate(${elementos.evento.rotation}deg)`,
                            fontSize: `${elementos.evento.size}px`,
                            color: elementos.evento.color,
                            opacity: 0.8
                          }}
                          onMouseDown={(e) => handleMouseDown(e, 'evento')}
                          onTouchStart={(e) => handleTouchStart(e, 'evento')}
                        >
                          {datosEjemplo.evento}
                        </div>
                      )}

                      {elementos.qr.visible && (
                        <div
                          className={`absolute cursor-move select-none bg-white p-1.5 rounded-lg ${isDragging && elementoActivo === 'qr' ? 'ring-2 ring-primary' : ''}`}
                          style={{
                            left: `${elementos.qr.x}%`,
                            top: `${elementos.qr.y}%`,
                            transform: `translate(-50%, -50%) rotate(${elementos.qr.rotation}deg)`,
                            width: `${elementos.qr.size}px`,
                            height: `${elementos.qr.size}px`
                          }}
                          onMouseDown={(e) => handleMouseDown(e, 'qr')}
                          onTouchStart={(e) => handleTouchStart(e, 'qr')}
                        >
                          <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
                            <QrCode className="w-3/4 h-3/4 text-gray-800" />
                          </div>
                        </div>
                      )}

                      {/* Borde de la credencial */}
                      <div 
                        className="absolute inset-0 rounded-2xl pointer-events-none"
                        style={{ 
                          border: `3px solid ${getCategoriaColor()}`,
                          boxShadow: `inset 0 0 20px rgba(0,0,0,0.3)`
                        }}
                      />
                    </div>

                    {/* Instrucciones */}
                    <div className="mt-6 p-4 bg-primary/10 rounded-xl border border-primary/20">
                      <h4 className="font-bold text-foreground mb-2">💡 Instrucciones</h4>
                      <ul className="text-sm text-foreground/70 space-y-1">
                        <li>• <strong>Selecciona</strong> el evento y la categoría</li>
                        <li>• <strong>Arrastra</strong> cada elemento para posicionarlo</li>
                        <li>• Ajusta <strong>tamaño, color y rotación</strong> en el panel</li>
                        <li>• <strong>Guarda</strong> el diseño (se guarda por evento + categoría)</li>
                      </ul>
                    </div>

                    {/* Link a descarga de PDFs */}
                    <div className="mt-4 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="w-8 h-8 text-blue-400" />
                          <div>
                            <h4 className="font-bold text-foreground">Descargar Acreditaciones</h4>
                            <p className="text-sm text-foreground/60">Genera PDFs de las acreditaciones creadas</p>
                          </div>
                        </div>
                        <Link
                          to="/admin/acreditaciones"
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-blue-600 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Ir a Descargas
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDisenoAcreditacion;
