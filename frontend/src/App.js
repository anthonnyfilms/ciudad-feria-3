import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Eventos from './pages/Eventos';
import DetalleEvento from './pages/DetalleEvento';
import MisEntradas from './pages/MisEntradas';
import ValidarEntrada from './pages/ValidarEntrada';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminEventos from './pages/admin/AdminEventos';
import AdminCategorias from './pages/admin/AdminCategorias';
import AdminCompras from './pages/admin/AdminCompras';
import AdminMetodosPago from './pages/admin/AdminMetodosPago';
import AdminConfiguracion from './pages/admin/AdminConfiguracion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

function App() {
  return (
    <div className="App min-h-screen bg-background">
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<><Navbar /><Home /><Footer /></>} />
          <Route path="/eventos" element={<><Navbar /><Eventos /><Footer /></>} />
          <Route path="/evento/:id" element={<><Navbar /><DetalleEvento /><Footer /></>} />
          <Route path="/mis-entradas" element={<><Navbar /><MisEntradas /><Footer /></>} />
          <Route path="/validar" element={<><Navbar /><ValidarEntrada /><Footer /></>} />
          
          {/* Admin Routes */}
          <Route path="/secure-admin-panel-2026" element={<AdminLogin />} />
          <Route path="/admin/*" element={
            <PrivateRoute>
              <Routes>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="eventos" element={<AdminEventos />} />
                <Route path="categorias" element={<AdminCategorias />} />
                <Route path="compras" element={<AdminCompras />} />
                <Route path="metodos-pago" element={<AdminMetodosPago />} />
                <Route path="configuracion" element={<AdminConfiguracion />} />
              </Routes>
            </PrivateRoute>
          } />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;