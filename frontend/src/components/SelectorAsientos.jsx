import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Check, X, Users, Table2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SelectorAsientos = ({ eventoId, precioBase = 0, onSeleccionChange, maxSeleccion = 10 }) => {
  const [loading, setLoading] = useState(true);
  const [datosAsientos, setDatosAsientos] = useState(null);
  const [asientosSeleccionados, setAsientosSeleccionados] = useState([]);
  const [cantidadGeneral, setCantidadGeneral] = useState(1);
  const [categoriasMesas, setCategoriasMesas] = useState([]);

  useEffect(() => {
    cargarAsientos();
    cargarCategoriasMesas();
  }, [eventoId]);

  useEffect(() => {
    // Notificar cambios de selección con precios
    if (datosAsientos?.tipo_asientos === 'general') {
      onSeleccionChange?.({
        tipo: 'general',
        cantidad: cantidadGeneral,
        asientos: [],
        total: cantidadGeneral,
        precioTotal: precioBase * cantidadGeneral,
        detalles: [{ tipo: 'General', cantidad: cantidadGeneral, precioUnitario: precioBase }]
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
  }, [asientosSeleccionados, cantidadGeneral, datosAsientos]);

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
    
    asientosSeleccionados.forEach(asientoId => {
      // Extraer mesa del asiento (formato: Mesa1-Silla1)
      const parts = asientoId.split('-');
      if (parts.length >= 2) {
        const mesaNombre = parts[0];
        const mesa = datosAsientos.configuracion.mesas.find(m => 
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
      default: return `cursor-pointer hover:opacity-80`;
    }
  };

  const getCategoriaColor = (categoriaNombre) => {
    const cat = categoriasMesas.find(c => c.nombre === categoriaNombre);
    return cat?.color || '#10B981';
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

  // Modo Mesas - Organizado por categorías
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
      {/* Leyenda */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500"></div>
          <span className="text-foreground/70">Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary"></div>
          <span className="text-foreground/70">Seleccionado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-orange-500"></div>
          <span className="text-foreground/70">Pendiente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500"></div>
          <span className="text-foreground/70">Ocupado</span>
        </div>
      </div>

      {/* Escenario */}
      <div className="text-center">
        <div className="inline-block px-12 py-3 bg-foreground/10 rounded-lg text-foreground/70">
          🎭 ESCENARIO
        </div>
      </div>

      {/* Mapa por Categorías - EN LÍNEA HORIZONTAL */}
      {Object.entries(mesasPorCategoria).map(([categoria, mesasCategoria]) => {
        const categoriaColor = getCategoriaColor(categoria);
        const precioCategoria = mesasCategoria[0]?.precio || precioBase;
        
        return (
          <div key={categoria} className="glass-card p-6 rounded-2xl">
            {/* Encabezado de Categoría */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: categoriaColor }}
                />
                <h3 className="text-xl font-bold text-foreground">{categoria}</h3>
                <span className="text-sm text-foreground/50">
                  ({mesasCategoria.reduce((sum, m) => sum + (m.sillas || 10), 0)} sillas)
                </span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold" style={{ color: categoriaColor }}>
                  ${precioCategoria}
                </p>
                <p className="text-xs text-foreground/50">por silla</p>
              </div>
            </div>

            {/* Mesas en LÍNEA HORIZONTAL con scroll */}
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-8 min-w-max px-4">
                {mesasCategoria.map((mesa, mesaIndex) => {
                  const mesaId = mesa.id || (mesaIndex + 1).toString();
                  const numSillas = mesa.sillas || 10;
                  const mesaNombre = mesa.nombre || `Mesa ${mesaIndex + 1}`;
                  
                  return (
                    <div key={mesaId} className="flex flex-col items-center">
                      {/* Nombre de la mesa */}
                      <div className="text-center mb-3">
                        <span className="font-bold text-foreground text-sm">
                          {mesaNombre}
                        </span>
                      </div>

                      {/* Mesa con sillas en línea */}
                      <div className="flex items-center gap-1">
                        {/* Sillas lado izquierdo */}
                        <div className="flex flex-col gap-1">
                          {Array.from({ length: Math.ceil(numSillas / 2) }).map((_, idx) => {
                            const sillaNum = idx + 1;
                            const asientoId = `${mesaNombre}-Silla${sillaNum}`;
                            const estado = getEstadoAsiento(asientoId);

                            return (
                              <button
                                key={sillaNum}
                                type="button"
                                disabled={estado === 'ocupado' || estado === 'pendiente'}
                                onClick={() => toggleAsiento(asientoId, mesa.precio || precioBase)}
                                className={`w-8 h-8 rounded transition-all duration-200 flex items-center justify-center text-xs font-bold text-white ${getColorAsiento(estado, categoriaColor)}`}
                                style={{
                                  backgroundColor: estado === 'disponible' ? categoriaColor : undefined
                                }}
                                title={`Silla ${sillaNum} - $${mesa.precio || precioBase}`}
                              >
                                {estado === 'seleccionado' ? (
                                  <Check className="w-4 h-4" />
                                ) : estado === 'ocupado' ? (
                                  <X className="w-4 h-4" />
                                ) : (
                                  sillaNum
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Mesa central */}
                        <div 
                          className="w-10 h-16 rounded flex items-center justify-center border-2"
                          style={{ 
                            backgroundColor: categoriaColor + '20',
                            borderColor: categoriaColor + '40'
                          }}
                        >
                          <Table2 className="w-4 h-4" style={{ color: categoriaColor }} />
                        </div>

                        {/* Sillas lado derecho */}
                        <div className="flex flex-col gap-1">
                          {Array.from({ length: Math.floor(numSillas / 2) }).map((_, idx) => {
                            const sillaNum = Math.ceil(numSillas / 2) + idx + 1;
                            const asientoId = `${mesaNombre}-Silla${sillaNum}`;
                            const estado = getEstadoAsiento(asientoId);

                            return (
                              <button
                                key={sillaNum}
                                type="button"
                                disabled={estado === 'ocupado' || estado === 'pendiente'}
                                onClick={() => toggleAsiento(asientoId, mesa.precio || precioBase)}
                                className={`w-8 h-8 rounded transition-all duration-200 flex items-center justify-center text-xs font-bold text-white ${getColorAsiento(estado, categoriaColor)}`}
                                style={{
                                  backgroundColor: estado === 'disponible' ? categoriaColor : undefined
                                }}
                                title={`Silla ${sillaNum} - $${mesa.precio || precioBase}`}
                              >
                                {estado === 'seleccionado' ? (
                                  <Check className="w-4 h-4" />
                                ) : estado === 'ocupado' ? (
                                  <X className="w-4 h-4" />
                                ) : (
                                  sillaNum
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Precio debajo de la mesa */}
                      <p className="text-xs text-foreground/50 mt-2">${mesa.precio || precioBase}/silla</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}

      {/* Resumen de selección con factura */}
      {asientosSeleccionados.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-6 rounded-2xl bg-primary/5 border border-primary/20"
        >
          <h4 className="font-bold text-foreground mb-4">📋 Detalle de tu compra</h4>
          
          {/* Lista de asientos seleccionados */}
          <div className="space-y-2 mb-4">
            {asientosSeleccionados.map(asiento => {
              const parts = asiento.split('-');
              const mesaNombre = parts[0];
              const sillaNombre = parts[1];
              const mesa = mesas.find(m => m.nombre === mesaNombre);
              const precio = mesa?.precio || precioBase;
              
              return (
                <div key={asiento} className="flex justify-between items-center py-2 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground">{mesaNombre}</span>
                    <span className="text-foreground/50">•</span>
                    <span className="text-foreground/70">{sillaNombre}</span>
                  </div>
                  <span className="font-bold text-primary">${precio.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
          
          {/* Total */}
          <div className="flex justify-between items-center pt-4 border-t border-white/20">
            <span className="text-lg font-bold text-foreground">Total ({asientosSeleccionados.length} sillas):</span>
            <span className="text-2xl font-black text-primary">
              ${calcularDetallesSeleccion().reduce((sum, d) => sum + (d.precioUnitario * d.cantidad), 0).toFixed(2)}
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SelectorAsientos;
