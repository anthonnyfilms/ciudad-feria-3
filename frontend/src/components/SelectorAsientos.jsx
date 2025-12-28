import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Check, X, Users, Table2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SelectorAsientos = ({ eventoId, onSeleccionChange, maxSeleccion = 10 }) => {
  const [loading, setLoading] = useState(true);
  const [datosAsientos, setDatosAsientos] = useState(null);
  const [asientosSeleccionados, setAsientosSeleccionados] = useState([]);
  const [cantidadGeneral, setCantidadGeneral] = useState(1);

  useEffect(() => {
    cargarAsientos();
  }, [eventoId]);

  useEffect(() => {
    // Notificar cambios de selección
    if (datosAsientos?.tipo_asientos === 'general') {
      onSeleccionChange?.({
        tipo: 'general',
        cantidad: cantidadGeneral,
        asientos: [],
        total: cantidadGeneral
      });
    } else {
      onSeleccionChange?.({
        tipo: datosAsientos?.tipo_asientos || 'mesas',
        cantidad: asientosSeleccionados.length,
        asientos: asientosSeleccionados,
        total: asientosSeleccionados.length
      });
    }
  }, [asientosSeleccionados, cantidadGeneral, datosAsientos]);

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

  const toggleAsiento = (asientoId) => {
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

  const getColorAsiento = (estado) => {
    switch (estado) {
      case 'ocupado': return 'bg-red-500/80 cursor-not-allowed';
      case 'pendiente': return 'bg-orange-500/80 cursor-not-allowed';
      case 'seleccionado': return 'bg-primary cursor-pointer ring-2 ring-primary ring-offset-2 ring-offset-background';
      default: return 'bg-green-500/80 hover:bg-green-400 cursor-pointer';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-primary"></div>
      </div>
    );
  }

  // Modo General - Solo selector de cantidad
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
          </div>

          <div className="flex items-center justify-between">
            <span className="text-foreground/70">Cantidad de entradas:</span>
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
        </div>

        <div className="text-center text-foreground/50 text-sm">
          Disponibles: {datosAsientos.disponibles} de {datosAsientos.capacidad_total}
        </div>
      </motion.div>
    );
  }

  // Modo Mesas - Visualización del mapa
  const configuracion = datosAsientos?.configuracion || {};
  const mesas = configuracion.mesas || [];

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

      {/* Mapa de mesas */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="mb-4 text-center">
          <div className="inline-block px-8 py-2 bg-foreground/10 rounded-lg text-foreground/70 text-sm">
            🎭 ESCENARIO
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {mesas.map((mesa, mesaIndex) => {
            const mesaId = mesa.id || (mesaIndex + 1).toString();
            const numSillas = mesa.sillas || 10;
            
            return (
              <div key={mesaId} className="relative">
                {/* Nombre de la mesa */}
                <div className="text-center mb-2">
                  <span className="text-sm font-medium text-foreground/70">
                    {mesa.nombre || `Mesa ${mesaIndex + 1}`}
                  </span>
                  {mesa.categoria && mesa.categoria !== 'General' && (
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                      mesa.categoria === 'VIP' ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'
                    }`}>
                      {mesa.categoria}
                    </span>
                  )}
                </div>

                {/* Mesa con sillas */}
                <div className="relative flex items-center justify-center">
                  {/* Mesa central */}
                  <div className="w-16 h-16 rounded-full bg-foreground/20 border-2 border-foreground/30 flex items-center justify-center z-10">
                    <Table2 className="w-6 h-6 text-foreground/40" />
                  </div>

                  {/* Sillas alrededor */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {Array.from({ length: numSillas }).map((_, sillaIndex) => {
                      const asientoId = `M${mesaId}-S${sillaIndex + 1}`;
                      const estado = getEstadoAsiento(asientoId);
                      const angulo = (360 / numSillas) * sillaIndex - 90;
                      const radio = 44;
                      const x = Math.cos((angulo * Math.PI) / 180) * radio;
                      const y = Math.sin((angulo * Math.PI) / 180) * radio;

                      return (
                        <button
                          key={sillaIndex}
                          type="button"
                          disabled={estado === 'ocupado' || estado === 'pendiente'}
                          onClick={() => toggleAsiento(asientoId)}
                          className={`absolute w-7 h-7 rounded-full transition-all duration-200 flex items-center justify-center text-xs font-bold text-white ${getColorAsiento(estado)}`}
                          style={{
                            transform: `translate(${x}px, ${y}px)`
                          }}
                          title={`Silla ${sillaIndex + 1} - ${estado}`}
                        >
                          {estado === 'seleccionado' ? (
                            <Check className="w-4 h-4" />
                          ) : estado === 'ocupado' ? (
                            <X className="w-4 h-4" />
                          ) : (
                            sillaIndex + 1
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Precio */}
                {mesa.precio > 0 && (
                  <div className="text-center mt-2 text-xs text-foreground/50">
                    ${mesa.precio.toFixed(2)} c/u
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Entradas generales adicionales (modo mixto) */}
      {datosAsientos?.tipo_asientos === 'mixto' && configuracion.entradas_generales > 0 && (
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Entrada General</h3>
              <p className="text-sm text-foreground/60">
                {configuracion.entradas_generales} disponibles - Sin asiento fijo
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => {
              if (!asientosSeleccionados.includes('GENERAL')) {
                setAsientosSeleccionados([...asientosSeleccionados, 'GENERAL']);
              }
            }}
            className={`w-full py-3 rounded-xl transition-all ${
              asientosSeleccionados.includes('GENERAL')
                ? 'bg-primary text-primary-foreground'
                : 'glass-card hover:border-primary'
            }`}
          >
            {asientosSeleccionados.includes('GENERAL') ? '✓ Seleccionada' : 'Agregar entrada general'}
          </button>
        </div>
      )}

      {/* Resumen de selección */}
      {asientosSeleccionados.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-4 rounded-xl bg-primary/5 border border-primary/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-foreground/70">Asientos seleccionados:</span>
            <span className="font-bold text-primary">{asientosSeleccionados.length}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {asientosSeleccionados.map(asiento => (
              <span
                key={asiento}
                className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full"
              >
                {asiento === 'GENERAL' ? 'General' : asiento}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SelectorAsientos;
