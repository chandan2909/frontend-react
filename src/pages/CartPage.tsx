import { useNavigate } from 'react-router-dom';
import useCartStore from '@/store/cartStore';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import { ShoppingCart, PlayCircle, Star } from 'lucide-react';

export default function CartPage() {
  const { items, removeItem, getTotal, getOriginalTotal } = useCartStore();
  const navigate = useNavigate();

  const total = getTotal();
  const originalTotal = getOriginalTotal();
  const discount = originalTotal > 0 ? Math.round((1 - total / originalTotal) * 100) : 0;

  const handleCheckout = () => {
    navigate('/checkout', {
      state: {
        amount: total,
        originalAmount: originalTotal,
        itemCount: items.length,
        onSuccessAction: 'cart',
      }
    });
  };

  return (      <div className="min-h-screen flex flex-col bg-[#f7f9fa]">
        <Header />
      <main className="flex-grow pt-[72px]">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-10">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1c1d1f] mb-6 md:mb-8 font-serif">Shopping Cart</h1>

          {items.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-16 text-center">
              <ShoppingCart className="w-20 h-20 text-gray-300 mx-auto mb-4" />
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
                    <div key={item.id} className="flex items-start gap-3 md:gap-4 p-4 md:p-5">
                      {/* Thumbnail */}
                      <div className={`w-24 h-16 md:w-32 md:h-20 rounded overflow-hidden flex-shrink-0 relative bg-gradient-to-br ${item.gradient}`}>
                        {item.thumbnail_url ? (
                          <img
                            src={item.thumbnail_url}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                          />
                        ) : (
                          <PlayCircle className="w-8 h-8 text-white opacity-50 absolute inset-0 m-auto" />
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
                              <Star key={i} className="w-3 h-3 fill-current" />
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
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 sticky top-[90px]">
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
