import { motion } from 'framer-motion';
import { Facebook, Instagram, Twitter, Youtube, Music2, MessageCircle } from 'lucide-react';

const Footer = () => {
  const socialLinks = [
    { icon: Facebook, label: 'Facebook', url: 'https://facebook.com', color: '#1877F2' },
    { icon: Instagram, label: 'Instagram', url: 'https://instagram.com', color: '#E4405F' },
    { icon: Twitter, label: 'Twitter', url: 'https://twitter.com', color: '#1DA1F2' },
    { icon: Youtube, label: 'YouTube', url: 'https://youtube.com', color: '#FF0000' },
    { icon: Music2, label: 'TikTok', url: 'https://tiktok.com', color: '#000000' },
    { icon: MessageCircle, label: 'WhatsApp', url: 'https://wa.me/584120000000', color: '#25D366' },
  ];

  return (
    <footer className="glass-card border-t border-white/10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Branding */}
          <div>
            <h3 className="text-2xl font-heading font-black text-primary mb-4 glow-text">
              Ciudad Feria
            </h3>
            <p className="text-foreground/70 mb-4">
              Feria de San Sebastián 2026<br />
              San Cristóbal, Táchira, Venezuela
            </p>
            <p className="text-sm text-foreground/50">
              Sistema de entradas digitales con códigos QR seguros e incopiables.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-heading font-bold text-foreground mb-4">
              Enlaces Rápidos
            </h4>
            <ul className="space-y-2">
              <li>
                <a href="/eventos" className="text-foreground/70 hover:text-primary transition-colors">
                  Ver Eventos
                </a>
              </li>
              <li>
                <a href="/mis-entradas" className="text-foreground/70 hover:text-primary transition-colors">
                  Mis Entradas
                </a>
              </li>
              <li>
                <a href="/validar" className="text-foreground/70 hover:text-primary transition-colors">
                  Validar Entrada
                </a>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h4 className="text-lg font-heading font-bold text-foreground mb-4">
              Síguenos
            </h4>
            <div className="grid grid-cols-3 gap-4">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={social.label}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center justify-center w-14 h-14 rounded-2xl glass-card border border-white/10 hover:border-primary/50 transition-all group"
                  data-testid={`social-link-${social.label.toLowerCase()}`}
                >
                  <social.icon className="w-6 h-6 text-foreground/70 group-hover:text-primary transition-colors" />
                </motion.a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <p className="text-foreground/50 text-sm">
            &copy; 2026 Ciudad Feria. Todos los derechos reservados.
          </p>
          <p className="text-foreground/30 text-xs mt-2">
            Sistema de entradas digitales con encriptación AES-256
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;