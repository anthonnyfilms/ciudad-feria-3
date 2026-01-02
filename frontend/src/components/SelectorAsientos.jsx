import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Check, X, Users, Table2, ChevronDown, ChevronUp, Info, MousePointerClick, ArrowRight, Ticket } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SelectorAsientos = ({ eventoId, precioBase = 0, onSeleccionChange, maxSeleccion = 10 }) => {
  const [loading, setLoading] = useState(true);
  const [datosAsientos, setDatosAsientos] = useState(null);
  const [asientosSeleccionados, setAsientosSeleccionados] = useState([]);
  const [cantidadGeneral, setCantidadGeneral] = useState(1);
  const [categoriasMesas, setCategoriasMesas] = useState([]);
  const [seleccionPorCategoria, setSeleccionPorCategoria] = useState({});
  const [mesaExpandida, setMesaExpandida] = useState(null);
  const [mostrarGuia, setMostrarGuia] = useState(true);

  useEffect(() => {
    cargarAsientos();
    cargarCategoriasMesas();
  }, [eventoId]);

  useEffect(() => {
    // Notificar cambios de selección con precios
    if (datosAsientos?.tipo_asientos === 'general') {
      const detalles = Object.entries(seleccionPorCategoria)
        .filter(([_, cant]) => cant > 0)
        .map(([nombre, cantidad]) => {
          const categoriasGenerales = datosAsientos?.configuracion?.categorias_generales || [];
          const cat = categoriasGenerales.find(c => c.nombre === nombre);
          return {
            tipo: nombre,
            cantidad,
            precioUnitario: cat?.precio || precioBase
          };
        });
      
      const totalCantidad = detalles.reduce((sum, d) => sum + d.cantidad, 0);
      const precioTotal = detalles.reduce((sum, d) => sum + (d.precioUnitario * d.cantidad), 0);
      
      onSeleccionChange?.({
        tipo: 'general',
        cantidad: totalCantidad || cantidadGeneral,
        asientos: [],
        total: totalCantidad || cantidadGeneral,
        precioTotal: precioTotal || (precioBase * cantidadGeneral),
        detalles: detalles.length > 0 ? detalles : [{ tipo: 'General', cantidad: cantidadGeneral, precioUnitario: precioBase }]
      });
    } else {
      // Calcular precio total basado en asientos seleccionados
      const detalles = calcularDetallesSeleccion();
      const precioTotal = detalles.reduce((sum, d) => sum + (d.precioUnitario * d.cantidad), 0);
      
      onSeleccionChange?.({
        tipo: datosAsientos?.tipo_asientos || 'mesas',
        cantidad: asientosSeleccionados.length,
        asientos: asientosSeleccionados,
        total: asientosSeleccionados.length,
        precioTotal,
        detalles
      });
    }
  }, [asientosSeleccionados, cantidadGeneral, datosAsientos, seleccionPorCategoria]);

  const actualizarCantidadCategoria = (categoria, delta, precio) => {
    setSeleccionPorCategoria(prev => {
      const actual = prev[categoria] || 0;
      const nuevo = Math.max(0, Math.min(maxSeleccion, actual + delta));
      return { ...prev, [categoria]: nuevo };
    });
  };

  const calcularTotalGeneral = () => {
    const categoriasGenerales = datosAsientos?.configuracion?.categorias_generales || [];
    return Object.entries(seleccionPorCategoria).reduce((total, [nombre, cantidad]) => {
      const cat = categoriasGenerales.find(c => c.nombre === nombre);
      return total + ((cat?.precio || precioBase) * cantidad);
    }, 0);
  };

  const cargarCategoriasMesas = async () => {
    try {
      const response = await axios.get(`${API}/categorias-mesas`);
      setCategoriasMesas(response.data);
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  const cargarAsientos = async () => {
    try {
      const response = await axios.get(`${API}/eventos/${eventoId}/asientos`);
      setDatosAsientos(response.data);
    } catch (error) {
      console.error('Error cargando asientos:', error);
    } finally {
      setLoading(false);
    }
  };

  const calcularDetallesSeleccion = () => {
    if (!datosAsientos?.configuracion?.mesas) return [];
    
    const detallesPorCategoria = {};
    const mesas = datosAsientos.configuracion.mesas || [];
    
    asientosSeleccionados.forEach(asientoId => {
      const parts = asientoId.split('-');
      if (parts.length >= 2) {
        const mesaNombre = parts[0];
        const mesa = mesas.find(m => 
          m.nombre === mesaNombre || `Mesa${m.id}` === mesaNombre
        );
        
        if (mesa) {
          const categoria = mesa.categoria || 'General';
          const precio = mesa.precio || precioBase;
          
          if (!detallesPorCategoria[categoria]) {
            detallesPorCategoria[categoria] = {
              tipo: categoria,
              cantidad: 0,
              precioUnitario: precio,
              asientos: []
            };
          }
          detallesPorCategoria[categoria].cantidad++;
          detallesPorCategoria[categoria].asientos.push(asientoId);
        }
      }
    });
    
    return Object.values(detallesPorCategoria);
  };

  const toggleAsiento = (asientoId, precio) => {
    if (asientosSeleccionados.includes(asientoId)) {
      setAsientosSeleccionados(asientosSeleccionados.filter(id => id !== asientoId));
    } else {
      if (asientosSeleccionados.length < maxSeleccion) {
        setAsientosSeleccionados([...asientosSeleccionados, asientoId]);
      }
    }
  };

  const toggleMesaCompleta = (mesa, mesaNombre, numSillas) => {
    // Verificar si todas las sillas de la mesa están seleccionadas
    const sillasMesa = Array.from({ length: numSillas }, (_, i) => `${mesaNombre}-Silla${i + 1}`);
    const todasSeleccionadas = sillasMesa.every(s => asientosSeleccionados.includes(s));
    
    if (todasSeleccionadas) {
      // Deseleccionar toda la mesa
      setAsientosSeleccionados(asientosSeleccionados.filter(a => !a.startsWith(mesaNombre + '-')));
    } else {
      // Seleccionar toda la mesa (solo sillas disponibles)
      const sillasDisponibles = sillasMesa.filter(s => {
        const estado = getEstadoAsiento(s);
        return estado === 'disponible' || estado === 'seleccionado';
      });
      
      // Verificar si hay suficiente espacio en maxSeleccion
      const otrasSelecciones = asientosSeleccionados.filter(a => !a.startsWith(mesaNombre + '-'));
      if (otrasSelecciones.length + sillasDisponibles.length <= maxSeleccion) {
        setAsientosSeleccionados([...otrasSelecciones, ...sillasDisponibles]);
      }
    }
  };

  const getEstadoAsiento = (asientoId) => {
    if (datosAsientos?.asientos_ocupados?.includes(asientoId)) return 'ocupado';
    if (datosAsientos?.asientos_pendientes?.includes(asientoId)) return 'pendiente';
    if (asientosSeleccionados.includes(asientoId)) return 'seleccionado';
    return 'disponible';
  };

  const getColorAsiento = (estado, categoriaColor) => {
    switch (estado) {
      case 'ocupado': return 'bg-red-500/80 cursor-not-allowed';
      case 'pendiente': return 'bg-orange-500/80 cursor-not-allowed';
      case 'seleccionado': return 'bg-primary cursor-pointer ring-2 ring-primary ring-offset-2 ring-offset-background';
      default: return `cursor-pointer hover:scale-110 transition-transform`;
    }
  };

  const getCategoriaColor = (categoriaNombre) => {
    const cat = categoriasMesas.find(c => c.nombre === categoriaNombre);
    return cat?.color || '#10B981';
  };

  const contarSillasDisponibles = (mesa) => {
    const numSillas = mesa.sillas || 10;
    const mesaNombre = mesa.nombre;
    let disponibles = 0;
    
    for (let i = 1; i <= numSillas; i++) {
      const asientoId = `${mesaNombre}-Silla${i}`;
      const estado = getEstadoAsiento(asientoId);
      if (estado === 'disponible' || estado === 'seleccionado') {
        disponibles++;
      }
    }
    return disponibles;
  };

  const contarSillasSeleccionadasMesa = (mesa) => {
    const mesaNombre = mesa.nombre;
    return asientosSeleccionados.filter(a => a.startsWith(mesaNombre + '-')).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-primary"></div>
      </div>
    );
  }

  // Modo General - Con categorías de entradas
  if (datosAsientos?.tipo_asientos === 'general') {
    const categoriasGenerales = datosAsientos?.configuracion?.categorias_generales || [
      { nombre: 'General', precio: precioBase, capacidad: datosAsientos?.capacidad_total || 100 }
    ];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* Guía para modo general */}
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
          <Ticket className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-foreground font-medium">Selecciona tus entradas</p>
            <p className="text-foreground/60 text-sm">Elige la cantidad de entradas que deseas por cada categoría.</p>
          </div>
        </div>

        {categoriasGenerales.map((cat, idx) => {
          const cantidadSeleccionada = seleccionPorCategoria[cat.nombre] || 0;
          
          return (
            <div key={idx} className="glass-card p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: (cat.color || getCategoriaColor(cat.nombre)) + '20' }}
                >
                  <Users className="w-5 h-5" style={{ color: cat.color || getCategoriaColor(cat.nombre) }} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground">{cat.nombre}</h3>
                  <p className="text-sm text-foreground/60">Sin asiento asignado</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">${cat.precio || precioBase}</p>
                  <p className="text-xs text-foreground/50">por entrada</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <span className="text-foreground/70">Cantidad:</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => actualizarCantidadCategoria(cat.nombre, -1, cat.precio || precioBase)}
                    className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-xl font-bold hover:border-primary transition-colors"
                  >
                    -
                  </button>
                  <span className="text-2xl font-bold text-primary w-12 text-center">
                    {cantidadSeleccionada}
                  </span>
                  <button
                    type="button"
                    onClick={() => actualizarCantidadCategoria(cat.nombre, 1, cat.precio || precioBase)}
                    className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-xl font-bold hover:border-primary transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {cantidadSeleccionada > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10 flex justify-between">
                  <span className="text-foreground/70">Subtotal:</span>
                  <span className="font-bold text-primary">
                    ${((cat.precio || precioBase) * cantidadSeleccionada).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* Resumen total */}
        {Object.values(seleccionPorCategoria).some(v => v > 0) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 rounded-2xl bg-primary/5 border border-primary/20"
          >
            <h4 className="font-bold text-foreground mb-4">📋 Detalle de tu compra</h4>
            
            {Object.entries(seleccionPorCategoria).filter(([_, cant]) => cant > 0).map(([nombre, cantidad]) => {
              const cat = categoriasGenerales.find(c => c.nombre === nombre);
              const precio = cat?.precio || precioBase;
              return (
                <div key={nombre} className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-foreground">{nombre} x{cantidad}</span>
                  <span className="font-bold text-foreground">${(precio * cantidad).toFixed(2)}</span>
                </div>
              );
            })}
            
            <div className="flex justify-between items-center pt-4 mt-2">
              <span className="text-lg font-bold text-foreground">TOTAL:</span>
              <span className="text-2xl font-black text-primary">
                ${calcularTotalGeneral().toFixed(2)}
              </span>
            </div>
          </motion.div>
        )}

        <div className="text-center text-foreground/50 text-sm">
          Disponibles: {datosAsientos.disponibles} de {datosAsientos.capacidad_total}
        </div>
      </motion.div>
    );
  }

  // Modo Mesas - Con mesas expandibles
  const configuracion = datosAsientos?.configuracion || {};
  const mesas = configuracion.mesas || [];
  
  // Agrupar mesas por categoría
  const mesasPorCategoria = {};
  mesas.forEach(mesa => {
    const cat = mesa.categoria || 'General';
    if (!mesasPorCategoria[cat]) {
      mesasPorCategoria[cat] = [];
    }
    mesasPorCategoria[cat].push(mesa);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Guía de compra - Se puede cerrar */}
      <AnimatePresence>
        {mostrarGuia && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 rounded-2xl p-5 relative overflow-hidden"
          >
            <button
              onClick={() => setMostrarGuia(false)}
              className="absolute top-3 right-3 text-foreground/50 hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-primary" />
              <h4 className="font-bold text-foreground">¿Cómo comprar tu entrada?</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-primary">1</span>
                </div>
                <div>
                  <p className="text-foreground font-medium text-sm">Selecciona una mesa</p>
                  <p className="text-foreground/60 text-xs">Haz clic en cualquier mesa para ver las sillas disponibles</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-primary">2</span>
                </div>
                <div>
                  <p className="text-foreground font-medium text-sm">Elige tus sillas</p>
                  <p className="text-foreground/60 text-xs">Selecciona las sillas verdes disponibles que deseas</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-primary">3</span>
                </div>
                <div>
                  <p className="text-foreground font-medium text-sm">Completa tu compra</p>
                  <p className="text-foreground/60 text-xs">Revisa el detalle y continúa con el pago</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leyenda compacta */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs bg-background/50 p-3 rounded-xl">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-500"></div>
          <span className="text-foreground/70">Disponible</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-primary"></div>
          <span className="text-foreground/70">Tu selección</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-orange-500"></div>
          <span className="text-foreground/70">Reservado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-500"></div>
          <span className="text-foreground/70">Vendido</span>
        </div>
      </div>

      {/* Escenario */}
      <div className="text-center">
        <div className="inline-block px-16 py-4 bg-gradient-to-b from-foreground/20 to-foreground/5 rounded-t-3xl text-foreground/70 font-bold">
          🎭 ESCENARIO
        </div>
      </div>

      {/* Mapa por Categorías */}
      {Object.entries(mesasPorCategoria).map(([categoria, mesasCategoria]) => {
        const categoriaColor = getCategoriaColor(categoria);
        const precioCategoria = mesasCategoria[0]?.precio || precioBase;
        
        return (
          <div key={categoria} className="space-y-3">
            {/* Encabezado de Categoría */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: categoriaColor }}
                />
                <h3 className="text-lg font-bold text-foreground">{categoria}</h3>
              </div>
              <span className="text-sm font-bold" style={{ color: categoriaColor }}>
                ${precioCategoria}/silla
              </span>
            </div>

            {/* Grid de Mesas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {mesasCategoria.map((mesa, mesaIndex) => {
                const mesaId = mesa.id || (mesaIndex + 1).toString();
                const numSillas = mesa.sillas || 10;
                const mesaNombre = mesa.nombre || `Mesa ${mesaIndex + 1}`;
                const sillasDisponibles = contarSillasDisponibles(mesa);
                const sillasSeleccionadas = contarSillasSeleccionadasMesa(mesa);
                const estaExpandida = mesaExpandida === mesaNombre;
                
                return (
                  <motion.div
                    key={mesaId}
                    layout
                    className={`glass-card rounded-xl overflow-hidden transition-all ${
                      estaExpandida ? 'col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-5' : ''
                    }`}
                  >
                    {/* Cabecera de Mesa (clickeable) */}
                    <button
                      type="button"
                      onClick={() => setMesaExpandida(estaExpandida ? null : mesaNombre)}
                      className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ 
                            backgroundColor: categoriaColor + '20',
                            borderColor: categoriaColor
                          }}
                        >
                          <Table2 className="w-5 h-5" style={{ color: categoriaColor }} />
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-foreground">{mesaNombre}</p>
                          <p className="text-xs text-foreground/60">
                            {sillasDisponibles} disponibles de {numSillas}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {sillasSeleccionadas > 0 && (
                          <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-bold">
                            {sillasSeleccionadas} selec.
                          </span>
                        )}
                        {estaExpandida ? (
                          <ChevronUp className="w-5 h-5 text-foreground/50" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-foreground/50" />
                        )}
                      </div>
                    </button>

                    {/* Sillas expandidas */}
                    <AnimatePresence>
                      {estaExpandida && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-white/10"
                        >
                          <div className="p-4">
                            {/* Mostrar mensaje de venta completa si aplica */}
                            {mesa.ventaCompleta && (
                              <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-3 mb-4 text-center">
                                <p className="text-amber-400 font-medium text-sm">
                                  🎯 Esta mesa solo se vende completa ({numSillas} sillas)
                                </p>
                                <p className="text-foreground/60 text-xs mt-1">
                                  Precio total: ${(mesa.precio || precioBase) * numSillas}
                                </p>
                              </div>
                            )}
                            
                            <p className="text-sm text-foreground/60 mb-4 flex items-center gap-2">
                              <MousePointerClick className="w-4 h-4" />
                              {mesa.ventaCompleta 
                                ? 'Haz clic en cualquier silla para seleccionar la mesa completa'
                                : 'Haz clic en las sillas que deseas reservar'
                              }
                            </p>
                            
                            {/* Mesa en forma de U - Frente libre hacia el escenario */}
                            <div className="relative py-6">
                              {/* Indicador del frente (escenario) - SIN SILLAS */}
                              <div className="text-center mb-4">
                                <div className="inline-block px-8 py-2 bg-gradient-to-b from-foreground/10 to-transparent rounded-t-xl border-t border-l border-r border-foreground/20">
                                  <span className="text-xs text-foreground/50 uppercase tracking-wider">🎭 Frente al Escenario</span>
                                </div>
                              </div>
                              
                              {/* Contenedor de la mesa en U */}
                              <div className="flex flex-col items-center gap-2">
                                {/* Fila con sillas izquierda, mesa central y sillas derecha */}
                                <div className="flex items-center gap-3">
                                  {/* Sillas IZQUIERDA (1, 2, 3) */}
                                  <div className="flex flex-col gap-2">
                                    {[1, 2, 3].filter(n => n <= numSillas).map((sillaNum) => {
                                      const asientoId = `${mesaNombre}-Silla${sillaNum}`;
                                      const estado = getEstadoAsiento(asientoId);

                                      return (
                                        <motion.button
                                          key={sillaNum}
                                          type="button"
                                          disabled={estado === 'ocupado' || estado === 'pendiente'}
                                          onClick={() => mesa.ventaCompleta 
                                            ? toggleMesaCompleta(mesa, mesaNombre, numSillas)
                                            : toggleAsiento(asientoId, mesa.precio || precioBase)
                                          }
                                          whileHover={{ scale: estado === 'disponible' ? 1.1 : 1 }}
                                          whileTap={{ scale: 0.95 }}
                                          className={`w-10 h-10 rounded-lg transition-all duration-200 flex flex-col items-center justify-center text-white text-xs font-bold ${getColorAsiento(estado, categoriaColor)}`}
                                          style={{
                                            backgroundColor: estado === 'disponible' ? categoriaColor : undefined
                                          }}
                                          title={`Silla ${sillaNum} - $${mesa.precio || precioBase}`}
                                        >
                                          {estado === 'seleccionado' ? <Check className="w-4 h-4" /> : estado === 'ocupado' ? <X className="w-4 h-4" /> : sillaNum}
                                        </motion.button>
                                      );
                                    })}
                                  </div>

                                  {/* Mesa central */}
                                  <div 
                                    className="w-28 h-24 rounded-lg flex items-center justify-center border-2 border-dashed"
                                    style={{ 
                                      borderColor: categoriaColor + '60',
                                      backgroundColor: categoriaColor + '10'
                                    }}
                                  >
                                    <span className="text-sm font-bold" style={{ color: categoriaColor }}>
                                      {mesaNombre.replace('Mesa ', 'M')}
                                    </span>
                                  </div>

                                  {/* Sillas DERECHA (8, 9, 10) */}
                                  <div className="flex flex-col gap-2">
                                    {[8, 9, 10].filter(n => n <= numSillas).map((sillaNum) => {
                                      const asientoId = `${mesaNombre}-Silla${sillaNum}`;
                                      const estado = getEstadoAsiento(asientoId);

                                      return (
                                        <motion.button
                                          key={sillaNum}
                                          type="button"
                                          disabled={estado === 'ocupado' || estado === 'pendiente'}
                                          onClick={() => mesa.ventaCompleta 
                                            ? toggleMesaCompleta(mesa, mesaNombre, numSillas)
                                            : toggleAsiento(asientoId, mesa.precio || precioBase)
                                          }
                                          whileHover={{ scale: estado === 'disponible' ? 1.1 : 1 }}
                                          whileTap={{ scale: 0.95 }}
                                          className={`w-10 h-10 rounded-lg transition-all duration-200 flex flex-col items-center justify-center text-white text-xs font-bold ${getColorAsiento(estado, categoriaColor)}`}
                                          style={{
                                            backgroundColor: estado === 'disponible' ? categoriaColor : undefined
                                          }}
                                          title={`Silla ${sillaNum} - $${mesa.precio || precioBase}`}
                                        >
                                          {estado === 'seleccionado' ? <Check className="w-4 h-4" /> : estado === 'ocupado' ? <X className="w-4 h-4" /> : sillaNum}
                                        </motion.button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Sillas de ABAJO (4, 5, 6, 7) */}
                                <div className="flex gap-2 justify-center mt-1">
                                  {[4, 5, 6, 7].filter(n => n <= numSillas).map((sillaNum) => {
                                    const asientoId = `${mesaNombre}-Silla${sillaNum}`;
                                    const estado = getEstadoAsiento(asientoId);

                                    return (
                                      <motion.button
                                        key={sillaNum}
                                        type="button"
                                        disabled={estado === 'ocupado' || estado === 'pendiente'}
                                        onClick={() => mesa.ventaCompleta 
                                          ? toggleMesaCompleta(mesa, mesaNombre, numSillas)
                                          : toggleAsiento(asientoId, mesa.precio || precioBase)
                                        }
                                        whileHover={{ scale: estado === 'disponible' ? 1.1 : 1 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`w-10 h-10 rounded-lg transition-all duration-200 flex flex-col items-center justify-center text-white text-xs font-bold ${getColorAsiento(estado, categoriaColor)}`}
                                        style={{
                                          backgroundColor: estado === 'disponible' ? categoriaColor : undefined
                                        }}
                                        title={`Silla ${sillaNum} - $${mesa.precio || precioBase}`}
                                      >
                                        {estado === 'seleccionado' ? <Check className="w-4 h-4" /> : estado === 'ocupado' ? <X className="w-4 h-4" /> : sillaNum}
                                      </motion.button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            {/* Info de precio en la mesa expandida */}
                            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                              <span className="text-foreground/60 text-sm">
                                {mesa.ventaCompleta ? 'Precio mesa completa:' : 'Precio por silla:'}
                              </span>
                              <span className="font-bold text-lg" style={{ color: categoriaColor }}>
                                ${mesa.ventaCompleta 
                                  ? ((mesa.precio || precioBase) * numSillas).toFixed(2)
                                  : (mesa.precio || precioBase)
                                }
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Sección de Entradas Generales para eventos MIXTOS */}
      {datosAsientos?.tipo_asientos === 'mixto' && configuracion.categorias_generales && configuracion.categorias_generales.length > 0 && (
        <div className="mt-8 pt-8 border-t border-white/10">
          <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Ticket className="w-6 h-6 text-primary" />
            Entradas Generales (sin mesa asignada)
          </h3>
          
          <div className="space-y-4">
            {configuracion.categorias_generales.map((cat, idx) => {
              const cantidadSeleccionada = seleccionPorCategoria[cat.nombre] || 0;
              
              return (
                <div key={idx} className="glass-card p-6 rounded-2xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: (cat.color || '#10B981') + '20' }}
                    >
                      <Users className="w-5 h-5" style={{ color: cat.color || '#10B981' }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground">{cat.nombre}</h3>
                      <p className="text-sm text-foreground/60">Sin asiento asignado • {cat.capacidad} disponibles</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">${cat.precio || precioBase}</p>
                      <p className="text-xs text-foreground/50">por entrada</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <span className="text-foreground/70">Cantidad:</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => actualizarCantidadCategoria(cat.nombre, -1, cat.precio || precioBase)}
                        className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-xl font-bold hover:border-primary transition-colors"
                        disabled={cantidadSeleccionada <= 0}
                      >
                        -
                      </button>
                      <span className="text-2xl font-bold text-primary w-12 text-center">
                        {cantidadSeleccionada}
                      </span>
                      <button
                        type="button"
                        onClick={() => actualizarCantidadCategoria(cat.nombre, 1, cat.precio || precioBase)}
                        className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-xl font-bold hover:border-primary transition-colors"
                        disabled={cantidadSeleccionada >= (cat.capacidad || 10)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {cantidadSeleccionada > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10 flex justify-between">
                      <span className="text-foreground/70">Subtotal:</span>
                      <span className="font-bold text-primary">
                        ${((cat.precio || precioBase) * cantidadSeleccionada).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mensaje si no hay mesas expandidas y no hay selección */}
      {asientosSeleccionados.length === 0 && !mesaExpandida && Object.values(seleccionPorCategoria).every(v => v === 0) && (
        <div className="text-center py-6">
          <MousePointerClick className="w-8 h-8 text-foreground/30 mx-auto mb-2" />
          <p className="text-foreground/50">Haz clic en una mesa para ver las sillas disponibles o selecciona entradas generales</p>
        </div>
      )}

      {/* Resumen de selección con factura */}
      <AnimatePresence>
        {(asientosSeleccionados.length > 0 || Object.values(seleccionPorCategoria).some(v => v > 0)) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="glass-card p-6 rounded-2xl bg-primary/5 border border-primary/20 sticky bottom-4"
          >
            <h4 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-primary" />
              Tu selección
            </h4>
            
            {/* Lista de sillas seleccionadas */}
            {asientosSeleccionados.length > 0 && (
              <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
                {asientosSeleccionados.map(asiento => {
                  const parts = asiento.split('-');
                  const mesaNombre = parts[0];
                  const sillaNombre = parts[1];
                  const mesa = mesas.find(m => m.nombre === mesaNombre);
                  const precio = mesa?.precio || precioBase;
                  
                  return (
                    <div key={asiento} className="flex justify-between items-center py-2 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <Table2 className="w-4 h-4 text-foreground/50" />
                        <span className="text-foreground">{mesaNombre}</span>
                        <ArrowRight className="w-3 h-3 text-foreground/30" />
                        <span className="text-foreground/70">{sillaNombre}</span>
                      </div>
                      <span className="font-bold text-primary">${precio.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Lista de entradas generales seleccionadas */}
            {Object.entries(seleccionPorCategoria).filter(([_, cant]) => cant > 0).map(([nombre, cantidad]) => {
              const cat = configuracion.categorias_generales?.find(c => c.nombre === nombre);
              const precio = cat?.precio || precioBase;
              return (
                <div key={nombre} className="flex justify-between items-center py-2 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-foreground/50" />
                    <span className="text-foreground">{nombre}</span>
                    <span className="text-foreground/50">x{cantidad}</span>
                  </div>
                  <span className="font-bold text-primary">${(precio * cantidad).toFixed(2)}</span>
                </div>
              );
            })}
            
            {/* Total */}
            <div className="flex justify-between items-center pt-4 border-t border-white/20">
              <span className="text-lg font-bold text-foreground">TOTAL:</span>
              <span className="text-2xl font-black text-primary">
                ${(
                  calcularDetallesSeleccion().reduce((sum, d) => sum + (d.precioUnitario * d.cantidad), 0) +
                  calcularTotalGeneral()
                ).toFixed(2)}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SelectorAsientos;
