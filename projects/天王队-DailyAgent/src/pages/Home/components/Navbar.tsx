import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import logo from '../../../../assets/images/logo/logo.png'; // Assuming logo path

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: '功能', href: '#features' },
    { name: '使用场景', href: '#scenarios' },
    { name: '优势', href: '#advantage' },
  ];

  return (
    <nav
      className={clsx(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-slate-900/80 backdrop-blur-md shadow-lg py-4'
          : 'bg-transparent py-6'
      )}
    >
      <div className="container mx-auto px-6 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
           {/* Fallback to text if logo image is missing or just use text for now to be safe */}
           <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#15D69C] to-[#0EB583] flex items-center justify-center">
                  <span className="text-white font-bold text-xl">D</span>
              </div>
              <span className="text-white font-bold text-xl tracking-tight">DailyAgent</span>
           </div>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-slate-300 hover:text-[#15D69C] transition-colors font-medium"
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="hidden md:flex items-center space-x-4">
          <button
            onClick={() => navigate('/login')}
            className="text-white hover:text-[#15D69C] transition-colors font-medium px-4"
          >
            登录
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 rounded-full bg-gradient-to-r from-[#15D69C] to-[#0EB583] text-white font-semibold hover:shadow-[0_0_20px_rgba(21,214,156,0.5)] transition-shadow"
          >
            开始使用
          </button>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-white p-2"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-slate-900 border-t border-slate-800"
          >
            <div className="px-6 py-4 space-y-4 flex flex-col">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-slate-300 hover:text-[#15D69C] py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <div className="pt-4 border-t border-slate-800 flex flex-col space-y-4">
                <button
                  onClick={() => navigate('/login')}
                  className="text-white hover:text-[#15D69C] text-left"
                >
                  登录
                </button>
                <button
                   onClick={() => navigate('/login')}
                   className="w-full py-3 rounded-lg bg-gradient-to-r from-[#15D69C] to-[#0EB583] text-white font-semibold"
                >
                  开始使用
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
