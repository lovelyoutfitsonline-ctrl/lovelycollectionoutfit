import React, { useContext, useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FiSearch, FiBell, FiHeart, FiShoppingBag, FiSend, FiCheck } from 'react-icons/fi'
import { FaWhatsapp, FaInstagram } from 'react-icons/fa'
import { ShopContext } from '../context/ShopContext'
import BannerSlider from '../components/BannerSlider'
const logo = '/image_imgupscaler.ai_V1_Fast__2K-removebg-preview-Photoroom.png';

const ProductsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const offerFilter = searchParams.get('offer'); // 'COMBO300' or 'COMBO200'
  const { products, categories, addToCart, wishlist, toggleWishlist, searchQuery, setSearchQuery, unreadCount, refetchProducts } = useContext(ShopContext);
  const [activeCategory, setActiveCategory] = useState('All');
  const [toastMessage, setToastMessage] = useState('');

  const handleShareItem = async (e, item) => {
    if (e) e.stopPropagation();
    const shareUrl = `${window.location.origin}/product/${item._id || item.id}`;
    const shareText = `🛍️ *Check out this product on 𝐋𝐨𝐯𝐞𝐥𝐲 𝐎𝐮𝐭𝐟𝐢𝐭𝐬!*\n\n👕 *Product:* ${item.name}\n💰 *Price:* ₹${item.price}${item.originalPrice ? ` (MRP ₹${item.originalPrice})` : ''}\n\n👉 *View & Order here:* ${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: item.name,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    // Direct WhatsApp fallback if Web Share API is unavailable
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Fetch real-time products list from MongoDB on mount
  useEffect(() => {
    if (refetchProducts) {
      refetchProducts();
    }
  }, []);

  // Automatically reset category filter to 'All' when an offer banner is clicked
  useEffect(() => {
    if (offerFilter) {
      setActiveCategory('All');
    }
  }, [offerFilter]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || product.category === activeCategory;
    const matchesOffer = !offerFilter || product.combo_group === offerFilter;
    return matchesSearch && matchesCategory && matchesOffer;
  });

  return (
    <div className="w-full min-h-screen bg-white pt-6 pb-24 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900/90 text-white px-5 py-3 rounded-full text-xs font-bold shadow-2xl backdrop-blur-md flex items-center gap-2 animate-bounce">
          <FiCheck className="text-green-400 text-base" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center px-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 flex items-center justify-center overflow-hidden">
            <img src={logo} alt="Logo" className="w-full h-full object-contain scale-[2.2]" />
          </div>
          <h1 className="text-xl font-black tracking-tighter uppercase leading-none">
            <span className="text-black drop-shadow-[0_2px_5px_rgba(0,0,0,0.3)]">𝐋𝐨𝐯𝐞𝐥𝐲</span>
            <span className="text-blue-600 ml-1">𝐎𝐮𝐭𝐟𝐢𝐭𝐬</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          {/* WhatsApp Logo */}
          <a 
            href="https://chat.whatsapp.com/CwdrdHZ5XYsK8DMOikyws0" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-emerald-600 transition-all duration-200 active:scale-90 hover:text-emerald-500 hover:scale-105"
            title="Chat on WhatsApp"
          >
            <FaWhatsapp className="text-2xl" />
          </a>

          {/* Instagram Logo */}
          <a 
            href="https://www.instagram.com/lovely_mens_collection?igsh=MWpoMnVlczRyOHE2Nw==" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-pink-600 transition-all duration-200 active:scale-90 hover:text-pink-500 hover:scale-105"
            title="Follow on Instagram"
          >
            <FaInstagram className="text-2xl" />
          </a>

          {/* Notification Bell */}
          <div 
            className="relative cursor-pointer flex items-center justify-center transition-all duration-200 active:scale-90 hover:scale-105" 
            onClick={() => navigate('/notifications')}
            title="Notifications"
          >
            <FiBell className="text-blue-600 text-2xl hover:text-blue-500" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-6 mb-8">
        <div className="w-full bg-white border border-blue-100 rounded-full flex items-center px-4 py-3 shadow-[0_4px_20px_rgba(59,130,246,0.08)] focus-within:border-blue-300 transition-colors">
          <FiSearch className="text-blue-500 text-xl mr-3" />
          <input 
            type="text" 
            placeholder="Search premium fashion..." 
            className="bg-transparent border-none outline-none w-full text-gray-800 placeholder-gray-400 font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Hero Banner Slider */}
      <div className="px-6 mb-8">
        <BannerSlider />
      </div>

      {/* Categories */}
      <div className="px-6 mb-8">
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-lg font-bold text-gray-800">Categories</h2>
          <span className="text-xs font-bold text-blue-600 cursor-pointer" onClick={() => setActiveCategory('All')}>See All</span>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {categories.map((cat, idx) => (
            <div 
              key={cat._id || idx} 
              onClick={() => setActiveCategory(cat.name)}
              className="flex flex-col items-center gap-2 min-w-[70px] cursor-pointer"
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${activeCategory === cat.name ? 'bg-blue-600 shadow-lg shadow-blue-500/30' : 'bg-white border border-blue-100'}`}>
                <img src={cat.image} alt={cat.name} className="w-14 h-14 rounded-full object-cover border-2 border-white" />
              </div>
              <span className={`text-xs font-bold ${activeCategory === cat.name ? 'text-blue-600' : 'text-gray-800'}`}>{cat.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="px-6 mb-4">
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-lg font-bold text-gray-800">
            {searchQuery 
              ? 'Search Results' 
              : offerFilter 
                ? (offerFilter === 'COMBO300' ? '4 for ₹999 Shirts' : '3 for ₹500 Collection')
                : activeCategory === 'All' 
                  ? 'Trending Now' 
                  : activeCategory}
          </h2>
          <span className="text-xs text-gray-400 font-medium">{filteredProducts.length} items found</span>
        </div>

        {offerFilter && (
          <div className="mb-6 flex items-center justify-between bg-green-50 border border-green-100 px-4 py-3 rounded-2xl shadow-sm">
            <span className="text-xs font-black text-green-700 uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              Offer Active: {offerFilter === 'COMBO300' ? 'Any 4 for ₹999' : 'Any 3 for ₹500'}
            </span>
            <button 
              onClick={() => navigate('/products')} 
              className="text-[10px] bg-green-200/50 hover:bg-green-200 text-green-800 font-extrabold px-3 py-1 rounded-xl transition-all active:scale-95 shadow-sm"
            >
              Clear Filter
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {filteredProducts.map((item) => {
            const isLiked = wishlist.some((p) => (
              (item._id && p._id && p._id === item._id) || 
              (item.id && p.id && p.id === item.id)
            ));
            return (
              <div key={item._id || item.id} className="bg-white border border-blue-50 p-3 rounded-2xl flex flex-col gap-2 shadow-[0_4px_15px_rgba(59,130,246,0.05)] hover:shadow-lg transition-all group">
                <div className="w-full h-40 rounded-xl bg-blue-50 relative overflow-hidden flex items-center justify-center">
                   {/* Floating Action Column: Heart & Share Send Icon */}
                   <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-10">
                     <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(item);
                      }}
                      className="w-7 h-7 rounded-xl bg-white/95 backdrop-blur-md flex items-center justify-center shadow-sm active:scale-90 transition-transform hover:scale-105"
                      title={isLiked ? "Remove from Wishlist" : "Add to Wishlist"}
                     >
                        <FiHeart className={`text-xs ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} />
                     </button>
                     <button 
                      onClick={(e) => handleShareItem(e, item)}
                      className="w-7 h-7 rounded-xl bg-white/95 backdrop-blur-md flex items-center justify-center shadow-sm active:scale-90 transition-transform hover:scale-105"
                      title="Share Product Link"
                     >
                        <FiSend className="text-xs text-gray-800" />
                     </button>
                   </div>
                   {Array.isArray(item.images) && item.images.length > 1 && (
                     <div className="absolute bottom-2 left-2 bg-gray-900/75 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded-md z-10 flex items-center gap-1">
                       <span>📷</span>
                       <span>{item.images.length} Photos</span>
                     </div>
                   )}
                   <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 cursor-pointer" 
                    onClick={() => navigate(`/product/${item._id || item.id}`)}
                   />
                </div>
                <div className="mt-1">
                  <h3 className="text-sm font-bold text-gray-800 truncate">{item.name}</h3>
                  <div className="flex flex-col mt-1">
                    <div className="flex items-center gap-2">
                       <span className="text-sm font-black text-blue-600">₹{item.price}</span>
                       {item.originalPrice && (
                         <span className="text-[10px] text-gray-400 line-through font-bold">₹{item.originalPrice}</span>
                       )}
                    </div>
                    {item.originalPrice && (
                      <span className="text-[10px] text-green-600 font-black uppercase tracking-tighter">
                        {Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% OFF
                      </span>
                    )}
                  </div>

                  {/* Available Sizes List */}
                  {(() => {
                    const availSizes = (item.sizes || [])
                      .map(s => typeof s === 'string' ? { size: s, stock: 5 } : s)
                      .filter(s => s && s.size && s.stock > 0)
                      .map(s => s.size);
                    if (availSizes.length === 0) return null;
                    return (
                      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide mt-1.5 py-0.5">
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Sizes:</span>
                        {availSizes.slice(0, 3).map((sz, szIdx) => (
                          <span key={szIdx} className="text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                            {sz}
                          </span>
                        ))}
                        {availSizes.length > 3 && (
                          <span className="text-[9px] font-bold text-gray-400">+{availSizes.length - 3}</span>
                        )}
                      </div>
                    );
                  })()}

                  <div className="flex justify-end mt-2">
                    <button 
                      onClick={() => addToCart(item)}
                      className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30 active:scale-95 transition-transform"
                    >
                      <FiShoppingBag className="text-sm" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {filteredProducts.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500 font-medium">No products found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductsPage
