import { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import AuthGuard from '@/components/Auth/AuthGuard';
import { Link, useNavigate } from 'react-router-dom';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import useAuthStore from '@/store/authStore';

export default function ProfilePage() {
  const [progress, setProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('learning');
  const navigate = useNavigate();

  const { user, fetchUser, deleteAccount } = useAuthStore();

  useEffect(() => {
    fetchUser();
    const fetchProgress = async () => {
      try {
        const { data } = await apiClient.get('/progress/overview');
        setProgress(data || []);
      } catch (err) {
        setError('Failed to load progress.');
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [fetchUser]);

  const joinDate = user?.created_at 
    ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : 'Unknown date';

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#f7f9fa] flex flex-col">
        <Header />
        
        {/* User Banner */}
        <div className="bg-[#1c1d1f] text-white pt-[112px] pb-[40px]">
          <div className="max-w-5xl mx-auto px-4 md:px-6 flex items-center gap-4 md:gap-6">
            <div className="w-16 h-16 md:w-24 md:h-24 bg-[#2d2f31] rounded-full flex items-center justify-center text-2xl md:text-4xl font-bold font-serif border-4 border-[#3e4143]">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1 font-serif">{user?.name || 'Student'}</h1>
              <p className="text-[#c0c4cc] text-sm mb-2">{user?.email || 'Loading email...'}</p>
              <p className="text-sm font-medium text-[#cec0fc]">Student since {joinDate}</p>
            </div>
          </div>
        </div>

        {/* Profile Navigation */}
        <div className="bg-white border-b border-gray-200 sticky top-[72px] z-40">
           <div className="max-w-5xl mx-auto px-4 md:px-6 flex gap-4 md:gap-8 overflow-x-auto hide-scrollbar whitespace-nowrap">
              {['learning', 'certificates', 'history', 'settings'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 md:py-4 text-sm md:text-base font-bold transition-colors ${
                    activeTab === tab 
                      ? 'text-[#1c1d1f] border-b-4 border-[#1c1d1f]' 
                      : 'text-gray-500 hover:text-[#1c1d1f] border-b-4 border-transparent'
                  }`}
                >
                  {tab === 'learning' ? 'My Learning' : 
                   tab === 'certificates' ? 'Certificates' : 
                   tab === 'history' ? 'Purchase History' : 'Settings'}
                </button>
              ))}
           </div>
        </div>

        {/* Main Content Area */}
        <main className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12 w-full text-[#1c1d1f] flex-grow">
          {activeTab === 'learning' && (
             <>
              <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-left font-serif">All courses</h2>

              {loading ? (
                <div className="flex py-12 justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1c1d1f]"></div>
                </div>
              ) : error ? (
                <div className="text-red-500 bg-red-50 p-4 rounded-md text-left border border-red-200 font-medium">{error}</div>
              ) : progress.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded p-12 text-center text-gray-500 font-medium">
                  <p className="mb-4">You don't have any courses yet.</p>
                  <Link to="/" className="px-6 py-3 bg-[#1c1d1f] text-white font-bold rounded hover:bg-black transition-colors">
                    Browse courses
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {progress.map((p: any) => (
                    <Link 
                      key={p.subject_id}
                      to={`/subjects/${p.subject_id}`}
                      className="group flex flex-col h-full bg-white border border-gray-200 hover:border-black transition-colors cursor-pointer text-left"
                    >
                      {/* Thumbnail */}
                      <div className="w-full aspect-video bg-[#2d2f31] relative overflow-hidden">
                        {p.thumbnail_url ? (
                          <img
                            src={p.thumbnail_url}
                            alt={p.subject_title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              const img = e.currentTarget as HTMLImageElement;
                              const current = img.src;
                              if (current.includes('hqdefault')) {
                                img.src = current.replace('hqdefault', 'sddefault');
                              } else if (current.includes('sddefault')) {
                                img.style.display = 'none';
                              } else {
                                img.style.display = 'none';
                              }
                            }}
                          />
                        ) : (
                          <svg className="w-12 h-12 text-white opacity-50 absolute inset-0 m-auto" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        )}
                        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity z-10"></div>
                      </div>

                      <div className="p-4 flex flex-col flex-grow">
                        <h3 className="text-base font-bold text-[#1c1d1f] mb-1 line-clamp-2 leading-tight">
                          {p.subject_title}
                        </h3>
                        <p className="text-xs text-gray-500 mb-4">Dr. Instructor</p>
                        
                        <div className="mt-auto">
                          <div className="flex justify-between items-center mb-1">
                             <span className="text-xs font-bold text-gray-600">
                               {Math.round(p.completion_percentage)}% complete
                             </span>
                             <span className="text-xs text-gray-500">
                               {p.completed_videos}/{p.total_videos} lessons
                             </span>
                          </div>
                          <div className="w-full bg-gray-200 h-1.5 mb-2 overflow-hidden">
                            <div 
                              className="bg-[#5624d0] h-1.5 transition-all duration-1000 ease-out" 
                              style={{ width: `${p.completion_percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
             </>
          )}

          {activeTab === 'certificates' && (
             <div className="bg-white border border-gray-200 rounded p-12 text-center text-gray-500 font-medium">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
                <p>No certificates earned yet.</p>
                <p className="text-sm mt-2 text-gray-400">Complete 100% of a course to earn its certificate.</p>
             </div>
          )}

          {activeTab === 'history' && (
             <div className="bg-white border border-gray-200 rounded p-12 text-center text-gray-500 font-medium">
                <p>You haven't made any purchases.</p>
             </div>
          )}

          {activeTab === 'settings' && (
             <div className="bg-white border border-gray-200 rounded p-8">
                <h2 className="text-xl font-bold mb-4">Danger Zone</h2>
                <p className="text-gray-600 mb-6 text-sm">
                  Once you delete your account, there is no going back. Please be certain.
                  This will permanently delete your user data, purchase history, and course progress.
                </p>
                <button
                  onClick={async () => {
                    if (window.confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) {
                      await deleteAccount();
                      navigate('/');
                    }
                  }}
                  className="px-6 py-2 border-2 border-red-600 text-red-600 font-bold hover:bg-red-50 transition-colors"
                >
                  Delete Account
                </button>
             </div>
          )}
        </main>
        <Footer />
      </div>
    </AuthGuard>
  );
}
