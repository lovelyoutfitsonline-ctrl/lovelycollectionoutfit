import React from 'react';

const SplashEffect = () => {
  const logo = '/image_imgupscaler.ai_V1_Fast__2K-removebg-preview-Photoroom.png';

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#0B0F19] via-[#111827] to-[#1E1B4B] overflow-hidden select-none">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-blue-600/10 rounded-full blur-[80px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: '1s' }}></div>

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col items-center max-w-sm px-6 text-center">
        {/* Logo Container with Glow effect */}
        <div className="relative w-40 h-40 mb-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 backdrop-blur-md p-6 shadow-2xl animate-splash-logo">
          {/* Internal rotating ring */}
          <div className="absolute inset-0 rounded-full border border-dashed border-blue-500/30 animate-[spin_12s_linear_infinite]"></div>
          {/* Logo image */}
          <img 
            src={logo} 
            alt="Lovely Outfits Logo" 
            className="w-full h-full object-contain scale-[1.9]" 
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentNode.innerHTML += `<div class="text-white text-5xl font-black">🛍️</div>`;
            }}
          />
        </div>

        {/* Brand Name Text with fade up and letter tracking */}
        <div className="space-y-2 mb-12 animate-splash-text">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight uppercase leading-none">
            <span className="text-white block">Lovely</span>
            <span className="text-blue-500 block">Outfits</span>
          </h1>
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.4em] opacity-80 pt-2">
            Premium Fashion Marketplace
          </p>
        </div>

        {/* Premium Loading Progress Bar */}
        <div className="w-48 h-[3px] bg-white/10 rounded-full overflow-hidden relative">
          <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-splash-line shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
        </div>
      </div>
    </div>
  );
};

export default SplashEffect;
