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
           <Link 
             to="/profile" 
             onClick={closeMenu}
             className="flex items-center gap-3 w-full pb-4 border-b border-gray-100 mb-2 hover:bg-gray-50 transition-colors p-2 rounded-lg"
           >
             <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-bold text-xl flex-shrink-0">
               {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
             </div>
             <div>
               <p className="font-bold text-[#1c1d1f] hover:text-[#5624d0]">{user.name}</p>
               <p className="text-xs text-gray-500">{user.email}</p>
             </div>
           </Link>
        )}
        {!isMobile && (
          <Link to="/" onClick={closeMenu} className={`text-sm font-bold px-3 transition-colors ${isActive('/') ? 'text-[#5624d0]' : 'text-[#1c1d1f] hover:text-[#5624d0]'}`}>
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
        <Link to="/profile" onClick={closeMenu} className={`text-sm font-bold transition-colors ${isActive('/profile') ? 'text-[#5624d0]' : 'text-[#1c1d1f] hover:text-[#5624d0]'} ${isMobile ? 'w-full py-2' : 'px-3'}`}>
          My learning
        </Link>
        <button onClick={handleLogout} className={`text-sm font-bold text-[#1c1d1f] hover:text-[#5624d0] text-left ${isMobile ? 'w-full py-2' : 'px-3'}`}>
          Logout
        </button>
        {!isMobile && (
          <Link to="/profile" className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold ml-2">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </Link>
        )}
      </nav>
    );
  }

  return (
    <nav className={`flex ${isMobile ? 'flex-col items-stretch gap-4' : 'items-center gap-2'}`}>
      {!isMobile && (
        <Link to="/" onClick={closeMenu} className={`text-sm font-bold px-3 mr-2 transition-colors ${isActive('/') ? 'text-[#5624d0]' : 'text-[#1c1d1f] hover:text-[#5624d0]'}`}>
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
