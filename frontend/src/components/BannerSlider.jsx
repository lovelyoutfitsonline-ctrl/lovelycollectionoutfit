import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BannerSlider = () => {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const fixLocalhostUrl = (url) => {
    if (!url) return url;
    return url.replace(/localhost|127\.0\.0\.1/g, window.location.hostname);
  };

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await axios.get(`http://${window.location.hostname}:5000/api/banners`);
        const fixedBanners = response.data.map(banner => ({
          ...banner,
          image: fixLocalhostUrl(banner.image)
        }));
        setBanners(fixedBanners);
      } catch (error) {
        console.error("Error fetching banners:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length > 0) {
      const timer = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [banners.length]);

  if (loading || banners.length === 0) {
    return (
      <div className="w-full h-[300px] rounded-[35px] bg-blue-50 animate-pulse flex items-center justify-center">
        <span className="text-blue-200 font-black italic">LOVELY OFFERS</span>
      </div>
    );
  }

  return (
    <div className="w-full h-[300px] rounded-[35px] overflow-hidden shadow-2xl shadow-blue-500/20 relative group">
      {banners.map((banner, index) => (
        <div
          key={banner._id || banner.id}
          className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out transform ${
            index === currentIndex ? 'opacity-100 scale-100 translate-x-0' : 'opacity-0 scale-105 translate-x-full'
          } ${banner.bgColor} flex items-center justify-center text-center`}
        >
          {banner.image && (
            <img 
              src={banner.image} 
              alt={banner.title} 
              className="absolute inset-0 w-full h-full object-cover opacity-80"
            />
          )}
          
          {/* Decorative Elements */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"></div>
        </div>
      ))}

      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {banners.map((_, index) => (
          <div
            key={index}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              index === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/30'
            }`}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default BannerSlider;
