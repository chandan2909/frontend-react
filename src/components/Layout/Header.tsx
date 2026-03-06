import { Link } from 'react-router-dom';
import HeaderActions from './HeaderActions';
import useCartStore from '@/store/cartStore';
import { useState } from 'react';

export default function Header() {
  const itemCount = useCartStore((s) => s.items.length);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 h-[72px] bg-white border-b border-gray-200 z-50 flex items-center px-4 md:px-6 gap-4 md:gap-6 shadow-sm">
      <button 
        className="md:hidden p-2 -ml-2 text-[#1c1d1f]"
        onClick={() => setMobileMenuOpen(true)}
        aria-label="Open Menu"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <Link to="/" className="flex-shrink-0 text-[24px] md:text-[28px] font-black tracking-tighter text-[#1c1d1f] font-serif decoration-none">
        Kodemy
      </Link>

      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0 ml-auto">
        <Link to="/cart" className="relative p-2 hover:text-[#a435f0] transition-colors text-[#1c1d1f]" title="Cart" aria-label="Cart">
          <svg className="w-6 h-6 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
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

      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="fixed top-0 left-0 bottom-0 w-64 bg-white z-[70] shadow-xl overflow-y-auto">
             <div className="p-4 border-b border-gray-200 flex justify-between items-center h-[72px]">
               <span className="font-serif font-black text-[24px] tracking-tighter text-[#1c1d1f]">Kodemy</span>
               <button onClick={() => setMobileMenuOpen(false)} aria-label="Close menu" className="p-2 -mr-2 text-[#1c1d1f]">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
             </div>
             <div className="p-4 flex flex-col gap-4">
               <HeaderActions isMobile={true} closeMenu={() => setMobileMenuOpen(false)} />
             </div>
          </div>
        </>
      )}
    </header>
  );
}
