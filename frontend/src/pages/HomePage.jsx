import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import bgVideo from "../../data's/videos/lovely collection video.mp4";

const logo = '/image_imgupscaler.ai_V1_Fast__2K-removebg-preview-Photoroom.png';

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);

  const handleStart = () => {
    navigate('/products');
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black flex flex-col items-center justify-end pb-40">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover scale-[1.45]"
      >
        <source src={bgVideo} type="video/mp4" />
      </video>

      {/* Floating Logo - Fixed at Top Left */}
     

      {/* Center Content Section */}
      <div className="relative z-20 flex flex-col items-center justify-center w-full px-8 text-center">
        
        {/* Site Name - Centered */}
        <div className="mb-10 animate-fade-in-up">
           <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              <span className="text-white block">𝐋𝐨𝐯𝐞𝐥𝐲</span>
              <span className="text-blue-500 block -mt-2">𝐎𝐮𝐭𝐟𝐢𝐭𝐬</span>
           </h1>
          
        </div>

        {/* Shop Now Button - Mirror Morphism Style */}
        <button
          onClick={handleStart}
          className="w-full max-w-[280px] bg-white/10 backdrop-blur-xl border border-white/30 text-white font-black py-5 rounded-[30px] text-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:bg-white/20 active:scale-95 transition-all uppercase tracking-[0.2em] group relative overflow-hidden"
        >
          <span className="relative z-10 flex items-center justify-center gap-3">
             Shop Now
             <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center scale-0 group-hover:scale-100 transition-transform duration-300">
                <div className="w-2 h-2 bg-white rotate-45"></div>
             </div>
          </span>
          {/* Glass Reflection Shine */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        </button>

        <p className="mt-8 text-blue-100/60 font-bold text-[10px] uppercase tracking-[0.4em] opacity-80">
          Premium Fashion Marketplace
        </p>
      </div>

      {/* Bottom Gradient Overlay to ensure visibility if needed */}
      <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
    </div>
  );
};

export default HomePage;
