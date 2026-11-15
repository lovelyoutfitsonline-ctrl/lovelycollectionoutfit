import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiChevronLeft, FiTag } from 'react-icons/fi';

const OffersPage = () => {
  const navigate = useNavigate();

  const handleBannerClick = (offerType) => {
    // Redirect to products listing page with query parameter for that offer
    navigate(`/products?offer=${offerType}`);
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-blue-50/50 via-white to-white pb-32">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 pt-6 mb-8">
        <button 
          onClick={() => navigate(-1)} 
          className="w-10 h-10 rounded-full bg-white border border-blue-100 flex items-center justify-center shadow-sm active:scale-95 transition-transform"
        >
          <FiChevronLeft className="text-blue-600 text-xl" />
        </button>
        <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
          <FiTag className="text-green-500 animate-pulse" />
          Exclusive Offers
        </h1>
      </div>

      {/* Promos Banners Stack */}
      <div className="px-6 flex flex-col gap-8">
        {/* Banner 1: COMBO300 (4 Shirts 999) */}
        <div className="relative w-full h-[260px] rounded-[32px] overflow-hidden shadow-2xl shadow-blue-500/10 border border-white/60 group">
          <img 
            src="/combo300_banner.png" 
            alt="4 Shirts for 999" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
          />
          {/* Frosted bottom center overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent flex flex-col justify-end items-center pb-8">
            {/* Mirror-Morphism Button */}
            <button 
              onClick={() => handleBannerClick('COMBO300')}
              className="bg-white/20 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] text-white hover:bg-white/30 active:scale-95 hover:scale-105 transition-all duration-300 font-black text-xs uppercase tracking-[0.2em] px-10 py-4 rounded-full flex items-center justify-center"
            >
              Shop Now
            </button>
          </div>
        </div>

        {/* Banner 2: COMBO200 (3 Shirts 500) */}
        <div className="relative w-full h-[260px] rounded-[32px] overflow-hidden shadow-2xl shadow-blue-500/10 border border-white/60 group">
          <img 
            src="/combo200_banner.png" 
            alt="3 Shirts for 500" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
          />
          {/* Frosted bottom center overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent flex flex-col justify-end items-center pb-8">
            {/* Mirror-Morphism Button */}
            <button 
              onClick={() => handleBannerClick('COMBO200')}
              className="bg-white/20 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] text-white hover:bg-white/30 active:scale-95 hover:scale-105 transition-all duration-300 font-black text-xs uppercase tracking-[0.2em] px-10 py-4 rounded-full flex items-center justify-center"
            >
              Shop Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OffersPage;
