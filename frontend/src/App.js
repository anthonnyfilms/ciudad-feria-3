import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Eventos from './pages/Eventos';
import DetalleEvento from './pages/DetalleEvento';
import MisEntradas from './pages/MisEntradas';
import ValidarEntrada from './pages/ValidarEntrada';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import './App.css';

function App() {
  return (
    <div className="App min-h-screen bg-background">
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/eventos" element={<Eventos />} />
          <Route path="/evento/:id" element={<DetalleEvento />} />
          <Route path="/mis-entradas" element={<MisEntradas />} />
          <Route path="/validar" element={<ValidarEntrada />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </div>
  );
}

export default App;