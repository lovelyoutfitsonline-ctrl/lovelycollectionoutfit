import React, { useContext, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { AuthContext } from '../context/AuthContext';
import { FiChevronLeft, FiChevronRight, FiHeart, FiShoppingBag, FiSend, FiCheck } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

const formatSizeLabel = (rawSize) => {
  if (!rawSize) return '';
  const trimmed = rawSize.trim();
  if (trimmed.toLowerCase().includes('shirt') || trimmed.toLowerCase().includes('pant') || trimmed.toLowerCase().includes('hip')) {
    return trimmed;
  }
  
  const s = trimmed.toUpperCase();
  if (s === 'S' || s === 'S-36' || s === '36') {
    return 'Shirts S 36 , pant 28 Hip size';
  }
  if (s === 'M' || s === 'M-38' || s === '38') {
    return 'Shirts M 38 , pant 30 Hip size';
  }
  if (s === 'L' || s === 'L-40' || s === '40') {
    return 'Shirts L 40 , pant 32 Hip size';
  }
  if (s === 'XL' || s === 'XL-42' || s === '42') {
    return 'Shirts XL 42 , pant 34 Hip size';
  }
  if (s === '2XL' || s === 'XXL' || s === 'XXL-44' || s === '2XL-44' || s === '44') {
    return 'Shirts 2Xl 44 , pant 36 Hip size';
  }
  if (s === '3XL' || s === 'XXXL' || s === 'XXXL-46' || s === '3XL-46' || s === '46') {
    return 'Shirts 3Xl 46 , pant 38 Hip size';
  }
  
  return rawSize;
};

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { products, addToCart, toggleWishlist, wishlist } = useContext(ShopContext);
  const [toastMessage, setToastMessage] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  const product = products.find((p) => (p._id === id || p.id === parseInt(id)));

  // Share product directly via Web Share API (native share to WhatsApp/apps) or direct WhatsApp launch
  const handleShare = async () => {
    if (!product) return;
    const shareUrl = `${window.location.origin}/product/${product._id || product.id}`;
    const shareText = `🛍️ *Check out this product on 𝐋𝐨𝐯𝐞𝐥𝐲 𝐎𝐮𝐭𝐟𝐢𝐭𝐬!*\n\n👕 *Product:* ${product.name}\n💰 *Price:* ₹${product.price}${product.originalPrice ? ` (MRP ₹${product.originalPrice})` : ''}\n\n👉 *View & Order here:* ${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
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

  const handleWhatsAppShare = () => {
    if (!product) return;
    const shareUrl = `${window.location.origin}/product/${product._id || product.id}`;
    const shareText = `🛍️ *Check out this product on 𝐋𝐨𝐯𝐞l𝐲 𝐎𝐮𝐭𝐟𝐢𝐭𝐬!*\n\n👕 *Product:* ${product.name}\n💰 *Price:* ₹${product.price}${product.originalPrice ? ` (MRP ₹${product.originalPrice})` : ''}\n\n👉 *View & Order here:* ${shareUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Parse sizes from product. Legacy sizes might be simple strings, new ones will be { size: 'XL', stock: 4 }
  const sizesInfo = React.useMemo(() => {
    if (!product || !product.sizes) return [];
    return product.sizes.map(s => {
      if (typeof s === 'string') {
        return { size: s, stock: 5 }; // default stock for legacy sizes
      }
      return { size: s.size, stock: s.stock ?? 0 };
    });
  }, [product]);

  const imagesList = React.useMemo(() => {
    if (!product) return [];
    if (Array.isArray(product.images) && product.images.length > 0) {
      const valid = product.images.filter(img => Boolean(img));
      if (valid.length > 0) return valid;
    }
    return product.image ? [product.image] : ['https://images.unsplash.com/photo-1594932224010-74f43a163102?w=500'];
  }, [product]);

  const [selectedSize, setSelectedSize] = React.useState('');

  React.useEffect(() => {
    if (sizesInfo.length > 0) {
      const available = sizesInfo.find(s => s.stock > 0);
      if (available) {
        setSelectedSize(available.size);
      } else {
        setSelectedSize(sizesInfo[0].size);
      }
    }
  }, [sizesInfo]);

  const handleBuyNow = () => {
    if (product) {
      addToCart({ ...product, selectedSize });
      if (!user) {
        navigate('/login?redirect=/checkout');
      } else {
        navigate('/checkout');
      }
    }
  };

  if (!product) {
    return <div className="p-10 text-center">Product not found</div>;
  }

  const isLiked = wishlist.some((item) => (
    (product._id && item._id && item._id === product._id) || 
    (product.id && item.id && item.id === product.id)
  ));

  const relatedItems = products.filter(
    (p) => p.category === product.category && (
      (product._id && p._id && p._id !== product._id) || 
      (product.id && p.id && p.id !== product.id)
    )
  );

  return (
    <div className="w-full min-h-screen bg-white pb-24 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900/90 text-white px-5 py-3 rounded-full text-xs font-bold shadow-2xl backdrop-blur-md flex items-center gap-2 animate-bounce">
          <FiCheck className="text-green-400 text-base" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Floating Action Icons */}
      <div className="flex justify-between items-start px-6 pt-6 absolute top-0 left-0 w-full z-20 pointer-events-none">
        <button 
          onClick={() => navigate(-1)}
          className="w-11 h-11 rounded-2xl bg-white/90 backdrop-blur-md flex items-center justify-center shadow-lg border border-gray-100 pointer-events-auto active:scale-95 transition-transform"
        >
          <FiChevronLeft className="text-gray-800 text-xl" />
        </button>
        
        {/* Floating Heart & Share Actions Column */}
        <div className="flex flex-col gap-3 pointer-events-auto">
          {/* Wishlist Heart Icon */}
          <button 
            onClick={() => toggleWishlist(product)}
            className="w-12 h-12 rounded-2xl bg-white/95 backdrop-blur-md flex items-center justify-center shadow-xl border border-gray-100 active:scale-90 transition-all hover:scale-105"
            title={isLiked ? "Remove from Wishlist" : "Add to Wishlist"}
          >
            <FiHeart className={`text-2xl transition-colors ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-700'}`} />
          </button>

          {/* Direct App Share Icon */}
          <button 
            onClick={handleShare}
            className="w-12 h-12 rounded-2xl bg-white/95 backdrop-blur-md flex items-center justify-center shadow-xl border border-gray-100 active:scale-90 transition-all hover:scale-105"
            title="Share Product directly to WhatsApp or Apps"
          >
            <FiSend className="text-2xl text-gray-800" />
          </button>
        </div>
      </div>

      {/* Flipkart-Style Multi-Image Gallery */}
      <div className="w-full relative bg-gray-50 pt-2 pb-6">
        {/* Main Image View Container */}
        <div className="w-full h-[450px] relative overflow-hidden flex items-center justify-center bg-gradient-to-b from-blue-50/50 to-white">
          <img 
            src={imagesList[activeImageIndex] || product.image} 
            alt={`${product.name} - View ${activeImageIndex + 1}`} 
            className="w-full h-full object-cover transition-all duration-300 select-none"
          />

          {/* Navigation Arrows for Multi-Images */}
          {imagesList.length > 1 && (
            <>
              <button 
                onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : imagesList.length - 1))}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md text-gray-800 flex items-center justify-center shadow-lg border border-gray-100 hover:bg-white active:scale-90 transition-all z-10"
                title="Previous Image"
              >
                <FiChevronLeft className="text-xl" />
              </button>

              <button 
                onClick={() => setActiveImageIndex((prev) => (prev < imagesList.length - 1 ? prev + 1 : 0))}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md text-gray-800 flex items-center justify-center shadow-lg border border-gray-100 hover:bg-white active:scale-90 transition-all z-10"
                title="Next Image"
              >
                <FiChevronRight className="text-xl" />
              </button>

              {/* Photo Counter Badge */}
              <div className="absolute bottom-4 right-4 bg-gray-900/80 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg border border-white/20 flex items-center gap-1">
                <span>{activeImageIndex + 1}</span>
                <span className="text-gray-400">/</span>
                <span>{imagesList.length} Photos</span>
              </div>
            </>
          )}
        </div>

        {/* Clickable Image Thumbnails Bar (Flipkart Style) */}
        {imagesList.length > 1 && (
          <div className="flex items-center justify-center gap-3 px-4 mt-4 overflow-x-auto scrollbar-hide py-1">
            {imagesList.map((imgUrl, idx) => {
              const isActive = idx === activeImageIndex;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  onMouseEnter={() => setActiveImageIndex(idx)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-200 flex-shrink-0 relative ${
                    isActive 
                      ? 'border-blue-600 ring-4 ring-blue-500/20 scale-105 shadow-md' 
                      : 'border-gray-200 opacity-70 hover:opacity-100 hover:border-gray-300'
                  }`}
                >
                  <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  {isActive && (
                    <div className="absolute inset-0 bg-blue-600/10 pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Details Section */}
      <div className="px-6 -mt-10 relative z-10 bg-white rounded-t-[40px] pt-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-blue-600 font-bold text-sm uppercase tracking-wider">{product.category}</span>
            <h1 className="text-2xl font-black text-gray-900 mt-1">{product.name}</h1>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-2xl font-black text-blue-600">₹{product.price}</div>
            {product.originalPrice && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 line-through font-bold">₹{product.originalPrice}</span>
                <span className="text-xs text-green-600 font-black uppercase">
                  {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                </span>
              </div>
            )}
          </div>
        </div>

        <p className="text-gray-500 leading-relaxed mb-8">
          {product.description}
        </p>

        {/* Size Selection */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest">Select Size</h2>
            <span className="text-xs text-blue-600 font-bold underline cursor-pointer">Size Chart</span>
          </div>
          <div className="flex flex-col gap-3">
            {sizesInfo.map(({ size, stock }) => {
              const isSelected = selectedSize === size;
              const isOutOfStock = stock <= 0;
              const label = formatSizeLabel(size);
              return (
                <button
                  key={size}
                  disabled={isOutOfStock}
                  onClick={() => setSelectedSize(size)}
                  className={`w-full px-6 py-3.5 rounded-full flex items-center justify-between font-medium text-sm md:text-base transition-all border ${
                    isSelected 
                    ? 'bg-black text-white border-black shadow-sm' 
                    : isOutOfStock 
                    ? 'bg-gray-50 text-gray-400 border-gray-300 cursor-not-allowed' 
                    : 'bg-white text-gray-900 border-gray-400 hover:border-black'
                  }`}
                >
                  <span className={isOutOfStock ? 'line-through' : ''}>{label}</span>
                  {stock > 0 ? (
                    <span className={`text-xs px-3 py-1 rounded-full font-bold transition-colors ${
                      isSelected 
                      ? 'bg-neutral-800 text-white' 
                      : 'bg-gray-100 text-gray-800'
                    }`}>
                      {stock} Left
                    </span>
                  ) : (
                    <span className="text-xs px-3 py-1 rounded-full font-medium bg-gray-100 text-gray-400">
                      Out of Stock
                    </span>
                  )}
                </button>
              );
            })}
            {sizesInfo.length === 0 && (
              <span className="text-sm text-gray-400">No sizes available for this item</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-4">
            <button 
              disabled={!selectedSize || (sizesInfo.find(s => s.size === selectedSize)?.stock <= 0)}
              onClick={() => addToCart({ ...product, selectedSize })}
              className={`flex-1 font-bold py-4 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-transform border-2 ${
                (!selectedSize || (sizesInfo.find(s => s.size === selectedSize)?.stock <= 0))
                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white border-blue-600 text-blue-600'
              }`}
            >
              <FiShoppingBag className="text-xl" />
              {(!selectedSize || (sizesInfo.find(s => s.size === selectedSize)?.stock <= 0)) ? 'Out of Stock' : 'Add to Cart'}
            </button>
            
            <button 
              disabled={!selectedSize || (sizesInfo.find(s => s.size === selectedSize)?.stock <= 0)}
              onClick={handleBuyNow}
              className={`flex-1 font-bold py-4 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-transform shadow-lg ${
                (!selectedSize || (sizesInfo.find(s => s.size === selectedSize)?.stock <= 0))
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                : 'bg-blue-600 text-white shadow-blue-500/30'
              }`}
            >
              Buy Now
            </button>
          </div>

          {/* Direct WhatsApp Share Button */}
          <button 
            onClick={handleWhatsAppShare}
            className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all text-sm uppercase tracking-wider cursor-pointer mt-1"
          >
            <FaWhatsapp className="text-xl" />
            Share Product on WhatsApp
          </button>
        </div>

        {/* Related Items Section */}
        <div className="mt-12">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Related Items</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {relatedItems.map((item) => (
              <div 
                key={item._id || item.id} 
                onClick={() => navigate(`/product/${item._id || item.id}`)}
                className="min-w-[160px] bg-white border border-blue-50 p-3 rounded-2xl flex flex-col gap-2 shadow-sm"
              >
                <div className="w-full h-28 rounded-xl bg-blue-50 overflow-hidden">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-xs font-bold text-gray-800 truncate">{item.name}</h3>
                <span className="text-xs font-black text-blue-600">₹{item.price}</span>
              </div>
            ))}
            {relatedItems.length === 0 && (
              <p className="text-gray-400 text-sm">No related items found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;

