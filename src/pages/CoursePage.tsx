import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '@/lib/apiClient';
import useAuthStore from '@/store/authStore';
import useCartStore from '@/store/cartStore';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';

export default function CoursePage() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { addItem, isInCart, isPurchased, purchaseSingle } = useCartStore();
  const parsedId = parseInt(subjectId as string, 10);

  const [subject, setSubject] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  // Track enrollment from backend (source of truth) OR cartStore (optimistic)
  const [enrolled, setEnrolled] = useState(false);

  // cartStore acts as an optimistic local cache; backend is the source of truth
  const inCart = isInCart(parsedId);

  const getGradient = (id: number) => {
    const gradients = [
      'from-purple-500 to-indigo-600',
      'from-blue-500 to-cyan-500',
      'from-emerald-500 to-teal-500',
      'from-orange-500 to-red-500',
      'from-pink-500 to-rose-500',
    ];
    return gradients[id % gradients.length];
  };

  // Seeded pseudo-random for consistent but varied prices per course
  const seededRandom = (seed: number) => {
    let x = Math.sin(seed * 9301 + 49297) * 233280;
    return x - Math.floor(x);
  };

  const priceOptions = [999, 1299, 1499, 1999, 2499, 3499, 4999, 7999, 9999];
  const fakePrice = priceOptions[Math.floor(seededRandom(parsedId) * priceOptions.length)];
  const originalMultiplier = 3 + seededRandom(parsedId + 100) * 4; // 3x to 7x
  const fakeOriginal = Math.round(fakePrice * originalMultiplier);
  const fakeRating = (4 + seededRandom(parsedId + 200) * 0.9).toFixed(1);
  const fakeStudents = Math.floor(seededRandom(parsedId + 300) * 150000) + 5000;
  const fakeHours = Math.floor(seededRandom(parsedId + 400) * 50) + 5;
  const fakeLectures = Math.floor(seededRandom(parsedId + 500) * 80) + 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await apiClient.get(`/subjects`);
        const found = data.find((s: any) => s.id === parsedId);
        setSubject(found || { id: parsedId, title: 'Course', description: '' });

        try {
          const treeRes = await apiClient.get(`/subjects/${parsedId}/tree`);
          setSections(treeRes.data?.sections || []);
        } catch {
          setSections([]);
        }
      } catch {
        setSubject({ id: parsedId, title: 'Course', description: '' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [parsedId]);

  // Always check enrollment status from backend — it's the only source of truth.
  // localStorage (isPurchased) can be stale across logins, so we never rely on it alone.
  useEffect(() => {
    if (!isAuthenticated) {
      setEnrolled(false);
      return;
    }
    apiClient.get('/progress/overview').then(({ data }) => {
      const isEnrolled = data.some((course: any) => course.subject_id === parsedId);
      setEnrolled(isEnrolled);
    }).catch(() => {
      // If backend fails, fall back to local cache
      setEnrolled(isPurchased(parsedId));
    });
  }, [parsedId, isAuthenticated]);

  const handleBuy = async () => {
    if (!isAuthenticated) {
      navigate(`/auth/login?redirect=/course/${parsedId}`);
      return;
    }
    
    try {
      await purchaseSingle(parsedId);
      setEnrolled(true); // immediately switch button to "Start Learning"
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Failed to purchase course. Please try again.');
    }
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate(`/auth/login?redirect=/course/${parsedId}`);
      return;
    }
    addItem({
      id: parsedId,
      title: subject?.title || 'Course',
      price: fakePrice,
      originalPrice: fakeOriginal,
      gradient: getGradient(parsedId),
      thumbnail_url: subject?.thumbnail_url,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleStartLearning = () => {
    navigate(`/subjects/${parsedId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <div className="flex-grow flex items-center justify-center pt-[72px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1c1d1f]"></div>
        </div>
      </div>
    );
  }

  const totalVideos = sections.reduce((acc: number, s: any) => acc + (s.videos?.length || 0), 0);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* Dark Hero Banner */}
      <div className="bg-[#1c1d1f] pt-[72px]">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col lg:flex-row gap-8">
          {/* Left: Course Info */}
          <div className="flex-1 text-white text-left">
            <h1 className="text-3xl font-bold mb-4 leading-tight">{subject?.title}</h1>
            <p className="text-lg text-gray-300 mb-4 max-w-xl">
              {subject?.description || 'Master the fundamentals and advanced concepts with hands-on projects and real-world examples.'}
            </p>

            <div className="flex items-center gap-3 mb-3">
              <span className="text-[#f3ca8c] font-bold text-lg">{fakeRating}</span>
              <div className="flex text-[#f3ca8c]">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                ))}
              </div>
              <span className="text-[#c0c4cc] text-sm">({fakeStudents.toLocaleString()} students)</span>
            </div>

            <p className="text-sm text-gray-400 mb-1">
              Created by <span className="text-[#cec0fc] underline cursor-pointer">Dr. Instructor</span>
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-400 mt-2">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Last updated 2026
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/></svg>
                English
              </span>
            </div>
          </div>

          {/* Right: Purchase Card */}
          <div className="lg:w-[380px] flex-shrink-0">
            <div className="bg-white rounded-lg shadow-2xl overflow-hidden border border-gray-200">
              {/* Thumbnail */}
              <div className={`w-full aspect-video bg-gradient-to-br ${getGradient(parsedId)} relative overflow-hidden`}>
                {subject?.thumbnail_url ? (
                  <img
                    src={subject.thumbnail_url}
                    alt={subject?.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <svg className="w-16 h-16 text-white opacity-60 absolute inset-0 m-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>

              <div className="p-6">
                {/* Price */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl font-bold text-[#1c1d1f]">₹{fakePrice.toLocaleString('en-IN')}</span>
                  <span className="text-lg text-gray-500 line-through">₹{fakeOriginal.toLocaleString('en-IN')}</span>
                  <span className="text-sm font-bold text-[#1c1d1f] bg-[#eceb98] px-2 py-0.5">
                    {Math.round((1 - fakePrice / fakeOriginal) * 100)}% off
                  </span>
                </div>

                {/* Timer */}
                <p className="text-sm text-red-600 font-medium mb-4 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  <span className="font-bold">2 days</span> left at this price!
                </p>

                {/* Buttons */}
                {enrolled ? (
                  <button
                    onClick={handleStartLearning}
                    className="w-full py-3 bg-[#1c1d1f] text-white font-bold text-base hover:bg-gray-800 transition-colors mb-3"
                  >
                    Start Learning →
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleBuy}
                      className="w-full py-3 bg-[#1c1d1f] text-white font-bold text-base hover:bg-gray-800 transition-colors mb-3"
                    >
                      Buy now
                    </button>
                    {inCart ? (
                      <button
                        onClick={() => navigate('/cart')}
                        className="w-full py-3 bg-white text-[#1c1d1f] font-bold text-base border border-[#1c1d1f] hover:bg-[#f7f9fa] transition-colors mb-3"
                      >
                        Go to cart
                      </button>
                    ) : (
                      <button
                        onClick={handleAddToCart}
                        className="w-full py-3 bg-white text-[#1c1d1f] font-bold text-base border border-[#1c1d1f] hover:bg-[#f7f9fa] transition-colors mb-3"
                      >
                        Add to cart
                      </button>
                    )}
                  </>
                )}

                {addedToCart && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-3 text-sm font-medium">
                    🛒 Added to cart!
                  </div>
                )}

                {/* Success Toast */}
                {showSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-3 text-sm font-medium animate-pulse">
                    ✅ Purchase successful! You now have full access.
                  </div>
                )}

                {/* Money-back */}
                <p className="text-xs text-gray-500 text-center">30-Day Money-Back Guarantee</p>
                <p className="text-xs text-gray-500 text-center">Full Lifetime Access</p>

                {/* Includes */}
                <div className="mt-5 pt-5 border-t border-gray-200">
                  <h4 className="font-bold text-sm text-[#1c1d1f] mb-3">This course includes:</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/></svg>
                      {fakeHours} hours on-demand video
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                      {fakeLectures} downloadable resources
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                      Access on mobile and TV
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
                      Certificate of completion
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content Section */}
      <div className="max-w-7xl mx-auto px-6 py-12 w-full text-left">
        <h2 className="text-2xl font-bold text-[#1c1d1f] mb-2">Course content</h2>
        <p className="text-sm text-gray-500 mb-6">
          {sections.length} sections • {totalVideos} lectures • {fakeHours}h total length
        </p>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {sections.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No content available yet.</div>
          ) : (
            sections.map((section: any, idx: number) => (
              <div key={section.id} className={idx > 0 ? 'border-t border-gray-200' : ''}>
                <div className="bg-[#f7f9fa] px-5 py-4 flex justify-between items-center cursor-pointer hover:bg-gray-100">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                    <span className="font-bold text-sm text-[#1c1d1f]">{section.title}</span>
                  </div>
                  <span className="text-xs text-gray-500">{section.videos?.length || 0} lectures</span>
                </div>
                <div className="bg-white">
                  {section.videos?.map((video: any) => (
                    <div key={video.id} className="flex items-center gap-3 px-8 py-3 text-sm text-gray-700 border-t border-gray-100">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      <span>{video.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* What you'll learn */}
        <div className="mt-12 border border-gray-200 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-[#1c1d1f] mb-5">What you'll learn</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              'Build real-world projects from scratch',
              'Understand core concepts deeply',
              'Apply best practices and patterns',
              'Debug and solve complex problems',
              'Write clean, maintainable code',
              'Prepare for technical interviews',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-[#1c1d1f]">
                <svg className="w-5 h-5 text-[#1c1d1f] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
