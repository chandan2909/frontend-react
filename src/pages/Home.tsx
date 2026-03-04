import { useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';
import { Link } from 'react-router-dom';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import useAuthStore from '@/store/authStore';

export default function Home() {
  const { isAuthenticated } = useAuthStore();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get('/subjects')
      .then(({ data }) => setSubjects(data))
      .catch(() => setError('Failed to load subjects.'))
      .finally(() => setLoading(false));
  }, []);

  const seededRandom = (seed: number) => {
    let x = Math.sin(seed * 9301 + 49297) * 233280;
    return x - Math.floor(x);
  };

  const priceOptions = [999, 1299, 1499, 1999, 2499, 3499, 4999, 7999, 9999];
  const getCoursePrice = (id: number) => priceOptions[Math.floor(seededRandom(id) * priceOptions.length)];
  const getOriginalPrice = (id: number) => Math.round(getCoursePrice(id) * (3 + seededRandom(id + 100) * 4));
  const getCourseRating = (id: number) => (4 + seededRandom(id + 200) * 0.9).toFixed(1);
  const getCourseStudents = (id: number) => Math.floor(seededRandom(id + 300) * 150000) + 5000;

  const stats = [
    { value: '5+', label: 'Expert courses' },
    { value: '500K+', label: 'Students enrolled' },
    { value: '4.7★', label: 'Average rating' },
    { value: '100%', label: 'Free to try' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-grow w-full">

        {/* ── Hero ── */}
        <section className="relative w-full bg-[#1c1d1f] pt-[72px] overflow-hidden">
          {/* subtle grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '28px 28px' }}
          />
          <div className="max-w-7xl mx-auto px-6 py-16 relative z-10 flex flex-col lg:flex-row items-center gap-12">
            {/* Left copy */}
            <div className="flex-1 text-left">
              <span className="inline-block mb-4 text-xs font-bold uppercase tracking-widest text-gray-400 bg-white/10 px-3 py-1 rounded-full">
                🎓 Learn at your own pace
              </span>
              <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">
                Skills for your present<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-500">
                  and your future.
                </span>
              </h1>
              <p className="text-gray-400 text-lg mb-8 max-w-xl">
                World-class courses taught by expert instructors. Start learning today and unlock your potential.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="#courses"
                  className="px-6 py-3 bg-white text-[#1c1d1f] font-bold hover:bg-gray-100 transition-colors text-sm"
                >
                  Browse courses ↓
                </a>
                {!isAuthenticated ? (
                  <Link
                    to="/auth/register"
                    className="px-6 py-3 border border-white/30 text-white font-bold hover:bg-white/10 transition-colors text-sm"
                  >
                    Sign up free
                  </Link>
                ) : (
                  <Link
                    to="/profile"
                    className="px-6 py-3 border border-white/30 text-white font-bold hover:bg-white/10 transition-colors text-sm"
                  >
                    Go to My Learning
                  </Link>
                )}
              </div>
            </div>

            {/* Stats strip */}
            <div className="lg:w-auto grid grid-cols-2 gap-4">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="bg-white/5 border border-white/10 rounded-lg px-6 py-4 text-center"
                >
                  <div className="text-2xl font-black text-white">{s.value}</div>
                  <div className="text-xs text-gray-400 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Courses ── */}
        <section id="courses" className="max-w-7xl mx-auto px-6 py-14 w-full text-[#1c1d1f]">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-black mb-1">
                All courses
              </h2>
              <p className="text-gray-500 text-sm">
                {subjects.length} course{subjects.length !== 1 ? 's' : ''} — new content added every month
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-24">
              <div className="flex gap-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-[#1c1d1f] rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="text-red-600 bg-red-50 border border-red-200 p-4 font-medium text-sm">
              ⚠️ {error}
            </div>
          ) : subjects.length === 0 ? (
            <div className="text-gray-400 border border-dashed border-gray-200 p-16 text-center text-sm">
              No courses published yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {subjects.map((subject) => (
                <Link
                  key={subject.id}
                  to={`/course/${subject.id}`}
                  className="group flex flex-col bg-white border border-gray-200 hover:border-[#1c1d1f] hover:shadow-lg transition-all duration-200 text-left overflow-hidden"
                >


                  {/* Body */}
                  <div className="flex flex-col flex-grow p-4">
                    <h3 className="text-[14px] font-bold text-[#1c1d1f] leading-snug line-clamp-2 mb-1 group-hover:underline">
                      {subject.title}
                    </h3>
                    <p className="text-xs text-gray-500 mb-2">Dr. Instructor</p>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-3">
                      <span className="text-xs font-bold text-[#b4690e]">{getCourseRating(subject.id)}</span>
                      <div className="flex text-[#e59819]">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-[11px] text-gray-500">({getCourseStudents(subject.id).toLocaleString()})</span>
                    </div>

                    {/* Price pushed to bottom */}
                    <div className="mt-auto">
                      <span className="font-black text-base text-[#1c1d1f]">
                        ₹{getCoursePrice(subject.id).toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs text-gray-400 line-through ml-2">
                        ₹{getOriginalPrice(subject.id).toLocaleString('en-IN')}
                      </span>
                      <span className="ml-2 text-xs font-bold text-green-600">
                        {Math.round((1 - getCoursePrice(subject.id) / getOriginalPrice(subject.id)) * 100)}% off
      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── Trust strip ── */}
        <section className="border-t border-gray-100 py-10 bg-[#f7f9fa]">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">
              Trusted by learners worldwide
            </p>
            <div className="flex flex-wrap justify-center gap-8 text-[#6a6f73] text-sm font-semibold">
              {['MIT OpenCourseWare', 'Stanford Online', 'Harvard Extension', 'IIT Madras', 'Google Developers'].map((name) => (
                <span key={name} className="opacity-60 hover:opacity-100 transition-opacity">{name}</span>
              ))}
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
