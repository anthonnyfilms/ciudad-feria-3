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

  // Modo General
  if (datosAsientos?.tipo_asientos === 'general') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Entrada General</h3>
              <p className="text-sm text-foreground/60">Sin asiento asignado</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-2xl font-bold text-primary">${precioBase}</p>
              <p className="text-xs text-foreground/50">por entrada</p>
            </div>
          </div>

          <div className="flex items-center justify-between mt-6">
            <span className="text-foreground/70">Cantidad:</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCantidadGeneral(Math.max(1, cantidadGeneral - 1))}
                className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-xl font-bold hover:border-primary transition-colors"
              >
                -
              </button>
              <span className="text-2xl font-bold text-primary w-12 text-center">{cantidadGeneral}</span>
              <button
                type="button"
                onClick={() => setCantidadGeneral(Math.min(maxSeleccion, cantidadGeneral + 1))}
                className="w-10 h-10 rounded-full glass-card flex items-center justify-center text-xl font-bold hover:border-primary transition-colors"
              >
                +
              </button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex justify-between items-center">
              <span className="text-foreground/70">Total:</span>
              <span className="text-2xl font-bold text-primary">${(precioBase * cantidadGeneral).toFixed(2)}</span>
            </div>
          </div>
        </div>

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

      {/* Mapa por Categorías */}
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

            {/* Mesas de esta categoría */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {mesasCategoria.map((mesa, mesaIndex) => {
                const mesaId = mesa.id || (mesaIndex + 1).toString();
                const numSillas = mesa.sillas || 10;
                const mesaNombre = mesa.nombre || `Mesa ${mesaIndex + 1}`;
                
                return (
                  <div key={mesaId} className="relative">
                    {/* Nombre de la mesa */}
                    <div className="text-center mb-3">
                      <span className="font-bold text-foreground">
                        {mesaNombre}
                      </span>
                    </div>

                    {/* Mesa con sillas */}
                    <div className="relative flex items-center justify-center" style={{ height: '140px' }}>
                      {/* Mesa central */}
                      <div 
                        className="w-14 h-14 rounded-full flex items-center justify-center z-10 border-2"
                        style={{ 
                          backgroundColor: categoriaColor + '20',
                          borderColor: categoriaColor + '40'
                        }}
                      >
                        <Table2 className="w-5 h-5" style={{ color: categoriaColor }} />
                      </div>

                      {/* Sillas alrededor */}
                      {Array.from({ length: numSillas }).map((_, sillaIndex) => {
                        const sillaNum = sillaIndex + 1;
                        const asientoId = `${mesaNombre}-Silla${sillaNum}`;
                        const estado = getEstadoAsiento(asientoId);
                        const angulo = (360 / numSillas) * sillaIndex - 90;
                        const radio = 50;
                        const x = Math.cos((angulo * Math.PI) / 180) * radio;
                        const y = Math.sin((angulo * Math.PI) / 180) * radio;

                        return (
                          <button
                            key={sillaIndex}
                            type="button"
                            disabled={estado === 'ocupado' || estado === 'pendiente'}
                            onClick={() => toggleAsiento(asientoId, mesa.precio || precioBase)}
                            className={`absolute w-8 h-8 rounded-full transition-all duration-200 flex items-center justify-center text-xs font-bold text-white shadow-md ${getColorAsiento(estado, categoriaColor)}`}
                            style={{
                              transform: `translate(${x}px, ${y}px)`,
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
                );
              })}
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
