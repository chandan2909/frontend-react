import { Link, useLocation } from 'react-router-dom';
import HeaderActions from './HeaderActions';
import useCartStore from '@/store/cartStore';
import { useState } from 'react';
import { Menu, X, Home, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
  const itemCount = useCartStore((s) => s.items.length);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 h-[72px] bg-white border-b border-gray-200 z-50 flex items-center px-4 md:px-6 gap-4 md:gap-6 shadow-sm">
      <button 
        className="md:hidden p-2 -ml-2 text-[#1c1d1f]"
        onClick={() => setMobileMenuOpen(true)}
        aria-label="Open Menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      <Link to="/" className="flex items-center gap-2 flex-shrink-0 text-[24px] md:text-[28px] font-black tracking-tighter text-[#1c1d1f] font-serif decoration-none">
        <img src="/favicon.png" alt="Kodemy Logo" className="w-8 h-8 md:w-10 md:h-10 rounded-lg shadow-sm" />
        Kodemy
      </Link>

      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0 ml-auto">
        {/* AI Assistant - Always visible */}
        <Link 
          to="/chat" 
          className="flex items-center gap-1 text-sm font-bold bg-[#1c1d1f] text-white px-3 py-1.5 rounded-full hover:bg-gray-800 transition-colors"
          title="AI Assistant"
        >
          <span className="text-base leading-none relative top-[-1px]">✨</span>
          <span className="hidden md:inline">AI Assistant</span>
        </Link>

        {/* Mobile Home Button */}
        <Link 
          to="/" 
          className={`md:hidden relative p-2 transition-colors rounded-full ${isActive('/') ? 'bg-[#1c1d1f] text-white' : 'text-[#1c1d1f] hover:bg-gray-100'}`}
          title="Home" 
          aria-label="Home"
        >
          <Home className="w-6 h-6" />
        </Link>
        
        {/* Cart Button */}
        <Link 
          to="/cart" 
          className={`relative p-2 transition-colors rounded-full ${isActive('/cart') ? 'bg-[#1c1d1f] text-white' : 'text-[#1c1d1f] hover:bg-gray-100'}`}
          title="Cart" 
          aria-label="Cart"
        >
          <ShoppingCart className="w-6 h-6 md:w-6 md:h-6" />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#a435f0] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </Link>
        <div className="hidden md:block">
          <HeaderActions />
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[60]" 
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="fixed top-0 left-0 bottom-0 w-64 bg-white z-[70] shadow-xl overflow-y-auto"
            >
               <div className="p-4 border-b border-gray-200 flex justify-between items-center h-[72px]">
                 <div className="flex items-center gap-2">
                   <img src="/favicon.png" alt="Kodemy Logo" className="w-8 h-8 rounded-lg shadow-sm" />
                   <span className="font-serif font-black text-[24px] tracking-tighter text-[#1c1d1f]">Kodemy</span>
                 </div>
                 <button onClick={() => setMobileMenuOpen(false)} aria-label="Close menu" className="p-2 -mr-2 text-[#1c1d1f]">
                   <X className="w-6 h-6" />
                 </button>
               </div>
               <div className="p-4 flex flex-col gap-4">
                 <HeaderActions isMobile={true} closeMenu={() => setMobileMenuOpen(false)} />
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
