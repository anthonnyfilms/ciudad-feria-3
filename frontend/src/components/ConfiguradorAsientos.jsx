import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Users, Table2, Ticket, Save } from 'lucide-react';

const ConfiguradorAsientos = ({ eventoId, configuracionInicial, onConfiguracionChange }) => {
  const [tipoAsientos, setTipoAsientos] = useState(configuracionInicial?.tipo || 'general');
  const [capacidadGeneral, setCapacidadGeneral] = useState(configuracionInicial?.capacidad || 100);
  const [mesas, setMesas] = useState(configuracionInicial?.mesas || []);
  const [entradasGeneralesMixto, setEntradasGeneralesMixto] = useState(configuracionInicial?.entradas_generales || 0);

  useEffect(() => {
    // Emitir cambios cuando se actualice la configuración
    const config = generarConfiguracion();
    onConfiguracionChange?.(tipoAsientos, config);
  }, [tipoAsientos, capacidadGeneral, mesas, entradasGeneralesMixto]);

  const generarConfiguracion = () => {
    if (tipoAsientos === 'general') {
      return { capacidad: capacidadGeneral };
    } else if (tipoAsientos === 'mesas') {
      return { mesas };
    } else if (tipoAsientos === 'mixto') {
      return { mesas, entradas_generales: entradasGeneralesMixto };
    }
    return {};
  };

  const agregarMesa = () => {
    const nuevaMesa = {
      id: Date.now().toString(),
      nombre: `Mesa ${mesas.length + 1}`,
      sillas: 10,
      precio: 0,
      categoria: 'General'
    };
    setMesas([...mesas, nuevaMesa]);
  };

  const actualizarMesa = (index, campo, valor) => {
    const nuevasMesas = [...mesas];
    nuevasMesas[index] = { ...nuevasMesas[index], [campo]: valor };
    setMesas(nuevasMesas);
  };

  const eliminarMesa = (index) => {
    setMesas(mesas.filter((_, i) => i !== index));
  };

  const calcularCapacidadTotal = () => {
    if (tipoAsientos === 'general') {
      return capacidadGeneral;
    } else if (tipoAsientos === 'mesas') {
      return mesas.reduce((acc, mesa) => acc + mesa.sillas, 0);
    } else if (tipoAsientos === 'mixto') {
      return mesas.reduce((acc, mesa) => acc + mesa.sillas, 0) + entradasGeneralesMixto;
    }
    return 0;
  };

  return (
    <div className="space-y-6">
      {/* Selector de tipo */}
      <div>
        <label className="block text-sm font-medium text-foreground/70 mb-3">
          Tipo de Asientos
        </label>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setTipoAsientos('general')}
            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
              tipoAsientos === 'general'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-white/10 hover:border-white/30 text-foreground/70'
            }`}
          >
            <Ticket className="w-6 h-6" />
            <span className="font-medium">General</span>
            <span className="text-xs opacity-70">Sin asiento fijo</span>
          </button>

          <button
            type="button"
            onClick={() => setTipoAsientos('mesas')}
            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
              tipoAsientos === 'mesas'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-white/10 hover:border-white/30 text-foreground/70'
            }`}
          >
            <Table2 className="w-6 h-6" />
            <span className="font-medium">Mesas</span>
            <span className="text-xs opacity-70">Sillas por mesa</span>
          </button>

          <button
            type="button"
            onClick={() => setTipoAsientos('mixto')}
            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
              tipoAsientos === 'mixto'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-white/10 hover:border-white/30 text-foreground/70'
            }`}
          >
            <Users className="w-6 h-6" />
            <span className="font-medium">Mixto</span>
            <span className="text-xs opacity-70">Mesas + General</span>
          </button>
        </div>
      </div>

      {/* Configuración según tipo */}
      {tipoAsientos === 'general' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 rounded-xl"
        >
          <label className="block text-sm font-medium text-foreground/70 mb-2">
            Capacidad Total de Entradas
          </label>
          <input
            type="number"
            value={capacidadGeneral}
            onChange={(e) => setCapacidadGeneral(parseInt(e.target.value) || 0)}
            min="1"
            className="w-full bg-background/50 border border-white/10 rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary"
            placeholder="Ej: 200"
          />
          <p className="text-xs text-foreground/50 mt-2">
            Los usuarios podrán comprar entradas sin seleccionar asiento específico
          </p>
        </motion.div>
      )}

      {(tipoAsientos === 'mesas' || tipoAsientos === 'mixto') && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Lista de mesas */}
          <div className="space-y-3">
            {mesas.map((mesa, index) => (
              <div key={mesa.id} className="glass-card p-4 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Table2 className="w-6 h-6 text-primary" />
                  </div>
                  
                  <div className="flex-1 grid grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs text-foreground/50">Nombre</label>
                      <input
                        type="text"
                        value={mesa.nombre}
                        onChange={(e) => actualizarMesa(index, 'nombre', e.target.value)}
                        className="w-full bg-background/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs text-foreground/50">Sillas</label>
                      <input
                        type="number"
                        value={mesa.sillas}
                        onChange={(e) => actualizarMesa(index, 'sillas', parseInt(e.target.value) || 1)}
                        min="1"
                        max="20"
                        className="w-full bg-background/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs text-foreground/50">Precio por silla</label>
                      <input
                        type="number"
                        value={mesa.precio}
                        onChange={(e) => actualizarMesa(index, 'precio', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        className="w-full bg-background/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs text-foreground/50">Categoría</label>
                      <select
                        value={mesa.categoria}
                        onChange={(e) => actualizarMesa(index, 'categoria', e.target.value)}
                        className="w-full bg-background/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                      >
                        <option value="General">General</option>
                        <option value="VIP">VIP</option>
                        <option value="Premium">Premium</option>
                      </select>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => eliminarMesa(index)}
                    className="p-2 rounded-lg hover:bg-accent/20 text-accent transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Botón agregar mesa */}
          <button
            type="button"
            onClick={agregarMesa}
            className="w-full py-3 border-2 border-dashed border-white/20 rounded-xl text-foreground/70 hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Agregar Mesa
          </button>

          {/* Entradas generales (solo mixto) */}
          {tipoAsientos === 'mixto' && (
            <div className="glass-card p-6 rounded-xl">
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Entradas Generales Adicionales
              </label>
              <input
                type="number"
                value={entradasGeneralesMixto}
                onChange={(e) => setEntradasGeneralesMixto(parseInt(e.target.value) || 0)}
                min="0"
                className="w-full bg-background/50 border border-white/10 rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary"
                placeholder="Ej: 100"
              />
              <p className="text-xs text-foreground/50 mt-2">
                Entradas sin asiento asignado, adicionales a las mesas
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Resumen de capacidad */}
      <div className="glass-card p-4 rounded-xl bg-primary/5 border border-primary/20">
        <div className="flex items-center justify-between">
          <span className="text-foreground/70">Capacidad Total:</span>
          <span className="text-2xl font-bold text-primary">{calcularCapacidadTotal()} lugares</span>
        </div>
        {tipoAsientos !== 'general' && mesas.length > 0 && (
          <div className="mt-2 text-sm text-foreground/50">
            {mesas.length} mesa(s) · {mesas.reduce((acc, m) => acc + m.sillas, 0)} sillas
            {tipoAsientos === 'mixto' && entradasGeneralesMixto > 0 && (
              <> + {entradasGeneralesMixto} generales</>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfiguradorAsientos;
