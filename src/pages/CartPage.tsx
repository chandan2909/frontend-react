import { useNavigate } from 'react-router-dom';
import useCartStore from '@/store/cartStore';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import { useState } from 'react';

export default function CartPage() {
  const { items, removeItem, purchaseAll, getTotal, getOriginalTotal } = useCartStore();
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);

  const total = getTotal();
  const originalTotal = getOriginalTotal();
  const discount = originalTotal > 0 ? Math.round((1 - total / originalTotal) * 100) : 0;

  const handleCheckout = async () => {
    try {
      await purchaseAll();
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigate('/');
      }, 2500);
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Purchase failed. Please ensure you are logged in and try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f9fa]">
      <Header />
      <main className="flex-grow pt-[72px]">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <h1 className="text-4xl font-bold text-[#1c1d1f] mb-8 font-serif">Shopping Cart</h1>

          {showSuccess && (
            <div className="bg-green-50 border border-green-300 text-green-800 px-6 py-4 rounded-lg mb-6 text-base font-medium animate-pulse">
              ✅ Purchase successful! Redirecting to homepage...
            </div>
          )}

          {items.length === 0 && !showSuccess ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-16 text-center">
              <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-lg text-gray-500 mb-4">Your cart is empty.</p>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-[#a435f0] text-white font-bold rounded hover:bg-[#8710d8] transition-colors"
              >
                Keep shopping
              </button>
            </div>
          ) : items.length > 0 && (
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Cart Items */}
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-500 mb-4">{items.length} Course{items.length > 1 ? 's' : ''} in Cart</p>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-100">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-start gap-4 p-5">
                      {/* Thumbnail */}
                      <div className={`w-32 h-20 rounded overflow-hidden flex-shrink-0 relative bg-gradient-to-br ${item.gradient}`}>
                        {item.thumbnail_url ? (
                          <img
                            src={item.thumbnail_url}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <svg className="w-8 h-8 text-white opacity-50 absolute inset-0 m-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          </svg>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 text-left">
                        <h3 className="font-bold text-[#1c1d1f] text-base truncate">{item.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">By Dr. Instructor</p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-sm font-bold text-[#b4690e]">4.8</span>
                          <div className="flex text-[#b4690e]">
                            {[...Array(5)].map((_, i) => (
                              <svg key={i} className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-[#a435f0] hover:text-[#8710d8] text-sm font-medium mt-2"
                        >
                          Remove
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-[#a435f0] text-lg">₹{item.price.toLocaleString('en-IN')}</p>
                        <p className="text-sm text-gray-400 line-through">₹{item.originalPrice.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Checkout Sidebar */}
              <div className="lg:w-[300px] flex-shrink-0">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-[90px]">
                  <h3 className="text-gray-500 font-bold text-sm mb-3">Total:</h3>
                  <p className="text-3xl font-bold text-[#1c1d1f] mb-1">₹{total.toLocaleString('en-IN')}</p>
                  <p className="text-sm text-gray-400 line-through mb-1">₹{originalTotal.toLocaleString('en-IN')}</p>
                  <p className="text-sm font-bold text-[#1c1d1f] mb-5">{discount}% off</p>

                  <button
                    onClick={handleCheckout}
                    className="w-full py-3 bg-[#a435f0] text-white font-bold text-base rounded hover:bg-[#8710d8] transition-colors mb-3"
                  >
                    Checkout
                  </button>

                  <div className="border-t border-gray-200 mt-4 pt-4">
                    <h4 className="font-bold text-sm text-[#1c1d1f] mb-2">Promotions</h4>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter Coupon"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#a435f0] text-black"
                      />
                      <button className="px-4 py-2 bg-[#a435f0] text-white font-bold text-sm rounded hover:bg-[#8710d8]">
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
