import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Users, Table2, Ticket, Save, Settings } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ConfiguradorAsientos = ({ eventoId, configuracionInicial, onConfiguracionChange }) => {
  const [tipoAsientos, setTipoAsientos] = useState(configuracionInicial?.tipo || 'general');
  const [capacidadGeneral, setCapacidadGeneral] = useState(configuracionInicial?.capacidad || 100);
  const [mesas, setMesas] = useState(configuracionInicial?.mesas || []);
  const [entradasGeneralesMixto, setEntradasGeneralesMixto] = useState(configuracionInicial?.entradas_generales || 0);
  const [categoriasMesas, setCategoriasMesas] = useState([]);
  const [mostrarGestionCategorias, setMostrarGestionCategorias] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState({ nombre: '', color: '#10B981' });
  // Categorías de entradas generales
  const [categoriasGenerales, setCategoriasGenerales] = useState(configuracionInicial?.categorias_generales || [
    { nombre: 'General', precio: 0, capacidad: 100, color: '#10B981' }
  ]);
  const [nuevaCategoriaGeneral, setNuevaCategoriaGeneral] = useState({ nombre: '', precio: 0, capacidad: 100, color: '#10B981' });

  useEffect(() => {
    cargarCategoriasMesas();
  }, []);

  const cargarCategoriasMesas = async () => {
    try {
      const response = await axios.get(`${API}/categorias-mesas`);
      setCategoriasMesas(response.data);
    } catch (error) {
      console.error('Error cargando categorías de mesas:', error);
      // Usar categorías por defecto si falla
      setCategoriasMesas([
        { id: '1', nombre: 'General', color: '#10B981' },
        { id: '2', nombre: 'VIP', color: '#F59E0B' },
        { id: '3', nombre: 'Premium', color: '#8B5CF6' }
      ]);
    }
  };

  const agregarCategoriaMesa = async () => {
    if (!nuevaCategoria.nombre.trim()) return;
    
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.post(`${API}/admin/categorias-mesas`, nuevaCategoria, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategoriasMesas([...categoriasMesas, response.data]);
      setNuevaCategoria({ nombre: '', color: '#10B981' });
    } catch (error) {
      console.error('Error creando categoría:', error);
    }
  };

  const eliminarCategoriaMesa = async (categoriaId) => {
    try {
      const token = localStorage.getItem('admin_token');
      await axios.delete(`${API}/admin/categorias-mesas/${categoriaId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategoriasMesas(categoriasMesas.filter(c => c.id !== categoriaId));
    } catch (error) {
      console.error('Error eliminando categoría:', error);
    }
  };

  const generarConfiguracion = () => {
    if (tipoAsientos === 'general') {
      return { 
        capacidad: capacidadGeneral,
        categorias_generales: categoriasGenerales 
      };
    } else if (tipoAsientos === 'mesas') {
      return { 
        mesas,
        categorias_generales: categoriasGenerales 
      };
    } else if (tipoAsientos === 'mixto') {
      return { 
        mesas, 
        entradas_generales: entradasGeneralesMixto,
        categorias_generales: categoriasGenerales 
      };
    }
    return {};
  };

  // Funciones para zonas generales
  const agregarCategoriaGeneral = () => {
    if (!nuevaCategoriaGeneral.nombre.trim()) return;
    setCategoriasGenerales([...categoriasGenerales, { 
      ...nuevaCategoriaGeneral, 
      id: Date.now().toString() 
    }]);
    setNuevaCategoriaGeneral({ nombre: '', precio: 0, capacidad: 100, color: '#10B981' });
  };

  const actualizarCategoriaGeneral = (index, campo, valor) => {
    const nuevas = [...categoriasGenerales];
    nuevas[index] = { ...nuevas[index], [campo]: valor };
    setCategoriasGenerales(nuevas);
  };

  const eliminarCategoriaGeneral = (index) => {
    setCategoriasGenerales(categoriasGenerales.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const config = generarConfiguracion();
    onConfiguracionChange?.(tipoAsientos, config);
  }, [tipoAsientos, capacidadGeneral, mesas, entradasGeneralesMixto, onConfiguracionChange]);

  const agregarMesa = () => {
    const nuevaMesa = {
      id: Date.now().toString(),
      nombre: `Mesa ${mesas.length + 1}`,
      sillas: 10,
      precio: 0,
      categoria: categoriasMesas.length > 0 ? categoriasMesas[0].nombre : 'General'
    };
    setMesas([...mesas, nuevaMesa]);
  };

  const duplicarMesa = (index) => {
    const mesaOriginal = mesas[index];
    const nuevaMesa = {
      ...mesaOriginal,
      id: Date.now().toString(),
      nombre: `${mesaOriginal.nombre} (copia)`
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

  const getCategoriaColor = (categoriaNombre) => {
    const cat = categoriasMesas.find(c => c.nombre === categoriaNombre);
    return cat?.color || '#10B981';
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
                        {categoriasMesas.map(cat => (
                          <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
                        ))}
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

          {/* Botones de acciones */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={agregarMesa}
              className="flex-1 py-3 border-2 border-dashed border-white/20 rounded-xl text-foreground/70 hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Agregar Mesa
            </button>
            
            <button
              type="button"
              onClick={() => setMostrarGestionCategorias(!mostrarGestionCategorias)}
              className="px-4 py-3 glass-card rounded-xl text-foreground/70 hover:border-primary hover:text-primary transition-all flex items-center gap-2"
            >
              <Settings className="w-5 h-5" />
              Categorías
            </button>
          </div>

          {/* Panel de gestión de categorías */}
          {mostrarGestionCategorias && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="glass-card p-6 rounded-xl border border-primary/30"
            >
              <h4 className="font-bold text-foreground mb-4">Gestionar Categorías de Mesas</h4>
              
              {/* Lista de categorías existentes */}
              <div className="space-y-2 mb-4">
                {categoriasMesas.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between p-2 rounded-lg bg-background/30">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-foreground">{cat.nombre}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => eliminarCategoriaMesa(cat.id)}
                      className="p-1 rounded hover:bg-accent/20 text-accent transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Formulario para nueva categoría */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nuevaCategoria.nombre}
                  onChange={(e) => setNuevaCategoria({...nuevaCategoria, nombre: e.target.value})}
                  placeholder="Nombre de categoría"
                  className="flex-1 bg-background/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                />
                <input
                  type="color"
                  value={nuevaCategoria.color}
                  onChange={(e) => setNuevaCategoria({...nuevaCategoria, color: e.target.value})}
                  className="w-10 h-10 rounded-lg cursor-pointer"
                />
                <button
                  type="button"
                  onClick={agregarCategoriaMesa}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/80 transition-colors"
                >
                  Agregar
                </button>
              </div>
            </motion.div>
          )}

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
