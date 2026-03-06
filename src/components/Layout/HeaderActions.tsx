import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useAuthStore from '../../store/authStore';

export default function HeaderActions({ isMobile, closeMenu }: { isMobile?: boolean, closeMenu?: () => void }) {
  const { isAuthenticated, logout, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  // Avoid hydration error (still useful in some React patterns, though less critical than Next.js)
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const handleLogout = () => {
    logout();
    if (closeMenu) closeMenu();
    navigate('/');
  };

  if (isAuthenticated) {
    return (
      <nav className={`flex ${isMobile ? 'flex-col items-start gap-4' : 'items-center gap-3'}`}>
        {isMobile && user && (
          <div 
             className="flex items-center gap-3 w-full pb-4 border-b border-gray-100 mb-2 p-2 rounded-lg"
           >
             <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-bold text-xl flex-shrink-0">
               {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
             </div>
             <div>
               <p className="font-bold text-[#1c1d1f]">{user.name}</p>
               <p className="text-xs text-gray-500">{user.email}</p>
             </div>
           </div>
        )}
        {!isMobile && (
          <Link to="/" onClick={closeMenu} className={`text-sm font-bold px-4 py-2 rounded-full transition-all ${isActive('/') ? 'bg-[#1c1d1f] text-white' : 'text-[#1c1d1f] hover:bg-gray-100'}`}>
            Home
          </Link>
        )}
        <Link 
          to="/chat" 
          onClick={closeMenu}
          className={`text-sm font-bold flex items-center gap-1 text-white bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-1.5 rounded-full hover:shadow-lg transition-all ${isMobile ? 'w-full justify-center py-2' : ''}`}
        >
          <span className="text-base leading-none">✨</span> AI Assistant
        </Link>
        <Link to="/profile" onClick={closeMenu} className={`text-sm font-bold transition-all ${isMobile ? 'w-full py-2 px-3 rounded-lg' : 'px-4 py-2 rounded-full'} ${isActive('/profile') ? 'bg-[#1c1d1f] text-white' : 'text-[#1c1d1f] hover:bg-gray-100'}`}>
          My profile
        </Link>
        <button onClick={handleLogout} className={`text-sm font-bold text-[#1c1d1f] hover:bg-gray-100 transition-all text-left ${isMobile ? 'w-full py-2 px-3 rounded-lg' : 'px-4 py-2 rounded-full'}`}>
          Logout
        </button>
        {!isMobile && (
          <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold ml-2">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
        )}
      </nav>
    );
  }

  return (
    <nav className={`flex ${isMobile ? 'flex-col items-stretch gap-4' : 'items-center gap-2'}`}>
      {!isMobile && (
        <Link to="/" onClick={closeMenu} className={`text-sm font-bold px-4 py-2 rounded-full transition-all mr-2 ${isActive('/') ? 'bg-[#1c1d1f] text-white' : 'text-[#1c1d1f] hover:bg-gray-100'}`}>
          Home
        </Link>
      )}
      <Link 
        to="/chat" 
        onClick={closeMenu}
        className={`text-sm font-bold flex items-center justify-center gap-1 text-white bg-[#1c1d1f] px-3 py-1.5 rounded-full hover:bg-gray-800 transition-all ${isMobile ? 'py-2.5' : 'mr-2'}`}
      >
        <span className="text-base leading-none">✨</span> AI Assistant
      </Link>
      <Link 
        to="/auth/login" 
        onClick={closeMenu}
        className="h-10 px-4 flex items-center justify-center text-sm font-bold text-[#1c1d1f] border border-[#1c1d1f] bg-white hover:bg-[#f7f9fa] transition-colors"
      >
        Log in
      </Link>
      <Link 
        to="/auth/register" 
        onClick={closeMenu}
        className="h-10 px-4 flex items-center justify-center text-sm font-bold text-white bg-[#1c1d1f] hover:bg-gray-800 transition-colors"
      >
        Sign up
      </Link>
    </nav>
  );
}
