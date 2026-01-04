import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  LayoutDashboard, Calendar, Settings, LogOut, Tag, ShoppingCart, 
  CreditCard, Shield, Table2, Users, Printer, Plus, Trash2, 
  Download, Eye, BadgeCheck, Activity, Ticket, Package, ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '../../components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminTicketsTermicos = () => {
  const navigate = useNavigate();
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [entradasGeneradas, setEntradasGeneradas] = useState([]);
  const [entradaPreview, setEntradaPreview] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const printRef = useRef(null);
  
  // Form state
  const [formData, setFormData] = useState({
    evento_id: '',
    categoria: 'General',
    cantidad: 10,
    precio: 0
  });

  // Categorías disponibles para el evento seleccionado
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);

  useEffect(() => {
    cargarEventos();
  }, []);

  useEffect(() => {
    if (formData.evento_id) {
      const evento = eventos.find(e => e.id === formData.evento_id);
      if (evento) {
        actualizarCategoriasDisponibles(evento);
      }
    }
  }, [formData.evento_id, eventos]);

  const actualizarCategoriasDisponibles = (evento) => {
    const categorias = [];
    
    if (evento.tipo_asientos === 'general' || evento.tipo_asientos === 'mixto') {
      const zonasGenerales = evento.configuracion_asientos?.categorias_generales || [];
      zonasGenerales.forEach(zona => {
        categorias.push({
          nombre: zona.nombre,
          precio: zona.precio || 0,
          tipo: 'general'
        });
      });
    }
    
    if (evento.tipo_asientos === 'mesas' || evento.tipo_asientos === 'mixto') {
      const mesas = evento.configuracion_asientos?.mesas || [];
      const categMesas = [...new Set(mesas.map(m => m.categoria))];
      categMesas.forEach(cat => {
        const mesaEjemplo = mesas.find(m => m.categoria === cat);
        categorias.push({
          nombre: `Mesa - ${cat}`,
          precio: mesaEjemplo?.precio || 0,
          tipo: 'mesa'
        });
      });
    }
    
    // Si no hay categorías configuradas, usar una por defecto
    if (categorias.length === 0) {
      categorias.push({
        nombre: 'General',
        precio: evento.precio || 0,
        tipo: 'general'
      });
    }
    
    setCategoriasDisponibles(categorias);
    
    // Seleccionar la primera categoría por defecto
    if (categorias.length > 0) {
      setFormData(prev => ({
        ...prev,
        categoria: categorias[0].nombre,
        precio: categorias[0].precio
      }));
    }
  };

  const cargarEventos = async () => {
    try {
      const response = await axios.get(`${API}/eventos`);
      setEventos(response.data);
      if (response.data.length > 0) {
        setFormData(prev => ({
          ...prev,
          evento_id: response.data[0].id
        }));
      }
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

  const handleCategoriaChange = (e) => {
    const categoriaNombre = e.target.value;
    const categoria = categoriasDisponibles.find(c => c.nombre === categoriaNombre);
    setFormData(prev => ({
      ...prev,
      categoria: categoriaNombre,
      precio: categoria?.precio || 0
    }));
  };

  const generarEntradas = async () => {
    if (!formData.evento_id) {
      toast.error('Selecciona un evento');
      return;
    }
    
    if (formData.cantidad < 1 || formData.cantidad > 100) {
      toast.error('La cantidad debe ser entre 1 y 100');
      return;
    }

    setGenerando(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.post(
        `${API}/admin/generar-entradas-termicas`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setEntradasGeneradas(response.data.entradas);
      toast.success(`${response.data.cantidad} tickets generados correctamente`);
    } catch (error) {
      console.error('Error generando entradas:', error);
      toast.error(error.response?.data?.detail || 'Error al generar tickets');
    } finally {
      setGenerando(false);
    }
  };

  const verPreview = async (entrada) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(
        `${API}/admin/entrada-termica/${entrada.id}`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      
      const imageUrl = URL.createObjectURL(response.data);
      setEntradaPreview({ ...entrada, imageUrl });
      setShowPreviewModal(true);
    } catch (error) {
      console.error('Error obteniendo preview:', error);
      toast.error('Error al obtener preview del ticket');
    }
  };

  const descargarTicket = async (entrada) => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(
        `${API}/admin/entrada-termica/${entrada.id}`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ticket-${entrada.codigo_alfanumerico}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error descargando ticket:', error);
      toast.error('Error al descargar ticket');
    }
  };

  const imprimirTodos = async () => {
    if (entradasGeneradas.length === 0) {
      toast.error('No hay tickets para imprimir');
      return;
    }

    // Crear ventana de impresión con todos los tickets
    const printWindow = window.open('', '_blank');
    const token = localStorage.getItem('admin_token');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Tickets - Ciudad Feria 2026</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
            }
            .ticket {
              width: 80mm;
              page-break-after: always;
              margin: 0;
              padding: 0;
            }
            .ticket img {
              width: 100%;
              height: auto;
              display: block;
            }
            .loading {
              text-align: center;
              padding: 20px;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="loading">Cargando tickets...</div>
        </body>
      </html>
    `);

    // Cargar todas las imágenes
    let ticketsHtml = '';
    for (const entrada of entradasGeneradas) {
      try {
        const response = await axios.get(
          `${API}/admin/entrada-termica/${entrada.id}`,
          { 
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob'
          }
        );
        const imageUrl = URL.createObjectURL(response.data);
        ticketsHtml += `<div class="ticket"><img src="${imageUrl}" /></div>`;
      } catch (error) {
        console.error(`Error cargando ticket ${entrada.id}:`, error);
      }
    }

    printWindow.document.body.innerHTML = ticketsHtml;
    
    // Esperar a que las imágenes carguen y luego imprimir
    setTimeout(() => {
      printWindow.print();
    }, 1500);
  };

  const limpiarLista = () => {
    setEntradasGeneradas([]);
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Calendar, label: 'Eventos', path: '/admin/eventos' },
    { icon: Tag, label: 'Categorías', path: '/admin/categorias' },
    { icon: Table2, label: 'Categorías Mesas', path: '/admin/categorias-mesas' },
    { icon: ShoppingCart, label: 'Compras', path: '/admin/compras' },
    { icon: CreditCard, label: 'Métodos de Pago', path: '/admin/metodos-pago' },
    { icon: Shield, label: 'Validar Entradas', path: '/admin/validar' },
    { icon: Printer, label: 'Tickets Térmicos', path: '/admin/tickets-termicos', active: true },
    { icon: BadgeCheck, label: 'Acreditaciones', path: '/admin/acreditaciones' },
    { icon: Activity, label: 'Aforo', path: '/admin/aforo' },
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
          <div className="mb-8">
            <h2 className="text-4xl font-heading font-black text-foreground flex items-center gap-3">
              <Printer className="w-10 h-10 text-primary" />
              Tickets Térmicos 80mm
            </h2>
            <p className="text-foreground/60 mt-2">
              Genera tickets para impresora térmica de 80mm - Venta en taquilla
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulario de generación */}
            <div className="lg:col-span-1">
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary" />
                  Generar Tickets
                </h3>

                <div className="space-y-4">
                  {/* Selector de evento */}
                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-2">
                      Evento
                    </label>
                    <select
                      data-testid="evento-select"
                      value={formData.evento_id}
                      onChange={(e) => setFormData({ ...formData, evento_id: e.target.value })}
                      className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    >
                      <option value="">Seleccionar evento...</option>
                      {eventos.map((evento) => (
                        <option key={evento.id} value={evento.id}>
                          {evento.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selector de categoría */}
                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-2">
                      Categoría / Zona
                    </label>
                    <select
                      data-testid="categoria-select"
                      value={formData.categoria}
                      onChange={handleCategoriaChange}
                      className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    >
                      {categoriasDisponibles.map((cat, idx) => (
                        <option key={idx} value={cat.nombre}>
                          {cat.nombre} - ${cat.precio.toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cantidad */}
                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-2">
                      Cantidad de tickets
                    </label>
                    <input
                      type="number"
                      data-testid="cantidad-input"
                      min="1"
                      max="100"
                      value={formData.cantidad}
                      onChange={(e) => setFormData({ ...formData, cantidad: parseInt(e.target.value) || 1 })}
                      className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                    <p className="text-xs text-foreground/50 mt-1">Máximo 100 por lote</p>
                  </div>

                  {/* Precio */}
                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-2">
                      Precio unitario ($)
                    </label>
                    <input
                      type="number"
                      data-testid="precio-input"
                      min="0"
                      step="0.01"
                      value={formData.precio}
                      onChange={(e) => setFormData({ ...formData, precio: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-input border border-border rounded-xl px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>

                  {/* Resumen */}
                  <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-foreground/70">Tickets:</span>
                      <span className="font-bold text-foreground">{formData.cantidad}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-foreground/70">Precio c/u:</span>
                      <span className="font-bold text-foreground">${formData.precio.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-primary/30 pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-foreground/70 font-medium">Total:</span>
                        <span className="text-2xl font-black text-primary">
                          ${(formData.cantidad * formData.precio).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Botón generar */}
                  <motion.button
                    data-testid="generar-btn"
                    onClick={generarEntradas}
                    disabled={generando || !formData.evento_id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg btn-glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {generando ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-foreground border-t-transparent"></div>
                        Generando...
                      </>
                    ) : (
                      <>
                        <Ticket className="w-5 h-5" />
                        Generar Tickets
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Lista de tickets generados */}
            <div className="lg:col-span-2">
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    Tickets Generados ({entradasGeneradas.length})
                  </h3>
                  
                  {entradasGeneradas.length > 0 && (
                    <div className="flex gap-2">
                      <motion.button
                        data-testid="imprimir-todos-btn"
                        onClick={imprimirTodos}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground font-medium"
                      >
                        <Printer className="w-4 h-4" />
                        Imprimir Todos
                      </motion.button>
                      <motion.button
                        data-testid="limpiar-btn"
                        onClick={limpiarLista}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-accent font-medium"
                      >
                        <Trash2 className="w-4 h-4" />
                        Limpiar
                      </motion.button>
                    </div>
                  )}
                </div>

                {entradasGeneradas.length === 0 ? (
                  <div className="text-center py-16">
                    <Ticket className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
                    <p className="text-foreground/50">
                      No hay tickets generados aún.<br />
                      Usa el formulario para generar un lote.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
                    {entradasGeneradas.map((entrada, index) => (
                      <motion.div
                        key={entrada.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-background/50 border border-white/10 rounded-xl p-4"
                      >
                        <div className="text-center mb-3">
                          <span className="text-xs text-foreground/50">#{index + 1}</span>
                          <h4 className="font-mono font-bold text-primary text-sm">
                            {entrada.codigo_alfanumerico}
                          </h4>
                        </div>
                        
                        <div className="text-xs text-foreground/60 space-y-1 mb-3">
                          <p><span className="font-medium">Categoría:</span> {entrada.categoria_entrada}</p>
                          <p><span className="font-medium">Precio:</span> ${entrada.precio_total.toFixed(2)}</p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            data-testid={`ver-btn-${index}`}
                            onClick={() => verPreview(entrada)}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            Ver
                          </button>
                          <button
                            data-testid={`descargar-btn-${index}`}
                            onClick={() => descargarTicket(entrada)}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-secondary/10 text-secondary text-xs font-medium hover:bg-secondary/20 transition-colors"
                          >
                            <Download className="w-3 h-3" />
                            PNG
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal Preview */}
      {showPreviewModal && entradaPreview && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 rounded-3xl max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-foreground mb-4 text-center">
              Preview del Ticket
            </h3>
            
            <div className="bg-white rounded-xl p-2 mb-4">
              <img 
                src={entradaPreview.imageUrl} 
                alt="Ticket Preview" 
                className="w-full"
              />
            </div>
            
            <div className="text-center text-sm text-foreground/60 mb-4">
              <p className="font-mono font-bold text-primary">
                {entradaPreview.codigo_alfanumerico}
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => descargarTicket(entradaPreview)}
                className="flex-1 py-3 rounded-xl bg-secondary text-secondary-foreground font-bold flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Descargar PNG
              </button>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  URL.revokeObjectURL(entradaPreview.imageUrl);
                }}
                className="flex-1 py-3 rounded-xl glass-card font-bold text-foreground/80"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminTicketsTermicos;
