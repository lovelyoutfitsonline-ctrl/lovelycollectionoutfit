import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { FiChevronLeft, FiHeart, FiShoppingBag } from 'react-icons/fi';

const WishlistPage = () => {
  const navigate = useNavigate();
  const { wishlist, toggleWishlist, addToCart } = useContext(ShopContext);

  return (
    <div className="w-full min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 pt-6 mb-8">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
          <FiChevronLeft className="text-blue-600 text-xl" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">My Wishlist</h1>
      </div>

      {wishlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-20 px-10">
          <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
            <FiHeart className="text-4xl text-red-200" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Wishlist is empty</h2>
          <p className="text-gray-500 text-center mb-8">Save items you love to your wishlist to find them later.</p>
          <button 
            onClick={() => navigate('/products')}
            className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-blue-500/30"
          >
            Explore Products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 px-6">
          {wishlist.map((item) => (
            <div key={item._id || item.id} className="bg-white border border-blue-50 p-3 rounded-2xl flex flex-col gap-2 shadow-sm relative">
              <button 
                onClick={() => toggleWishlist(item)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-sm z-10"
              >
                <FiHeart className="text-red-500 fill-red-500 text-sm" />
              </button>
              <div 
                onClick={() => navigate(`/product/${item._id || item.id}`)}
                className="w-full h-32 rounded-xl bg-blue-50 overflow-hidden cursor-pointer"
              >
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="mt-1">
                <h3 className="text-sm font-bold text-gray-800 truncate">{item.name}</h3>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm font-black text-blue-600">₹{item.price}</span>
                  <button 
                    onClick={() => addToCart(item)}
                    className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white"
                  >
                    <FiShoppingBag className="text-sm" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
